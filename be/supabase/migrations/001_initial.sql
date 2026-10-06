CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    graduate_name TEXT NOT NULL,
    degree TEXT NOT NULL,
    university TEXT NOT NULL,
    event_title TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'vi',
    music_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    personal_message TEXT NOT NULL,
    theme_variant TEXT NOT NULL DEFAULT 'desktop'
        CHECK (theme_variant IN ('desktop', 'notebook', 'compiler')),
    is_test BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS invitations_event_id_idx
    ON invitations(event_id);

CREATE INDEX IF NOT EXISTS invitations_token_idx
    ON invitations(token);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
