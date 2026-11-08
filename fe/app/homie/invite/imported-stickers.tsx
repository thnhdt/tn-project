import type { CSSProperties } from "react";
import { loveStickerRows } from "../../lib/love-web-stickers";

/** Một hàng sticker: hàng 0 là sticker động, hàng 1 và 2 là sticker tĩnh. */
export function ImportedStickers({ group }: { group: number }) {
    return (
        <div className="love-imported-stickers" aria-hidden="true">
            {(loveStickerRows[group] ?? []).map((src, index) => (
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
