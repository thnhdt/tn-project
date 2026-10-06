import type { Metadata } from "next";
import { QrGate } from "./qr-gate";
import "./homie.css";

export const metadata: Metadata = {
    title: "Homie Check-in — Lễ Tốt Nghiệp Lê Thành Đạt",
    description: "Quét QR trên thiệp để mở lời mời tốt nghiệp dành riêng cho bạn.",
};

export default function HomiePage() {
    return <QrGate />;
}
