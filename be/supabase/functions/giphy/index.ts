// Edge Function công khai: giữ GIPHY_API_KEY ở phía Supabase.
//   GET /giphy/list?tag=...        → { data: Gif[] } khoảng 50 GIF của chủ đề (tag rỗng = trending)
//   GET /giphy/trending?offset=0   → { data: Gif } (giữ cho bản giao diện cũ)
//   GET /giphy/search?tag=&offset= → { data: Gif } (giữ cho bản giao diện cũ)
//   GET /giphy/random?tag=...      → { data: Gif } (giữ cho bản giao diện cũ)
//   GET /giphy/<id>/download?src=  → file GIF đính kèm
//
// Key beta của GIPHY chỉ cho 100 lần gọi mỗi giờ, nên mọi danh sách GIF đều được
// cache: trong bộ nhớ của function, rồi tới bảng `giphy_cache` (sống qua các lần
// khởi động lại). Chỉ khi cache cũ quá `freshForMs` mới gọi GIPHY, và tổng số lần
// gọi mỗi giờ bị chặn ở `upstreamPerHourPerKey` × số key. Gọi không được thì trả danh sách cũ.
//
// Key: đặt nhiều key cách nhau dấu phẩy trong secret GIPHY_API_KEYS (vẫn đọc
// GIPHY_API_KEY cũ, nên có thể luân phiên cả key cũ lẫn key mới). Mỗi lần gọi chọn
// ngẫu nhiên một key; key nào bị GIPHY trả 429 (hết lượt) hoặc 401/403 (sai, bị
// thu hồi) thì nghỉ 1 giờ và thử ngay key khác.

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

type GiphyGif = {
    id: string;
    title?: string;
    alt_text?: string;
    images: {
        original: { url: string };
        fixed_height?: { url: string };
        downsized?: { url: string };
    };
};

type Gif = {
    id: string;
    title: string;
    altText: string;
    previewUrl: string;
    downloadUrl: string;
};

type Pool = { gifs: Gif[]; fetchedAt: number };

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type",
};
const maxGifBytes = 15 * 1024 * 1024;
/** Danh sách GIF còn "mới" trong 12 giờ; quá hạn mới gọi GIPHY lấy lại. */
const freshForMs = 12 * 60 * 60 * 1000;
/** Mỗi key beta được 100 lần/giờ; chừa 40 lần mỗi key cho dev và các lần tải GIF thiếu link. */
const upstreamPerHourPerKey = 60;
/** Key bị GIPHY trả 429/401/403 thì cho nghỉ 1 giờ. */
const keyCooldownMs = 60 * 60 * 1000;
const poolSize = 50;

class RateLimitedError extends Error {}

const memoryPools = new Map<string, Pool>();
/** Dự phòng khi không đếm được trong database (ví dụ chạy local thiếu service role). */
const memoryCalls: number[] = [];
/** Key → thời điểm hết nghỉ (chỉ trong bộ nhớ của function). */
const coolingKeys = new Map<string, number>();

function readApiKeys() {
    const values = [
        ...(Deno.env.get("GIPHY_API_KEYS") ?? "").split(","),
        Deno.env.get("GIPHY_API_KEY") ?? "",
    ];
    return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function upstreamPerHour() {
    return upstreamPerHourPerKey * Math.max(readApiKeys().length, 1);
}

/** Các key đang dùng được, xếp ngẫu nhiên để chia đều lượt gọi. */
function availableKeys() {
    const now = Date.now();
    const keys = readApiKeys().filter((key) => (coolingKeys.get(key) ?? 0) <= now);
    for (let index = keys.length - 1; index > 0; index -= 1) {
        const other = Math.floor(Math.random() * (index + 1));
        [keys[index], keys[other]] = [keys[other], keys[index]];
    }
    return keys;
}

function json(body: unknown, status = 200, cacheSeconds = 0) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            ...corsHeaders,
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": cacheSeconds > 0 ? `public, max-age=${cacheSeconds}` : "no-store",
        },
    });
}

let database: SupabaseClient | null | undefined;

function getDatabase() {
    if (database === undefined) {
        const url = Deno.env.get("SUPABASE_URL")?.trim();
        const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
        database = url && key
            ? createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
            : null;
    }

    return database;
}

/** Ghi nhận một lần gọi GIPHY; ném RateLimitedError nếu đã chạm giới hạn giờ này. */
async function takeUpstreamCall() {
    const hourAgo = Date.now() - 60 * 60 * 1000;
    const db = getDatabase();

    if (db) {
        const { count, error } = await db
            .from("giphy_upstream_calls")
            .select("id", { count: "exact", head: true })
            .gte("created_at", new Date(hourAgo).toISOString());
        if (!error) {
            if ((count ?? 0) >= upstreamPerHour()) {
                throw new RateLimitedError("Đã chạm giới hạn gọi GIPHY trong giờ này.");
            }
            await db.from("giphy_upstream_calls").insert({});
            // Dọn bớt dòng cũ cho bảng khỏi phình.
            await db
                .from("giphy_upstream_calls")
                .delete()
                .lt("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
            return;
        }
        console.error("Không đếm được lượt gọi GIPHY:", error.message);
    }

    while (memoryCalls.length > 0 && memoryCalls[0] < hourAgo) {
        memoryCalls.shift();
    }
    if (memoryCalls.length >= upstreamPerHour()) {
        throw new RateLimitedError("Đã chạm giới hạn gọi GIPHY trong giờ này.");
    }
    memoryCalls.push(Date.now());
}

async function callGiphy(path: string, params: Record<string, string> = {}) {
    if (readApiKeys().length === 0) {
        throw new Error("Thiếu secret GIPHY_API_KEYS (hoặc GIPHY_API_KEY).");
    }

    const keys = availableKeys();
    if (keys.length === 0) {
        throw new RateLimitedError("Mọi key GIPHY đang bị giới hạn tần suất.");
    }

    for (const apiKey of keys) {
        await takeUpstreamCall();

        const url = new URL(path, "https://api.giphy.com");
        url.searchParams.set("api_key", apiKey);
        for (const [name, value] of Object.entries(params)) {
            url.searchParams.set(name, value);
        }

        const response = await fetch(url, {
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout(8_000),
        });
        if (response.status === 429 || response.status === 401 || response.status === 403) {
            // Key này hết lượt (429) hoặc sai / bị thu hồi (401, 403): cho nghỉ rồi thử ngay key khác.
            coolingKeys.set(apiKey, Date.now() + keyCooldownMs);
            console.error(`Key GIPHY …${apiKey.slice(-4)} trả ${response.status}, đổi key khác.`);
            continue;
        }
        if (!response.ok) {
            throw new Error(`GIPHY API trả về ${response.status}.`);
        }

        return (await response.json() as { data?: GiphyGif | GiphyGif[] }).data;
    }

    throw new RateLimitedError("Mọi key GIPHY đang bị giới hạn tần suất.");
}

function toGif(gif: GiphyGif | undefined): Gif | null {
    if (!gif?.id || !gif.images?.original?.url) {
        return null;
    }

    return {
        id: gif.id,
        title: gif.title || "Random reaction GIF",
        altText: gif.alt_text || gif.title || "GIF ngẫu nhiên được cung cấp bởi GIPHY",
        previewUrl: gif.images.fixed_height?.url ?? gif.images.downsized?.url ?? gif.images.original.url,
        downloadUrl: gif.images.downsized?.url ?? gif.images.original.url,
    };
}

async function readStoredPool(cacheKey: string): Promise<Pool | null> {
    const db = getDatabase();
    if (!db) {
        return null;
    }

    const { data, error } = await db
        .from("giphy_cache")
        .select("gifs, fetched_at")
        .eq("cache_key", cacheKey)
        .maybeSingle();
    if (error || !data || !Array.isArray(data.gifs) || data.gifs.length === 0) {
        return null;
    }

    return { gifs: data.gifs as Gif[], fetchedAt: new Date(data.fetched_at).getTime() };
}

async function storePool(cacheKey: string, pool: Pool) {
    const db = getDatabase();
    if (!db) {
        return;
    }

    const { error } = await db.from("giphy_cache").upsert({
        cache_key: cacheKey,
        gifs: pool.gifs,
        fetched_at: new Date(pool.fetchedAt).toISOString(),
    });
    if (error) {
        console.error("Không lưu được cache GIF:", error.message);
    }
}

/** Danh sách GIF của một chủ đề: bộ nhớ → database → GIPHY, hỏng thì dùng bản cũ. */
async function getPool(tag: string): Promise<Gif[]> {
    const cacheKey = tag ? `search:${tag.toLowerCase()}` : "trending";
    const isFresh = (pool: Pool) => Date.now() - pool.fetchedAt < freshForMs;

    let stale: Pool | null = memoryPools.get(cacheKey) ?? null;
    if (stale && isFresh(stale)) {
        return stale.gifs;
    }

    const stored = await readStoredPool(cacheKey);
    if (stored) {
        memoryPools.set(cacheKey, stored);
        if (isFresh(stored)) {
            return stored.gifs;
        }
        stale = stored;
    }

    try {
        const data = await callGiphy(
            tag ? "/v1/gifs/search" : "/v1/gifs/trending",
            {
                rating: "pg13",
                limit: String(poolSize),
                ...(tag ? { q: tag, sort: "relevant" } : {}),
            },
        );
        const gifs = (Array.isArray(data) ? data : [])
            .map(toGif)
            .filter((gif): gif is Gif => gif !== null);
        if (gifs.length === 0) {
            throw new Error("GIPHY trả về danh sách rỗng.");
        }

        const pool = { gifs, fetchedAt: Date.now() };
        memoryPools.set(cacheKey, pool);
        await storePool(cacheKey, pool);
        return gifs;
    } catch (error) {
        if (stale) {
            console.error("Dùng lại danh sách GIF cũ:", error);
            return stale.gifs;
        }
        throw error;
    }
}

function isAllowedGiphyMediaUrl(value: string, id?: string) {
    try {
        const url = new URL(value);

        return (
            url.protocol === "https:" &&
            (url.hostname === "giphy.com" || url.hostname.endsWith(".giphy.com")) &&
            (!id || url.pathname.includes(`/${id}/`))
        );
    } catch {
        return false;
    }
}

async function findMediaUrl(id: string, src: string | null) {
    // Link tải đã có sẵn trong danh sách GIF: tải thẳng từ media.giphy.com, không tốn lượt API.
    if (src && isAllowedGiphyMediaUrl(src, id)) {
        return src;
    }
    for (const pool of memoryPools.values()) {
        const gif = pool.gifs.find((item) => item.id === id);
        if (gif) {
            return gif.downloadUrl;
        }
    }

    const data = await callGiphy(`/v1/gifs/${encodeURIComponent(id)}`);
    const gif = toGif(Array.isArray(data) ? data[0] : data);
    if (!gif) {
        throw new Error("GIPHY trả về dữ liệu không hợp lệ.");
    }
    return gif.downloadUrl;
}

async function downloadGif(id: string, src: string | null) {
    const mediaUrl = await findMediaUrl(id, src);
    if (!isAllowedGiphyMediaUrl(mediaUrl)) {
        throw new Error("GIPHY trả về media URL không hợp lệ.");
    }

    const response = await fetch(mediaUrl, {
        headers: { Accept: "image/gif" },
        signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
        throw new Error("Không thể tải file GIF từ GIPHY.");
    }

    const body = await response.arrayBuffer();
    if (body.byteLength > maxGifBytes) {
        throw new Error("GIF vượt quá giới hạn tải 15 MB.");
    }

    return new Response(body, {
        headers: {
            ...corsHeaders,
            "Content-Type": response.headers.get("content-type") ?? "image/gif",
            "Content-Disposition": `attachment; filename="graduation-${id}.gif"`,
            "Cache-Control": "private, max-age=300",
        },
    });
}

function readTag(params: URLSearchParams) {
    const tag = (params.get("tag") ?? "").trim();
    return tag.length > 80 ? null : tag;
}

function readOffset(params: URLSearchParams) {
    const value = params.get("offset") ?? "0";
    return /^\d{1,2}$/.test(value) && Number(value) <= 49 ? Number(value) : null;
}

Deno.serve(async (request) => {
    if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== "GET") {
        return json({ message: "Phương thức không được hỗ trợ." }, 405);
    }

    // Đường dẫn có dạng /giphy/... (hoặc /functions/v1/giphy/... khi chạy local).
    const url = new URL(request.url);
    const segments = url.pathname.split("/").filter(Boolean);
    const [first, second] = segments.slice(segments.indexOf("giphy") + 1);
    const params = url.searchParams;

    try {
        if (first === "list" && second === undefined) {
            const tag = readTag(params);
            if (tag === null) return json({ message: "Tag tối đa 80 ký tự." }, 400);
            return json({ data: await getPool(tag) }, 200, 600);
        }

        // Các route cũ: lấy một GIF trong danh sách đã cache thay vì gọi GIPHY mỗi lần.
        if ((first === "search" || first === "trending") && second === undefined) {
            const tag = first === "search" ? readTag(params) : "";
            const offset = readOffset(params);
            if (tag === null || offset === null || (first === "search" && !tag)) {
                return json({ message: "Bộ lọc GIF không hợp lệ." }, 400);
            }
            const gifs = await getPool(tag);
            return json({ data: gifs[offset % gifs.length] });
        }
        if (first === "random" && second === undefined) {
            const tag = readTag(params);
            if (tag === null) return json({ message: "Tag tối đa 80 ký tự." }, 400);
            const gifs = await getPool(tag);
            return json({ data: gifs[Math.floor(Math.random() * gifs.length)] });
        }

        if (second === "download") {
            if (!/^[A-Za-z0-9_-]+$/.test(first)) {
                return json({ message: "GIF ID không hợp lệ." }, 400);
            }

            return await downloadGif(first, params.get("src"));
        }

        return json({ message: "Không tìm thấy." }, 404);
    } catch (error) {
        console.error(error);

        if (error instanceof RateLimitedError) {
            return json(
                { message: "Máy bốc GIF đang nghỉ mệt một chút, thử lại sau ít phút nha!" },
                429,
            );
        }
        return json(
            { message: "Chưa thể lấy GIF từ GIPHY. Vui lòng thử lại." },
            502,
        );
    }
});
