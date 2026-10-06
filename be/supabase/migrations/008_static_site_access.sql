-- Frontend tĩnh gọi Supabase trực tiếp bằng publishable key, nên mọi quyền
-- truy cập phải được chặn ngay trong database:
--   * Khách (anon) không đọc/ghi trực tiếp bảng nào, chỉ gọi được hai hàm RPC
--     open_invitation() và record_page_visit().
--   * Quản trị viên là user Supabase Auth có id nằm trong bảng admins.
-- File này chạy lại nhiều lần được (db:migrate áp dụng lại toàn bộ migration).

CREATE TABLE IF NOT EXISTS admins (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.admins
        WHERE user_id = (SELECT auth.uid())
    );
$$;

-- Dashboard không còn backend tạo token/kiểm tra dữ liệu, database tự đảm nhận.
ALTER TABLE invitations
    ALTER COLUMN token
    SET DEFAULT translate(encode(gen_random_bytes(18), 'base64'), '+/', '-_');

ALTER TABLE invitations
    DROP CONSTRAINT IF EXISTS invitations_display_name_check;
ALTER TABLE invitations
    ADD CONSTRAINT invitations_display_name_check
    CHECK (
        display_name = btrim(display_name)
        AND char_length(display_name) BETWEEN 1 AND 120
    ) NOT VALID;

ALTER TABLE invitations
    DROP CONSTRAINT IF EXISTS invitations_personal_message_check;
ALTER TABLE invitations
    ADD CONSTRAINT invitations_personal_message_check
    CHECK (
        personal_message = btrim(personal_message)
        AND char_length(personal_message) BETWEEN 1 AND 1200
    ) NOT VALID;

ALTER TABLE invitations
    DROP CONSTRAINT IF EXISTS invitations_instagram_handle_check;
ALTER TABLE invitations
    ADD CONSTRAINT invitations_instagram_handle_check
    CHECK (
        instagram_handle IS NULL
        OR instagram_handle ~ '^@[A-Za-z0-9._]{1,30}$'
    ) NOT VALID;

ALTER TABLE invitations
    DROP CONSTRAINT IF EXISTS invitations_qr_code_check;
ALTER TABLE invitations
    ADD CONSTRAINT invitations_qr_code_check
    CHECK (qr_code ~ '^[A-Za-z0-9_-]{8,64}$') NOT VALID;

-- Quyền trên bảng: thu hồi hết rồi cấp lại đúng những gì dashboard cần.
REVOKE ALL ON events, invitations, page_visits, admins FROM PUBLIC;
REVOKE ALL ON events, invitations, page_visits, admins FROM anon, authenticated;

GRANT SELECT ON events TO authenticated;
GRANT SELECT, INSERT, DELETE ON invitations TO authenticated;
GRANT UPDATE (display_name, instagram_handle, personal_message, qr_code)
    ON invitations TO authenticated;
GRANT SELECT ON page_visits TO authenticated;

DROP POLICY IF EXISTS events_admin_select ON events;
CREATE POLICY events_admin_select ON events
    FOR SELECT TO authenticated
    USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS invitations_admin_select ON invitations;
CREATE POLICY invitations_admin_select ON invitations
    FOR SELECT TO authenticated
    USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS invitations_admin_insert ON invitations;
CREATE POLICY invitations_admin_insert ON invitations
    FOR INSERT TO authenticated
    WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS invitations_admin_update ON invitations;
CREATE POLICY invitations_admin_update ON invitations
    FOR UPDATE TO authenticated
    USING ((SELECT public.is_admin()))
    WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS invitations_admin_delete ON invitations;
CREATE POLICY invitations_admin_delete ON invitations
    FOR DELETE TO authenticated
    USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS page_visits_admin_select ON page_visits;
CREATE POLICY page_visits_admin_select ON page_visits
    FOR SELECT TO authenticated
    USING ((SELECT public.is_admin()));

-- Khách mở thiệp bằng mã QR (ngẫu nhiên 128-bit, hoặc mã do quản trị viên tự
-- đặt). Hàm chỉ trả đúng một lời mời khớp mã và không bao giờ để lộ token,
-- qr_code hay danh sách khách.
-- Migration 009 đổi kiểu trả về của hàm này, nên phải xoá trước khi tạo lại.
DROP FUNCTION IF EXISTS open_invitation(TEXT);

CREATE FUNCTION open_invitation(p_code TEXT)
RETURNS TABLE (
    display_name TEXT,
    instagram_handle TEXT,
    personal_message TEXT,
    theme_variant TEXT
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
        i.theme_variant
    FROM public.invitations AS i
    WHERE p_code ~ '^[A-Za-z0-9_-]{8,64}$'
        AND i.qr_code = p_code
    LIMIT 1;
$$;

-- Ghi một lượt truy cập. Trả về false khi bỏ qua (dữ liệu sai, trang /dev,
-- hoặc cùng visitor + path trong vòng 30 giây).
CREATE OR REPLACE FUNCTION record_page_visit(
    p_visitor_id UUID,
    p_path TEXT,
    p_referrer TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_path TEXT := btrim(p_path);
    v_referrer TEXT := nullif(btrim(p_referrer), '');
    v_headers JSON := nullif(current_setting('request.headers', true), '')::JSON;
BEGIN
    IF p_visitor_id IS NULL
        OR v_path IS NULL
        OR v_path !~ '^/'
        OR char_length(v_path) > 500
        OR v_path LIKE '/dev%'
        OR char_length(v_referrer) > 1000
    THEN
        RETURN false;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.page_visits
        WHERE visitor_id = p_visitor_id
            AND path = v_path
            AND created_at > now() - INTERVAL '30 seconds'
    ) THEN
        RETURN false;
    END IF;

    INSERT INTO public.page_visits (visitor_id, path, referrer, user_agent)
    VALUES (
        p_visitor_id,
        v_path,
        v_referrer,
        left(v_headers ->> 'user-agent', 1000)
    );

    RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION is_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION open_invitation(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION record_page_visit(UUID, TEXT, TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION open_invitation(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION record_page_visit(UUID, TEXT, TEXT) TO anon, authenticated;
