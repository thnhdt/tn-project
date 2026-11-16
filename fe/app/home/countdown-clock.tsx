"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { ceremony, countdown as content } from "../site-content";

const target = new Date(ceremony.startsAt);
const end = new Date(ceremony.endsAt);
const [year, month, day] = ceremony.startsAt.slice(0, 10).split("-");
const [hour, minute] = ceremony.startsAt.slice(11, 16).split(":");

/** `upcoming`: còn đếm ngược, `live`: đang làm lễ, `done`: đã xong. */
type Phase = "upcoming" | "live" | "done";

function getRemaining() {
    const now = Date.now();
    const remaining = Math.max(target.getTime() - now, 0);
    const phase: Phase = remaining > 0 ? "upcoming" : now < end.getTime() ? "live" : "done";

    return {
        phase,
        days: Math.floor(remaining / 86_400_000),
        hours: Math.floor((remaining / 3_600_000) % 24),
        minutes: Math.floor((remaining / 60_000) % 60),
        seconds: Math.floor((remaining / 1_000) % 60),
    };
}

/** `kicker` đổi nhãn nhỏ phía trên; thiệp riêng không đánh số mục như trang chủ. */
export function CountdownClock({ kicker = content.kicker }: { kicker?: string } = {}) {
    const [remaining, setRemaining] = useState<ReturnType<typeof getRemaining> | null>(
        null,
    );

    useEffect(() => {
        const update = () => setRemaining(getRemaining());
        const animationFrame = window.requestAnimationFrame(update);
        const timer = window.setInterval(update, 1_000);

        return () => {
            window.cancelAnimationFrame(animationFrame);
            window.clearInterval(timer);
        };
    }, []);

    const phase = remaining?.phase ?? "upcoming";
    const ended = phase === "live" ? content.live : phase === "done" ? content.done : null;

    const units = [
        { label: "NGÀY", value: remaining?.days },
        { label: "GIỜ", value: remaining?.hours },
        { label: "PHÚT", value: remaining?.minutes },
        { label: "GIÂY", value: remaining?.seconds },
    ];

    return (
        <section className="countdown-section" aria-labelledby="countdown-title">
            <div className="countdown-copy">
                <span>{kicker}</span>
                <h2 id="countdown-title">
                    {content.title[0]}
                    <br />
                    {content.title[1]}
                </h2>
                {phase === "done" ? (
                    <p>{content.done.note}</p>
                ) : (
                    <p>
                        {phase === "live" ? content.live.note : content.text}{" "}
                        {phase === "live" && ceremony.location ? (
                            <time dateTime={ceremony.startsAt}>{ceremony.location}</time>
                        ) : (
                            <time dateTime={ceremony.startsAt}>{`${hour}h${minute} • ${day}.${month}.${year}`}</time>
                        )}
                        {phase === "live" ? content.live.noteEnd : "."}
                    </p>
                )}
            </div>

            <div className="doodle-clock">
                <div className="clock-rays" aria-hidden="true">
                    {Array.from({ length: 16 }, (_, index) => (
                        <i key={index} style={{ "--ray-index": index } as CSSProperties} />
                    ))}
                </div>
                <div className="clock-face">
                    <span className="clock-scribble">{ended ? ended.scribble : "tick tock!"}</span>
                    {ended ? (
                        <strong className={`countdown-ended is-${phase}`} role="status">
                            {ended.badge}
                        </strong>
                    ) : (
                        <div
                            className="countdown-grid"
                            role="timer"
                            aria-live="off"
                            aria-label={`Thời gian còn lại đến ${hour}h${minute} ngày ${Number(day)} tháng ${Number(month)} năm ${year}`}
                        >
                            {units.map((unit) => (
                                <div key={unit.label}>
                                    <strong>
                                        {unit.value === undefined
                                            ? "--"
                                            : unit.value.toString().padStart(2, "0")}
                                    </strong>
                                    <small>{unit.label}</small>
                                </div>
                            ))}
                        </div>
                    )}
                    <b>{`${day} / ${month} / ${year}`}</b>
                </div>
            </div>
        </section>
    );
}
