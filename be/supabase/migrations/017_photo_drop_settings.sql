-- Trang /tha-anh: quản trị viên chỉnh số ảnh mỗi khách được thả ngay trên
-- dashboard /dev, thay cho con số 4 viết cứng ở migration 015.
-- Đặt 0 để tạm dừng việc thả ảnh (ảnh đã thả vẫn bay như cũ).
-- Hạ giới hạn xuống thấp hơn số ảnh khách đã thả thì ảnh cũ vẫn giữ, khách chỉ
-- không thả thêm được nữa.
-- File này chạy lại nhiều lần được.

-- Bảng chỉ có đúng một dòng (id luôn là true).
CREATE TABLE IF NOT EXISTS public.photo_drop_settings (
    id BOOLEAN PRIMARY KEY DEFAULT true CHECK (id),
    max_per_guest INTEGER NOT NULL DEFAULT 4
        CHECK (max_per_guest BETWEEN 0 AND 50)
);

INSERT INTO public.photo_drop_settings (id)
VALUES (true)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.photo_drop_settings ENABLE ROW LEVEL SECURITY;

-- Khách không đọc trực tiếp: giới hạn tới tay khách qua hàm photo_drop_quota().
REVOKE ALL ON public.photo_drop_settings FROM PUBLIC;
REVOKE ALL ON public.photo_drop_settings FROM anon, authenticated;
GRANT SELECT ON public.photo_drop_settings TO authenticated;
GRANT UPDATE (max_per_guest) ON public.photo_drop_settings TO authenticated;

DROP POLICY IF EXISTS photo_drop_settings_admin_select ON public.photo_drop_settings;
CREATE POLICY photo_drop_settings_admin_select ON public.photo_drop_settings
    FOR SELECT TO authenticated
    USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS photo_drop_settings_admin_update ON public.photo_drop_settings;
CREATE POLICY photo_drop_settings_admin_update ON public.photo_drop_settings
    FOR UPDATE TO authenticated
    USING ((SELECT public.is_admin()))
    WITH CHECK ((SELECT public.is_admin()));

-- Thay hàm của migration 015: đọc giới hạn từ bảng cấu hình.
-- Không còn IMMUTABLE vì giá trị đổi được; SECURITY DEFINER để đọc được bảng
-- khi gọi từ photo_drop_quota() / photo_drop_reserve().
CREATE OR REPLACE FUNCTION public.photo_drop_max_per_guest()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT coalesce(
        (SELECT s.max_per_guest FROM public.photo_drop_settings AS s WHERE s.id),
        4
    );
$$;

REVOKE ALL ON FUNCTION public.photo_drop_max_per_guest() FROM PUBLIC;
