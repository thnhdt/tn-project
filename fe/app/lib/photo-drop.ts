import { supabaseKey, supabaseUrl } from "./api";

/** Bucket công khai của trang /tha-anh (xem migration 013_photo_drop.sql). */
export const photoDropBucket = "photo-drop";

const maxEdge = 1200;
const maxFiles = 8;
const maxInputBytes = 25 * 1024 * 1024;

export type DroppedPhoto = {
    name: string;
    url: string;
};

function storageHeaders(extra: Record<string, string> = {}) {
    return {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        ...extra,
    };
}

export function photoDropUrl(name: string) {
    return `${supabaseUrl}/storage/v1/object/public/${photoDropBucket}/${name}`;
}

/** Danh sách ảnh mới nhất trong bucket (tối đa 300 ảnh). */
export async function listDroppedPhotos(): Promise<DroppedPhoto[]> {
    const response = await fetch(
        `${supabaseUrl}/storage/v1/object/list/${photoDropBucket}`,
        {
            method: "POST",
            cache: "no-store",
            headers: storageHeaders({ "Content-Type": "application/json" }),
            body: JSON.stringify({
                prefix: "",
                limit: 300,
                offset: 0,
                sortBy: { column: "created_at", order: "desc" },
            }),
        },
    );

    if (!response.ok) {
        throw new Error("Chưa tải được ảnh của mọi người.");
    }

    const rows = (await response.json()) as { name: string; id: string | null }[];
    return rows
        .filter((row) => row.id && /\.(webp|jpg)$/.test(row.name))
        .map((row) => ({ name: row.name, url: photoDropUrl(row.name) }));
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
    return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Nén ảnh trên trình duyệt: cạnh dài tối đa 1200px, ưu tiên WebP, trình duyệt
 * không xuất được WebP thì dùng JPEG. Ảnh thường còn khoảng 150–300 KB.
 */
export async function compressDroppedPhoto(file: File) {
    if (!file.type.startsWith("image/") && file.type !== "") {
        throw new Error(`"${file.name}" không phải ảnh.`);
    }
    if (file.size > maxInputBytes) {
        throw new Error(`"${file.name}" lớn quá (tối đa 25 MB).`);
    }

    let bitmap: ImageBitmap;
    try {
        bitmap = await createImageBitmap(file);
    } catch {
        throw new Error(`Không đọc được "${file.name}". Thử ảnh JPG hoặc PNG nhé.`);
    }

    try {
        const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        const context = canvas.getContext("2d");
        if (!context) {
            throw new Error("Trình duyệt không hỗ trợ canvas.");
        }

        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

        const webp = await canvasToBlob(canvas, "image/webp", 0.8);
        if (webp && webp.type === "image/webp") {
            return { blob: webp, extension: "webp" };
        }

        const jpeg = await canvasToBlob(canvas, "image/jpeg", 0.82);
        if (!jpeg) {
            throw new Error(`Không xử lý được "${file.name}".`);
        }
        return { blob: jpeg, extension: "jpg" };
    } finally {
        bitmap.close();
    }
}

/** Nén rồi tải một ảnh lên bucket. Trả về ảnh vừa tải để thả bay ngay. */
export async function uploadDroppedPhoto(file: File): Promise<DroppedPhoto> {
    const { blob, extension } = await compressDroppedPhoto(file);
    const name = `${window.crypto.randomUUID()}.${extension}`;
    const response = await fetch(
        `${supabaseUrl}/storage/v1/object/${photoDropBucket}/${name}`,
        {
            method: "POST",
            headers: storageHeaders({
                "Content-Type": blob.type,
                "Cache-Control": "31536000",
            }),
            body: blob,
        },
    );

    if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
            message?: string;
        };
        const reason = payload.message ?? "";
        if (/row-level security|policy/i.test(reason)) {
            throw new Error("Kho ảnh đã đầy rồi, nhắn Đạt dọn bớt nhé!");
        }
        throw new Error(`Chưa gửi được "${file.name}". Thử lại sau chút nhé.`);
    }

    return { name, url: photoDropUrl(name) };
}

/** Lấy các file ảnh từ lần kéo-thả hoặc chọn file, tối đa 8 ảnh mỗi lần. */
export function pickImageFiles(list: FileList | null) {
    const files = Array.from(list ?? []).filter(
        (file) => file.type.startsWith("image/") || /\.(heic|heif)$/i.test(file.name),
    );
    return { files: files.slice(0, maxFiles), skipped: Math.max(0, files.length - maxFiles) };
}
