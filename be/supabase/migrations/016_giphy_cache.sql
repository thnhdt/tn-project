-- Cache danh sách GIF của Edge Function giphy, để không gọi GIPHY mỗi lần có
-- người mở trang (key beta của GIPHY chỉ cho 100 lần gọi mỗi giờ).
--   giphy_cache: mỗi chủ đề (tag) giữ một danh sách ~50 GIF, làm mới sau vài giờ.
--   giphy_upstream_calls: mỗi lần thật sự gọi GIPHY ghi một dòng, dùng để đếm và
--   chặn khi gần chạm giới hạn mỗi giờ.
-- Chỉ Edge Function (service role) dùng hai bảng này. File này chạy lại nhiều lần được.

CREATE TABLE IF NOT EXISTS giphy_cache (
    cache_key TEXT PRIMARY KEY,
    gifs JSONB NOT NULL,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS giphy_upstream_calls (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS giphy_upstream_calls_created_at_idx
    ON giphy_upstream_calls (created_at DESC);

ALTER TABLE giphy_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE giphy_upstream_calls ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON giphy_cache FROM PUBLIC;
REVOKE ALL ON giphy_cache FROM anon, authenticated;
REVOKE ALL ON giphy_upstream_calls FROM PUBLIC;
REVOKE ALL ON giphy_upstream_calls FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON giphy_cache TO service_role;
GRANT SELECT, INSERT, DELETE ON giphy_upstream_calls TO service_role;
