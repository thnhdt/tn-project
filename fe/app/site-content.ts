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
    /** Mốc đồng hồ đếm ngược, luôn ghi kèm múi giờ +07:00. */
    startsAt: "2026-11-01T00:00:00+07:00",
    /** Để `null` khi chưa chốt; trang sẽ hiện "sẽ được cập nhật". */
    time: null as string | null,
    /** Tên địa điểm ngắn gọn, ví dụ "Hội trường A5". */
    location: null as string | null,
    /** Địa chỉ đầy đủ, dùng để tìm trên bản đồ và in trong thiệp PDF. */
    address: null as string | null,
    /** Link Google Maps; để `null` thì tự tìm theo địa chỉ. */
    mapUrl: null as string | null,
};

export const toolbar = {
    brand: "BLUE_NOTEBOOK",
    homieLink: "MỞ THIỆP RIÊNG ↗",
};

export const hero = {
    eyebrow: `BUILD PASSED • CLASS OF ${graduate.classOf}`,
    scribble: "finally shipped!",
    photoTitle: "ẢNH CỦA ĐẠT",
    photoHint: "drop your best shot here",
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

export const memories = {
    kicker: "04 / MEMORY CACHE",
    title: ["ẢNH Ở ĐÂY.", "BUG Ở LẠI."],
    text: "Khung mẫu cho gallery — ảnh thật sẽ được tối ưu và thay vào sau.",
    items: [
        {
            mark: "↗",
            title: "first commit",
            caption: "Ngày đầu còn tưởng deadline là một khái niệm trừu tượng.",
        },
        {
            mark: "✦",
            title: "debug era",
            caption: "99 little bugs in the code, take one down… 127 bugs.",
        },
        {
            mark: "!!",
            title: "final build",
            caption: "Sau tất cả, build đã xanh và mình cũng sắp mặc áo tốt nghiệp.",
        },
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
    title: ["ĐẾM NGƯỢC", "TỚI NGÀY ĐẶC BIỆT"],
    text: "Đồng hồ đang compile từng giây tới ngày",
};

export const gifMachine = {
    kicker: "05 / RANDOM JOY MACHINE",
    title: ["BỐC MỘT CHIẾC", "GIF TỐT NGHIỆP"],
    text: "Bấm nút để gọi một reaction ngẫu nhiên từ GIPHY. Hợp mood thì tải về, chưa hợp thì bốc lại!",
    /** Tự bốc một GIF khi mở trang. */
    autoLoad: true,
};

export const footer = {
    label: "MADE WITH",
    text: "CODE + CHAOS + COFFEE",
};
