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
    /** Riêng thiệp mặc định (Blue Notebook): lời chào, câu phụ và note ngắn gọn hơn. */
    defaultTheme: {
        greeting: "Hellooo",
        subline: "Đến chụp với tui mấy tấm hình thiệccc đẹp nhaaaa",
        jokes: ["Nhiệm vụ chính: HOÀN THÀNH ✓. Phần thưởng: có bạn tới chung vui"],
        closing: "Rất mong gặp bạn ở sảnh A5 đó nha!!!",
    },
    /** Riêng thiệp Discord: tin nhắn dài của Skehjhj, mỗi câu là một dòng. */
    discordTheme: {
        messages: [
            "Lâu lắm rồi anh em mình không ngồi lại với nhau để bàn lại cách sống, có lẽ đồng tiền quá mạnh khiến anh em mình không thể lại gần nhau !",
            "Anh em thử luộc con gà lên, không cần chặt, để nó nguội, xong ngồi xé. Mấy anh em ngồi xé, các anh em ăn sẽ cảm thấy ngon và thú vị như thế nào.",
            "Nói chung là bữa đó tới nái nha anh em, cần thiết á",
        ],
    },
    /** Câu chốt cuối thiệp. */
    closing: "Hẹn gặp ở Sảnh A5 nha, tới trễ là lọt khỏi khung hình đó!",
} as const;

/** Lời mời in trên thiệp PDF khi khách không có lời nhắn riêng. */
export const fallbackCardMessage = `${inviteLines.headline} ${inviteLines.subline}. ${inviteLines.jokes[0]}`;
