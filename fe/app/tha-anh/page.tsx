import type { Metadata } from "next";
import { PhotoDrop } from "./photo-drop";
import "./tha-anh.css";

export const metadata: Metadata = {
    title: "Thả ảnh — Lễ Tốt Nghiệp Lê Thành Đạt",
    description: "Thả con ảnh của bạn dzô đây, ảnh sẽ bay lên cho mọi người cùng xem.",
};

export default function ThaAnhPage() {
    return <PhotoDrop />;
}
