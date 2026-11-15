"use client";

import { musicToggleAttribute, useAutoplayMusic } from "../lib/use-autoplay-music";

/** Bài nhạc của trang chính và các thiệp (trừ thiệp hồng), nằm trong `public/music/`. */
export const musicSrc = "/music/Rick_Astley_-_Never_Gonna_Give_You_Up_Official_Video_4K_Remaster.mp3";

/** Nút nhạc trên thanh công cụ trang chính: tự bật khi mở trang, bấm để tắt / bật lại. */
export function MusicButton() {
    const { audioProps, playing, toggle } = useAutoplayMusic();

    return (
        <>
            <button
                className={`music-button ${playing ? "is-playing" : ""}`}
                type="button"
                aria-pressed={playing}
                aria-label={playing ? "Tắt nhạc" : "Mở nhạc"}
                data-testid="music-toggle"
                {...{ [musicToggleAttribute]: "" }}
                onClick={() => void toggle()}
            >
                <span className="music-bars" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                </span>
                {playing ? "đang mở" : "mở nhạc"}
            </button>
            <audio {...audioProps} src={musicSrc} />
        </>
    );
}
