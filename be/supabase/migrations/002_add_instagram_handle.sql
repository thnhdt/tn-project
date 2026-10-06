ALTER TABLE invitations
    ADD COLUMN IF NOT EXISTS instagram_handle TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS invitations_instagram_handle_lower_idx
    ON invitations (lower(instagram_handle))
    WHERE instagram_handle IS NOT NULL;
