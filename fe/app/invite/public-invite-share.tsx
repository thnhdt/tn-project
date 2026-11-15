"use client";

import { useState } from "react";
import { downloadBlob, inviteCardToPdf, renderInviteCard } from "../lib/qr-card";

/** Cuối trang thiệp chung: tải thiệp PNG / PDF (QR in trên thiệp mở lại trang này). */
export function PublicInviteShare() {
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    async function exportCard(format: "png" | "pdf") {
        setBusy(true);
        setError("");
        try {
            const png = await renderInviteCard({
                displayName: "Bạn",
                personalMessage: "",
                themeVariant: "desktop",
                hideName: true,
            }, `${window.location.origin}/invite`);
            downloadBlob(format === "pdf" ? await inviteCardToPdf(png) : png, `thiep-moi-chung.${format}`);
        } catch {
            setError("Chưa tải được thiệp. Bạn thử lại nhé!");
        } finally {
            setBusy(false);
        }
    }

    return (
        <section className="public-invite-share" aria-label="Tải thiệp mời chung">
            <h2>Hẹn gặp bạn tại buổi lễ!</h2>
            <div className="homie-result-actions">
                <button disabled={busy} onClick={() => void exportCard("png")}>THIỆP PNG ↓</button>
                <button disabled={busy} onClick={() => void exportCard("pdf")}>THIỆP PDF ↓</button>
            </div>
            {error ? <p role="alert">{error}</p> : null}
        </section>
    );
}
