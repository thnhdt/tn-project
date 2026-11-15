"use client";

/**
 * Nút về đầu trang. Dùng nút cuộn thẳng thay vì link `#top`: link sẽ gắn `#top` vào
 * URL và router xử lý hash, khiến trang bị kéo giữ ở đầu.
 */
export function BackToTop() {
    const scrollToTop = () => {
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    };

    return (
        <button className="back-to-top" type="button" onClick={scrollToTop}>
            BACK_TO_TOP ↑
        </button>
    );
}
