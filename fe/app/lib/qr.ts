import jsQR from "jsqr";

/** Mã ngẫu nhiên (32 ký tự hex) hoặc mã quản trị viên tự đặt. */
export const qrCodePattern = /^[A-Za-z0-9_-]{8,64}$/;
const maxPdfPages = 5;

/** Link được in trong QR: `<site>/homie?code=<mã>`. */
export function buildInviteUrl(origin: string, code: string) {
    return `${origin}/homie?code=${code}`;
}

/** Lấy mã mời từ nội dung QR (link đầy đủ hoặc mã trần). */
export function extractInviteCode(text: string) {
    const value = text.trim();
    if (qrCodePattern.test(value)) {
        return value;
    }

    try {
        const code = new URL(value).searchParams.get("code") ?? "";
        return qrCodePattern.test(code) ? code : null;
    } catch {
        return null;
    }
}

/**
 * Đọc QR trong một khung hình (camera, ảnh hoặc trang PDF đã vẽ ra canvas).
 * Thiệp A4 có thêm một QR chỉ đường, nên khi gặp QR không phải mã mời thì che
 * nó đi rồi tìm tiếp. Trả về QR mã mời nếu có, nếu không thì QR đầu tiên thấy.
 */
export function decodeImageData(image: ImageData) {
    let firstText: string | null = null;

    for (let attempt = 0; attempt < 3; attempt += 1) {
        const result = jsQR(image.data, image.width, image.height, {
            inversionAttempts: "attemptBoth",
        });
        if (!result) {
            break;
        }

        if (extractInviteCode(result.data)) {
            return result.data;
        }

        firstText ??= result.data;
        const corners = [
            result.location.topLeftCorner,
            result.location.topRightCorner,
            result.location.bottomLeftCorner,
            result.location.bottomRightCorner,
        ];
        const left = Math.max(0, Math.floor(Math.min(...corners.map((corner) => corner.x))));
        const right = Math.min(image.width, Math.ceil(Math.max(...corners.map((corner) => corner.x))));
        const top = Math.max(0, Math.floor(Math.min(...corners.map((corner) => corner.y))));
        const bottom = Math.min(image.height, Math.ceil(Math.max(...corners.map((corner) => corner.y))));
        for (let y = top; y < bottom; y += 1) {
            image.data.fill(255, (y * image.width + left) * 4, (y * image.width + right) * 4);
        }
    }

    return firstText;
}

function canvasImageData(
    source: CanvasImageSource,
    width: number,
    height: number,
) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) {
        return null;
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(source, 0, 0, width, height);
    return context.getImageData(0, 0, width, height);
}

async function decodeImageFile(file: File) {
    const bitmap = await createImageBitmap(file);
    try {
        const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
        const image = canvasImageData(
            bitmap,
            Math.round(bitmap.width * scale),
            Math.round(bitmap.height * scale),
        );
        return image ? decodeImageData(image) : null;
    } finally {
        bitmap.close();
    }
}

async function decodePdfFile(file: File) {
    const pdfjs = await import("pdfjs-dist");
    const { default: workerUrl } = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

    const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    let otherQrText: string | null = null;
    try {
        for (let pageNumber = 1; pageNumber <= Math.min(pdf.numPages, maxPdfPages); pageNumber += 1) {
            const page = await pdf.getPage(pageNumber);
            for (const scale of [2, 4]) {
                const viewport = page.getViewport({ scale });
                const canvas = document.createElement("canvas");
                canvas.width = Math.ceil(viewport.width);
                canvas.height = Math.ceil(viewport.height);
                await page.render({ canvas, viewport, background: "#ffffff" }).promise;

                const image = canvas
                    .getContext("2d", { willReadFrequently: true })
                    ?.getImageData(0, 0, canvas.width, canvas.height);
                const text = image ? decodeImageData(image) : null;
                if (text && extractInviteCode(text)) {
                    return text;
                }

                otherQrText ??= text;
            }
        }

        return otherQrText;
    } finally {
        await pdf.destroy();
    }
}

/** Đọc QR từ file ảnh hoặc PDF người dùng tải lên. File không rời khỏi trình duyệt. */
export async function decodeQrFile(file: File) {
    const isPdf =
        file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    return isPdf ? decodePdfFile(file) : decodeImageFile(file);
}
