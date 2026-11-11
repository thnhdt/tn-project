"use client";

import { useEffect, useRef, useState } from "react";

/** Bài nhạc của nút "mở nhạc", nằm trong `public/music/`. */
export const musicSrc = "/music/Rick_Astley_-_Never_Gonna_Give_You_Up_Official_Video_4K_Remaster.mp3";

export function MusicButton() {
    const [playing, setPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        const audio = audioRef.current;
        return () => audio?.pause();
    }, []);

    const toggleMusic = async () => {
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
                className={`music-button ${playing ? "is-playing" : ""}`}
                type="button"
                aria-pressed={playing}
                aria-label={playing ? "Tắt nhạc" : "Mở nhạc"}
                data-testid="music-toggle"
                onClick={toggleMusic}
            >
                <span className="music-bars" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                </span>
                {playing ? "đang mở" : "mở nhạc"}
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
