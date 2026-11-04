-- Thiệp hồng dành cho người thương: thêm giao diện 'love' và cho dashboard
-- đổi giao diện của từng khách.
-- File này chạy lại nhiều lần được.

ALTER TABLE invitations
    DROP CONSTRAINT IF EXISTS invitations_theme_variant_check;
ALTER TABLE invitations
    ADD CONSTRAINT invitations_theme_variant_check
    CHECK (theme_variant IN ('desktop', 'notebook', 'compiler', 'love'));

GRANT UPDATE (theme_variant) ON invitations TO authenticated;
