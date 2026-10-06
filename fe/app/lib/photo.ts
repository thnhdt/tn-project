const maxEdge = 1600;

/**
 * Thu nhỏ ảnh ngay trên trình duyệt (cạnh dài tối đa 1600px, JPEG) trước khi
 * tải lên, để ảnh nhẹ và nằm trong giới hạn 2 MB của bucket.
 */
export async function resizePhoto(file: File) {
    let bitmap: ImageBitmap;
    try {
        bitmap = await createImageBitmap(file);
    } catch {
        throw new Error("Không đọc được ảnh này. Hãy dùng ảnh JPG hoặc PNG.");
    }

    try {
        const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(bitmap.width * scale);
        canvas.height = Math.round(bitmap.height * scale);
        const context = canvas.getContext("2d");
        if (!context) {
            throw new Error("Trình duyệt không hỗ trợ canvas.");
        }

        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

        return await new Promise<Blob>((resolve, reject) =>
            canvas.toBlob(
                (blob) => (blob ? resolve(blob) : reject(new Error("Không xử lý được ảnh."))),
                "image/jpeg",
                0.85,
            ),
        );
    } finally {
        bitmap.close();
    }
}
