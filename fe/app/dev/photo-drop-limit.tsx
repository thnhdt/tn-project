"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { getPhotoDropLimit, photoDropLimitRange, setPhotoDropLimit } from "../lib/admin";
import { errorMessage } from "../lib/api";

type Feedback = { tone: "error" | "success"; text: string } | null;

/** Khung chỉnh số ảnh mỗi khách được thả ở trang /tha-anh. */
export function PhotoDropLimit() {
    const [saved, setSaved] = useState<number | null>(null);
    const [value, setValue] = useState("");
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState<Feedback>(null);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                const limit = await getPhotoDropLimit();
                if (!cancelled) {
                    setSaved(limit);
                    setValue(String(limit));
                }
            } catch (error) {
                if (!cancelled) {
                    setFeedback({ tone: "error", text: errorMessage(error, "Không thể tải giới hạn thả ảnh.") });
                }
            }
        };
        void load();
        return () => {
            cancelled = true;
        };
    }, []);

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaving(true);
        setFeedback(null);
        try {
            const limit = await setPhotoDropLimit(Number(value));
            setSaved(limit);
            setValue(String(limit));
            setFeedback({
                tone: "success",
                text: limit === 0 ? "Đã tạm dừng thả ảnh." : `Đã lưu: mỗi khách thả tối đa ${limit} ảnh.`,
            });
        } catch (error) {
            setFeedback({ tone: "error", text: errorMessage(error, "Không thể lưu giới hạn thả ảnh.") });
        } finally {
            setSaving(false);
        }
    };

    const unchanged = saved !== null && value === String(saved);

    return (
        <section className="dev-photo-limit" aria-labelledby="photo-limit-title">
            <div className="dev-photo-limit-copy">
                <span>PHOTO_DROP.CONFIG</span>
                <h2 id="photo-limit-title">Giới hạn thả ảnh</h2>
                <p>
                    Số ảnh mỗi khách có QR được thả ở <Link href="/tha-anh">/tha-anh</Link>. Đặt 0 để tạm
                    dừng thả ảnh; ảnh đã thả vẫn bay như cũ.
                </p>
            </div>

            <form onSubmit={submit}>
                <label htmlFor="photo-limit">Ảnh / khách</label>
                <input
                    id="photo-limit"
                    type="number"
                    inputMode="numeric"
                    min={photoDropLimitRange.min}
                    max={photoDropLimitRange.max}
                    step={1}
                    required
                    value={value}
                    disabled={saved === null}
                    onChange={(event) => setValue(event.target.value)}
                />
                <button type="submit" disabled={saving || saved === null || unchanged}>
                    {saving ? "ĐANG LƯU..." : "LƯU"}
                </button>
            </form>

            {feedback ? (
                <p
                    className={`dev-feedback is-${feedback.tone}`}
                    role={feedback.tone === "error" ? "alert" : "status"}
                >
                    {feedback.text}
                </p>
            ) : null}
        </section>
    );
}
