import type { Metadata } from "next";
import { PhotoDrop } from "./photo-drop";
import "./tha-anh.css";

export const metadata: Metadata = {
    title: "Thư viện ảnh bay bay — Lễ Tốt Nghiệp Lê Thành Đạt",
    description: "Ảnh từ lễ tốt nghiệp của Đạt bay lên cho mọi người cùng xem.",
};

export default function ThaAnhPage() {
    return <PhotoDrop />;
}
