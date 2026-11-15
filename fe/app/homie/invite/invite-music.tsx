"use client";

import { musicSrc } from "../../home/music-button";
import { musicToggleAttribute, useAutoplayMusic } from "../../lib/use-autoplay-music";

/** Nút nhạc nổi ở góc dưới thiệp thường / Discord / thiệp chung: tự bật khi mở thiệp. */
export function InviteMusic() {
    const { audioProps, playing, toggle } = useAutoplayMusic();

    return (
        <>
            <button
                className={`invite-music${playing ? " is-playing" : ""}`}
                type="button"
                aria-pressed={playing}
                aria-label={playing ? "Tắt nhạc" : "Mở nhạc"}
                data-testid="invite-music"
                {...{ [musicToggleAttribute]: "" }}
                onClick={() => void toggle()}
            >
                <span className="invite-music-bars" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                </span>
                {playing ? "đang mở ♪" : "mở nhạc"}
            </button>
            <audio {...audioProps} src={musicSrc} />
        </>
    );
}
