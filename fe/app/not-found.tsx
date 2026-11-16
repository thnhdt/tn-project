import Link from "next/link";
import "./homie/homie.css";

/** Trang 404 chung, dùng lại khung thẻ của trang thiệp riêng. */
export default function NotFound() {
    return (
        <main className="homie-shell homie-result-shell">
            <div className="homie-grid" aria-hidden="true" />
            <div className="homie-not-found">
                <span>404_PAGE_NOT_FOUND</span>
                <h1>Ơ, trang này không có thật rồi.</h1>
                <p>Link có thể bị gõ sai hoặc đã đổi chỗ. Quay về trang chính xem thiệp nha!</p>
                <Link href="/">VỀ TRANG CHÍNH →</Link>
            </div>
        </main>
    );
}
