-- Ảnh chụp chung của từng khách: quản trị viên tải lên từ dashboard, khách chỉ
-- nhận được đường dẫn ảnh của chính mình qua open_invitation().
-- File này chạy lại nhiều lần được.

ALTER TABLE invitations
    ADD COLUMN IF NOT EXISTS photo_path TEXT;

ALTER TABLE invitations
    DROP CONSTRAINT IF EXISTS invitations_photo_path_check;
ALTER TABLE invitations
    ADD CONSTRAINT invitations_photo_path_check
    CHECK (photo_path IS NULL OR photo_path ~ '^[a-f0-9-]{36}\.jpg$') NOT VALID;

GRANT UPDATE (photo_path) ON invitations TO authenticated;

-- Bucket công khai theo đường dẫn: ai có đúng tên file (UUID ngẫu nhiên) mới
-- xem được ảnh. Không có policy SELECT cho khách nên không liệt kê được bucket.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'invitation-photos',
    'invitation-photos',
    true,
    2 * 1024 * 1024,
    ARRAY['image/jpeg']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS invitation_photos_admin_select ON storage.objects;
CREATE POLICY invitation_photos_admin_select ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'invitation-photos' AND (SELECT public.is_admin()));

DROP POLICY IF EXISTS invitation_photos_admin_insert ON storage.objects;
CREATE POLICY invitation_photos_admin_insert ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'invitation-photos' AND (SELECT public.is_admin()));

DROP POLICY IF EXISTS invitation_photos_admin_delete ON storage.objects;
CREATE POLICY invitation_photos_admin_delete ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'invitation-photos' AND (SELECT public.is_admin()));

DROP FUNCTION IF EXISTS open_invitation(TEXT);

CREATE FUNCTION open_invitation(p_code TEXT)
RETURNS TABLE (
    display_name TEXT,
    instagram_handle TEXT,
    personal_message TEXT,
    theme_variant TEXT,
    photo_path TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT
        i.display_name,
        i.instagram_handle,
        i.personal_message,
        i.theme_variant,
        i.photo_path
    FROM public.invitations AS i
    WHERE p_code ~ '^[A-Za-z0-9_-]{8,64}$'
        AND i.qr_code = p_code
    LIMIT 1;
$$;

REVOKE ALL ON FUNCTION open_invitation(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION open_invitation(TEXT) TO anon, authenticated;
