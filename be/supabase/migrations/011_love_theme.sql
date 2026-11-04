-- Thiệp hồng dành cho người thương: thêm giao diện 'love' và cho dashboard
-- đổi giao diện của từng khách.
-- File này chạy lại nhiều lần được.
--
-- NOT VALID: db:migrate chạy lại mọi migration theo thứ tự, khi đó database đã có
-- khách dùng theme của migration sau (ví dụ 'discord' ở 012). Không kiểm tra lại
-- dòng cũ ở đây; 012 thay ràng buộc này bằng danh sách đầy đủ và kiểm tra toàn bộ.

ALTER TABLE invitations
    DROP CONSTRAINT IF EXISTS invitations_theme_variant_check;
ALTER TABLE invitations
    ADD CONSTRAINT invitations_theme_variant_check
    CHECK (theme_variant IN ('desktop', 'notebook', 'compiler', 'love')) NOT VALID;

GRANT UPDATE (theme_variant) ON invitations TO authenticated;
