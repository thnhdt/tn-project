// Cloudflare Pages Function của project thiệp (root directory: fe).
// Người vào bằng tn-project.pages.dev được chuyển sang tên miền chính, giữ nguyên
// đường dẫn và tham số. Địa chỉ xem trước của từng lần deploy (<hash>.tn-project.pages.dev)
// không bị chuyển, để còn kiểm tra bản mới.

const TEN_MIEN_CHINH = "tn.thnhdt.site";
const TEN_MIEN_PHU = ["tn-project.pages.dev"];

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
