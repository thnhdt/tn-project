"use client";

import { useEffect, useState } from "react";
import { buildInviteUrl } from "../lib/qr";
import { downloadBlob, inviteCardToPdf, qrDataUrl, renderInviteCard } from "../lib/qr-card";
import "./guest-qr.css";

type GuestQrProps = {
    displayName: string;
    personalMessage: string;
    themeVariant: string;
    qrCode: string;
    regenerating: boolean;
    onRegenerate: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onError: (message: string) => void;
};

function fileSlug(name: string) {
    return (
        name
            .normalize("NFD")
            .replace(/[̀-ͯ]/g, "")
            .replace(/đ/gi, "d")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "") || "guest"
    );
}

export function GuestQr({
    displayName,
    personalMessage,
    themeVariant,
    qrCode,
    regenerating,
    onRegenerate,
    onEdit,
    onDelete,
    onError,
}: GuestQrProps) {
    const [preview, setPreview] = useState("");
    const [exporting, setExporting] = useState(false);
    /** `false`: xuất thiệp sạch, không QR / link web. */
    const [withQr, setWithQr] = useState(true);
    const [inviteUrl, setInviteUrl] = useState("");

    useEffect(() => {
        const url = buildInviteUrl(window.location.origin, qrCode);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- The invite URL depends on the browser origin.
        setInviteUrl(url);
        void qrDataUrl(url, 176).then(setPreview);
    }, [qrCode]);

    const exportCard = async (format: "png" | "pdf") => {
        setExporting(true);
        try {
            const png = await renderInviteCard(
                { displayName, personalMessage, themeVariant },
                inviteUrl,
                { withQr },
            );
            const fileName = `thiep-moi-${fileSlug(displayName)}${withQr ? "" : "-khong-qr"}.${format}`;
            downloadBlob(format === "pdf" ? await inviteCardToPdf(png) : png, fileName);
        } catch (exportError) {
            onError(exportError instanceof Error ? exportError.message : "Không thể tạo file QR.");
        } finally {
            setExporting(false);
        }
    };

    const copyLink = () => {
        void navigator.clipboard?.writeText(inviteUrl);
    };

    return (
        <div className="dev-qr">
            {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt={`QR thiệp mời của ${displayName}`} />
            ) : null}
            <div className="dev-qr-actions">
                <code title={inviteUrl}>{inviteUrl}</code>
                <select
                    className="dev-qr-variant"
                    aria-label="Kiểu thiệp khi xuất PNG/PDF"
                    value={withQr ? "qr" : "plain"}
                    disabled={exporting}
                    onChange={(event) => setWithQr(event.target.value === "qr")}
                >
                    <option value="qr">Có QR</option>
                    <option value="plain">Không QR</option>
                </select>
                <button type="button" disabled={exporting} onClick={() => void exportCard("png")}>
                    PNG ↓
                </button>
                <button type="button" disabled={exporting} onClick={() => void exportCard("pdf")}>
                    PDF ↓
                </button>
                <button type="button" onClick={copyLink}>
                    COPY LINK
                </button>
                <button type="button" onClick={() => window.open(inviteUrl, "_blank", "noopener")}>
                    XEM THIỆP ↗
                </button>
                <button
                    type="button"
                    disabled={regenerating}
                    onClick={() => {
                        if (window.confirm(`Tạo mã mới cho ${displayName}? QR cũ sẽ hết hiệu lực.`)) {
                            onRegenerate();
                        }
                    }}
                >
                    {regenerating ? "ĐANG TẠO..." : "TẠO MÃ MỚI ↻"}
                </button>
                <button type="button" onClick={onEdit}>
                    SỬA ✎
                </button>
                <button
                    type="button"
                    className="is-danger"
                    onClick={() => {
                        if (window.confirm(`Xoá ${displayName} khỏi danh sách? QR của khách này sẽ hết hiệu lực.`)) {
                            onDelete();
                        }
                    }}
                >
                    XOÁ ✕
                </button>
            </div>
        </div>
    );
}
