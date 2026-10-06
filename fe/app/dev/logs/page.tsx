import type { Metadata } from "next";
import { PageVisitLogs } from "./page-visit-logs";
import "../dev-dashboard.css";
import "./page-visit-logs.css";

export const metadata: Metadata = {
    title: "Visit Logs.dev — Lê Thành Đạt",
    description: "Log lượt truy cập frontend dành cho quản trị viên.",
};

export default function PageVisitLogsPage() {
    return <PageVisitLogs />;
}
