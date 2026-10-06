export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

/** URL của Edge Function lấy GIF (giữ GIPHY_API_KEY ở phía Supabase). */
export const giphyFunctionUrl = `${supabaseUrl}/functions/v1/giphy`;

export const photoBucket = "invitation-photos";

const inviteCodeKey = "homie_invite_code";

export type GuestInvitation = {
    display_name: string;
    instagram_handle: string | null;
    personal_message: string;
    theme_variant: string;
    photo_path: string | null;
};

export type RandomGif = {
    id: string;
    title: string;
    altText: string;
    previewUrl: string;
};

/**
 * Gọi một hàm RPC công khai bằng publishable key. Các trang của khách dùng
 * fetch trực tiếp để không phải tải supabase-js; dashboard dùng `lib/admin.ts`.
 */
async function callRpc<T>(
    name: string,
    args: Record<string, unknown>,
    init: RequestInit = {},
): Promise<T> {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${name}`, {
        cache: "no-store",
        ...init,
        method: "POST",
        headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(args),
    });

    if (!response.ok) {
        throw new Error("Không thể kết nối máy chủ.");
    }

    return (await response.json()) as T;
}

/** Đường dẫn công khai của ảnh chụp chung (tên file là UUID ngẫu nhiên). */
export function invitationPhotoUrl(photoPath: string) {
    return `${supabaseUrl}/storage/v1/object/public/${photoBucket}/${photoPath}`;
}

/** Trả về lời mời khớp mã QR, hoặc `null` nếu mã không thuộc về khách nào. */
export async function openInvitation(code: string) {
    const rows = await callRpc<GuestInvitation[]>("open_invitation", {
        p_code: code,
    });

    return rows[0] ?? null;
}

export function recordPageVisit(visit: {
    visitorId: string;
    path: string;
    referrer: string;
}) {
    return callRpc<boolean>(
        "record_page_visit",
        {
            p_visitor_id: visit.visitorId,
            p_path: visit.path,
            p_referrer: visit.referrer,
        },
        { keepalive: true },
    );
}

export async function getRandomGif(): Promise<RandomGif> {
    const response = await fetch(`${giphyFunctionUrl}/random`, {
        cache: "no-store",
    });
    const payload = (await response.json().catch(() => ({}))) as {
        data?: RandomGif;
        message?: string;
    };

    if (!response.ok || !payload.data) {
        throw new Error(payload.message ?? "Chưa thể tạo GIF ngẫu nhiên.");
    }

    return payload.data;
}

/** Mã QR đã xác thực được nhớ trên máy khách để mở lại thiệp mà không cần quét lại. */
export function readInviteCode() {
    try {
        return window.localStorage.getItem(inviteCodeKey);
    } catch {
        return null;
    }
}

export function saveInviteCode(code: string | null) {
    try {
        if (code) {
            window.localStorage.setItem(inviteCodeKey, code);
        } else {
            window.localStorage.removeItem(inviteCodeKey);
        }
    } catch {
        // Trình duyệt chặn localStorage: khách chỉ cần quét lại QR ở lần sau.
    }
}

export function errorMessage(error: unknown, fallback = "Không thể kết nối máy chủ.") {
    return error instanceof Error ? error.message : fallback;
}
