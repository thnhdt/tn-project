CREATE TABLE IF NOT EXISTS page_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_id UUID NOT NULL,
    path TEXT NOT NULL,
    referrer TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS page_visits_created_at_idx
    ON page_visits (created_at DESC);

CREATE INDEX IF NOT EXISTS page_visits_visitor_id_idx
    ON page_visits (visitor_id);

ALTER TABLE page_visits ENABLE ROW LEVEL SECURITY;
