"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Gắn lên nút bật/tắt nhạc để lần chạm đầu tiên vào nút không bị tính là "chạm để bật". */
export const musicToggleAttribute = "data-music-toggle";

/**
 * Tự bật nhạc khi mở trang thiệp.
 *
 * Trình duyệt thường chặn nhạc có tiếng khi khách chưa chạm vào trang (ví dụ vừa quét QR
 * mở ra). Khi bị chặn, nhạc sẽ bật ngay lần đầu khách chạm, bấm hay gõ phím ở bất kỳ đâu.
 * Khách đã tự tắt nhạc thì không tự bật lại nữa.
 */
export function useAutoplayMusic() {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [playing, setPlaying] = useState(false);
    const pausedByGuestRef = useRef(false);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const events = ["pointerdown", "keydown", "touchstart"] as const;
        const removeListeners = () => {
            for (const name of events) {
                window.removeEventListener(name, startOnGesture, true);
            }
        };

        const tryPlay = () => {
            if (pausedByGuestRef.current) {
                removeListeners();
                return;
            }
            audio.play().then(removeListeners).catch(() => {
                // Bị chặn: chờ lần chạm kế tiếp.
            });
        };

        function startOnGesture(event: Event) {
            // Chạm vào chính nút nhạc thì để nút tự xử lý (bật hoặc tắt).
            const target = event.target;
            if (target instanceof Element && target.closest(`[${musicToggleAttribute}]`)) {
                removeListeners();
                return;
            }
            tryPlay();
        }

        for (const name of events) {
            window.addEventListener(name, startOnGesture, true);
        }
        tryPlay();

        return () => {
            removeListeners();
            audio.pause();
        };
    }, []);

    const toggle = useCallback(async () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (!audio.paused) {
            pausedByGuestRef.current = true;
            audio.pause();
            return;
        }

        pausedByGuestRef.current = false;
        try {
            await audio.play();
        } catch {
            // File lỗi hoặc trình duyệt vẫn chặn: giữ trạng thái tắt.
            setPlaying(false);
        }
    }, []);

    const audioProps = {
        ref: audioRef,
        preload: "auto" as const,
        loop: true,
        onPlay: () => setPlaying(true),
        onPause: () => setPlaying(false),
    };

    return { audioProps, playing, toggle };
}
