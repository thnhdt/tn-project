-- Lỗi phía trình duyệt do Edge Function error-report ghi lại (bằng service
-- role) trước khi báo qua Telegram. Bảng này cũng là chỗ đếm để giới hạn tần
-- suất, nên khách và cả quản trị viên đều không truy cập trực tiếp.
-- File này chạy lại nhiều lần được.

CREATE TABLE IF NOT EXISTS client_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_id UUID NOT NULL,
    path TEXT NOT NULL,
    source TEXT NOT NULL,
    message TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS client_errors_created_at_idx
    ON client_errors (created_at DESC);

ALTER TABLE client_errors ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON client_errors FROM PUBLIC;
REVOKE ALL ON client_errors FROM anon, authenticated;
GRANT SELECT, INSERT ON client_errors TO service_role;
