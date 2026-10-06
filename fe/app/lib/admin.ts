import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { photoBucket, supabaseKey, supabaseUrl } from "./api";
import { qrCodePattern } from "./qr";

export type Invitation = {
    id: string;
    token: string;
    display_name: string;
    qr_code: string;
    instagram_handle: string | null;
    personal_message: string;
    theme_variant: string;
    photo_path: string | null;
    created_at: string;
};

export type InvitationInput = {
    displayName: string;
    instagramHandle: string;
    personalMessage: string;
    /** Để trống thì tự tạo mã ngẫu nhiên. */
    qrCode: string;
};

export type PageVisit = {
    id: string;
    visitor_id: string;
    path: string;
    referrer: string | null;
    user_agent: string | null;
    created_at: string;
};

const invitationColumns =
    "id, token, qr_code, display_name, instagram_handle, personal_message, theme_variant, photo_path, created_at";

let client: SupabaseClient | null = null;

/** Client có phiên đăng nhập, chỉ dùng trong dashboard `/dev`. */
function getSupabase() {
    if (!client) {
        client = createClient(supabaseUrl, supabaseKey);
    }

    return client;
}

function createQrCode() {
    const bytes = window.crypto.getRandomValues(new Uint8Array(16));

    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Email của quản trị viên đang đăng nhập, hoặc `null`. Quyền thật sự do RLS
 * quyết định; lần kiểm tra này chỉ để giao diện biết nên hiện form đăng nhập.
 */
export async function getAdminEmail() {
    const supabase = getSupabase();
    const { data } = await supabase.auth.getSession();
    const email = data.session?.user.email;
    if (!email) {
        return null;
    }

    const { data: isAdmin, error } = await supabase.rpc("is_admin");
    if (error) {
        throw new Error("Không thể kiểm tra phiên quản trị.");
    }

    return isAdmin ? email : null;
}

export async function signInAdmin(email: string, password: string) {
    const supabase = getSupabase();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        throw new Error(
            error.status === 429
                ? "Bạn đã thử quá nhiều lần. Vui lòng đợi rồi thử lại."
                : "Email hoặc mật khẩu chưa đúng.",
        );
    }

    const adminEmail = await getAdminEmail();
    if (!adminEmail) {
        await supabase.auth.signOut();
        throw new Error("Tài khoản này không có quyền quản trị.");
    }

    return adminEmail;
}

export async function signOutAdmin() {
    await getSupabase().auth.signOut();
}

export async function listInvitations() {
    const { data, error } = await getSupabase()
        .from("invitations")
        .select(invitationColumns)
        .order("created_at", { ascending: false });

    if (error) {
        throw new Error("Không thể tải danh sách.");
    }

    return data as Invitation[];
}

/** Chuyển dữ liệu form thành các cột của bảng, kiểm tra mã QR tự đặt. */
function invitationRow(input: InvitationInput) {
    const qrCode = input.qrCode.trim();
    if (qrCode && !qrCodePattern.test(qrCode)) {
        throw new Error(
            "Mã QR phải dài 8–64 ký tự, chỉ gồm chữ không dấu, số, gạch ngang hoặc gạch dưới.",
        );
    }

    return {
        display_name: input.displayName.trim(),
        instagram_handle: input.instagramHandle.trim() || null,
        personal_message: input.personalMessage.trim(),
        qr_code: qrCode || createQrCode(),
    };
}

function saveError(error: { code?: string; message: string }, fallback: string) {
    if (error.code === "23505") {
        return new Error(
            error.message.includes("qr_code")
                ? "Mã QR này đã được dùng cho khách khác."
                : "Instagram này đã có trong danh sách khách mời.",
        );
    }

    if (error.code === "23514") {
        return new Error(
            error.message.includes("instagram_handle")
                ? "Instagram phải bắt đầu bằng @ và chỉ gồm chữ, số, dấu chấm hoặc gạch dưới."
                : "Tên khách mời, lời mời hoặc mã QR không hợp lệ.",
        );
    }

    return new Error(fallback);
}

export async function createInvitation(input: InvitationInput) {
    const row = invitationRow(input);
    const supabase = getSupabase();
    const { data: event, error: eventError } = await supabase
        .from("events")
        .select("id")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (eventError) {
        throw new Error("Không thể thêm khách mời.");
    }

    if (!event) {
        throw new Error("Chưa có sự kiện để gắn khách mời.");
    }

    const { data, error } = await supabase
        .from("invitations")
        .insert({ event_id: event.id, ...row })
        .select(invitationColumns)
        .single();

    if (error) {
        throw saveError(error, "Không thể thêm khách mời.");
    }

    return data as Invitation;
}

export async function updateInvitation(invitationId: string, input: InvitationInput) {
    const { data, error } = await getSupabase()
        .from("invitations")
        .update(invitationRow(input))
        .eq("id", invitationId)
        .select(invitationColumns)
        .maybeSingle();

    if (error) {
        throw saveError(error, "Không thể lưu thay đổi.");
    }

    if (!data) {
        throw new Error("Không tìm thấy khách mời.");
    }

    return data as Invitation;
}

/**
 * Đặt (hoặc gỡ, khi `photo` là `null`) ảnh chụp chung của một khách. Ảnh mới
 * luôn có tên file mới nên link ảnh cũ hết hiệu lực ngay khi file cũ bị xoá.
 */
export async function setInvitationPhoto(invitation: Invitation, photo: Blob | null) {
    const supabase = getSupabase();
    const storage = supabase.storage.from(photoBucket);
    let photoPath: string | null = null;

    if (photo) {
        photoPath = `${window.crypto.randomUUID()}.jpg`;
        const { error: uploadError } = await storage.upload(photoPath, photo, {
            contentType: "image/jpeg",
        });
        if (uploadError) {
            throw new Error("Không thể tải ảnh lên.");
        }
    }

    const { data, error } = await supabase
        .from("invitations")
        .update({ photo_path: photoPath })
        .eq("id", invitation.id)
        .select(invitationColumns)
        .maybeSingle();

    if (error || !data) {
        if (photoPath) {
            await storage.remove([photoPath]);
        }

        throw new Error("Không thể lưu ảnh cho khách mời.");
    }

    if (invitation.photo_path) {
        await storage.remove([invitation.photo_path]);
    }

    return data as Invitation;
}

export async function deleteInvitation(invitationId: string) {
    const { data, error } = await getSupabase()
        .from("invitations")
        .delete()
        .eq("id", invitationId)
        .select("id, photo_path");

    if (error) {
        throw new Error("Không thể xoá khách mời.");
    }

    if (data.length === 0) {
        throw new Error("Không tìm thấy khách mời.");
    }

    const photoPaths = data.flatMap((row) => (row.photo_path ? [row.photo_path] : []));
    if (photoPaths.length > 0) {
        await getSupabase().storage.from(photoBucket).remove(photoPaths);
    }
}

export async function regenerateQrCode(invitationId: string) {
    const { data, error } = await getSupabase()
        .from("invitations")
        .update({ qr_code: createQrCode() })
        .eq("id", invitationId)
        .select(invitationColumns)
        .maybeSingle();

    if (error) {
        throw new Error("Không thể tạo mã QR mới.");
    }

    if (!data) {
        throw new Error("Không tìm thấy khách mời.");
    }

    return data as Invitation;
}

export async function listPageVisits(limit = 200) {
    const vietnamOffsetMs = 7 * 60 * 60 * 1_000;
    const vietnamToday = new Date(Date.now() + vietnamOffsetMs);
    vietnamToday.setUTCHours(0, 0, 0, 0);
    const todayStart = new Date(vietnamToday.getTime() - vietnamOffsetMs);
    const supabase = getSupabase();
    const [visitsResult, totalResult, todayResult] = await Promise.all([
        supabase
            .from("page_visits")
            .select("id, visitor_id, path, referrer, user_agent, created_at")
            .order("created_at", { ascending: false })
            .limit(limit),
        supabase
            .from("page_visits")
            .select("id", { count: "exact", head: true }),
        supabase
            .from("page_visits")
            .select("id", { count: "exact", head: true })
            .gte("created_at", todayStart.toISOString()),
    ]);

    if (visitsResult.error ?? totalResult.error ?? todayResult.error) {
        throw new Error("Không thể tải visit log.");
    }

    return {
        visits: (visitsResult.data ?? []) as PageVisit[],
        summary: {
            total: totalResult.count ?? 0,
            today: todayResult.count ?? 0,
        },
    };
}
