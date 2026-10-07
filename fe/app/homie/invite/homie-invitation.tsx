"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CountdownClock } from "../../home/countdown-clock";
import {
    errorMessage,
    type GuestInvitation,
    invitationPhotoUrl,
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

const eventDetails = [
    { label: "NGÀY", value: ceremonyDate, detail: null },
    { label: "GIỜ", value: ceremonyTime, detail: null },
    { label: "ĐỊA ĐIỂM", value: ceremonyLocation, detail: ceremonyAddress },
];

const wrongCodeMessage = "Trang này chỉ mở được bằng đúng mã QR trên thiệp của bạn.";

export function HomieInvitation() {
    const [invitation, setInvitation] = useState<GuestInvitation | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
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
    }, []);

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

    return (
        <main className="homie-shell homie-result-shell">
            <div className="homie-grid" aria-hidden="true" />
            <Link className="homie-logo" href="/">
                <span>LD</span>
                <strong>HOMIE_INVITE.exe</strong>
            </Link>

            <section className="homie-invitation">
                <div className="homie-invite-heading">
                    <p>PERSONAL_MESSAGE DELIVERED ✓</p>
                    <h1>
                        Hey,
                        <span>{invitation.display_name}!</span>
                    </h1>
                    {invitation.instagram_handle ? (
                        <small>{invitation.instagram_handle}</small>
                    ) : null}
                </div>

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
                    <span>TO: {invitation.display_name.toLocaleUpperCase("vi")}</span>
                    <p>{invitation.personal_message}</p>
                    <strong>— Đạt ✦</strong>
                </article>

                <CountdownClock />

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

                <div className="homie-result-actions">
                    <Link href="/">XEM THIỆP CHÍNH →</Link>
                    {directionsUrl ? (
                        <a href={directionsUrl} target="_blank" rel="noreferrer">
                            CHỈ ĐƯỜNG ↗
                        </a>
                    ) : null}
                    <Link href="/homie" onClick={() => saveInviteCode(null)}>
                        KHÔNG PHẢI BẠN?
                    </Link>
                </div>
            </section>

            <p className="homie-doodle result-doodle" aria-hidden="true">
                made just for you!
            </p>
        </main>
    );
}
