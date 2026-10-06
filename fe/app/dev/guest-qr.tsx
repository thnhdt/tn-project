"use client";

import { useEffect, useState } from "react";
import { buildInviteUrl } from "../lib/qr";
import { downloadBlob, inviteCardToPdf, qrDataUrl, renderInviteCard } from "../lib/qr-card";

type GuestQrProps = {
    displayName: string;
    personalMessage: string;
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
    qrCode,
    regenerating,
    onRegenerate,
    onEdit,
    onDelete,
    onError,
}: GuestQrProps) {
    const [preview, setPreview] = useState("");
    const [exporting, setExporting] = useState(false);
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
            const png = await renderInviteCard({ displayName, personalMessage }, inviteUrl);
            const fileName = `thiep-moi-${fileSlug(displayName)}.${format}`;
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
