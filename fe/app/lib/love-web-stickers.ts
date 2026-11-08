// Sticker cho trang thiệp hồng, chia theo hàng: một hàng sticker động, hai hàng sticker tĩnh.
const base = "/stickers/love-web";

/** Sticker động (WebP nhiều khung hình). */
export const loveAnimatedStickers = [
    `${base}/sticker-6bba7992ae00.webp`,
    `${base}/sticker-2e0d03c44e71.webp`,
    `${base}/sticker-c09cdb1c2d65.webp`,
    `${base}/sticker-2f7385ce4b55.webp`,
    `${base}/sticker-3fe076e4e592.webp`,
    `${base}/sticker-bbdffe768775.webp`,
];

/** Sticker tĩnh (ảnh PNG), chia làm hai hàng. */
const loveStaticStickers = [
    `${base}/sticker-299f278187d4.png`,
    `${base}/sticker-b417b821d433.png`,
    `${base}/sticker-78582dd4428f.png`,
    `${base}/sticker-170dd33cde9e.png`,
    `${base}/sticker-e22217927d25.png`,
    `${base}/sticker-0ae501ede4e4.png`,
    `${base}/sticker-2ad87af35f4a.png`,
    `${base}/sticker-6ccc1997e05d.png`,
    `${base}/sticker-97716912be4b.png`,
];

/** Các hàng sticker theo thứ tự xuất hiện trên trang. */
export const loveStickerRows = [
    loveAnimatedStickers,
    loveStaticStickers.slice(0, 5),
    loveStaticStickers.slice(5),
];
