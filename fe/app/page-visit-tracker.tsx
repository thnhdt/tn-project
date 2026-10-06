"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { recordPageVisit } from "./lib/api";

const visitorIdKey = "graduation_visitor_id";
const lastVisitKey = "graduation_last_visit";

function getVisitorId(): string {
    const existingId = window.localStorage.getItem(visitorIdKey);

    if (existingId) {
        return existingId;
    }

    const visitorId = window.crypto.randomUUID();
    window.localStorage.setItem(visitorIdKey, visitorId);
    return visitorId;
}

export function PageVisitTracker() {
    const pathname = usePathname();

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
