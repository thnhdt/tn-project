import Link from "next/link";
import { Fragment } from "react";
import {
    ceremony,
    footer,
    graduate,
    hero,
    invite,
    journey,
    memories,
    story,
    toolbar,
} from "../site-content";
import { MusicButton } from "./music-button";

function formatCeremonyDate() {
    const [year, month, day] = ceremony.startsAt.slice(0, 10).split("-");
    return `${day}.${month}.${year}`;
}

export function Toolbar() {
    return (
        <header className="theme-toolbar">
            <a className="brand-lockup" href="#top" aria-label="Về đầu trang">
                <span>{graduate.initials}</span>
                <strong>{toolbar.brand}</strong>
            </a>

            <div className="notebook-mode">
                <span>{ceremony.title}</span>
                <strong>
                    {formatCeremonyDate()}
                    {ceremony.location ? ` • ${ceremony.location}` : ""}
                </strong>
            </div>

            <div className="toolbar-actions">
                <Link href="/homie">{toolbar.homieLink}</Link>
                <MusicButton />
            </div>
        </header>
    );
}

export function Hero() {
    return (
        <section className="hero-section" id="top">
            <div className="doodle doodle-arrow" aria-hidden="true">↘</div>
            <div className="doodle doodle-star" aria-hidden="true">✦</div>
            <div className="doodle doodle-loop" aria-hidden="true">@@@</div>
            <div className="hero-spark-lines" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
                <i />
            </div>

            <div className="hero-copy">
                <div className="eyebrow-row">
                    <span className="status-dot" />
                    {hero.eyebrow}
                </div>

                <p className="scribble-note">{hero.scribble}</p>
                <h1>
                    {graduate.firstName}
                    <span>{graduate.lastName}</span>
                </h1>

                <div className="degree-card">
                    <span className="degree-icon" aria-hidden="true">
                        &lt;/&gt;
                    </span>
                    <div>
                        <small>degree_unlocked:</small>
                        <strong>{graduate.degree}</strong>
                    </div>
                </div>

                <p className="university">
                    {graduate.university[0]}
                    <br />
                    {graduate.university[1]}
                </p>
            </div>

            <div className="hero-collage" aria-label="Khung ảnh tốt nghiệp">
                <div className="window-card">
                    <div className="window-bar">
                        <span />
                        <span />
                        <span />
                        <b>{hero.windowTitle}</b>
                    </div>
                    <div className="portrait-placeholder">
                        <div className="portrait-code">
                            <span>while</span> (alive) {"{"}
                            <br />
                            &nbsp;&nbsp;keepLearning();
                            <br />
                            {"}"}
                        </div>
                        <strong>{hero.photoTitle}</strong>
                        <small>{hero.photoHint}</small>
                    </div>
                </div>

                <div className="tape tape-one" aria-hidden="true" />
                <div className="tape tape-two" aria-hidden="true" />
                <div className="sticker sticker-degree">
                    404
                    <small>degree not found</small>
                    <b>fixed ✓</b>
                </div>
                <div className="sticker sticker-bk">{graduate.badge}</div>
                <div className="cursor-sticker" aria-hidden="true">↖</div>
            </div>

            <a className="scroll-ticket" href="#event">
                <span>SCROLL TO RUN</span>
                <b>↓</b>
            </a>
        </section>
    );
}

export function Journey() {
    return (
        <section className="sketchnote-map" aria-label="Bản đồ sketchnote hành trình đại học">
            <div className="sketchnote-map-intro">
                <span>{journey.label}</span>
                <strong>{journey.title}</strong>
            </div>
            {journey.steps.map((step) => (
                <article key={step.label}>
                    <div className="sketch-symbol" aria-hidden="true">
                        {step.symbol}
                    </div>
                    <small>{step.caption}</small>
                    <b>{step.label}</b>
                </article>
            ))}
        </section>
    );
}

export function Story() {
    return (
        <section className="story-section" id="story">
            <div className="section-heading">
                <span>{story.kicker}</span>
                <h2>
                    {story.title[0]}
                    <br />
                    {story.title[1]}
                </h2>
                <p>{story.text}</p>
                <div
                    className="sketch-equation"
                    aria-label={`${story.equation.join(" + ")} = ${story.equationResult}`}
                >
                    {story.equation.map((term, index) => (
                        <Fragment key={term}>
                            {index > 0 ? <b>+</b> : null}
                            <span>{term}</span>
                        </Fragment>
                    ))}
                    <b>=</b>
                    <strong>{story.equationResult}</strong>
                </div>
            </div>

            <div className="terminal-card">
                <div className="terminal-top">
                    <span>terminal — zsh</span>
                    <b>⌁ □ ×</b>
                </div>
                <div className="terminal-body">
                    <p>
                        <span>{story.terminalPrompt}</span> ~ % {story.terminalCommand}
                    </p>
                    {story.commits.map((commit) => (
                        <p key={commit.hash}>
                            <b>{commit.hash}</b> {commit.message}
                        </p>
                    ))}
                    <p className="terminal-success">Process finished with exit code 0 ▮</p>
                </div>
            </div>
        </section>
    );
}

export function Memories() {
    return (
        <section className="memory-section">
            <div className="memory-intro">
                <span>{memories.kicker}</span>
                <h2>
                    {memories.title[0]}
                    <br />
                    {memories.title[1]}
                </h2>
                <p>{memories.text}</p>
            </div>

            <div className="memory-grid">
                {memories.items.map((memory, index) => {
                    const number = String(index + 1).padStart(2, "0");

                    return (
                        <article className="memory-card" key={memory.title}>
                            <span className="memory-sketch-mark" aria-hidden="true">
                                {memory.mark}
                            </span>
                            <div className="memory-photo">
                                <span>{number}</span>
                                <b>PHOTO_{number}.JPG</b>
                            </div>
                            <div className="memory-copy">
                                <small>{memory.title}</small>
                                <p>{memory.caption}</p>
                            </div>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}

export function EventInfo() {
    const details = [
        { label: "NGÀY", value: formatCeremonyDate() },
        { label: "GIỜ", value: ceremony.time ?? "sẽ cập nhật" },
        { label: "ĐỊA ĐIỂM", value: ceremony.location ?? "sẽ cập nhật" },
    ];

    return (
        <section className="event-section" id="event">
            <p className="event-side-doodle" aria-hidden="true">
                {invite.sideDoodle}
                <span>↙</span>
            </p>
            <div className="event-paper">
                <span className="pin" aria-hidden="true">●</span>
                <small>{invite.kicker}</small>
                <h2>{ceremony.title}</h2>
                <dl className="event-details">
                    {details.map((detail) => (
                        <div key={detail.label}>
                            <dt>{detail.label}</dt>
                            <dd>{detail.value}</dd>
                        </div>
                    ))}
                </dl>
                {ceremony.mapUrl ? (
                    <a className="event-map-link" href={ceremony.mapUrl} target="_blank" rel="noreferrer">
                        MỞ GOOGLE MAPS ↗
                    </a>
                ) : (
                    <button type="button" disabled>
                        GOOGLE MAPS — SOON
                    </button>
                )}
            </div>

            <div className="invite-note">
                <span>{invite.to}</span>
                <p>{invite.text}</p>
                <strong>{graduate.signature}</strong>
            </div>
        </section>
    );
}

export function Footer() {
    return (
        <footer>
            <div>
                <span>{footer.label}</span>
                <b>{footer.text}</b>
            </div>
            <p>
                {graduate.fullName.toLocaleUpperCase("vi")} © {graduate.classOf}
            </p>
            <a href="#top">BACK_TO_TOP ↑</a>
        </footer>
    );
}
