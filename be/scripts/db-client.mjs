import { resolve6 } from "node:dns/promises";
import pg from "pg";

export async function createDatabaseClient(connectionString) {
    const connectionUrl = new URL(connectionString);
    let host = connectionUrl.hostname;

    try {
        const addresses = await resolve6(host);
        host = addresses[0] ?? host;
    } catch {
        // Keep the original hostname when an IPv4/dual-stack connection is available.
    }

    return new pg.Client({
        host,
        port: Number(connectionUrl.port || 5432),
        database: connectionUrl.pathname.slice(1),
        user: decodeURIComponent(connectionUrl.username),
        password: decodeURIComponent(connectionUrl.password),
        ssl: {
            rejectUnauthorized: false,
        },
    });
}
