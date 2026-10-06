ALTER TABLE invitations
    ADD COLUMN IF NOT EXISTS access_code_salt TEXT;

ALTER TABLE invitations
    ADD COLUMN IF NOT EXISTS access_code_hash TEXT;
