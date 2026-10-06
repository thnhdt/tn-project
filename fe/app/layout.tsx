import type { Metadata } from "next";
import {
    Be_Vietnam_Pro,
    Roboto_Mono,
    Shantell_Sans,
} from "next/font/google";
import { PageVisitTracker } from "./page-visit-tracker";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
    variable: "--font-be-vietnam",
    subsets: ["latin", "vietnamese"],
    weight: ["400", "500", "600", "700", "800", "900"],
});

const robotoMono = Roboto_Mono({
    variable: "--font-roboto-mono",
    subsets: ["latin", "vietnamese"],
    weight: ["400", "500", "600", "700"],
});

const shantellSans = Shantell_Sans({
    variable: "--font-doodle",
    subsets: ["latin", "vietnamese"],
    weight: "variable",
});

export const metadata: Metadata = {
    title: "Lễ Tốt Nghiệp — Lê Thành Đạt",
    description:
        "Theme preview cho trang mời tốt nghiệp của Lê Thành Đạt, Cử nhân Khoa học Máy tính.",
    icons: {
        icon: "/favicon.svg",
        shortcut: "/favicon.svg",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="vi">
            <body
                className={`${beVietnamPro.variable} ${robotoMono.variable} ${shantellSans.variable}`}
            >
                <PageVisitTracker />
                {children}
            </body>
        </html>
    );
}
