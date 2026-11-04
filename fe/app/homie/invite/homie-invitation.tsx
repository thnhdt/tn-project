"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CountdownClock } from "../../home/countdown-clock";
import {
    errorMessage,
    type GuestInvitation,
    invitationPhotoUrl,
    loveTheme,
    openInvitation,
    readInviteCode,
    reportError,
    saveInviteCode,
} from "../../lib/api";
import {
    ceremonyAddress,
    ceremonyDate,
    ceremonyLocation,
    ceremonyTime,
    directionsUrl,
    mapEmbedUrl,
} from "../../lib/ceremony";
import { graduate } from "../../site-content";
import { LoveEffects } from "./love-effects";
import { ImportedStickers } from "./imported-stickers";

const eventDetails = [
    { label: "NGÀY", value: ceremonyDate, detail: null },
    { label: "GIỜ", value: ceremonyTime, detail: null },
    { label: "ĐỊA ĐIỂM", value: ceremonyLocation, detail: ceremonyAddress },
];

const wrongCodeMessage = "Trang này chỉ mở được bằng đúng mã QR trên thiệp của bạn.";

export function HomieInvitation({ publicInvitation = false }: { publicInvitation?: boolean }) {
    const [invitation, setInvitation] = useState<GuestInvitation | null>(publicInvitation ? {
        display_name: "Bạn",
        instagram_handle: null,
        personal_message: "Mời bạn đến chung vui trong ngày tốt nghiệp của Đạt! Có bạn ở đó, khoảnh khắc này sẽ đáng nhớ hơn rất nhiều. Hẹn gặp bạn tại buổi lễ nhé!",
        theme_variant: "desktop",
        photo_path: null,
    } : null);
    const [loading, setLoading] = useState(!publicInvitation);
    const [error, setError] = useState("");

    useEffect(() => {
        if (publicInvitation) return;
        const loadInvitation = async () => {
            const code = readInviteCode();

            try {
                const found = code ? await openInvitation(code) : null;
                if (found) {
                    setInvitation(found);
                    return;
                }

                // Mã đã bị thay bằng QR mới: quên mã cũ để khách quét lại.
                saveInviteCode(null);
                if (code) {
                    reportError("invite", "Mã QR đã lưu không còn hợp lệ.");
                }
                setError(wrongCodeMessage);
            } catch (loadError) {
                reportError("invite", loadError);
                setError(errorMessage(loadError, "Không tìm thấy lời mời này."));
            } finally {
                setLoading(false);
            }
        };

        void loadInvitation();
    }, [publicInvitation]);

    if (loading) {
        return (
            <main className="homie-shell homie-result-shell">
                <div className="homie-grid" aria-hidden="true" />
                <div className="homie-loading">
                    <span>LOADING_PERSONAL_MESSAGE...</span>
                    <strong>Đang mở thiệp của bạn</strong>
                </div>
            </main>
        );
    }

    if (error || !invitation) {
        return (
            <main className="homie-shell homie-result-shell">
                <div className="homie-grid" aria-hidden="true" />
                <div className="homie-not-found">
                    <span>404_INVITATION</span>
                    <h1>Oops, link này không đúng rồi.</h1>
                    <p>{error}</p>
                    <Link href="/homie">QUÉT LẠI QR →</Link>
                </div>
            </main>
        );
    }

    const love = invitation.theme_variant === loveTheme;
    const discord = invitation.theme_variant === "discord";

    return (
        <main className={`homie-shell homie-result-shell ${love ? "is-love" : discord ? "is-discord" : ""}`}>
            <div className="homie-grid" aria-hidden="true" />
            {love ? <LoveEffects /> : null}
            <Link className="homie-logo" href="/">
                <span>LD</span>
                <strong>{love ? "LOVE_LETTER.exe" : discord ? "# graduation-party" : "HOMIE_INVITE.exe"}</strong>
            </Link>

            <section className="homie-invitation">
                <div className="homie-invite-heading">
                    {love ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img className="love-cat-sticker" src="/stickers/ig-cat.webp" alt="" aria-hidden="true" />
                    ) : null}
                    <p>{love ? "LOVE_LETTER DELIVERED ♥" : discord ? "● PRIVATE SERVER / HỘI BẠN THÂN" : publicInvitation ? "THÂN MỜI BẠN CHUNG VUI" : "PERSONAL_MESSAGE DELIVERED ✓"}</p>
                    <h1>
                        Hey,
                        <span>{invitation.display_name}!</span>
                    </h1>
                    {invitation.instagram_handle ? (
                        <small>{invitation.instagram_handle}</small>
                    ) : null}
                </div>

                {love ? <ImportedStickers group={0} /> : null}

                {invitation.photo_path ? (
                    <figure className="homie-photo">
                        <div className="homie-tape" aria-hidden="true" />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={invitationPhotoUrl(invitation.photo_path)}
                            alt={`${graduate.fullName} và ${invitation.display_name}`}
                        />
                        <figcaption>
                            {graduate.lastName} × {invitation.display_name}
                        </figcaption>
                    </figure>
                ) : null}

                <article className="homie-letter">
                    <div className="homie-tape" aria-hidden="true" />
                    <span>{discord ? "● ĐẠT / TIN NHẮN GHIM" : `TO: ${invitation.display_name.toLocaleUpperCase("vi")}`}</span>
                    <p>{invitation.personal_message}</p>
                    <strong>{love ? "— Đạt ♥" : "— Đạt ✦"}</strong>
                </article>

                {love ? <ImportedStickers group={1} /> : null}

                {discord ? <div className="discord-event-banner">🎓 SỰ KIỆN SẮP DIỄN RA / GRADUATION EVENT</div> : null}
                <CountdownClock />

                {love ? <ImportedStickers group={2} /> : null}

                <div className="homie-event-card">
                    {eventDetails.map((detail) => (
                        <div key={detail.label}>
                            <small>{detail.label}</small>
                            <strong>{detail.value}</strong>
                            {detail.detail ? <span>{detail.detail}</span> : null}
                        </div>
                    ))}
                </div>

                {mapEmbedUrl ? (
                    <div className="homie-map">
                        <iframe
                            src={mapEmbedUrl}
                            title="Bản đồ địa điểm tổ chức"
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                        />
                    </div>
                ) : null}

                {discord ? <p className="discord-reactions"><span aria-hidden="true">❤️ · 😂 · 🔥</span> <span>Hẹn gặp nhau ngoài đời!</span></p> : null}

                <div className="homie-result-actions">
                    <Link href="/">XEM THIỆP CHÍNH →</Link>
                    {directionsUrl ? (
                        <a href={directionsUrl} target="_blank" rel="noreferrer">
                            {discord ? "THAM GIA NGOÀI ĐỜI ↗" : "CHỈ ĐƯỜNG ↗"}
                        </a>
                    ) : null}
                    {!publicInvitation ? (
                        <Link href="/homie" onClick={() => saveInviteCode(null)}>
                            KHÔNG PHẢI BẠN?
                        </Link>
                    ) : null}
                </div>
            </section>

            <p className="homie-doodle result-doodle" aria-hidden="true">
                {love ? "only for you ♥" : discord ? "voice chat → gặp ngoài đời ✦" : "made just for you!"}
            </p>
        </main>
    );
}
