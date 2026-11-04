-- Add the friends' Discord theme without changing access privileges.
ALTER TABLE invitations DROP CONSTRAINT IF EXISTS invitations_theme_variant_check;
ALTER TABLE invitations ADD CONSTRAINT invitations_theme_variant_check
    CHECK (theme_variant IN ('desktop', 'notebook', 'compiler', 'love', 'discord'));
