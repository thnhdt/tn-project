-- Thiệp chung đã có sẵn lời mời, nên lời nhắn riêng giờ không bắt buộc:
-- cho phép chuỗi rỗng. Cột vẫn NOT NULL; để trống thì lưu ''.
ALTER TABLE invitations
    DROP CONSTRAINT IF EXISTS invitations_personal_message_check;
ALTER TABLE invitations
    ADD CONSTRAINT invitations_personal_message_check
    CHECK (
        personal_message = btrim(personal_message)
        AND char_length(personal_message) <= 1200
    );
