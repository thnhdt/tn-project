"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { ceremony, countdown as content } from "../site-content";

const target = new Date(ceremony.startsAt);
const [year, month, day] = ceremony.startsAt.slice(0, 10).split("-");

function getRemaining() {
    const remaining = Math.max(target.getTime() - Date.now(), 0);

    return {
        days: Math.floor(remaining / 86_400_000),
        hours: Math.floor((remaining / 3_600_000) % 24),
        minutes: Math.floor((remaining / 60_000) % 60),
        seconds: Math.floor((remaining / 1_000) % 60),
    };
}

export function CountdownClock() {
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

    const units = [
        { label: "NGÀY", value: remaining?.days },
        { label: "GIỜ", value: remaining?.hours },
        { label: "PHÚT", value: remaining?.minutes },
        { label: "GIÂY", value: remaining?.seconds },
    ];

    return (
        <section className="countdown-section" aria-labelledby="countdown-title">
            <div className="countdown-copy">
                <span>{content.kicker}</span>
                <h2 id="countdown-title">
                    {content.title[0]}
                    <br />
                    {content.title[1]}
                </h2>
                <p>
                    {content.text}{" "}
                    <time dateTime={`${year}-${month}-${day}`}>{`${day}.${month}.${year}`}</time>
                    .
                </p>
            </div>

            <div className="doodle-clock">
                <div className="clock-rays" aria-hidden="true">
                    {Array.from({ length: 16 }, (_, index) => (
                        <i key={index} style={{ "--ray-index": index } as CSSProperties} />
                    ))}
                </div>
                <div className="clock-face">
                    <span className="clock-scribble">tick tock!</span>
                    <div
                        className="countdown-grid"
                        role="timer"
                        aria-live="off"
                        aria-label={`Thời gian còn lại đến ngày ${Number(day)} tháng ${Number(month)} năm ${year}`}
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
                    <b>{`${day} / ${month} / ${year}`}</b>
                </div>
            </div>
        </section>
    );
}
