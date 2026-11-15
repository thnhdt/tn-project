"use client";

import { musicToggleAttribute, useAutoplayMusic } from "../../lib/use-autoplay-music";

/** Nhạc riêng của thiệp hồng, nằm trong `public/music/`. */
const loveMusicSrc = "/music/jvke-golden-hour.mp3";

/** Máy đĩa than ở góc dưới thiệp hồng: tự bật "golden hour" khi mở thiệp, bấm để tắt / bật lại. */
export function LoveRecordPlayer() {
    const { audioProps, playing, toggle } = useAutoplayMusic();

    return (
        <>
            <button
                className={`love-record ${playing ? "is-playing" : ""}`}
                type="button"
                aria-pressed={playing}
                aria-label={playing ? "Tắt nhạc" : "Mở nhạc"}
                data-testid="love-record"
                {...{ [musicToggleAttribute]: "" }}
                onClick={() => void toggle()}
            >
                <svg viewBox="0 0 180 130" aria-hidden="true">
                    <rect x="6" y="6" width="168" height="118" rx="12" className="love-record-base" />
                    <g className="love-record-disc">
                        <circle cx="76" cy="65" r="52" fill="#2b1520" />
                        <circle cx="76" cy="65" r="44" fill="none" stroke="#4a2a38" strokeWidth="1.5" />
                        <circle cx="76" cy="65" r="36" fill="none" stroke="#4a2a38" strokeWidth="1.5" />
                        <circle cx="76" cy="65" r="28" fill="none" stroke="#4a2a38" strokeWidth="1.5" />
                        <path d="M40 34a48 48 0 0 1 22-12" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="3" fill="none" strokeLinecap="round" />
                        <circle cx="76" cy="65" r="17" fill="#ff2f86" />
                        <path
                            d="M76 72c-6-5-9-8-9-11a4.5 4.5 0 0 1 9-1a4.5 4.5 0 0 1 9 1c0 3-3 6-9 11z"
                            fill="#ffffff"
                        />
                    </g>
                    <circle cx="150" cy="20" r="8" fill="#7a0f45" />
                    <g className="love-record-arm">
                        <path d="M150 20v56l-14 16" stroke="#7a0f45" strokeWidth="5" fill="none" strokeLinecap="round" />
                        <rect x="129" y="88" width="13" height="10" rx="2" fill="#ff2f86" />
                    </g>
                </svg>
                <span className="love-record-label">{playing ? "đang mở ♪" : "mở nhạc"}</span>
            </button>
            <audio {...audioProps} src={loveMusicSrc} />
        </>
    );
}
