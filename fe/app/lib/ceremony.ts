import { ceremony } from "../site-content";

const [year, month, day] = ceremony.startsAt.slice(0, 10).split("-");
const mapQuery = ceremony.address ?? ceremony.location;

/** Thông tin buổi lễ đã định dạng, dùng chung cho trang thiệp riêng và thiệp PDF. */
export const ceremonyDate = `${day}.${month}.${year}`;
export const ceremonyTime = ceremony.time ?? "sẽ cập nhật";
export const ceremonyLocation = ceremony.location ?? "sẽ cập nhật";
export const ceremonyAddress = ceremony.address;

/** Link chỉ đường: ưu tiên `mapUrl`, nếu chưa có thì tìm theo địa chỉ. */
export const directionsUrl =
    ceremony.mapUrl ??
    (mapQuery
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`
        : null);

/** Bản đồ nhúng của Google Maps, không cần API key. */
export const mapEmbedUrl = mapQuery
    ? `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`
    : null;
