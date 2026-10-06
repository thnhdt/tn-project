// Edge Function công khai: giữ GIPHY_API_KEY ở phía Supabase.
//   GET /giphy/random          → { data: { id, title, altText, previewUrl } }
//   GET /giphy/<id>/download   → file GIF đính kèm

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

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type",
};
const maxGifBytes = 15 * 1024 * 1024;

function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            ...corsHeaders,
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store",
        },
    });
}

async function fetchGiphyGif(path: string, params: Record<string, string> = {}) {
    const apiKey = Deno.env.get("GIPHY_API_KEY");
    if (!apiKey) {
        throw new Error("Thiếu secret GIPHY_API_KEY.");
    }

    const url = new URL(path, "https://api.giphy.com");
    url.searchParams.set("api_key", apiKey);
    for (const [name, value] of Object.entries(params)) {
        url.searchParams.set(name, value);
    }

    const response = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) {
        throw new Error("GIPHY API không phản hồi thành công.");
    }

    const gif = (await response.json() as { data?: GiphyGif }).data;
    if (!gif?.id || !gif.images?.original?.url) {
        throw new Error("GIPHY trả về dữ liệu không hợp lệ.");
    }

    return gif;
}

function isAllowedGiphyMediaUrl(value: string) {
    try {
        const url = new URL(value);

        return (
            url.protocol === "https:" &&
            (url.hostname === "giphy.com" || url.hostname.endsWith(".giphy.com"))
        );
    } catch {
        return false;
    }
}

async function randomGif() {
    const gif = await fetchGiphyGif("/v1/gifs/random", { rating: "pg13" });

    return json({
        data: {
            id: gif.id,
            title: gif.title || "Random graduation GIF",
            altText:
                gif.alt_text ||
                gif.title ||
                "GIF ngẫu nhiên được cung cấp bởi GIPHY",
            previewUrl:
                gif.images.fixed_height?.url ??
                gif.images.downsized?.url ??
                gif.images.original.url,
        },
    });
}

async function downloadGif(id: string) {
    const gif = await fetchGiphyGif(`/v1/gifs/${encodeURIComponent(id)}`);
    const mediaUrl = gif.images.downsized?.url ?? gif.images.original.url;
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

Deno.serve(async (request) => {
    if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== "GET") {
        return json({ message: "Phương thức không được hỗ trợ." }, 405);
    }

    // Đường dẫn có dạng /giphy/... (hoặc /functions/v1/giphy/... khi chạy local).
    const segments = new URL(request.url).pathname.split("/").filter(Boolean);
    const [first, second] = segments.slice(segments.indexOf("giphy") + 1);

    try {
        if (first === "random" && second === undefined) {
            return await randomGif();
        }

        if (second === "download") {
            if (!/^[A-Za-z0-9_-]+$/.test(first)) {
                return json({ message: "GIF ID không hợp lệ." }, 400);
            }

            return await downloadGif(first);
        }

        return json({ message: "Không tìm thấy." }, 404);
    } catch (error) {
        console.error(error);

        return json(
            { message: "Chưa thể lấy GIF từ GIPHY. Vui lòng thử lại." },
            502,
        );
    }
});
