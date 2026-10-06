ALTER TABLE invitations
    ADD COLUMN IF NOT EXISTS access_answers TEXT[] NOT NULL DEFAULT '{}';
