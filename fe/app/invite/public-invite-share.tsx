"use client";

import { useState } from "react";
import { downloadBlob, inviteCardToPdf, renderInviteCard } from "../lib/qr-card";
import { graduate } from "../site-content";

/**
 * Cuối trang thiệp chung: tải thiệp PNG / PDF. Hai dạng thiệp: có QR (QR in trên thiệp
 * mở lại trang này) hoặc không QR (để gửi/in, không có QR hay link web, tự xưng
 * `graduate.callName` thay cho biệt danh "Ske").
 */
export function PublicInviteShare() {
    const [withQr, setWithQr] = useState(true);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState<"png" | "pdf" | null>(null);

    async function exportCard(format: "png" | "pdf") {
        setBusy(format);
        setError("");
        try {
            const png = await renderInviteCard({
                displayName: "Bạn",
                personalMessage: "",
                themeVariant: "desktop",
                hideName: true,
            }, `${window.location.origin}/invite`, { withQr });
            const fileName = `thiep-moi-chung${withQr ? "" : "-khong-qr"}.${format}`;
            downloadBlob(format === "pdf" ? await inviteCardToPdf(png) : png, fileName);
        } catch {
            setError("Chưa tải được thiệp. Bạn thử lại nhé!");
        } finally {
            setBusy(null);
        }
    }

    return (
        <section className="public-invite-share" aria-label="Tải thiệp mời chung">
            <h2>Hẹn gặp bạn tại buổi lễ!</h2>
            <label className="card-variant">
                <span>DẠNG THIỆP</span>
                <select
                    value={withQr ? "qr" : "plain"}
                    disabled={busy !== null}
                    onChange={(event) => setWithQr(event.target.value === "qr")}
                >
                    <option value="qr">Thiệp có QR + link web</option>
                    <option value="plain">{`Thiệp không QR (ghi tên ${graduate.callName})`}</option>
                </select>
            </label>
            <div className="homie-result-actions">
                <button disabled={busy !== null} onClick={() => void exportCard("png")}>
                    {busy === "png" ? "ĐANG VẼ THIỆP…" : "THIỆP PNG ↓"}
                </button>
                <button disabled={busy !== null} onClick={() => void exportCard("pdf")}>
                    {busy === "pdf" ? "ĐANG VẼ THIỆP…" : "THIỆP PDF ↓"}
                </button>
            </div>
            {error ? <p role="alert">{error}</p> : null}
        </section>
    );
}
