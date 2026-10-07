"use client";

import Link from "next/link";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import {
    errorMessage,
    openInvitation as fetchInvitation,
    reportError,
    saveInviteCode,
} from "../lib/api";
import { decodeImageData, decodeQrFile, extractInviteCode } from "../lib/qr";

type Status = "idle" | "camera" | "checking";

const invalidQrMessage = "QR này không phải thiệp mời hợp lệ.";

export function QrGate() {
    const [status, setStatus] = useState<Status>("idle");
    const [error, setError] = useState("");
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const frameRef = useRef<number | null>(null);

    const stopCamera = useCallback(() => {
        if (frameRef.current !== null) {
            window.cancelAnimationFrame(frameRef.current);
            frameRef.current = null;
        }
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
    }, []);

    const openInvitation = useCallback(async (code: string) => {
        setStatus("checking");
        setError("");

        try {
            if (!(await fetchInvitation(code))) {
                throw new Error(invalidQrMessage);
            }

            saveInviteCode(code);
            window.location.assign("/homie/invite");
        } catch (verifyError) {
            reportError("qr-gate", verifyError);
            setError(errorMessage(verifyError));
            setStatus("idle");
        }
    }, []);

    const handleQrText = useCallback(
        (text: string | null) => {
            const code = text ? extractInviteCode(text) : null;
            if (!code) {
                setError(text ? invalidQrMessage : "Không tìm thấy mã QR nào.");
                setStatus("idle");
                return;
            }

            void openInvitation(code);
        },
        [openInvitation],
    );

    // Quét bằng camera điện thoại: QR mở thẳng /homie?code=..., tự kiểm tra luôn.
    useEffect(() => {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        if (!code) {
            return;
        }

        url.searchParams.delete("code");
        window.history.replaceState(null, "", url.pathname);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Verify the code carried in by the QR link once on load.
        handleQrText(code);
    }, [handleQrText]);

    useEffect(() => stopCamera, [stopCamera]);

    const startCamera = async () => {
        setError("");

        if (!navigator.mediaDevices?.getUserMedia) {
            setError("Trình duyệt không hỗ trợ camera. Hãy tải ảnh hoặc PDF có QR.");
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" },
                audio: false,
            });
            streamRef.current = stream;
            setStatus("camera");

            const video = videoRef.current;
            if (!video) {
                stopCamera();
                return;
            }

            video.srcObject = stream;
            await video.play();

            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d", { willReadFrequently: true });

            const scanFrame = () => {
                if (!context || !streamRef.current) {
                    return;
                }

                if (video.readyState >= video.HAVE_ENOUGH_DATA) {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    context.drawImage(video, 0, 0);
                    const text = decodeImageData(
                        context.getImageData(0, 0, canvas.width, canvas.height),
                    );
                    // Bỏ qua QR khác (ví dụ QR chỉ đường trên thiệp) và quét tiếp.
                    if (text && extractInviteCode(text)) {
                        stopCamera();
                        handleQrText(text);
                        return;
                    }
                }

                frameRef.current = window.requestAnimationFrame(scanFrame);
            };

            frameRef.current = window.requestAnimationFrame(scanFrame);
        } catch {
            stopCamera();
            setStatus("idle");
            setError("Không mở được camera. Hãy cho phép quyền camera hoặc tải file lên.");
        }
    };

    const closeCamera = () => {
        stopCamera();
        setStatus("idle");
    };

    const uploadFile = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) {
            return;
        }

        stopCamera();
        setStatus("checking");
        setError("");

        try {
            handleQrText(await decodeQrFile(file));
        } catch {
            setStatus("idle");
            setError("Không đọc được file này. Hãy thử ảnh PNG/JPG hoặc PDF khác.");
        }
    };

    const busy = status === "checking";

    return (
        <main className="homie-shell">
            <div className="homie-grid" aria-hidden="true" />
            <Link className="homie-logo" href="/">
                <span>LD</span>
                <strong>HOMIE_CHECK.exe</strong>
            </Link>

            <section className="homie-lookup-card">
                <div className="homie-window-bar">
                    <span />
                    <span />
                    <span />
                    <b>scan_my_invitation.tsx</b>
                </div>

                <div className="homie-card-body">
                    <div className="homie-sticker">
                        PRIVATE
                        <small>JUST 4 U</small>
                    </div>
                    <p className="homie-kicker">HEY HOMIE!</p>
                    <h1>
                        Thiệp của bạn
                        <span>đang ở đây.</span>
                    </h1>
                    <p className="homie-description">
                        Quét mã QR trên thiệp Đạt gửi bạn, hoặc tải lên ảnh / file PDF
                        có mã QR đó để mở trang dành riêng cho bạn.
                    </p>

                    <div className={`homie-camera ${status === "camera" ? "is-open" : ""}`}>
                        <video ref={videoRef} muted playsInline aria-label="Khung quét QR" />
                        <span className="homie-camera-frame" aria-hidden="true" />
                    </div>

                    <div className="homie-qr-actions">
                        {status === "camera" ? (
                            <button type="button" onClick={closeCamera}>
                                TẮT CAMERA ✕
                            </button>
                        ) : (
                            <button type="button" disabled={busy} onClick={() => void startCamera()}>
                                {busy ? "ĐANG KIỂM TRA..." : "QUÉT BẰNG CAMERA ⌁"}
                            </button>
                        )}
                        <label className={busy ? "is-disabled" : ""}>
                            TẢI ẢNH / PDF CÓ QR ↑
                            <input
                                type="file"
                                accept="image/*,application/pdf,.pdf"
                                disabled={busy}
                                onChange={(event) => void uploadFile(event)}
                            />
                        </label>
                    </div>

                    {error ? (
                        <p className="homie-error" role="alert">
                            {error}
                        </p>
                    ) : null}

                    <div className="homie-helper">
                        <span>SECURE</span>
                        <code>1 QR = 1 homie</code>
                        <p>File được đọc ngay trên máy bạn, không tải lên server.</p>
                    </div>
                </div>
            </section>

            <p className="homie-doodle doodle-one" aria-hidden="true">
                your invite!
            </p>
            <p className="homie-doodle doodle-two" aria-hidden="true">
                ↖ scan here
            </p>
            <footer>MADE WITH CODE + CHAOS + FRIENDSHIP</footer>
        </main>
    );
}
