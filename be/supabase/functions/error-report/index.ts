// Webhook công khai: trình duyệt của khách gọi vào đây khi gặp lỗi, function
// ghi lỗi vào bảng client_errors rồi báo cho quản trị viên qua Telegram.
//   POST /error-report  { visitorId, path, source, message }
// Vì ai cũng gọi được nên có giới hạn tần suất, để bot không bị spam.

import { createClient } from "npm:@supabase/supabase-js@2";

type ErrorReport = {
    visitorId: string;
    path: string;
    source: string;
    message: string;
};

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type",
};
const limits = {
    windowMinutes: 10,
    /** Số lỗi tối đa của một visitor trong một cửa sổ. */
    perVisitor: 5,
    /** Số tin Telegram tối đa của cả website trong một cửa sổ. */
    total: 20,
};

function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
    });
}

function requireEnv(name: string) {
    const value = Deno.env.get(name)?.trim();
    if (!value) {
        throw new Error(`Thiếu secret ${name}.`);
    }

    return value;
}

function readReport(body: unknown): ErrorReport | null {
    if (typeof body !== "object" || body === null) {
        return null;
    }

    const { visitorId, path, source, message } = body as Record<string, unknown>;
    if (
        typeof visitorId !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(visitorId) ||
        typeof path !== "string" ||
        !path.startsWith("/") ||
        path.length > 500 ||
        typeof source !== "string" ||
        !/^[a-z0-9-]{1,40}$/.test(source) ||
        typeof message !== "string" ||
        message.trim().length === 0
    ) {
        return null;
    }

    return { visitorId, path, source, message: message.trim().slice(0, 500) };
}

function describeDevice(userAgent: string | null) {
    if (!userAgent) {
        return "Không rõ thiết bị";
    }

    const device = /Android|iPhone|iPad|Mobile/i.test(userAgent) ? "Mobile" : "Desktop";
    const browser = /Edg\//i.test(userAgent)
        ? "Edge"
        : /Chrome\//i.test(userAgent)
        ? "Chrome"
        : /Firefox\//i.test(userAgent)
        ? "Firefox"
        : /Safari\//i.test(userAgent)
        ? "Safari"
        : "Browser";

    return `${browser} · ${device}`;
}

async function sendMessage(text: string) {
    const response = await fetch(
        `https://api.telegram.org/bot${requireEnv("TELE_BOT_TOKEN")}/sendMessage`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: requireEnv("CHAT_ID"), text }),
        },
    );

    if (!response.ok) {
        throw new Error(`Telegram API sendMessage thất bại: HTTP ${response.status}`);
    }
}

Deno.serve(async (request) => {
    if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== "POST") {
        return json({ message: "Phương thức không được hỗ trợ." }, 405);
    }

    const report = readReport(await request.json().catch(() => null));
    if (!report) {
        return json({ message: "Dữ liệu lỗi không hợp lệ." }, 400);
    }

    try {
        const supabase = createClient(
            requireEnv("SUPABASE_URL"),
            requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
            { auth: { autoRefreshToken: false, persistSession: false } },
        );
        const since = new Date(Date.now() - limits.windowMinutes * 60_000).toISOString();
        const { data: recent, error: recentError } = await supabase
            .from("client_errors")
            .select("visitor_id, message")
            .gte("created_at", since)
            .limit(limits.total);
        if (recentError) {
            throw new Error(recentError.message);
        }

        const fromVisitor = recent.filter((row) => row.visitor_id === report.visitorId);
        if (
            recent.length >= limits.total ||
            fromVisitor.length >= limits.perVisitor ||
            fromVisitor.some((row) => row.message === report.message)
        ) {
            return json({ data: { reported: false } }, 202);
        }

        const userAgent = request.headers.get("user-agent")?.slice(0, 1_000) ?? null;
        const { error: insertError } = await supabase.from("client_errors").insert({
            visitor_id: report.visitorId,
            path: report.path,
            source: report.source,
            message: report.message,
            user_agent: userAgent,
        });
        if (insertError) {
            throw new Error(insertError.message);
        }

        await sendMessage(
            [
                "⚠️ Khách gặp lỗi trên website",
                `Trang: ${report.path}`,
                `Nguồn: ${report.source}`,
                `Lỗi: ${report.message}`,
                `Thiết bị: ${describeDevice(userAgent)}`,
                `Visitor: #${report.visitorId.slice(0, 8)}`,
                `Thời gian: ${new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}`,
            ].join("\n"),
        );

        return json({ data: { reported: true } });
    } catch (error) {
        console.error(error);

        return json({ message: "Chưa thể ghi nhận lỗi." }, 500);
    }
});
