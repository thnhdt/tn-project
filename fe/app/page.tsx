import type { Metadata } from "next";
import { HomePage } from "./home/home-page";

export const metadata: Metadata = {
    title: "Blue Notebook — Lễ Tốt Nghiệp Lê Thành Đạt",
    description:
        "Thiệp tốt nghiệp phong cách Blue Notebook, sketchnote và computer-inspired của Lê Thành Đạt.",
};

export default function Home() {
    return <HomePage />;
}
