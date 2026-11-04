import type { Metadata } from "next";
import { HomieInvitation } from "./homie-invitation";
import "../homie.css";
import "./love.css";
import "./discord.css";

export const metadata: Metadata = {
    title: "Thiệp dành riêng cho Homie — Lê Thành Đạt",
    description: "Lời mời tốt nghiệp cá nhân từ Lê Thành Đạt.",
};

export default function HomieInvitationPage() {
    return <HomieInvitation />;
}
