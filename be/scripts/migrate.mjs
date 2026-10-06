import dotenv from "dotenv";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { createDatabaseClient } from "./db-client.mjs";

dotenv.config({
    path: resolve(process.cwd(), "../.env.local"),
});

if (!process.env.CONNECTION_STRING) {
    throw new Error("CONNECTION_STRING is required.");
}

const migrationsDirectory = resolve(process.cwd(), "supabase/migrations");
const migrationFiles = (await readdir(migrationsDirectory))
    .filter((fileName) => fileName.endsWith(".sql"))
    .sort();
const client = await createDatabaseClient(process.env.CONNECTION_STRING);

await client.connect();

try {
    for (const migrationFile of migrationFiles) {
        const sql = await readFile(
            resolve(migrationsDirectory, migrationFile),
            "utf8",
        );
        await client.query(sql);
        console.log(`Applied ${migrationFile}.`);
    }
} finally {
    await client.end();
}
