import dotenv from "dotenv";
import { readFile } from "node:fs/promises";
import { createDatabaseClient } from "./db-client.mjs";

dotenv.config({ path: new URL("../../.env.local", import.meta.url).pathname, quiet: true });
const handles = [
    "@_suns.ng_", "@txcdck_", "@kilnn9_", "@ntt.hoainotfound", "@khoa.nnguyennn",
    "@anhdavidnguyenduc", "@nhantricaonguyen", "@gnort08.12", "@daphuoc_1201", "@nhqt_601",
];
const client = await createDatabaseClient(process.env.CONNECTION_STRING);
await client.connect();
try {
    await client.query("BEGIN");
    const found = await client.query("SELECT display_name, instagram_handle FROM invitations WHERE instagram_handle = ANY($1::text[]) FOR UPDATE", [handles]);
    if (found.rowCount !== handles.length) throw new Error("Expected exactly 10 matching guests; no changes applied.");
    await client.query(await readFile(new URL("../supabase/migrations/012_discord_theme.sql", import.meta.url), "utf8"));
    const result = await client.query("UPDATE invitations SET theme_variant = 'discord' WHERE instagram_handle = ANY($1::text[]) RETURNING display_name, instagram_handle, theme_variant", [handles]);
    await client.query("COMMIT");
    console.table(result.rows);
} catch (error) {
    await client.query("ROLLBACK");
    console.error(error.message);
    process.exitCode = 1;
} finally {
    await client.end();
}
