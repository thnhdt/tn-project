/**
 * Toàn bộ nội dung chữ của trang chủ nằm ở đây.
 * Muốn đổi tên, ngày, địa điểm hay lời nhắn: chỉ cần sửa file này.
 */

export const graduate = {
    firstName: "LÊ THÀNH",
    lastName: "ĐẠT",
    fullName: "Lê Thành Đạt",
    signature: "— Đạt ✦",
    initials: "LD",
    degree: "Cử nhân Khoa học Máy tính",
    university: ["Trường Đại học Bách khoa", "Đại học Quốc gia TP.HCM"],
    classOf: "2026",
    badge: "BK • CS",
};

export const ceremony = {
    title: "LỄ TỐT NGHIỆP",
    /** Mốc đồng hồ đếm ngược (giờ bắt đầu), luôn ghi kèm múi giờ +07:00. */
    startsAt: "2026-11-28T15:30:00+07:00",
    /** Khung giờ hiển thị trên thiệp. Để `null` khi chưa chốt. */
    time: "15h30 – 17h30" as string | null,
    /** Tên địa điểm ngắn gọn, ví dụ "Hội trường A5". */
    location: "Sảnh A5" as string | null,
    /** Địa chỉ đầy đủ, dùng để tìm trên bản đồ và in trong thiệp PDF. */
    address: "Trường Đại học Bách khoa – ĐHQG TP.HCM, 268 Lý Thường Kiệt, TP.HCM" as string | null,
    /** Link Google Maps; để `null` thì tự tìm theo địa chỉ. */
    mapUrl: "https://maps.app.goo.gl/2NhU8gK859pcNhge7" as string | null,
    /** Các cổng vào trường, mỗi cổng một bản đồ nhúng trên thiệp. */
    gates: [
        {
            name: "Cổng 1",
            note: "Cổng chính, đường Lý Thường Kiệt",
            mapUrl: "https://maps.app.goo.gl/2NhU8gK859pcNhge7",
            lat: 10.772075,
            lng: 106.6579018,
        },
        {
            name: "Cổng 3",
            note: "Cổng sau, đường Tô Hiến Thành",
            mapUrl: "https://maps.app.goo.gl/RG27xk4PMytdWLKa9",
            lat: 10.7736185,
            lng: 106.6612596,
        },
    ],
    /** Sơ đồ khuôn viên trường, nằm trong `public/`. */
    campusMap: "/so-do-bk.webp",
};

export const toolbar = {
    brand: "BLUE_NOTEBOOK",
    homieLink: "MỞ THIỆP RIÊNG ↗",
    photoDropLink: "THẢ ẢNH DZÔ ĐÂY ↑",
};

export const hero = {
    eyebrow: `BUILD PASSED • CLASS OF ${graduate.classOf}`,
    scribble: "finally shipped!",
    photoTitle: "ẢNH CỦA ĐẠT",
    photoCaption: "(literally me)",
    windowTitle: "graduation_final_FINAL.exe",
};

export const journey = {
    label: "QUICK SKETCH",
    title: "4 NĂM TRONG 1 DÒNG",
    steps: [
        { symbol: "< >", label: "HELLO WORLD", caption: "nhập học" },
        { symbol: "?!", label: "PLOT TWIST", caption: "deadline" },
        { symbol: "{✓}", label: "BUILD PASSED", caption: "đồ án" },
        { symbol: "★", label: "NEW LEVEL", caption: "tốt nghiệp" },
    ],
};

export const story = {
    kicker: "03 / MY README",
    title: ["MỘT CHẶNG ĐƯỜNG", "ĐƯỢC COMPILE"],
    text: "Một chiếc thiệp không quá nghiêm túc cho một cột mốc rất nghiêm túc — được ghép từ code, meme, những đêm debug và thật nhiều kỷ niệm.",
    equation: ["4 NĂM", "∞ CÀ PHÊ", "BUGS"],
    equationResult: "1 TẤM BẰNG!",
    terminalPrompt: "đạt@hcmut",
    terminalCommand: "git log --oneline university",
    commits: [
        { hash: "c5f2026", message: "feat: officially graduate" },
        { hash: "4y3ars", message: "fix: survive every deadline" },
        { hash: "0coffee", message: "docs: thank everyone who stayed" },
    ],
};

export const invite = {
    kicker: "01 / SAVE THE DATE",
    sideDoodle: "circle this date!",
    to: "TO: MY FAVORITE HUMAN(S)",
    text: "Có mặt nhé! Vì hành trình này sẽ vui hơn rất nhiều nếu có những người từng xuất hiện trong “source code” thanh xuân của mình.",
};

export const countdown = {
    kicker: "02 / TICK TOCK",
    title: ["ĐỒNG HỒ", "ĐẾM NGƯỢC !!!"],
    text: "Đồng hồ đang compile từng giây tới ngày",
};

export const gifMachine = {
    kicker: "04 / RANDOM JOY MACHINE",
    title: ["BỐC MỘT CHIẾC", "GIF TỐT NGHIỆP"],
    text: "Bốc mọi chủ đề hoặc chọn tag meme quen thuộc bên dưới. Hợp mood thì tải về, chưa hợp thì bốc tiếp!",
    /** Tự bốc một GIF khi mở trang. */
    autoLoad: true,
};

export const footer = {
    label: "MADE WITH",
    text: "CODE + CHAOS + COFFEE",
};
