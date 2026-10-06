"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getAdminEmail, listPageVisits, type PageVisit } from "../../lib/admin";
import { errorMessage } from "../../lib/api";

type VisitSummary = {
    total: number;
    today: number;
};

function formatDateTime(value: string) {
    return new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "short",
        timeStyle: "medium",
        timeZone: "Asia/Ho_Chi_Minh",
    }).format(new Date(value));
}

function describeDevice(userAgent: string | null) {
    if (!userAgent) {
        return "Không rõ thiết bị";
    }

    const device = /Android|iPhone|iPad|Mobile/i.test(userAgent)
        ? "Mobile"
        : "Desktop";
    let browser = "Browser";

    if (/Edg\//i.test(userAgent)) {
        browser = "Edge";
    } else if (/Chrome\//i.test(userAgent)) {
        browser = "Chrome";
    } else if (/Firefox\//i.test(userAgent)) {
        browser = "Firefox";
    } else if (/Safari\//i.test(userAgent)) {
        browser = "Safari";
    }

    return `${browser} · ${device}`;
}

function describeReferrer(referrer: string | null) {
    if (!referrer) {
        return "Truy cập trực tiếp";
    }

    try {
        return new URL(referrer).hostname;
    } catch {
        return referrer;
    }
}

export function PageVisitLogs() {
    const router = useRouter();
    const [visits, setVisits] = useState<PageVisit[]>([]);
    const [summary, setSummary] = useState<VisitSummary>({
        total: 0,
        today: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

    const loadVisits = useCallback(async (showLoading = false) => {
        if (showLoading) {
            setLoading(true);
        }

        try {
            if (!(await getAdminEmail())) {
                router.replace("/dev");
                return;
            }

            const result = await listPageVisits(200);
            setVisits(result.visits);
            setSummary(result.summary);
            setUpdatedAt(new Date());
            setError("");
        } catch (loadError) {
            setError(errorMessage(loadError, "Không thể kết nối Supabase."));
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Load protected logs after the client page mounts.
        void loadVisits();
        const interval = window.setInterval(() => {
            void loadVisits();
        }, 15_000);

        return () => window.clearInterval(interval);
    }, [loadVisits]);

    const visibleVisitors = useMemo(
        () => new Set(visits.map((visit) => visit.visitor_id)).size,
        [visits],
    );

    return (
        <main className="dev-shell">
            <aside className="dev-sidebar">
                <Link className="dev-brand" href="/">
                    <span>LD</span>
                    <div>
                        <strong>GRAD CONTROL</strong>
                        <small>visit monitor</small>
                    </div>
                </Link>

                <nav aria-label="Điều hướng dashboard">
                    <Link href="/dev">
                        <span>01</span>
                        Khách mời
                    </Link>
                    <Link className="is-active" href="/dev/logs">
                        <span>02</span>
                        Visit logs
                    </Link>
                    <Link href="/">
                        <span>03</span>
                        Xem theme
                    </Link>
                </nav>

                <div className="dev-sidebar-note">
                    <span>AUTO_REFRESH</span>
                    <p>Danh sách tự cập nhật mỗi 15 giây và không gửi Telegram.</p>
                </div>
            </aside>

            <div className="dev-workspace">
                <header className="dev-header">
                    <div>
                        <p>VISIT_LOGS.DEV</p>
                        <h1>Log truy cập</h1>
                        <span>
                            Ghi nhận lượt mở trang frontend, không lưu địa chỉ IP.
                        </span>
                    </div>
                    <div className="dev-header-actions">
                        <span>
                            {updatedAt
                                ? `Cập nhật ${formatDateTime(updatedAt.toISOString())}`
                                : "Đang đồng bộ..."}
                        </span>
                        <button
                            type="button"
                            disabled={loading}
                            onClick={() => void loadVisits(true)}
                        >
                            {loading ? "ĐANG TẢI..." : "REFRESH ↻"}
                        </button>
                    </div>
                </header>

                <section className="dev-stats" aria-label="Thống kê truy cập">
                    <article>
                        <small>TỔNG LƯỢT TRUY CẬP</small>
                        <strong>{summary.total}</strong>
                        <span>toàn bộ thời gian</span>
                    </article>
                    <article>
                        <small>HÔM NAY</small>
                        <strong>{summary.today}</strong>
                        <span>theo giờ Việt Nam</span>
                    </article>
                    <article>
                        <small>VISITOR GẦN ĐÂY</small>
                        <strong>{visibleVisitors}</strong>
                        <span>trong 200 log mới nhất</span>
                    </article>
                </section>

                <section className="visit-log-panel">
                    <div className="dev-list-heading">
                        <div>
                            <span>RECENT_ACTIVITY</span>
                            <h2>200 lượt gần nhất</h2>
                        </div>
                        <small>LIVE · 15S</small>
                    </div>

                    {error ? (
                        <p className="dev-feedback is-error" role="alert">
                            {error}
                        </p>
                    ) : null}

                    {loading && visits.length === 0 ? (
                        <div className="dev-empty">
                            <strong>Đang tải log...</strong>
                            <span>supabase.query(page_visits)</span>
                        </div>
                    ) : visits.length === 0 ? (
                        <div className="dev-empty">
                            <strong>Chưa có lượt truy cập.</strong>
                            <span>Mở một trang ngoài /dev để tạo log đầu tiên.</span>
                        </div>
                    ) : (
                        <div className="visit-log-list">
                            {visits.map((visit) => (
                                <article key={visit.id}>
                                    <time dateTime={visit.created_at}>
                                        {formatDateTime(visit.created_at)}
                                    </time>
                                    <div>
                                        <strong>{visit.path}</strong>
                                        <span>{describeReferrer(visit.referrer)}</span>
                                    </div>
                                    <div>
                                        <strong>
                                            {describeDevice(visit.user_agent)}
                                        </strong>
                                        <span>
                                            VISITOR {visit.visitor_id.slice(0, 8)}
                                        </span>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
