"use client";

import { useEffect, useRef, useState } from "react";

export function MusicButton() {
    const [playing, setPlaying] = useState(false);
    const contextRef = useRef<AudioContext | null>(null);
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (timerRef.current !== null) {
                window.clearInterval(timerRef.current);
            }
            void contextRef.current?.close();
        };
    }, []);

    const playSequence = (context: AudioContext) => {
        const notes = [261.63, 329.63, 392, 523.25];
        notes.forEach((frequency, index) => {
            const oscillator = context.createOscillator();
            const gain = context.createGain();
            const start = context.currentTime + index * 0.18;

            oscillator.type = "sine";
            oscillator.frequency.value = frequency;
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(0.055, start + 0.025);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.42);
            oscillator.connect(gain);
            gain.connect(context.destination);
            oscillator.start(start);
            oscillator.stop(start + 0.45);
        });
    };

    const toggleMusic = async () => {
        if (playing) {
            if (timerRef.current !== null) {
                window.clearInterval(timerRef.current);
                timerRef.current = null;
            }
            await contextRef.current?.close();
            contextRef.current = null;
            setPlaying(false);
            return;
        }

        const AudioContextConstructor =
            window.AudioContext ??
            (window as typeof window & { webkitAudioContext?: typeof AudioContext })
                .webkitAudioContext;

        if (!AudioContextConstructor) {
            return;
        }

        const context = new AudioContextConstructor();
        contextRef.current = context;
        playSequence(context);
        timerRef.current = window.setInterval(() => playSequence(context), 3200);
        setPlaying(true);
    };

    return (
        <button
            className={`music-button ${playing ? "is-playing" : ""}`}
            type="button"
            aria-pressed={playing}
            aria-label={playing ? "Tắt nhạc mẫu" : "Mở nhạc mẫu"}
            data-testid="music-toggle"
            onClick={toggleMusic}
        >
            <span className="music-bars" aria-hidden="true">
                <i />
                <i />
                <i />
            </span>
            {playing ? "đang phát demo" : "mở nhạc"}
        </button>
    );
}
