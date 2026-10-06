// Webhook của Telegram bot, thay cho tiến trình monitor chạy nền.
//   /check — kiểm tra website (SITE_URL) còn phản hồi không
//   /using — tổng hợp lượt truy cập 12 giờ qua từ bảng page_visits
// Chỉ trả lời tin nhắn từ đúng CHAT_ID và request có đúng secret của webhook.

import { createClient } from "npm:@supabase/supabase-js@2";

type TelegramUpdate = {
    message?: {
        text?: string;
        chat: { id: number };
    };
};

type Visit = {
    visitor_id: string;
    path: string;
    created_at: string;
};

const usageHours = 12;

function requireEnv(name: string) {
    const value = Deno.env.get(name)?.trim();
    if (!value) {
        throw new Error(`Thiếu secret ${name}.`);
    }

    return value;
}

function vietnameseTime(date: Date, options: Intl.DateTimeFormatOptions = {}) {
    return date.toLocaleString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        ...options,
    });
}

function readCommand(text: string) {
    const firstPart = text.trim().split(/\s+/, 1)[0]?.toLowerCase() ?? "";

    return firstPart.split("@", 1)[0] ?? "";
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

async function checkWebsite() {
    const url = requireEnv("SITE_URL");
    const startedAt = Date.now();
    let reason = "";

    try {
        const response = await fetch(url, {
            headers: { "User-Agent": "graduation-uptime-monitor/1.0" },
            redirect: "follow",
            signal: AbortSignal.timeout(10_000),
        });
        await response.body?.cancel();
        reason = response.ok ? "" : `HTTP ${response.status}`;
    } catch (error) {
        reason = error instanceof Error ? error.message : String(error);
    }

    return [
        reason ? "🔴 Website đang gặp sự cố" : "🟢 Website đang hoạt động",
        `URL: ${url}`,
        reason ? `Lỗi: ${reason}` : `Phản hồi: ${Date.now() - startedAt} ms`,
        `Thời gian: ${vietnameseTime(new Date())}`,
    ].join("\n");
}

async function usageSummary() {
    const supabase = createClient(
        requireEnv("SUPABASE_URL"),
        requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
        { auth: { autoRefreshToken: false, persistSession: false } },
    );
    const since = new Date(Date.now() - usageHours * 60 * 60 * 1_000);
    const { data, error, count } = await supabase
        .from("page_visits")
        .select("visitor_id, path, created_at", { count: "exact" })
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: false })
        .limit(1_000);

    if (error) {
        throw new Error(error.message);
    }

    const visits = (data ?? []) as Visit[];
    const totalVisits = count ?? visits.length;
    const visitsByPath = new Map<string, number>();
    for (const visit of visits) {
        visitsByPath.set(visit.path, (visitsByPath.get(visit.path) ?? 0) + 1);
    }

    const topPathLines = [...visitsByPath]
        .sort((left, right) => right[1] - left[1])
        .slice(0, 5)
        .map(([path, pathVisits], index) => `${index + 1}. ${path} — ${pathVisits} lượt`);
    const recentVisitLines = visits.slice(0, 5).map((visit) =>
        [
            `• ${vietnameseTime(new Date(visit.created_at), { hour: "2-digit", minute: "2-digit" })}`,
            visit.path,
            `#${visit.visitor_id.slice(0, 8)}`,
        ].join(" · ")
    );
    const sampleNote = totalVisits > visits.length
        ? `\nVisitor được tính trên ${visits.length} log mới nhất.`
        : "";

    return [
        `📊 Truy cập trong ${usageHours} giờ qua`,
        `Tổng lượt: ${totalVisits}`,
        `Visitor ẩn danh: ${new Set(visits.map((visit) => visit.visitor_id)).size}${sampleNote}`,
        "",
        "Route phổ biến:",
        ...(topPathLines.length > 0 ? topPathLines : ["Chưa có dữ liệu."]),
        "",
        "Lượt mới nhất:",
        ...(recentVisitLines.length > 0 ? recentVisitLines : ["Chưa có lượt truy cập."]),
    ].join("\n");
}

Deno.serve(async (request) => {
    if (
        request.method !== "POST" ||
        request.headers.get("x-telegram-bot-api-secret-token") !==
            Deno.env.get("TELEGRAM_WEBHOOK_SECRET") ||
        !Deno.env.get("TELEGRAM_WEBHOOK_SECRET")
    ) {
        return new Response("Unauthorized", { status: 401 });
    }

    // Luôn trả 200 cho Telegram, nếu không Telegram sẽ gửi lại cùng một update.
    try {
        const update = await request.json() as TelegramUpdate;
        const message = update.message;
        if (!message?.text || String(message.chat.id) !== requireEnv("CHAT_ID")) {
            return new Response("ok");
        }

        const command = readCommand(message.text);
        if (!["/check", "/using", "/start", "/help"].includes(command)) {
            return new Response("ok");
        }

        try {
            if (command === "/check") {
                await sendMessage(await checkWebsite());
            } else if (command === "/using") {
                await sendMessage(await usageSummary());
            } else {
                await sendMessage(
                    [
                        "🤖 Graduation bot",
                        "/check — kiểm tra website ngay",
                        `/using — xem lượt truy cập ${usageHours} giờ qua`,
                    ].join("\n"),
                );
            }
        } catch (error) {
            const reason = error instanceof Error ? error.message : String(error);
            await sendMessage(`⚠️ Không thể thực hiện ${command}: ${reason}`);
        }
    } catch (error) {
        console.error(error);
    }

    return new Response("ok");
});
