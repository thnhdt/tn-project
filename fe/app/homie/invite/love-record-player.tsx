"use client";

import { useEffect, useRef, useState } from "react";
import { musicSrc } from "../../home/music-button";

/** Máy đĩa than ở góc dưới thiệp hồng: bấm để phát / tạm dừng nhạc. */
export function LoveRecordPlayer() {
    const [playing, setPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        const audio = audioRef.current;
        return () => audio?.pause();
    }, []);

    const toggle = async () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (!audio.paused) {
            audio.pause();
            return;
        }

        try {
            await audio.play();
        } catch {
            // Trình duyệt chặn phát nhạc hoặc file lỗi: giữ nguyên trạng thái tắt.
            setPlaying(false);
        }
    };

    return (
        <>
            <button
                className={`love-record ${playing ? "is-playing" : ""}`}
                type="button"
                aria-pressed={playing}
                aria-label={playing ? "Tắt nhạc" : "Mở nhạc"}
                data-testid="love-record"
                onClick={toggle}
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
            {/* File nhạc khá nặng nên chỉ tải khi bấm mở. */}
            <audio
                ref={audioRef}
                src={musicSrc}
                preload="none"
                loop
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
            />
        </>
    );
}
