"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef } from "react";

type Particle = {
    kind: "heart" | "confetti" | "spark" | "rocket";
    /** Lớp trước nằm trên nội dung (pháo giấy khi bấm), lớp sau nằm dưới. */
    front: boolean;
    x: number;
    y: number;
    velocityX: number;
    velocityY: number;
    size: number;
    color: string;
    rotation: number;
    spin: number;
    life: number;
    maxLife: number;
    gravity: number;
    phase: number;
    /** Độ cao pháo hoa sẽ nổ (chỉ dùng cho `rocket`). */
    targetY: number;
};

const palette = ["#ff2f86", "#ff6fae", "#ff9fc8", "#ffd84d", "#ff5470", "#c86bff", "#ffffff"];
/** Màu pháo hoa đậm hơn để nổi trên nền hồng nhạt. */
const fireworkColors = ["#ff2f86", "#e0177a", "#a44bff", "#ff3355", "#ff8a00", "#ff5cc0"];
const stickers = [
    { text: "iu", tone: "hot", x: "4%", y: "9%", size: 92, tilt: -14, delay: 0 },
    { text: "", tone: "sun", x: "88%", y: "6%", size: 70, tilt: 12, delay: -1.4 },
    { text: "luv u", tone: "soft", x: "90%", y: "30%", size: 104, tilt: 9, delay: -2.2 },
    { text: "", tone: "hot", x: "2%", y: "37%", size: 64, tilt: -8, delay: -0.7 },
    { text: "100%", tone: "sun", x: "5%", y: "62%", size: 98, tilt: 11, delay: -3.1 },
    { text: "", tone: "soft", x: "91%", y: "56%", size: 76, tilt: -12, delay: -1.9 },
    { text: "mãi iu", tone: "hot", x: "87%", y: "80%", size: 112, tilt: 7, delay: -2.7 },
    { text: "", tone: "sun", x: "6%", y: "86%", size: 72, tilt: -10, delay: -0.3 },
];
const flyers = [
    { top: "12%", size: 46, duration: 17, delay: 0, tone: "hot" },
    { top: "34%", size: 30, duration: 23, delay: -9, tone: "soft" },
    { top: "55%", size: 54, duration: 20, delay: -4, tone: "sun" },
    { top: "72%", size: 34, duration: 26, delay: -15, tone: "hot" },
    { top: "88%", size: 42, duration: 19, delay: -11, tone: "soft" },
];

function random(min: number, max: number) {
    return min + Math.random() * (max - min);
}

function pick<T>(items: T[]) {
    return items[Math.floor(Math.random() * items.length)];
}

function heartPath(context: CanvasRenderingContext2D) {
    context.beginPath();
    context.moveTo(0, 0.38);
    context.bezierCurveTo(-0.7, -0.08, -0.42, -0.62, 0, -0.26);
    context.bezierCurveTo(0.42, -0.62, 0.7, -0.08, 0, 0.38);
    context.closePath();
}

function HeartIcon() {
    return (
        <svg viewBox="-80 -75 160 130" aria-hidden="true">
            <path d="M0 38 C-70 -8 -42 -62 0 -26 C42 -62 70 -8 0 38 Z" />
        </svg>
    );
}

/**
 * Hiệu ứng của thiệp hồng: tim bay, pháo giấy và pháo hoa ở nền, sticker trái
 * tim trôi trên giao diện, bấm vào đâu cũng nổ tim ở đó.
 */
export function LoveEffects() {
    const backRef = useRef<HTMLCanvasElement>(null);
    const frontRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const back = backRef.current;
        const front = frontRef.current;
        const backContext = back?.getContext("2d");
        const frontContext = front?.getContext("2d");
        if (!back || !front || !backContext || !frontContext) {
            return;
        }

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            return;
        }

        const particles: Particle[] = [];
        let width = 0;
        let height = 0;
        let frame = 0;
        let lastTime = performance.now();
        let nextRocketAt = lastTime + 500;
        let lastTrailAt = 0;

        const resize = () => {
            const ratio = Math.min(window.devicePixelRatio || 1, 2);
            width = window.innerWidth;
            height = window.innerHeight;
            for (const [canvas, context] of [
                [back, backContext],
                [front, frontContext],
            ] as const) {
                canvas.width = Math.round(width * ratio);
                canvas.height = Math.round(height * ratio);
                context.setTransform(ratio, 0, 0, ratio, 0, 0);
            }
        };

        const add = (particle: Partial<Particle> & Pick<Particle, "kind" | "x" | "y">) => {
            if (particles.length > 900) {
                return;
            }

            particles.push({
                front: false,
                velocityX: 0,
                velocityY: 0,
                size: 10,
                color: pick(palette),
                rotation: random(0, Math.PI * 2),
                spin: random(-3, 3),
                life: 0,
                maxLife: 2,
                gravity: 0,
                phase: random(0, Math.PI * 2),
                targetY: 0,
                ...particle,
            });
        };

        const addFloatingHeart = (y = height + 40) => {
            add({
                kind: "heart",
                x: random(0, width),
                y,
                velocityY: -random(24, 70),
                size: random(14, 46),
                color: pick(palette.slice(0, 5)),
                rotation: random(-0.4, 0.4),
                spin: random(-0.4, 0.4),
                maxLife: Number.POSITIVE_INFINITY,
            });
        };

        const addConfettiRain = (y = -20) => {
            add({
                kind: "confetti",
                x: random(0, width),
                y,
                velocityX: random(-20, 20),
                velocityY: random(50, 130),
                size: random(7, 13),
                spin: random(-6, 6),
                maxLife: Number.POSITIVE_INFINITY,
            });
        };

        /** Pháo hoa nổ tại (x, y); một phần ba số lần nổ thành hình trái tim. */
        const explode = (x: number, y: number, isFront = false) => {
            const color = pick(fireworkColors);
            const heartShaped = Math.random() < 0.34;
            const count = heartShaped ? 64 : 56;
            const power = random(170, 290);

            for (let index = 0; index < count; index += 1) {
                const angle = (index / count) * Math.PI * 2;
                let velocityX = Math.cos(angle) * power * random(0.55, 1);
                let velocityY = Math.sin(angle) * power * random(0.55, 1);
                if (heartShaped) {
                    velocityX = (16 * Math.sin(angle) ** 3 * power) / 16;
                    velocityY =
                        (-(
                            13 * Math.cos(angle) -
                            5 * Math.cos(2 * angle) -
                            2 * Math.cos(3 * angle) -
                            Math.cos(4 * angle)
                        ) *
                            power) /
                        16;
                }

                add({
                    kind: "spark",
                    front: isFront,
                    x,
                    y,
                    velocityX,
                    velocityY,
                    size: random(3.5, 6),
                    color: Math.random() < 0.25 ? "#ffb800" : color,
                    maxLife: random(1.2, 2),
                    gravity: heartShaped ? 40 : 90,
                });
            }
        };

        /** Chùm tim + pháo giấy bắn ra từ một điểm, nằm trên nội dung. */
        const burst = (x: number, y: number, amount = 1) => {
            for (let index = 0; index < 14 * amount; index += 1) {
                const angle = random(0, Math.PI * 2);
                const speed = random(120, 420);
                add({
                    kind: "heart",
                    front: true,
                    x,
                    y,
                    velocityX: Math.cos(angle) * speed,
                    velocityY: Math.sin(angle) * speed - 160,
                    size: random(12, 30),
                    color: pick(palette.slice(0, 5)),
                    maxLife: random(0.9, 1.6),
                    gravity: 520,
                });
            }
            for (let index = 0; index < 26 * amount; index += 1) {
                const angle = random(0, Math.PI * 2);
                const speed = random(160, 560);
                add({
                    kind: "confetti",
                    front: true,
                    x,
                    y,
                    velocityX: Math.cos(angle) * speed,
                    velocityY: Math.sin(angle) * speed - 220,
                    size: random(7, 13),
                    spin: random(-12, 12),
                    maxLife: random(1.2, 2.2),
                    gravity: 620,
                });
            }
        };

        const draw = (context: CanvasRenderingContext2D, particle: Particle) => {
            const fade =
                particle.maxLife === Number.POSITIVE_INFINITY
                    ? 1
                    : Math.max(0, 1 - particle.life / particle.maxLife);

            context.save();
            context.translate(particle.x, particle.y);
            if (particle.kind === "heart") {
                context.globalAlpha = particle.front ? Math.min(1, fade * 1.6) : 0.5;
                context.rotate(particle.rotation);
                context.scale(particle.size, particle.size);
                heartPath(context);
                context.fillStyle = particle.color;
                context.fill();
            } else if (particle.kind === "confetti") {
                context.globalAlpha = particle.front ? Math.min(1, fade * 1.6) : 0.75;
                context.rotate(particle.rotation);
                // Lật quanh trục ngang để mảnh giấy trông như đang xoay trong không khí.
                context.scale(1, Math.cos(particle.phase + particle.life * 7));
                context.fillStyle = particle.color;
                context.fillRect(-particle.size / 2, -particle.size / 4, particle.size, particle.size / 2);
            } else {
                context.globalAlpha = particle.kind === "rocket" ? 0.9 : fade;
                context.fillStyle = particle.color;
                context.beginPath();
                context.arc(0, 0, particle.size, 0, Math.PI * 2);
                context.fill();
                // Vệt đuôi ngắn ngược hướng bay.
                context.globalAlpha *= 0.35;
                context.strokeStyle = particle.color;
                context.lineWidth = particle.size;
                context.lineCap = "round";
                context.beginPath();
                context.moveTo(0, 0);
                context.lineTo(-particle.velocityX * 0.09, -particle.velocityY * 0.09);
                context.stroke();
            }
            context.restore();
        };

        const tick = (time: number) => {
            const delta = Math.min((time - lastTime) / 1_000, 0.05);
            lastTime = time;
            backContext.clearRect(0, 0, width, height);
            frontContext.clearRect(0, 0, width, height);

            if (time >= nextRocketAt) {
                nextRocketAt = time + random(650, 1_700);
                add({
                    kind: "rocket",
                    x: random(width * 0.08, width * 0.92),
                    y: height + 10,
                    velocityX: random(-40, 40),
                    velocityY: -random(520, 760),
                    size: 4.5,
                    color: "#ff2f86",
                    maxLife: Number.POSITIVE_INFINITY,
                    targetY: random(height * 0.1, height * 0.55),
                });
            }

            for (let index = particles.length - 1; index >= 0; index -= 1) {
                const particle = particles[index];
                particle.life += delta;
                particle.velocityY += particle.gravity * delta;
                particle.x += particle.velocityX * delta;
                particle.y += particle.velocityY * delta;
                particle.rotation += particle.spin * delta;

                const endless = particle.maxLife === Number.POSITIVE_INFINITY;
                if (endless && particle.kind !== "rocket") {
                    // Tim và pháo giấy nền lắc lư nhẹ, ra khỏi màn hình thì quay lại.
                    particle.x += Math.sin(particle.phase + particle.life * 1.6) * 28 * delta;
                    if (particle.kind === "heart" && particle.y < -60) {
                        particle.y = height + 40;
                        particle.x = random(0, width);
                    } else if (particle.kind === "confetti" && particle.y > height + 20) {
                        particle.y = -20;
                        particle.x = random(0, width);
                    }
                }

                if (particle.kind === "rocket" && particle.y <= particle.targetY) {
                    explode(particle.x, particle.y);
                    particles.splice(index, 1);
                    continue;
                }

                if (!endless && particle.life >= particle.maxLife) {
                    particles.splice(index, 1);
                    continue;
                }

                draw(particle.front ? frontContext : backContext, particle);
            }

            frame = window.requestAnimationFrame(tick);
        };

        const start = () => {
            window.cancelAnimationFrame(frame);
            lastTime = performance.now();
            nextRocketAt = lastTime + 400;
            frame = window.requestAnimationFrame(tick);
        };

        const handleVisibility = () => {
            if (document.hidden) {
                window.cancelAnimationFrame(frame);
            } else {
                start();
            }
        };

        const handlePointerDown = (event: PointerEvent) => {
            burst(event.clientX, event.clientY);
            explode(event.clientX, event.clientY, true);
        };

        const handlePointerMove = (event: PointerEvent) => {
            if (event.pointerType !== "mouse" || event.timeStamp - lastTrailAt < 45) {
                return;
            }

            lastTrailAt = event.timeStamp;
            add({
                kind: "heart",
                front: true,
                x: event.clientX,
                y: event.clientY,
                velocityX: random(-30, 30),
                velocityY: -random(40, 110),
                size: random(8, 16),
                color: pick(palette.slice(0, 3)),
                maxLife: random(0.6, 1),
            });
        };

        resize();
        const density = Math.min(1, width / 900);
        for (let index = 0; index < Math.round(12 + 16 * density); index += 1) {
            addFloatingHeart(random(0, height));
        }
        for (let index = 0; index < Math.round(18 + 30 * density); index += 1) {
            addConfettiRain(random(0, height));
        }
        // Màn chào: hai chùm pháo giấy từ hai góc dưới và một chùm giữa màn hình.
        burst(width * 0.12, height * 0.8, 2);
        burst(width * 0.88, height * 0.8, 2);
        burst(width * 0.5, height * 0.4, 2);
        explode(width * 0.3, height * 0.3);
        explode(width * 0.7, height * 0.25);
        start();

        window.addEventListener("resize", resize);
        window.addEventListener("pointerdown", handlePointerDown);
        window.addEventListener("pointermove", handlePointerMove);
        document.addEventListener("visibilitychange", handleVisibility);

        return () => {
            window.cancelAnimationFrame(frame);
            window.removeEventListener("resize", resize);
            window.removeEventListener("pointerdown", handlePointerDown);
            window.removeEventListener("pointermove", handlePointerMove);
            document.removeEventListener("visibilitychange", handleVisibility);
        };
    }, []);

    return (
        <div className="love-effects" aria-hidden="true">
            <canvas ref={backRef} className="love-canvas love-canvas-back" />
            <div className="love-stickers">
                {stickers.map((sticker, index) => (
                    <span
                        key={index}
                        className={`love-sticker is-${sticker.tone}`}
                        style={
                            {
                                left: sticker.x,
                                top: sticker.y,
                                width: sticker.size,
                                "--love-tilt": `${sticker.tilt}deg`,
                                animationDelay: `${sticker.delay}s`,
                            } as CSSProperties
                        }
                    >
                        <HeartIcon />
                        {sticker.text ? <b>{sticker.text}</b> : null}
                    </span>
                ))}
            </div>
            <div className="love-flyers">
                {flyers.map((flyer, index) => (
                    <span
                        key={index}
                        className={`love-flyer is-${flyer.tone}`}
                        style={{
                            top: flyer.top,
                            width: flyer.size,
                            animationDuration: `${flyer.duration}s`,
                            animationDelay: `${flyer.delay}s`,
                        }}
                    >
                        <HeartIcon />
                    </span>
                ))}
            </div>
            <canvas ref={frontRef} className="love-canvas love-canvas-front" />
        </div>
    );
}
