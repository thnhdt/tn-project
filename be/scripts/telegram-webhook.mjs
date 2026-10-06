import dotenv from "dotenv";
import { resolve } from "node:path";

dotenv.config({
    path: resolve(process.cwd(), "../.env.local"),
});

for (const name of ["TELE_BOT_TOKEN", "SUPABASE_URL", "TELEGRAM_WEBHOOK_SECRET"]) {
    if (!process.env[name]) {
        throw new Error(`${name} is required.`);
    }
}

async function callTelegram(method, body) {
    const response = await fetch(
        `https://api.telegram.org/bot${process.env.TELE_BOT_TOKEN}/${method}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        },
    );
    const result = await response.json().catch(() => ({}));

    if (!response.ok || result.ok !== true) {
        throw new Error(
            `Telegram API ${method} thất bại: ${result.description ?? `HTTP ${response.status}`}`,
        );
    }
}

const webhookUrl = `${process.env.SUPABASE_URL}/functions/v1/telegram-bot`;

await callTelegram("setWebhook", {
    url: webhookUrl,
    secret_token: process.env.TELEGRAM_WEBHOOK_SECRET,
    allowed_updates: ["message"],
});
await callTelegram("setMyCommands", {
    commands: [
        {
            command: "check",
            description: "Kiểm tra website còn hoạt động không",
        },
        {
            command: "using",
            description: "Xem lượt truy cập trong 12 giờ qua",
        },
    ],
});

console.log(`Đã trỏ webhook Telegram về ${webhookUrl}.`);
