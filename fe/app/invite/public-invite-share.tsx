"use client";

import { useEffect, useState } from "react";
import { downloadBlob, inviteCardToPdf, qrDataUrl, renderInviteCard } from "../lib/qr-card";

export function PublicInviteShare() {
    const [qr, setQr] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        void qrDataUrl(`${window.location.origin}/invite`, 240).then(setQr).catch(() => setError("Chưa tạo được QR, vui lòng tải lại trang."));
    }, []);

    async function exportCard(format: "png" | "pdf") {
        setBusy(true);
        setError("");
        try {
            const png = await renderInviteCard({
                displayName: "Bạn",
                personalMessage: "Mời bạn đến chung vui trong ngày tốt nghiệp của Đạt! Có bạn ở đó, khoảnh khắc này sẽ đáng nhớ hơn rất nhiều. Hẹn gặp bạn tại buổi lễ nhé!",
                themeVariant: "desktop",
            }, `${window.location.origin}/invite`);
            downloadBlob(format === "pdf" ? await inviteCardToPdf(png) : png, `thiep-moi-chung.${format}`);
        } catch {
            setError("Chưa tải được thiệp. Bạn thử lại nhé!");
        } finally {
            setBusy(false);
        }
    }

    return (
        <section className="public-invite-share" aria-label="Chia sẻ thiệp mời chung">
            <h2>Hẹn gặp bạn tại buổi lễ!</h2>
            <p>QR này mở thẳng thiệp mời chung, không cần đăng nhập hay mã riêng.</p>
            {qr ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qr} width={180} height={180} alt="QR mở thiệp mời chung" />
            ) : null}
            <div className="homie-result-actions">
                {qr ? <a href={qr} download="qr-thiep-moi-chung.png">TẢI QR ↓</a> : null}
                <button disabled={busy} onClick={() => void exportCard("png")}>THIỆP PNG ↓</button>
                <button disabled={busy} onClick={() => void exportCard("pdf")}>THIỆP PDF ↓</button>
            </div>
            {error ? <p role="alert">{error}</p> : null}
        </section>
    );
}
