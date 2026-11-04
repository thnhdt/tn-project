"use client";

import { useEffect, useRef } from "react";

export function OpeningFireworks() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const context = canvas.getContext("2d");
        if (!context) return;

        const colors = ["#1559ed", "#ffca40", "#ff648a", "#49bfa5", "#ffffff"];
        let width = window.innerWidth;
        let height = window.innerHeight;
        let frame = 0;
        let previous = 0;
        let started: number | undefined;
        let burst = 0;
        const particles: {
            x: number; y: number; vx: number; vy: number;
            life: number; color: string; size: number;
        }[] = [];

        function resize() {
            width = window.innerWidth;
            height = window.innerHeight;
            const ratio = Math.min(window.devicePixelRatio || 1, 2);
            canvas!.width = width * ratio;
            canvas!.height = height * ratio;
            context!.setTransform(ratio, 0, 0, ratio, 0, 0);
        }

        function launch() {
            for (const side of [-1, 1]) {
                for (let index = 0; index < 65; index++) {
                    const angle = -Math.PI / 2 + side * (0.3 + Math.random() * 0.85);
                    const speed = 420 + Math.random() * 520;
                    particles.push({
                        x: side === 1 ? 0 : width,
                        y: height * 0.72,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        life: 1.6 + Math.random() * 1.2,
                        color: colors[Math.floor(Math.random() * colors.length)],
                        size: 2 + Math.random() * 3,
                    });
                }
            }
        }

        function draw(now: number) {
            started ??= now;
            const elapsed = now - started;
            const dt = Math.min((now - (previous || now)) / 1000, 0.04);
            previous = now;
            if (burst < 3 && elapsed >= burst * 450) {
                launch();
                burst++;
            }
            context!.clearRect(0, 0, width, height);
            for (let index = particles.length - 1; index >= 0; index--) {
                const particle = particles[index];
                particle.life -= dt;
                if (particle.life <= 0) {
                    particles.splice(index, 1);
                    continue;
                }
                particle.x += particle.vx * dt;
                particle.y += particle.vy * dt;
                particle.vy += 480 * dt;
                context!.globalAlpha = Math.min(particle.life, 1);
                context!.fillStyle = particle.color;
                context!.beginPath();
                context!.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                context!.fill();
            }
            if (burst < 3 || particles.length) frame = requestAnimationFrame(draw);
        }

        resize();
        window.addEventListener("resize", resize);
        frame = requestAnimationFrame(draw);
        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener("resize", resize);
        };
    }, []);

    return <canvas ref={canvasRef} className="opening-fireworks" aria-hidden="true" />;
}
