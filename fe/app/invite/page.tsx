import type { Metadata } from "next";
import { HomieInvitation } from "../homie/invite/homie-invitation";
import { PublicInviteShare } from "./public-invite-share";
import "../homie/homie.css";
import "../homie/invite/grad.css";

export const metadata: Metadata = {
    title: "Thân mời dự lễ tốt nghiệp — Lê Thành Đạt",
    description: "Thiệp mời chung: thời gian, địa điểm và lời mời đến lễ tốt nghiệp của Đạt.",
};

export default function PublicInvitePage() {
    return (
        <>
            <HomieInvitation publicInvitation />
            <PublicInviteShare />
        </>
    );
}
