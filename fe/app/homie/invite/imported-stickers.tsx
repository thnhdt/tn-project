import type { CSSProperties } from "react";
import { loveWebStickers } from "../../lib/love-web-stickers";

export function ImportedStickers({ group }: { group: number }) {
    return (
        <div className="love-imported-stickers" aria-hidden="true">
            {loveWebStickers.filter((_, index) => index % 3 === group).map((src, index) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    key={src}
                    src={src}
                    alt=""
                    loading="lazy"
                    style={{
                        "--sticker-angle": `${((index * 17 + group * 7) % 25) - 12}deg`,
                        "--sticker-size": `${80 + ((index * 23 + group * 19) % 51)}px`,
                    } as CSSProperties}
                />
            ))}
        </div>
    );
}
