/**
 * Lời mời chung: mọi khách đều thấy y như nhau trên thiệp mặc định và Discord.
 * Muốn thêm, bớt hay đổi câu: chỉ cần sửa file này.
 */
export const inviteLines = {
    headline: "Ske đã tốt nghiệppp",
    subline: "Đông về thêm gió, cuối tháng này thêm 1 lễ tốt nghiệp nhaaaa",
    /** Các câu vui, hiện thành sticker (mặc định) hoặc tin nhắn (Discord). */
    jokes: [
        "28/11 này rảnh không? Không rảnh cũng ráng rảnh nha 😤",
        "Bằng thì trường phát, còn ảnh đẹp thì cần bạn tới chụp giùm 📸",
        "Hoa không bắt buộc, mặt bạn thì bắt buộc 🌷",
        "Sau bao năm bị deadline dí, cuối cùng cũng được trường thả ra rồi",
        "Nhiệm vụ chính: HOÀN THÀNH ✓. Phần thưởng: có bạn tới chung vui",
    ],
    /** Câu chốt cuối thiệp. */
    closing: "Hẹn gặp ở Sảnh A5 nha, tới trễ là lọt khỏi khung hình đó!",
} as const;

/** Lời mời in trên thiệp PDF khi khách không có lời nhắn riêng. */
export const fallbackCardMessage = `${inviteLines.headline} ${inviteLines.subline}. ${inviteLines.jokes[0]}`;
