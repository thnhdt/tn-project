import dotenv from "dotenv";
import { resolve } from "node:path";
import { createDatabaseClient } from "./db-client.mjs";

dotenv.config({
    path: resolve(process.cwd(), "../.env.local"),
});

if (!process.env.CONNECTION_STRING) {
    throw new Error("CONNECTION_STRING is required.");
}

if (!process.env.ADMIN_EMAIL) {
    throw new Error("ADMIN_EMAIL is required.");
}

const client = await createDatabaseClient(process.env.CONNECTION_STRING);

await client.connect();

try {
    const { rowCount } = await client.query(
        `
            INSERT INTO admins (user_id)
            SELECT id
            FROM auth.users
            WHERE lower(email) = lower($1)
            ON CONFLICT (user_id) DO NOTHING
            RETURNING user_id
        `,
        [process.env.ADMIN_EMAIL],
    );
    const { rows } = await client.query(
        `
            SELECT 1
            FROM admins
            JOIN auth.users ON auth.users.id = admins.user_id
            WHERE lower(auth.users.email) = lower($1)
        `,
        [process.env.ADMIN_EMAIL],
    );

    if (rows.length === 0) {
        throw new Error(
            `Chưa có user Supabase Auth với email ${process.env.ADMIN_EMAIL}. Hãy tạo user này trong Supabase Dashboard → Authentication rồi chạy lại.`,
        );
    }

    console.log(
        rowCount
            ? `Đã cấp quyền quản trị cho ${process.env.ADMIN_EMAIL}.`
            : `${process.env.ADMIN_EMAIL} đã là quản trị viên.`,
    );
} finally {
    await client.end();
}
