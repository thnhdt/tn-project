"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { useEffect, useState } from "react";
import { CountdownClock } from "../../home/countdown-clock";
import {
    discordTheme,
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
} from "../../lib/ceremony";
import { inviteLines } from "../../lib/invite-lines";
import { graduate } from "../../site-content";
import { LoveEffects } from "./love-effects";
import { LoveFloaters } from "./love-floaters";
import { LoveRecordPlayer } from "./love-record-player";
import { ImportedStickers } from "./imported-stickers";
import { VenueMaps } from "./venue-maps";

const eventDetails = [
    { label: "NGÀY", value: ceremonyDate, detail: null },
    { label: "GIỜ", value: ceremonyTime, detail: null },
    { label: "ĐỊA ĐIỂM", value: ceremonyLocation, detail: ceremonyAddress },
];

const wrongCodeMessage = "Trang này chỉ mở được bằng đúng mã QR trên thiệp của bạn.";

type LayoutProps = {
    invitation: GuestInvitation;
    publicInvitation: boolean;
};

export function HomieInvitation({ publicInvitation = false }: { publicInvitation?: boolean }) {
    const [invitation, setInvitation] = useState<GuestInvitation | null>(publicInvitation ? {
        display_name: "Bạn",
        instagram_handle: null,
        personal_message: "",
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

    if (invitation.theme_variant === loveTheme) {
        return <LoveInvitation invitation={invitation} publicInvitation={publicInvitation} />;
    }

    if (invitation.theme_variant === discordTheme) {
        return <DiscordInvitation invitation={invitation} publicInvitation={publicInvitation} />;
    }

    return <DefaultInvitation invitation={invitation} publicInvitation={publicInvitation} />;
}

/* ───────────── Dùng chung ───────────── */

function GuestPhoto({
    invitation,
    hostName = graduate.lastName,
}: {
    invitation: GuestInvitation;
    hostName?: string;
}) {
    if (!invitation.photo_path) return null;

    return (
        <figure className="homie-photo">
            <div className="homie-tape" aria-hidden="true" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={invitationPhotoUrl(invitation.photo_path)}
                alt={`${graduate.fullName} và ${invitation.display_name}`}
            />
            <figcaption>
                {hostName} × {invitation.display_name}
            </figcaption>
        </figure>
    );
}

function ResultActions({
    publicInvitation,
    mainLabel = "XEM THIỆP CHÍNH →",
    directionsLabel = "CHỈ ĐƯỜNG ↗",
    showSwitchGuest = true,
}: {
    publicInvitation: boolean;
    mainLabel?: string;
    directionsLabel?: string;
    /** Hiện nút "KHÔNG PHẢI BẠN?" để quét lại mã khác. */
    showSwitchGuest?: boolean;
}) {
    return (
        <div className="homie-result-actions">
            <Link href="/">{mainLabel}</Link>
            {directionsUrl ? (
                <a href={directionsUrl} target="_blank" rel="noreferrer">
                    {directionsLabel}
                </a>
            ) : null}
            {!publicInvitation && showSwitchGuest ? (
                <Link href="/homie" onClick={() => saveInviteCode(null)}>
                    KHÔNG PHẢI BẠN?
                </Link>
            ) : null}
        </div>
    );
}

function EventDetailList() {
    return (
        <dl>
            {eventDetails.map((detail) => (
                <div key={detail.label}>
                    <dt>{detail.label}</dt>
                    <dd>{detail.value}</dd>
                    {detail.detail ? <span>{detail.detail}</span> : null}
                </div>
            ))}
        </dl>
    );
}

/* ───────────── Theme mặc định: cửa sổ máy tính cũ ───────────── */

const confetti = Array.from({ length: 18 }, (_, index) => index);

function DefaultInvitation({ invitation, publicInvitation }: LayoutProps) {
    return (
        <main className="homie-shell homie-result-shell is-grad">
            <div className="homie-grid" aria-hidden="true" />
            <div className="grad-confetti" aria-hidden="true">
                {confetti.map((index) => (
                    <i key={index} style={{ "--i": index } as CSSProperties} />
                ))}
            </div>
            <Link className="homie-logo" href="/">
                <span>{graduate.initials}</span>
                <strong>GRADUATION_INVITE.exe</strong>
            </Link>

            <section className="homie-invitation">
                <div className="homie-invite-heading">
                    <p>{publicInvitation ? "THÂN MỜI BẠN CHUNG VUI ✓" : "INVITATION DELIVERED ✓"}</p>
                    <h1>
                        {inviteLines.defaultTheme.greeting}
                        <span>{invitation.display_name}</span>
                    </h1>
                    {invitation.instagram_handle ? <small>{invitation.instagram_handle}</small> : null}
                </div>

                <div className="grad-window">
                    <div className="homie-window-bar">
                        <span />
                        <span />
                        <span />
                        <b>graduation_FINAL_v2(1).exe</b>
                    </div>
                    <div className="grad-window-body">
                        <span className="grad-cap" aria-hidden="true">🎓</span>
                        <p className="grad-kicker">&gt; run graduate.exe --class-of {graduate.classOf}</p>
                        <h2>{inviteLines.headline}</h2>
                        <p className="grad-subline">{inviteLines.defaultTheme.subline}</p>
                        <div className="grad-stamp" aria-hidden="true">
                            <b>OFFICIAL</b>
                            <span>GRADUATE ✓</span>
                            <small>CLASS OF {graduate.classOf}</small>
                        </div>
                    </div>
                </div>

                <ul className="grad-jokes">
                    {inviteLines.defaultTheme.jokes.map((joke, index) => (
                        <li key={joke} style={{ "--i": index } as CSSProperties}>
                            {joke}
                        </li>
                    ))}
                </ul>

                <GuestPhoto invitation={invitation} />

                <div className="grad-ticket">
                    <div className="grad-ticket-stub">
                        <small>VÉ MỜI</small>
                        <strong>KHÁCH QUÝ</strong>
                        <span>{invitation.display_name}</span>
                    </div>
                    <div className="grad-ticket-main">
                        <small>{graduate.fullName.toLocaleUpperCase("vi")} • LỄ TỐT NGHIỆP</small>
                        <EventDetailList />
                    </div>
                </div>

                <CountdownClock />

                <VenueMaps />

                <p className="grad-closing">{inviteLines.defaultTheme.closing}</p>

                <ResultActions publicInvitation={publicInvitation} />
            </section>

        </main>
    );
}

/* ───────────── Theme Discord: kênh chat #graduation-party ───────────── */

/** Tên của Đạt trên Discord. */
const discordHost = { name: "Skehjhj", avatar: "/stickers/dat-graduation.webp" };

function DiscordMessage({
    author,
    avatar,
    bot = false,
    time,
    children,
}: {
    author: string;
    avatar: string;
    bot?: boolean;
    time: string;
    children: ReactNode;
}) {
    return (
        <article className="dc-message">
            {avatar.startsWith("/") ? (
                // Avatar là ảnh (ảnh tốt nghiệp ở trang chủ), còn lại là chữ / emoji.
                // eslint-disable-next-line @next/next/no-img-element
                <img className="dc-avatar is-photo" src={avatar} alt="" aria-hidden="true" />
            ) : (
                <span className={`dc-avatar${bot ? " is-bot" : ""}`} aria-hidden="true">{avatar}</span>
            )}
            <div className="dc-message-body">
                <header>
                    <strong>{author}</strong>
                    {bot ? <em>BOT</em> : null}
                    <time>{time}</time>
                </header>
                {children}
            </div>
        </article>
    );
}

function DiscordInvitation({ invitation, publicInvitation }: LayoutProps) {
    const name = invitation.display_name;

    return (
        <main className="homie-shell homie-result-shell is-discord">
            <div className="homie-grid" aria-hidden="true" />
            <Link className="homie-logo" href="/">
                <span>{graduate.initials}</span>
                <strong># graduation-party</strong>
            </Link>

            <section className="homie-invitation dc-app">
                <aside className="dc-channels" aria-hidden="true">
                    <strong>HỘI BẠN THÂN ▾</strong>
                    <small>KÊNH CHAT</small>
                    <span># thông-báo</span>
                    <span className="is-active"># graduation-party</span>
                    <span># ảnh-kỷ-yếu</span>
                    <small>KÊNH THOẠI</small>
                    <span>🔊 {ceremonyLocation}</span>
                    <span className="dc-voice-user">● {discordHost.name} đang chờ</span>
                </aside>

                <div className="dc-chat">
                    <header className="dc-chat-header">
                        <strong># graduation-party</strong>
                        <span>lễ tốt nghiệp của {discordHost.name} • {ceremonyDate}</span>
                    </header>

                    <div className="dc-messages">
                        <p className="dc-day"><span>HÔM NAY</span></p>

                        <DiscordMessage author="Lễ_Bot" avatar="🤖" bot time="hôm nay lúc 07:00">
                            <p className="dc-big">
                                <mark>@everyone</mark> 📣 {inviteLines.headline} 🎓
                            </p>
                        </DiscordMessage>

                        <DiscordMessage author={discordHost.name} avatar={discordHost.avatar} time="hôm nay lúc 07:00">
                            <p className="dc-big">
                                <mark>@{name}</mark> ní nhớ tới chung vui với tui nha, thiếu ní là buồn á 🥹
                            </p>
                        </DiscordMessage>

                        <DiscordMessage author={discordHost.name} avatar={discordHost.avatar} time="hôm nay lúc 07:01">
                            {inviteLines.discordTheme.messages.map((line) => (
                                <p key={line}>{line}</p>
                            ))}
                        </DiscordMessage>

                        <GuestPhoto invitation={invitation} hostName={discordHost.name} />

                        <DiscordMessage author="Lễ_Bot" avatar="🤖" bot time="hôm nay lúc 07:02">
                            <div className="dc-event">
                                <small>🎓 SỰ KIỆN SẮP DIỄN RA</small>
                                <strong>Lễ tốt nghiệp của {graduate.fullName}</strong>
                                <EventDetailList />
                                <div className="dc-event-footer">
                                    <span>⭐ {name} đã bấm Quan tâm</span>
                                    <b>QUAN TÂM ✓</b>
                                </div>
                            </div>
                            <CountdownClock />
                        </DiscordMessage>

                        <DiscordMessage author={discordHost.name} avatar={discordHost.avatar} time="hôm nay lúc 07:03">
                            <p>📍 vị trí nè, vào cổng nào cũng được:</p>
                            <VenueMaps />
                            <p className="dc-reactions">
                                <span>🎓 12</span>
                                <span>😂 8</span>
                                <span>🔥 5</span>
                                <span>🌷 3</span>
                            </p>
                        </DiscordMessage>
                    </div>

                    <div className="dc-input" aria-hidden="true">
                        <span>＋</span>
                        <p>Nhắn #graduation-party… (đùa thôi, tới thẳng {ceremonyLocation} nha)</p>
                    </div>
                </div>

                <aside className="dc-members" aria-hidden="true">
                    <small>ONLINE — 3</small>
                    <span><i className="dc-dot" />{discordHost.name} <em>đang tốt nghiệp</em></span>
                    <span><i className="dc-dot" />{name} <em>sắp tới</em></span>
                    <span><i className="dc-dot" />Lễ_Bot <em>BOT</em></span>
                </aside>

                <div className="dc-footer">
                    <p className="grad-closing">{inviteLines.closing}</p>
                    <ResultActions publicInvitation={publicInvitation} directionsLabel="THAM GIA NGOÀI ĐỜI ↗" />
                </div>
            </section>
        </main>
    );
}

/* ───────────── Theme hồng: giữ lá thư riêng (sẽ thiết kế lại sau) ───────────── */

function LoveInvitation({ invitation, publicInvitation }: LayoutProps) {
    return (
        <main className="homie-shell homie-result-shell is-love">
            <div className="homie-grid" aria-hidden="true" />
            <LoveEffects />
            <LoveFloaters />
            <LoveRecordPlayer />
            <Link className="homie-logo" href="/">
                <span>{graduate.initials}</span>
                <strong>LOVE_LETTER.exe</strong>
            </Link>

            <section className="homie-invitation">
                <div className="homie-invite-heading">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="love-cat-sticker" src="/stickers/ig-cat.webp" alt="" aria-hidden="true" />
                    <p>LOVE_LETTER DELIVERED ♥</p>
                    <h1>
                        Gửi em bé của anhhh,
                        <span>{invitation.display_name}!!!</span>
                    </h1>
                    {invitation.instagram_handle ? <small>{invitation.instagram_handle}</small> : null}
                </div>

                <ImportedStickers group={0} />

                <GuestPhoto invitation={invitation} />

                <article className="homie-letter">
                    <div className="homie-tape" aria-hidden="true" />
                    <span>TO: {invitation.display_name.toLocaleUpperCase("vi")}</span>
                    <p>{invitation.personal_message.trim() || inviteLines.subline}</p>
                    <strong>— Người iu ngố xít của emmm - Skehihi ♥</strong>
                </article>

                <ImportedStickers group={1} />

                <CountdownClock />

                <ImportedStickers group={2} />

                <div className="homie-event-card">
                    {eventDetails.map((detail) => (
                        <div key={detail.label}>
                            <small>{detail.label}</small>
                            <strong>{detail.value}</strong>
                            {detail.detail ? <span>{detail.detail}</span> : null}
                        </div>
                    ))}
                </div>

                <VenueMaps />

                <ResultActions
                    publicInvitation={publicInvitation}
                    mainLabel="Vk iu xem thiệp chínhhh →"
                    directionsLabel="Google maps cho google maps của anhhh ↗"
                    showSwitchGuest={false}
                />
            </section>

            <p className="homie-doodle result-doodle" aria-hidden="true">
                only for you ♥
            </p>
        </main>
    );
}
