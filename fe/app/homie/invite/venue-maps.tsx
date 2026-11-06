import {
    campusMapUrl,
    ceremonyAddress,
    ceremonyGates,
    ceremonyLocation,
    gateEmbedUrl,
} from "../../lib/ceremony";

/** Sơ đồ trường ở giữa, bản đồ Cổng 1 và Cổng 3 ở hai bên (xếp chồng trên điện thoại). */
export function VenueMaps() {
    const [leftGate, rightGate] = ceremonyGates;

    return (
        <section className="invite-venue" aria-label="Bản đồ đường tới buổi lễ">
            <div className="invite-venue-title">
                <small>📍 ĐƯỜNG TỚI {ceremonyLocation.toLocaleUpperCase("vi")}</small>
                <strong>{ceremonyAddress}</strong>
            </div>

            <div className="invite-venue-grid">
                {leftGate ? <GateMap gate={leftGate} side="left" /> : null}

                <figure className="invite-campus">
                    <div className="invite-campus-frame">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={campusMapUrl}
                            alt="Sơ đồ khuôn viên Trường Đại học Bách khoa TP.HCM"
                            loading="lazy"
                        />
                        <span className="invite-campus-pin is-hall">{ceremonyLocation} ở đây 🎓</span>
                        <span className="invite-campus-pin is-gate-1">{leftGate?.name}</span>
                        <span className="invite-campus-pin is-gate-3">{rightGate?.name}</span>
                    </div>
                    <figcaption>
                        Vào {leftGate?.name} hoặc {rightGate?.name}, đi theo hướng {ceremonyLocation} là thấy Đạt
                    </figcaption>
                </figure>

                {rightGate ? <GateMap gate={rightGate} side="right" /> : null}
            </div>
        </section>
    );
}

function GateMap({ gate, side }: { gate: (typeof ceremonyGates)[number]; side: "left" | "right" }) {
    return (
        <div className={`invite-gate is-${side}`}>
            <div className="invite-gate-label">
                <strong>{gate.name}</strong>
                <span>{gate.note}</span>
            </div>
            <iframe
                src={gateEmbedUrl(gate)}
                title={`Bản đồ ${gate.name}`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
            />
            <a href={gate.mapUrl} target="_blank" rel="noreferrer">
                CHỈ ĐƯỜNG TỚI {gate.name.toLocaleUpperCase("vi")} ↗
            </a>
        </div>
    );
}
