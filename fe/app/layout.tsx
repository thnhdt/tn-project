import type { Metadata } from "next";
import {
    Be_Vietnam_Pro,
    Roboto_Mono,
    Shantell_Sans,
} from "next/font/google";
import { PageVisitTracker } from "./page-visit-tracker";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
    variable: "--font-be-vietnam",
    subsets: ["latin", "vietnamese"],
    weight: ["400", "500", "600", "700", "800", "900"],
});

const robotoMono = Roboto_Mono({
    variable: "--font-roboto-mono",
    subsets: ["latin", "vietnamese"],
    weight: ["400", "500", "600", "700"],
});

const shantellSans = Shantell_Sans({
    variable: "--font-doodle",
    subsets: ["latin", "vietnamese"],
    weight: "variable",
});

export const metadata: Metadata = {
    title: "Lễ Tốt Nghiệp — Lê Thành Đạt",
    description:
        "Theme preview cho trang mời tốt nghiệp của Lê Thành Đạt, Cử nhân Khoa học Máy tính.",
    // Favicon: phần đầu (mũ, mặt) của sticker tốt nghiệp ở trang chủ.
    icons: {
        icon: { url: "/favicon.png", type: "image/png", sizes: "192x192" },
        shortcut: "/favicon.png",
    },
};

/**
 * Chạy trước khi React tải: tắt tự khôi phục vị trí cuộn, mở trang luôn ở đầu
 * (trừ link có # hoặc khi khách đã tự cuộn trước lúc trang tải xong).
 */
const scrollToTopOnLoad = `(function () {
    try { if ("scrollRestoration" in history) history.scrollRestoration = "manual"; } catch (e) {}
    var touched = false;
    function markTouched() { touched = true; }
    ["touchstart", "wheel", "keydown"].forEach(function (name) {
        window.addEventListener(name, markTouched, { once: true, passive: true });
    });
    function toTop() {
        // Khách đã tự cuộn/chạm trước khi trang tải xong thì giữ nguyên chỗ họ đang xem.
        if (location.hash || touched) return;
        try { window.scrollTo({ top: 0, left: 0, behavior: "instant" }); } catch (e) { window.scrollTo(0, 0); }
    }
    window.addEventListener("pageshow", toTop);
    window.addEventListener("load", function () { toTop(); setTimeout(toTop, 50); });
})();`;

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="vi">
            <body
                className={`${beVietnamPro.variable} ${robotoMono.variable} ${shantellSans.variable}`}
            >
                {/* Không cho trình duyệt tự khôi phục vị trí cuộn khi tải lại: app Google trên iPhone
                    kéo-để-tải-lại xong thì trả về vị trí lệch, header bị kẹt sau thanh địa chỉ. */}
                <script dangerouslySetInnerHTML={{ __html: scrollToTopOnLoad }} />
                <PageVisitTracker />
                {children}
            </body>
        </html>
    );
}
