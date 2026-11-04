"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
    errorMessage,
    getRandomGif,
    giphyFunctionUrl,
    type RandomGif,
    reportError,
} from "../lib/api";
import { gifMachine as content } from "../site-content";

const memeTags = [
    { label: "Mọi GIF", tag: "" },
    { label: "Meme bất kỳ", tag: "meme" },
    { label: "Mèo 🐈", tag: "cat meme" },
    { label: "Doge", tag: "doge" },
    { label: "SpongeBob", tag: "spongebob meme" },
    { label: "Minions", tag: "minions" },
    { label: "The Office", tag: "the office reaction" },
    { label: "This is fine", tag: "this is fine" },
    { label: "Ăn mừng 🎉", tag: "celebration" },
];

export function GifMachine() {
    const [gif, setGif] = useState<RandomGif | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [selectedTag, setSelectedTag] = useState("");
    const offsets = useRef<Record<string, number>>({});

    const generateGif = useCallback(async (tag = "") => {
        setLoading(true);
        setError("");

        try {
            const offset = offsets.current[tag] ?? 0;
            const nextGif = await getRandomGif(tag, offset);
            setGif(nextGif);
            offsets.current[tag] = (offset + 1) % 50;
        } catch (generateError) {
            reportError("gif", generateError);
            setError(errorMessage(generateError));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (content.autoLoad) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- Pick the first random GIF once the page is mounted.
            void generateGif();
        }
    }, [generateGif]);

    return (
        <section className="gif-machine" aria-labelledby="gif-machine-title">
            <div className="gif-machine-copy">
                <span>{content.kicker}</span>
                <h2 id="gif-machine-title">
                    {content.title[0]}
                    <br />
                    {content.title[1]}
                </h2>
                <p>{content.text}</p>
                <div className="gif-meme-tags" role="group" aria-label="Chọn chủ đề GIF">
                    {memeTags.map(({ label, tag }) => (
                        <button
                            key={tag}
                            type="button"
                            aria-pressed={selectedTag === tag}
                            disabled={loading}
                            onClick={() => {
                                setSelectedTag(tag);
                                void generateGif(tag);
                            }}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                <div className="gif-machine-actions">
                    <button
                        type="button"
                        disabled={loading}
                        onClick={() => void generateGif(selectedTag)}
                    >
                        {loading ? "ĐANG BỐC GIF..." : "BỐC GIF NGẪU NHIÊN ✦"}
                    </button>
                    {gif ? (
                        <a href={`${giphyFunctionUrl}/${gif.id}/download`}>
                            TẢI GIF VỀ ↓
                        </a>
                    ) : null}
                </div>
                {error ? (
                    <p className="gif-machine-error" role="alert">
                        {error}
                    </p>
                ) : null}
                <a
                    className="giphy-attribution"
                    href="https://giphy.com"
                    target="_blank"
                    rel="noreferrer"
                >
                    POWERED BY GIPHY
                </a>
            </div>

            <div className="gif-notebook-frame">
                <div className="gif-tape" aria-hidden="true" />
                {gif ? (
                    <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={gif.previewUrl} alt={gif.altText} />
                        <p>{gif.title}</p>
                    </>
                ) : (
                    <div className="gif-empty-state" aria-hidden="true">
                        <span>?</span>
                        <strong>GIF_???</strong>
                        <small>your random reaction appears here</small>
                    </div>
                )}
                <div className="gif-frame-doodles" aria-hidden="true">
                    <span>↗</span>
                    <b>good vibes only!</b>
                    <i>{"///"}</i>
                </div>
            </div>
        </section>
    );
}
