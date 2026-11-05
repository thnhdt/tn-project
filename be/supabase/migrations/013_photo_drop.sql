-- Trang /tha-anh: khách thả ảnh vào, ảnh bay lên cho mọi người cùng xem.
-- Khách không cần đăng nhập, nên bucket được giới hạn chặt:
--     * chỉ nhận WebP/JPEG, tối đa 1.5 MB mỗi ảnh (trình duyệt đã nén trước);
--     * tên file bắt buộc là UUID, không ghi đè được ảnh đã có;
--     * cả bucket tối đa 1500 ảnh để không vượt 1 GB của gói miễn phí;
--     * chỉ quản trị viên xoá được ảnh.
-- File này chạy lại nhiều lần được.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'photo-drop',
    'photo-drop',
    true,
    1536 * 1024,
    ARRAY['image/webp', 'image/jpeg']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Đếm bằng SECURITY DEFINER để policy INSERT không phụ thuộc quyền đọc của khách.
CREATE OR REPLACE FUNCTION public.photo_drop_has_room()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT count(*) < 1500
    FROM storage.objects
    WHERE bucket_id = 'photo-drop';
$$;

REVOKE ALL ON FUNCTION public.photo_drop_has_room() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.photo_drop_has_room() TO anon, authenticated;

-- Ai cũng liệt kê được bucket này: ảnh thả vào là để mọi người cùng xem.
DROP POLICY IF EXISTS photo_drop_select ON storage.objects;
CREATE POLICY photo_drop_select ON storage.objects
    FOR SELECT TO anon, authenticated
    USING (bucket_id = 'photo-drop');

DROP POLICY IF EXISTS photo_drop_insert ON storage.objects;
CREATE POLICY photo_drop_insert ON storage.objects
    FOR INSERT TO anon, authenticated
    WITH CHECK (
        bucket_id = 'photo-drop'
        AND name ~ '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.(webp|jpg)$'
        AND (SELECT public.photo_drop_has_room())
    );

DROP POLICY IF EXISTS photo_drop_admin_delete ON storage.objects;
CREATE POLICY photo_drop_admin_delete ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'photo-drop' AND (SELECT public.is_admin()));
