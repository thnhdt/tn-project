DROP INDEX IF EXISTS invitations_instagram_handle_lower_idx;

CREATE UNIQUE INDEX IF NOT EXISTS invitations_instagram_handle_exact_idx
    ON invitations (instagram_handle)
    WHERE instagram_handle IS NOT NULL;
