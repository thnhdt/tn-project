-- Trang /tha-anh: chỉ khách có mã QR mới thả ảnh được, mỗi khách tối đa 4 ảnh.
-- Xem ảnh vẫn công khai như cũ (policy photo_drop_select ở migration 013).
--
-- Cách hoạt động:
--     1. Trình duyệt gọi photo_drop_reserve(mã QR, đuôi file) để xin một tên file.
--        Hàm kiểm tra mã QR và số ảnh đã dùng, rồi cấp một tên UUID ngẫu nhiên.
--     2. Storage chỉ nhận file có tên vừa được cấp trong vòng 15 phút.
-- Một suất được tính khi ảnh đã nằm trong bucket, hoặc tên vừa được cấp chưa quá
-- 15 phút (đang tải lên). Quản trị viên xoá ảnh thì khách lấy lại được suất đó.
-- File này chạy lại nhiều lần được.

CREATE TABLE IF NOT EXISTS public.photo_drop_uploads (
    object_name TEXT PRIMARY KEY,
    invitation_id UUID NOT NULL REFERENCES public.invitations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS photo_drop_uploads_invitation_idx
    ON public.photo_drop_uploads (invitation_id);

-- Không có policy nào: khách không đọc/ghi trực tiếp, chỉ qua các hàm bên dưới.
ALTER TABLE public.photo_drop_uploads ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.photo_drop_uploads FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.photo_drop_max_per_guest()
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
    SELECT 4;
$$;

CREATE OR REPLACE FUNCTION public.photo_drop_used(p_invitation UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT count(*)::INTEGER
    FROM public.photo_drop_uploads AS u
    WHERE u.invitation_id = p_invitation
        AND (
            u.created_at > now() - INTERVAL '15 minutes'
            OR EXISTS (
                SELECT 1
                FROM storage.objects AS o
                WHERE o.bucket_id = 'photo-drop'
                    AND o.name = u.object_name
            )
        );
$$;

REVOKE ALL ON FUNCTION public.photo_drop_used(UUID) FROM PUBLIC;

-- Số ảnh khách đã thả. Mã QR sai thì không trả về dòng nào.
CREATE OR REPLACE FUNCTION public.photo_drop_quota(p_code TEXT)
RETURNS TABLE (used INTEGER, max_photos INTEGER)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT public.photo_drop_used(i.id), public.photo_drop_max_per_guest()
    FROM public.invitations AS i
    WHERE p_code ~ '^[A-Za-z0-9_-]{8,64}$'
        AND i.qr_code = p_code
    LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.photo_drop_quota(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.photo_drop_quota(TEXT) TO anon, authenticated;

-- Cấp một tên file cho lần tải lên kế tiếp, hoặc báo lỗi nếu không được thả nữa.
CREATE OR REPLACE FUNCTION public.photo_drop_reserve(p_code TEXT, p_extension TEXT)
RETURNS TEXT
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_invitation UUID;
    v_name TEXT;
BEGIN
    IF p_extension IS NULL OR p_extension NOT IN ('webp', 'jpg') THEN
        RAISE EXCEPTION 'photo_drop_bad_extension';
    END IF;

    SELECT i.id INTO v_invitation
    FROM public.invitations AS i
    WHERE p_code ~ '^[A-Za-z0-9_-]{8,64}$'
        AND i.qr_code = p_code
    -- Khoá dòng khách để nhiều tab gửi cùng lúc không vượt quá giới hạn.
    FOR UPDATE;

    IF v_invitation IS NULL THEN
        RAISE EXCEPTION 'photo_drop_invalid_code';
    END IF;

    -- Dọn tên đã cấp quá hạn mà không có ảnh nào được tải lên.
    DELETE FROM public.photo_drop_uploads AS u
    WHERE u.invitation_id = v_invitation
        AND u.created_at <= now() - INTERVAL '15 minutes'
        AND NOT EXISTS (
            SELECT 1
            FROM storage.objects AS o
            WHERE o.bucket_id = 'photo-drop'
                AND o.name = u.object_name
        );

    IF public.photo_drop_used(v_invitation) >= public.photo_drop_max_per_guest() THEN
        RAISE EXCEPTION 'photo_drop_quota_exceeded';
    END IF;

    v_name := gen_random_uuid()::TEXT || '.' || p_extension;
    INSERT INTO public.photo_drop_uploads (object_name, invitation_id)
    VALUES (v_name, v_invitation);

    RETURN v_name;
END;
$$;

REVOKE ALL ON FUNCTION public.photo_drop_reserve(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.photo_drop_reserve(TEXT, TEXT) TO anon, authenticated;

-- Storage hỏi hàm này trước khi nhận file: tên phải vừa được cấp, chưa quá 15 phút.
CREATE OR REPLACE FUNCTION public.photo_drop_can_upload(p_name TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.photo_drop_uploads AS u
        WHERE u.object_name = p_name
            AND u.created_at > now() - INTERVAL '15 minutes'
    );
$$;

REVOKE ALL ON FUNCTION public.photo_drop_can_upload(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.photo_drop_can_upload(TEXT) TO anon, authenticated;

-- Thay policy INSERT của migration 013: thêm điều kiện tên file đã được cấp.
DROP POLICY IF EXISTS photo_drop_insert ON storage.objects;
CREATE POLICY photo_drop_insert ON storage.objects
    FOR INSERT TO anon, authenticated
    WITH CHECK (
        bucket_id = 'photo-drop'
        AND name ~ '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.(webp|jpg)$'
        AND (SELECT public.photo_drop_has_room())
        AND (SELECT public.photo_drop_can_upload(name))
    );
