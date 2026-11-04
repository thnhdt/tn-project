import dotenv from "dotenv";
import { randomBytes } from "node:crypto";
import { resolve } from "node:path";
import { createDatabaseClient } from "./db-client.mjs";

dotenv.config({ path: resolve(import.meta.dirname, "../../.env.local"), quiet: true });
if (!process.env.CONNECTION_STRING) throw new Error("CONNECTION_STRING is required.");

const guests = [
    ["Bé Thịnh", "_brnie", "anh yêu emmmmm", "love", "vkiubebongcuaanh"],
    ["Cu tí Trịnh", "txcdck_", "hí ku tí", "discord"],
    ["Cu Khánh", "kilnn9_", undefined, "discord"],
    ["Cu Phương", "_suns.ng_", undefined, "discord"],
    ["Thu Hoài", "ntt.hoainotfound", undefined, "discord"],
    ["Đăng Khoa", "khoa.nnguyennn", undefined, "discord"],
    ["Đức Anh", "anhdavidnguyenduc", undefined, "discord"],
    ["Nhân Trí + Thị Hoài", "nhantricaonguyen", undefined, "discord"],
    ["Đức Trọng", "gnort08.12", undefined, "discord"],
    ["Đa Phước", "daphuoc_1201", undefined, "discord"],
    ["Quốc Thiện", "nhqt_601", undefined, "discord"],
    ["Nhật Huy", "erwhuy"],
    ["Đức Xuân", "_dduwcsxuaann_"],
    ["Minh Châu", "meetmy.butter"],
    ["Giang", "chl.strwari"],
    ["Bảo Trung", "beotrunk"],
    ["Đức Duy", "tdduy_23"],
];
const eventId = "13d50d47-e8e4-4fef-9fd7-e10c74f18716";
const client = await createDatabaseClient(process.env.CONNECTION_STRING);
await client.connect();
try {
    await client.query("BEGIN");
    const event = await client.query("SELECT id FROM events WHERE id = $1", [eventId]);
    if (!event.rowCount) throw new Error("Graduation event not found; seed aborted.");
    for (const [name, handle, message, theme = "desktop", qrCode] of guests) {
        await client.query(`
            INSERT INTO invitations (
                event_id, token, display_name, instagram_handle,
                personal_message, theme_variant, qr_code, is_test
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, true)
            ON CONFLICT (instagram_handle) WHERE instagram_handle IS NOT NULL
            DO UPDATE SET
                display_name = EXCLUDED.display_name,
                personal_message = EXCLUDED.personal_message,
                theme_variant = EXCLUDED.theme_variant
        `, [
            eventId, randomBytes(24).toString("hex"), name, `@${handle}`,
            message ?? "Mời bạn đến dự lễ tốt nghiệp của mình nhé!",
            theme, qrCode ?? randomBytes(16).toString("hex"),
        ]);
        if (qrCode) {
            await client.query("UPDATE invitations SET qr_code = $1 WHERE instagram_handle = $2", [qrCode, `@${handle}`]);
        }
    }
    const { rows } = await client.query(`
        SELECT display_name, instagram_handle, theme_variant,
            CASE WHEN instagram_handle = '@_brnie' THEN qr_code = 'vkiubebongcuaanh' ELSE true END AS qr_ok
        FROM invitations WHERE instagram_handle = ANY($1::text[])
        ORDER BY created_at, display_name
    `, [guests.map((guest) => `@${guest[1]}`)]);
    if (rows.length !== guests.length || rows.some((row) => !row.qr_ok)) {
        throw new Error("Guest verification failed; seed aborted.");
    }
    await client.query("COMMIT");
    console.table(rows);
    console.log(`Seeded and verified ${rows.length} guests (new rows marked is_test=true).`);
} catch (error) {
    await client.query("ROLLBACK");
    console.error(error.message);
    process.exitCode = 1;
} finally {
    await client.end();
}
