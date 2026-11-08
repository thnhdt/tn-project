"use client";

import { useEffect, useRef } from "react";

/** Sticker động bay vòng vòng trên thiệp hồng, chạm mép màn hình thì dội lại. */
const floaterStickers = [
    "/stickers/love-float/float-1.webp",
    "/stickers/love-float/float-2.webp",
    "/stickers/love-float/float-3.webp",
    "/stickers/love-float/float-4.webp",
];

type Floater = {
    x: number;
    y: number;
    velocityX: number;
    velocityY: number;
    size: number;
    phase: number;
};

function random(min: number, max: number) {
    return min + Math.random() * (max - min);
}

export function LoveFloaters() {
    const itemRefs = useRef<(HTMLImageElement | null)[]>([]);

    useEffect(() => {
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const small = window.innerWidth < 640;
        const floaters: Floater[] = floaterStickers.map(() => {
            const size = small ? random(56, 72) : random(80, 110);
            const speed = random(40, 75);
            const angle = random(0, Math.PI * 2);
            return {
                x: random(0, Math.max(window.innerWidth - size, 0)),
                y: random(0, Math.max(window.innerHeight - size, 0)),
                velocityX: Math.cos(angle) * speed,
                velocityY: Math.sin(angle) * speed,
                size,
                phase: random(0, Math.PI * 2),
            };
        });

        const draw = (time: number) => {
            floaters.forEach((floater, index) => {
                const element = itemRefs.current[index];
                if (!element) return;
                const bob = Math.sin(time / 600 + floater.phase) * 6;
                const tilt = Math.sin(time / 900 + floater.phase) * 10;
                // Quay mặt theo hướng bay cho tự nhiên.
                const flip = floater.velocityX < 0 ? -1 : 1;
                element.style.width = `${floater.size}px`;
                element.style.transform =
                    `translate3d(${floater.x}px, ${floater.y + bob}px, 0) rotate(${tilt}deg) scaleX(${flip})`;
            });
        };

        if (reduceMotion) {
            draw(0);
            return;
        }

        let frame = 0;
        let last = performance.now();
        const step = (now: number) => {
            // Giới hạn bước thời gian để không nhảy cóc khi quay lại tab.
            const delta = Math.min((now - last) / 1000, 0.05);
            last = now;
            const width = window.innerWidth;
            const height = window.innerHeight;
            for (const floater of floaters) {
                floater.x += floater.velocityX * delta;
                floater.y += floater.velocityY * delta;
                if (floater.x < 0 || floater.x > width - floater.size) {
                    floater.velocityX *= -1;
                    floater.x = Math.min(Math.max(floater.x, 0), width - floater.size);
                }
                if (floater.y < 0 || floater.y > height - floater.size) {
                    floater.velocityY *= -1;
                    floater.y = Math.min(Math.max(floater.y, 0), height - floater.size);
                }
            }
            draw(now);
            frame = requestAnimationFrame(step);
        };
        frame = requestAnimationFrame(step);

        return () => cancelAnimationFrame(frame);
    }, []);

    return (
        <div className="love-floaters" aria-hidden="true">
            {floaterStickers.map((src, index) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    key={src}
                    ref={(element) => {
                        itemRefs.current[index] = element;
                    }}
                    src={src}
                    alt=""
                />
            ))}
        </div>
    );
}
