"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { getVisitorId, recordPageVisit, reportError } from "./lib/api";

const lastVisitKey = "graduation_last_visit";

export function PageVisitTracker() {
    const pathname = usePathname();

    // Lỗi JavaScript không ai bắt: báo về Telegram để biết khách đang gặp sự cố.
    useEffect(() => {
        const onError = (event: ErrorEvent) => {
            // "Script error." là lỗi từ script bên thứ ba, không có thông tin gì.
            if (event.message && event.message !== "Script error.") {
                reportError("window", event.error ?? event.message);
            }
        };
        const onRejection = (event: PromiseRejectionEvent) => {
            reportError("promise", event.reason);
        };

        window.addEventListener("error", onError);
        window.addEventListener("unhandledrejection", onRejection);

        return () => {
            window.removeEventListener("error", onError);
            window.removeEventListener("unhandledrejection", onRejection);
        };
    }, []);

    useEffect(() => {
        if (!pathname || pathname.startsWith("/dev")) {
            return;
        }

        const now = Date.now();
        const lastVisit = window.sessionStorage.getItem(lastVisitKey);

        if (lastVisit) {
            try {
                const parsed = JSON.parse(lastVisit) as {
                    path?: string;
                    recordedAt?: number;
                };

                if (
                    parsed.path === pathname
                    && typeof parsed.recordedAt === "number"
                    && now - parsed.recordedAt < 30_000
                ) {
                    return;
                }
            } catch {
                window.sessionStorage.removeItem(lastVisitKey);
            }
        }

        window.sessionStorage.setItem(
            lastVisitKey,
            JSON.stringify({ path: pathname, recordedAt: now }),
        );

        void recordPageVisit({
            visitorId: getVisitorId(),
            path: pathname,
            referrer: document.referrer,
        }).catch(() => {
            // Visit tracking must never interrupt the visitor experience.
        });
    }, [pathname]);

    return null;
}
