import dotenv from "dotenv";
import { resolve } from "node:path";
import { createDatabaseClient } from "./db-client.mjs";

dotenv.config({
    path: resolve(process.cwd(), "../.env.local"),
});

if (!process.env.CONNECTION_STRING) {
    throw new Error("CONNECTION_STRING is required.");
}

const eventId = "13d50d47-e8e4-4fef-9fd7-e10c74f18716";
const invitations = [
    {
        token: "demo-minh-blue-screen-2026",
        displayName: "Minh",
        instagramHandle: "@minh.dev",
        qrCode: "d0000000000000000000000000000001",
        message: "Cảm ơn Minh vì đã cùng mình debug cả code lẫn cuộc đời sinh viên.",
        theme: "desktop",
    },
    {
        token: "demo-lan-notebook-2026",
        displayName: "Lan",
        instagramHandle: "@lan.codes",
        qrCode: "d0000000000000000000000000000002",
        message: "Cảm ơn Lan vì đã làm những ngày ở Bách khoa trở nên nhiều màu sắc hơn.",
        theme: "notebook",
    },
    {
        token: "demo-quang-compiler-2026",
        displayName: "Quang",
        instagramHandle: "@quang.compiler",
        qrCode: "d0000000000000000000000000000003",
        message: "Từ deadline đến lễ tốt nghiệp — cuối cùng build của chúng ta cũng xanh.",
        theme: "compiler",
    },
    {
        token: "demo-tram-notebook-2026",
        displayName: "Trâm",
        instagramHandle: "@tram.jpeg",
        qrCode: "d0000000000000000000000000000004",
        message: "Mong Trâm có mặt để cùng mình lưu lại một chiếc ảnh thật đáng nhớ nhé!",
        theme: "notebook",
    },
    {
        token: "demo-team-cs-2026",
        displayName: "Team Compiler",
        instagramHandle: "@team.compiler",
        qrCode: "d0000000000000000000000000000005",
        message: "Gửi những con người đã góp commit vào repository thanh xuân của Đạt.",
        theme: "desktop",
    },
];

const client = await createDatabaseClient(process.env.CONNECTION_STRING);

await client.connect();

try {
    await client.query("BEGIN");
    await client.query(
        `
            INSERT INTO events (
                id,
                graduate_name,
                degree,
                university,
                event_title,
                language,
                music_enabled
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (id)
            DO UPDATE SET
                graduate_name = EXCLUDED.graduate_name,
                degree = EXCLUDED.degree,
                university = EXCLUDED.university,
                event_title = EXCLUDED.event_title,
                language = EXCLUDED.language,
                music_enabled = EXCLUDED.music_enabled
        `,
        [
            eventId,
            "Lê Thành Đạt",
            "Cử nhân Khoa học Máy tính",
            "Trường Đại học Bách khoa - Đại học Quốc gia TP.HCM",
            "Lễ Tốt Nghiệp",
            "vi",
            true,
        ],
    );

    for (const invitation of invitations) {
        await client.query(
            `
                INSERT INTO invitations (
                    event_id,
                    token,
                    display_name,
                    instagram_handle,
                    qr_code,
                    personal_message,
                    theme_variant,
                    is_test
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, true)
                ON CONFLICT (token)
                DO UPDATE SET
                    display_name = EXCLUDED.display_name,
                    instagram_handle = EXCLUDED.instagram_handle,
                    qr_code = EXCLUDED.qr_code,
                    personal_message = EXCLUDED.personal_message,
                    theme_variant = EXCLUDED.theme_variant,
                    is_test = true
            `,
            [
                eventId,
                invitation.token,
                invitation.displayName,
                invitation.instagramHandle,
                invitation.qrCode,
                invitation.message,
                invitation.theme,
            ],
        );
    }

    await client.query("COMMIT");
    console.log(`Seeded ${invitations.length} test invitations.`);
} catch (error) {
    await client.query("ROLLBACK");
    throw error;
} finally {
    await client.end();
}
