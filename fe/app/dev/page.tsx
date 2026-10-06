import type { Metadata } from "next";
import { DevDashboard } from "./dev-dashboard";
import "./dev-dashboard.css";

export const metadata: Metadata = {
    title: "Guest List.dev — Lê Thành Đạt",
    description: "Dashboard local quản lý danh sách khách mời tốt nghiệp.",
};

export default function DevPage() {
    return <DevDashboard />;
}
