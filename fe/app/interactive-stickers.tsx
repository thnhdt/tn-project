"use client";

import {
    type KeyboardEvent as ReactKeyboardEvent,
    type PointerEvent as ReactPointerEvent,
    useEffect,
    useRef,
    useState,
} from "react";

type StickerMode = "fall" | "float" | "drift";

type StickerDefinition = {
    id: string;
    label: string;
    note: string;
    mode: StickerMode;
    tone: "blue" | "yellow" | "pink" | "paper";
};

type StickerPhysics = {
    x: number;
    y: number;
    velocityX: number;
    velocityY: number;
    rotation: number;
    rotationVelocity: number;
    phase: number;
    dragging: boolean;
    dragOffsetX: number;
    dragOffsetY: number;
    lastPointerX: number;
    lastPointerY: number;
    lastPointerAt: number;
};

const stickerDefinitions: StickerDefinition[] = [
    {
        id: "graduate",
        label: "🎓",
        note: "SHIPPED!",
        mode: "fall",
        tone: "yellow",
    },
    {
        id: "code",
        label: "</>",
        note: "keep coding",
        mode: "float",
        tone: "blue",
    },
    {
        id: "bug",
        label: "BUG",
        note: "not a feature",
        mode: "drift",
        tone: "pink",
    },
    {
        id: "star",
        label: "★",
        note: "+1 level",
        mode: "fall",
        tone: "paper",
    },
    {
        id: "commit",
        label: "git ✓",
        note: "committed",
        mode: "float",
        tone: "yellow",
    },
    {
        id: "coffee",
        label: "☕",
        note: "fuel.exe",
        mode: "drift",
        tone: "paper",
    },
    {
        id: "cursor",
        label: "↖",
        note: "drag me!",
        mode: "fall",
        tone: "blue",
    },
    {
        id: "error",
        label: "404",
        note: "degree found",
        mode: "float",
        tone: "pink",
    },
];

const stickerStorageKey = "graduation-interactive-stickers";

function clamp(value: number, minimum: number, maximum: number) {
    return Math.min(Math.max(value, minimum), maximum);
}

export function InteractiveStickers() {
    const [enabled, setEnabled] = useState(true);
    const elementRefs = useRef(new Map<string, HTMLButtonElement>());
    const physicsRef = useRef(new Map<string, StickerPhysics>());
    const reducedMotionRef = useRef(false);

    useEffect(() => {
        const savedPreference = window.sessionStorage.getItem(stickerStorageKey);
        if (savedPreference === "off") {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- Restore the visitor's device-local animation preference.
            setEnabled(false);
        }
    }, []);

    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        const updateMotionPreference = () => {
            reducedMotionRef.current = mediaQuery.matches;
        };

        updateMotionPreference();
        mediaQuery.addEventListener("change", updateMotionPreference);

        return () => {
            mediaQuery.removeEventListener("change", updateMotionPreference);
        };
    }, []);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        stickerDefinitions.forEach((sticker, index) => {
            const element = elementRefs.current.get(sticker.id);
            if (!element) {
                return;
            }

            const width = element.offsetWidth || 90;
            const height = element.offsetHeight || 70;
            const availableWidth = Math.max(viewportWidth - width - 28, 1);
            const availableHeight = Math.max(viewportHeight - height - 80, 1);
            const startsAboveScreen = sticker.mode === "fall" && index < 3;
            const physics: StickerPhysics = {
                x: 14 + ((index * 173 + 47) % availableWidth),
                y: startsAboveScreen
                    ? -90 - index * 74
                    : 58 + ((index * 109 + 31) % availableHeight),
                velocityX: ((index % 3) - 1) * 0.55,
                velocityY: sticker.mode === "fall" ? 0.2 + index * 0.08 : 0,
                rotation: -12 + ((index * 11) % 25),
                rotationVelocity: index % 2 === 0 ? 0.08 : -0.07,
                phase: index * 1.7,
                dragging: false,
                dragOffsetX: 0,
                dragOffsetY: 0,
                lastPointerX: 0,
                lastPointerY: 0,
                lastPointerAt: 0,
            };

            physicsRef.current.set(sticker.id, physics);
            element.style.transform = `translate3d(${physics.x}px, ${physics.y}px, 0) rotate(${physics.rotation}deg)`;
            element.classList.add("is-ready");
        });

        let animationFrame = 0;
        let previousFrame = performance.now();

        const animate = (timestamp: number) => {
            const frameScale = clamp((timestamp - previousFrame) / 16.667, 0.4, 2);
            previousFrame = timestamp;

            if (!document.hidden && !reducedMotionRef.current) {
                stickerDefinitions.forEach((sticker) => {
                    const element = elementRefs.current.get(sticker.id);
                    const physics = physicsRef.current.get(sticker.id);
                    if (!element || !physics || physics.dragging) {
                        return;
                    }

                    const width = element.offsetWidth;
                    const height = element.offsetHeight;
                    if (!width || !height) {
                        return;
                    }

                    if (sticker.mode === "fall") {
                        physics.velocityY += 0.14 * frameScale;
                    } else if (sticker.mode === "drift") {
                        physics.velocityY += 0.035 * frameScale;
                        physics.velocityX +=
                            Math.sin(timestamp / 850 + physics.phase) *
                            0.008 *
                            frameScale;
                    } else {
                        physics.velocityX +=
                            Math.sin(timestamp / 900 + physics.phase) *
                            0.009 *
                            frameScale;
                        physics.velocityY +=
                            Math.cos(timestamp / 760 + physics.phase) *
                            0.008 *
                            frameScale;
                        physics.velocityX *= 0.994;
                        physics.velocityY *= 0.994;
                    }

                    physics.velocityX = clamp(physics.velocityX, -8, 8);
                    physics.velocityY = clamp(physics.velocityY, -10, 12);
                    physics.x += physics.velocityX * frameScale;
                    physics.y += physics.velocityY * frameScale;
                    physics.rotation +=
                        physics.rotationVelocity * frameScale +
                        physics.velocityX * 0.015;

                    const maximumX = Math.max(window.innerWidth - width, 0);
                    const maximumY = Math.max(window.innerHeight - height, 0);

                    if (physics.x <= 0 || physics.x >= maximumX) {
                        physics.x = clamp(physics.x, 0, maximumX);
                        physics.velocityX *= -0.78;
                        physics.rotationVelocity *= -1;
                    }

                    if (physics.y >= maximumY) {
                        physics.y = maximumY;
                        physics.velocityY *= sticker.mode === "fall" ? -0.72 : -0.55;
                        physics.velocityX *= 0.985;
                        if (Math.abs(physics.velocityY) < 0.75) {
                            physics.velocityY = sticker.mode === "fall" ? -4.8 : -1.2;
                        }
                    } else if (physics.y <= 0 && physics.velocityY < 0) {
                        physics.y = 0;
                        physics.velocityY *= -0.7;
                    }

                    element.style.transform = `translate3d(${physics.x}px, ${physics.y}px, 0) rotate(${physics.rotation}deg)`;
                });
            }

            animationFrame = window.requestAnimationFrame(animate);
        };

        animationFrame = window.requestAnimationFrame(animate);

        const keepStickersInViewport = () => {
            stickerDefinitions.forEach((sticker) => {
                const element = elementRefs.current.get(sticker.id);
                const physics = physicsRef.current.get(sticker.id);
                if (!element || !physics) {
                    return;
                }

                physics.x = clamp(
                    physics.x,
                    0,
                    Math.max(window.innerWidth - element.offsetWidth, 0),
                );
                physics.y = clamp(
                    physics.y,
                    0,
                    Math.max(window.innerHeight - element.offsetHeight, 0),
                );
            });
        };

        window.addEventListener("resize", keepStickersInViewport);

        return () => {
            window.cancelAnimationFrame(animationFrame);
            window.removeEventListener("resize", keepStickersInViewport);
        };
    }, [enabled]);

    const startDragging = (
        stickerId: string,
        event: ReactPointerEvent<HTMLButtonElement>,
    ) => {
        const physics = physicsRef.current.get(stickerId);
        if (!physics) {
            return;
        }

        event.currentTarget.setPointerCapture(event.pointerId);
        event.currentTarget.classList.add("is-dragging");
        physics.dragging = true;
        physics.dragOffsetX = event.clientX - physics.x;
        physics.dragOffsetY = event.clientY - physics.y;
        physics.lastPointerX = event.clientX;
        physics.lastPointerY = event.clientY;
        physics.lastPointerAt = event.timeStamp;
        physics.velocityX = 0;
        physics.velocityY = 0;
    };

    const moveSticker = (
        stickerId: string,
        event: ReactPointerEvent<HTMLButtonElement>,
    ) => {
        const physics = physicsRef.current.get(stickerId);
        if (!physics?.dragging) {
            return;
        }

        const now = event.timeStamp;
        const elapsed = Math.max(now - physics.lastPointerAt, 8);
        const maximumX = Math.max(
            window.innerWidth - event.currentTarget.offsetWidth,
            0,
        );
        const maximumY = Math.max(
            window.innerHeight - event.currentTarget.offsetHeight,
            0,
        );

        physics.x = clamp(event.clientX - physics.dragOffsetX, 0, maximumX);
        physics.y = clamp(event.clientY - physics.dragOffsetY, 0, maximumY);
        physics.velocityX = clamp(
            ((event.clientX - physics.lastPointerX) / elapsed) * 16,
            -10,
            10,
        );
        physics.velocityY = clamp(
            ((event.clientY - physics.lastPointerY) / elapsed) * 16,
            -12,
            12,
        );
        physics.rotation += physics.velocityX * 0.18;
        physics.lastPointerX = event.clientX;
        physics.lastPointerY = event.clientY;
        physics.lastPointerAt = now;
        event.currentTarget.style.transform = `translate3d(${physics.x}px, ${physics.y}px, 0) rotate(${physics.rotation}deg) scale(1.08)`;
    };

    const stopDragging = (
        stickerId: string,
        event: ReactPointerEvent<HTMLButtonElement>,
    ) => {
        const physics = physicsRef.current.get(stickerId);
        if (!physics) {
            return;
        }

        physics.dragging = false;
        physics.rotationVelocity = clamp(physics.velocityX * 0.14, -1.2, 1.2);
        event.currentTarget.classList.remove("is-dragging");
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
    };

    const bounceSticker = (stickerId: string) => {
        const physics = physicsRef.current.get(stickerId);
        if (!physics || physics.dragging) {
            return;
        }

        physics.velocityY = -7.5;
        physics.rotationVelocity =
            physics.rotationVelocity > 0 ? -0.8 : 0.8;
    };

    const moveStickerWithKeyboard = (
        stickerId: string,
        event: ReactKeyboardEvent<HTMLButtonElement>,
    ) => {
        const physics = physicsRef.current.get(stickerId);
        if (!physics) {
            return;
        }

        const movementByKey: Record<string, [number, number]> = {
            ArrowLeft: [-18, 0],
            ArrowRight: [18, 0],
            ArrowUp: [0, -18],
            ArrowDown: [0, 18],
        };
        const movement = movementByKey[event.key];

        if (movement) {
            event.preventDefault();
            physics.x = clamp(
                physics.x + movement[0],
                0,
                Math.max(window.innerWidth - event.currentTarget.offsetWidth, 0),
            );
            physics.y = clamp(
                physics.y + movement[1],
                0,
                Math.max(window.innerHeight - event.currentTarget.offsetHeight, 0),
            );
            physics.velocityX = movement[0] * 0.08;
            physics.velocityY = movement[1] * 0.08;
            event.currentTarget.style.transform = `translate3d(${physics.x}px, ${physics.y}px, 0) rotate(${physics.rotation}deg)`;
        }
    };

    const toggleStickers = () => {
        setEnabled((current) => {
            const nextValue = !current;
            window.sessionStorage.setItem(
                stickerStorageKey,
                nextValue ? "on" : "off",
            );
            return nextValue;
        });
    };

    return (
        <>
            <div
                className={`interactive-sticker-layer ${
                    enabled ? "is-enabled" : "is-disabled"
                }`}
                aria-label="Sticker tương tác"
            >
                {enabled
                    ? stickerDefinitions.map((sticker) => (
                          <button
                              className={`interactive-sticker sticker-tone-${sticker.tone} sticker-mode-${sticker.mode}`}
                              key={sticker.id}
                              ref={(element) => {
                                  if (element) {
                                      elementRefs.current.set(
                                          sticker.id,
                                          element,
                                      );
                                  } else {
                                      elementRefs.current.delete(sticker.id);
                                  }
                              }}
                              type="button"
                              aria-label={`Sticker ${sticker.note}. Có thể kéo và ném.`}
                              onClick={() => bounceSticker(sticker.id)}
                              onKeyDown={(event) =>
                                  moveStickerWithKeyboard(sticker.id, event)
                              }
                              onPointerDown={(event) =>
                                  startDragging(sticker.id, event)
                              }
                              onPointerMove={(event) =>
                                  moveSticker(sticker.id, event)
                              }
                              onPointerUp={(event) =>
                                  stopDragging(sticker.id, event)
                              }
                              onPointerCancel={(event) =>
                                  stopDragging(sticker.id, event)
                              }
                          >
                              <strong>{sticker.label}</strong>
                              <small>{sticker.note}</small>
                          </button>
                      ))
                    : null}
            </div>

            <button
                className="sticker-control"
                type="button"
                aria-pressed={enabled}
                onClick={toggleStickers}
            >
                <span aria-hidden="true">{enabled ? "✦" : "○"}</span>
                {enabled ? "STICKERS: ON • KÉO + NÉM" : "STICKERS: OFF"}
            </button>
        </>
    );
}
