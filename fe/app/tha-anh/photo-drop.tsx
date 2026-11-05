"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { errorMessage, reportError } from "../lib/api";
import {
    listDroppedPhotos,
    pickImageFiles,
    uploadDroppedPhoto,
    type DroppedPhoto,
} from "../lib/photo-drop";

type Balloon = {
    key: number;
    url: string;
    left: number;
    width: number;
    tilt: number;
    sway: number;
    duration: number;
    startBottom: number;
    popped: boolean;
};

type Status = { tone: "info" | "ok" | "error"; text: string } | null;

const refreshEveryMs = 45_000;

function random(min: number, max: number) {
    return min + Math.random() * (max - min);
}

export function PhotoDrop() {
    const [balloons, setBalloons] = useState<Balloon[]>([]);
    const [photoCount, setPhotoCount] = useState<number | null>(null);
    const [dragging, setDragging] = useState(false);
    const [uploading, setUploading] = useState(0);
    const [status, setStatus] = useState<Status>(null);
    const poolRef = useRef<DroppedPhoto[]>([]);
    const nextKeyRef = useRef(0);
    const dragDepthRef = useRef(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const launch = useCallback((url: string, at?: { x: number; y: number }) => {
        const viewportWidth = window.innerWidth;
        const small = viewportWidth < 640;
        const width = small ? random(92, 138) : random(130, 210);
        const left = at
            ? Math.min(Math.max(at.x - width / 2, 4), viewportWidth - width - 4)
            : random(0, Math.max(0, viewportWidth - width));
        const startBottom = at ? Math.max(0, window.innerHeight - at.y - width / 2) : -width * 1.4;

        setBalloons((current) => {
            const limit = small ? 9 : 16;
            const kept = current.length >= limit ? current.slice(current.length - limit + 1) : current;
            return [
                ...kept,
                {
                    key: nextKeyRef.current++,
                    url,
                    left,
                    width,
                    tilt: random(-14, 14),
                    sway: random(18, 46) * (Math.random() < 0.5 ? -1 : 1),
                    duration: random(11, 19),
                    startBottom,
                    popped: false,
                },
            ];
        });
    }, []);

    const refresh = useCallback(async () => {
        try {
            const photos = await listDroppedPhotos();
            poolRef.current = photos;
            setPhotoCount(photos.length);
        } catch (error) {
            setPhotoCount((count) => count ?? 0);
            reportError("photo-drop:list", error);
        }
    }, []);

    useEffect(() => {
        const first = window.setTimeout(() => void refresh(), 0);
        const timer = window.setInterval(() => void refresh(), refreshEveryMs);
        return () => {
            window.clearTimeout(first);
            window.clearInterval(timer);
        };
    }, [refresh]);

    // Thả ngẫu nhiên một ảnh trong kho cho bay lên, đều đặn.
    useEffect(() => {
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const timer = window.setInterval(
            () => {
                const pool = poolRef.current;
                if (pool.length === 0 || document.hidden) {
                    return;
                }
                launch(pool[Math.floor(Math.random() * pool.length)].url);
            },
            reduceMotion ? 4200 : 1500,
        );
        return () => window.clearInterval(timer);
    }, [launch]);

    const handleFiles = useCallback(
        async (list: FileList | null, at?: { x: number; y: number }) => {
            const { files, skipped } = pickImageFiles(list);
            if (files.length === 0) {
                setStatus({ tone: "error", text: "Không thấy tấm ảnh nào trong đó hết á." });
                return;
            }

            setUploading((count) => count + files.length);
            setStatus({ tone: "info", text: `Đang thả ${files.length} ảnh lên trời…` });
            let sent = 0;
            let lastError = "";

            await Promise.all(
                files.map(async (file, index) => {
                    try {
                        const photo = await uploadDroppedPhoto(file);
                        sent += 1;
                        poolRef.current = [photo, ...poolRef.current];
                        setPhotoCount((count) => (count ?? 0) + 1);
                        const spot = at ? { x: at.x + (index - files.length / 2) * 40, y: at.y } : undefined;
                        launch(photo.url, spot);
                    } catch (error) {
                        lastError = errorMessage(error);
                        reportError("photo-drop:upload", error);
                    } finally {
                        setUploading((count) => count - 1);
                    }
                }),
            );

            if (sent === 0) {
                setStatus({ tone: "error", text: lastError || "Chưa gửi được ảnh nào." });
            } else {
                const extra = skipped > 0 ? ` (mỗi lần tối đa 8 ảnh, bỏ qua ${skipped})` : "";
                const failed = sent < files.length ? `, ${files.length - sent} ảnh lỗi` : "";
                setStatus({ tone: "ok", text: `Bay rồi! ${sent} ảnh đã lên trời${failed}${extra}.` });
            }
        },
        [launch],
    );

    // Kéo-thả ở bất kỳ đâu trên trang.
    useEffect(() => {
        const hasFiles = (event: DragEvent) =>
            Array.from(event.dataTransfer?.types ?? []).includes("Files");

        const onEnter = (event: DragEvent) => {
            if (!hasFiles(event)) {
                return;
            }
            event.preventDefault();
            dragDepthRef.current += 1;
            setDragging(true);
        };
        const onOver = (event: DragEvent) => {
            if (hasFiles(event)) {
                event.preventDefault();
            }
        };
        const onLeave = () => {
            dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
            if (dragDepthRef.current === 0) {
                setDragging(false);
            }
        };
        const onDrop = (event: DragEvent) => {
            if (!hasFiles(event)) {
                return;
            }
            event.preventDefault();
            dragDepthRef.current = 0;
            setDragging(false);
            void handleFiles(event.dataTransfer?.files ?? null, {
                x: event.clientX,
                y: event.clientY,
            });
        };

        window.addEventListener("dragenter", onEnter);
        window.addEventListener("dragover", onOver);
        window.addEventListener("dragleave", onLeave);
        window.addEventListener("drop", onDrop);
        return () => {
            window.removeEventListener("dragenter", onEnter);
            window.removeEventListener("dragover", onOver);
            window.removeEventListener("dragleave", onLeave);
            window.removeEventListener("drop", onDrop);
        };
    }, [handleFiles]);

    const removeBalloon = (key: number) =>
        setBalloons((current) => current.filter((balloon) => balloon.key !== key));

    const pop = (key: number) =>
        setBalloons((current) =>
            current.map((balloon) => (balloon.key === key ? { ...balloon, popped: true } : balloon)),
        );

    return (
        <main className={`drop-shell${dragging ? " is-dragging" : ""}`}>
            <div className="drop-sky" aria-hidden="true">
                {balloons.map((balloon) => (
                    <button
                        key={balloon.key}
                        type="button"
                        tabIndex={-1}
                        className={`drop-balloon${balloon.popped ? " is-popped" : ""}`}
                        style={
                            {
                                left: `${balloon.left}px`,
                                bottom: `${balloon.startBottom}px`,
                                width: `${balloon.width}px`,
                                "--tilt": `${balloon.tilt}deg`,
                                "--sway": `${balloon.sway}px`,
                                "--rise": `calc(-100vh - ${balloon.startBottom + balloon.width * 1.6}px)`,
                                "--duration": `${balloon.duration}s`,
                            } as React.CSSProperties
                        }
                        onClick={() => pop(balloon.key)}
                        onAnimationEnd={(event) => {
                            if (event.target === event.currentTarget) {
                                removeBalloon(balloon.key);
                            }
                        }}
                    >
                        <span className="drop-balloon-sway">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={balloon.url}
                                alt=""
                                decoding="async"
                                draggable={false}
                                onAnimationEnd={() =>
                                    setBalloons((current) =>
                                        current.map((item) =>
                                            item.key === balloon.key ? { ...item, popped: false } : item,
                                        ),
                                    )
                                }
                            />
                        </span>
                    </button>
                ))}
            </div>

            <header className="drop-top">
                <Link href="/" className="drop-back">
                    ← VỀ TRANG CHÍNH
                </Link>
                <span className="drop-counter">
                    {photoCount === null ? "ĐANG ĐẾM ẢNH…" : `${photoCount} ẢNH ĐANG BAY`}
                </span>
            </header>

            <section className="drop-card">
                <p className="drop-eyebrow">PHOTO_DROP.exe</p>
                <h1>
                    Thả con ảnh của bạn <span>dzô đây</span>
                </h1>
                <p className="drop-lead">
                    Kéo ảnh thả vào bất kỳ đâu trên trang, hoặc bấm nút bên dưới. Ảnh sẽ bay lên
                    cho mọi người cùng xem. Bấm vào ảnh đang bay để làm nó nảy một cái.
                </p>

                <button
                    type="button"
                    className="drop-pick"
                    onClick={() => inputRef.current?.click()}
                    disabled={uploading > 0}
                >
                    {uploading > 0 ? `ĐANG THẢ ${uploading} ẢNH…` : "CHỌN ẢNH ĐỂ THẢ ↑"}
                </button>
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={(event) => {
                        void handleFiles(event.target.files);
                        event.target.value = "";
                    }}
                />

                <p className={`drop-status${status ? ` is-${status.tone}` : ""}`} role="status">
                    {status?.text ?? "Mỗi lần tối đa 8 ảnh. Ảnh được nén nhẹ trước khi gửi."}
                </p>
                <p className="drop-note">
                    Ảnh thả vào là công khai trên trang này, ai mở cũng thấy. Đừng thả ảnh riêng tư nha.
                </p>
            </section>

            <div className="drop-overlay" aria-hidden="true">
                <span>THẢ TAY RA ĐI ↓</span>
            </div>
        </main>
    );
}
