CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE invitations
    ADD COLUMN IF NOT EXISTS qr_code TEXT;

UPDATE invitations
    SET qr_code = encode(gen_random_bytes(16), 'hex')
    WHERE qr_code IS NULL;

ALTER TABLE invitations
    ALTER COLUMN qr_code SET DEFAULT encode(gen_random_bytes(16), 'hex');

ALTER TABLE invitations
    ALTER COLUMN qr_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS invitations_qr_code_idx
    ON invitations (qr_code);
