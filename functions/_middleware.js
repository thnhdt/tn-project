// Cloudflare Pages Function của project trang chào
// (root directory: để trống, build output directory: landing).
// Người vào bằng thnhdt-landing.pages.dev được chuyển sang
// tên miền gốc, giữ nguyên đường dẫn. Địa chỉ xem trước của từng lần deploy không bị chuyển.

const TEN_MIEN_CHINH = "thnhdt.site";
const TEN_MIEN_PHU = ["thnhdt-landing.pages.dev"];

export async function onRequest({ request, next }) {
    const url = new URL(request.url);
    if (!TEN_MIEN_PHU.includes(url.hostname)) {
        return next();
    }
    url.protocol = "https:";
    url.hostname = TEN_MIEN_CHINH;
    url.port = "";
    return Response.redirect(url.toString(), 301);
}
