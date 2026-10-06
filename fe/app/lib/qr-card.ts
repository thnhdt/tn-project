import QRCode from "qrcode";
import { ceremony, graduate } from "../site-content";
import {
    ceremonyAddress,
    ceremonyDate,
    ceremonyLocation,
    ceremonyTime,
    directionsUrl,
} from "./ceremony";

/** Thiệp mời khổ A4 ở 300 dpi. Muốn đổi bố cục thiệp tải về: sửa file này. */
const card = { width: 2480, height: 3508, margin: 220 };
const colors = {
    ink: "#082d72",
    blue: "#0868ff",
    acid: "#d9ff51",
    paper: "#fffdf7",
    grid: "#dce8f8",
    muted: "#5d77a1",
    white: "#ffffff",
};

type CardGuest = {
    displayName: string;
    personalMessage: string;
};

export function qrDataUrl(text: string, width = 320) {
    return QRCode.toDataURL(text, { errorCorrectionLevel: "M", margin: 2, width });
}

function fontFamily(variable: string) {
    return getComputedStyle(document.body).getPropertyValue(variable).trim() || "sans-serif";
}

function loadImage(source: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = source;
    });
}

/** Ngắt một đoạn văn thành các dòng vừa chiều rộng, giữ nguyên chỗ xuống dòng. */
function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
    const lines: string[] = [];

    for (const paragraph of text.split("\n")) {
        let line = "";
        for (const word of paragraph.split(/\s+/).filter(Boolean)) {
            const candidate = line ? `${line} ${word}` : word;
            if (line && context.measureText(candidate).width > maxWidth) {
                lines.push(line);
                line = word;
            } else {
                line = candidate;
            }
        }
        lines.push(line);
    }

    return lines;
}

/** Hộp trắng viền đậm có bóng lệch, kiểu sticker của Blue Notebook. */
function drawBox(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    fill = colors.white,
) {
    context.fillStyle = colors.ink;
    context.fillRect(x + 18, y + 18, width, height);
    context.fillStyle = fill;
    context.fillRect(x, y, width, height);
    context.strokeStyle = colors.ink;
    context.lineWidth = 8;
    context.strokeRect(x, y, width, height);
}

/** Vẽ thiệp mời A4 của một khách (lời mời, thời gian, địa điểm, QR), trả về PNG. */
export async function renderInviteCard(guest: CardGuest, inviteUrl: string) {
    const sans = fontFamily("--font-be-vietnam");
    const mono = fontFamily("--font-roboto-mono");
    const doodle = fontFamily("--font-doodle");
    const sample = `${guest.displayName} ${guest.personalMessage}`;
    await Promise.all([
        document.fonts.load(`400 40px ${sans}`, sample),
        document.fonts.load(`700 40px ${sans}`, sample),
        document.fonts.load(`800 40px ${sans}`, sample),
        document.fonts.load(`700 40px ${mono}`, sample),
        document.fonts.load(`700 40px ${doodle}`, sample),
    ]);

    const canvas = document.createElement("canvas");
    canvas.width = card.width;
    canvas.height = card.height;
    const context = canvas.getContext("2d");
    if (!context) {
        throw new Error("Trình duyệt không hỗ trợ canvas.");
    }

    const centerX = card.width / 2;
    const contentWidth = card.width - card.margin * 2;

    // Nền giấy kẻ ô và khung viền.
    context.fillStyle = colors.paper;
    context.fillRect(0, 0, card.width, card.height);
    context.strokeStyle = colors.grid;
    context.lineWidth = 3;
    context.beginPath();
    for (let x = 80; x < card.width; x += 80) {
        context.moveTo(x, 0);
        context.lineTo(x, card.height);
    }
    for (let y = 80; y < card.height; y += 80) {
        context.moveTo(0, y);
        context.lineTo(card.width, y);
    }
    context.stroke();
    context.strokeStyle = colors.ink;
    context.lineWidth = 14;
    context.strokeRect(80, 80, card.width - 160, card.height - 160);

    // Tiêu đề buổi lễ.
    context.textBaseline = "alphabetic";
    context.textAlign = "left";
    context.fillStyle = colors.blue;
    context.font = `700 40px ${mono}`;
    context.fillText("GRADUATION_INVITE.PDF", card.margin, 240);
    context.textAlign = "right";
    context.fillText(graduate.badge, card.width - card.margin, 240);

    context.textAlign = "center";
    context.fillStyle = colors.ink;
    context.font = `800 170px ${sans}`;
    context.fillText(ceremony.title, centerX, 470, contentWidth);
    context.fillStyle = colors.blue;
    context.font = `700 58px ${sans}`;
    context.fillText(`${graduate.fullName} • ${graduate.degree}`, centerX, 580, contentWidth);
    context.fillStyle = colors.muted;
    context.font = `400 44px ${sans}`;
    context.fillText(graduate.university.join(" – "), centerX, 656, contentWidth);

    context.strokeStyle = colors.ink;
    context.lineWidth = 5;
    context.setLineDash([24, 18]);
    context.beginPath();
    context.moveTo(card.margin, 730);
    context.lineTo(card.width - card.margin, 730);
    context.stroke();
    context.setLineDash([]);

    // Tên khách.
    context.fillStyle = colors.blue;
    context.font = `700 76px ${doodle}`;
    context.fillText("Thân mời", centerX, 860);
    context.font = `800 150px ${sans}`;
    const nameWidth = Math.min(context.measureText(guest.displayName).width, contentWidth);
    context.fillStyle = colors.acid;
    context.fillRect(centerX - nameWidth / 2 - 30, 960, nameWidth + 60, 70);
    context.fillStyle = colors.ink;
    context.fillText(guest.displayName, centerX, 1010, contentWidth);

    // Lá thư riêng: tự giảm cỡ chữ cho tới khi lời mời vừa khung.
    const letter = { x: card.margin, y: 1120, width: contentWidth, height: 800, padding: 70 };
    drawBox(context, letter.x, letter.y, letter.width, letter.height);
    context.textAlign = "left";
    context.fillStyle = colors.muted;
    context.font = `700 34px ${mono}`;
    context.fillText(
        `TO: ${guest.displayName.toLocaleUpperCase("vi")}`,
        letter.x + letter.padding,
        letter.y + 100,
        letter.width - letter.padding * 2,
    );

    const messageTop = letter.y + 150;
    const messageHeight = letter.height - 150 - 130;
    let fontSize = 76;
    let lines: string[] = [];
    for (; fontSize >= 26; fontSize -= 4) {
        context.font = `400 ${fontSize}px ${sans}`;
        lines = wrapText(context, guest.personalMessage, letter.width - letter.padding * 2);
        if (lines.length * fontSize * 1.5 <= messageHeight) {
            break;
        }
    }
    context.fillStyle = colors.ink;
    lines.forEach((line, index) => {
        context.fillText(line, letter.x + letter.padding, messageTop + fontSize * (1 + index * 1.5));
    });
    context.textAlign = "right";
    context.fillStyle = colors.blue;
    context.font = `700 64px ${doodle}`;
    context.fillText(
        graduate.signature,
        letter.x + letter.width - letter.padding,
        letter.y + letter.height - 60,
    );

    // Ngày, giờ, địa điểm.
    const info = { y: 2010, height: 360, gap: 40 };
    const smallWidth = 470;
    const cells = [
        { label: "NGÀY", value: ceremonyDate, detail: null, width: smallWidth },
        { label: "GIỜ", value: ceremonyTime, detail: null, width: smallWidth },
        {
            label: "ĐỊA ĐIỂM",
            value: ceremonyLocation,
            detail: ceremonyAddress,
            width: contentWidth - (smallWidth + info.gap) * 2,
        },
    ];
    let cellX = card.margin;
    for (const cell of cells) {
        drawBox(context, cellX, info.y, cell.width, info.height);
        const textWidth = cell.width - 80;
        context.textAlign = "left";
        context.fillStyle = colors.muted;
        context.font = `700 34px ${mono}`;
        context.fillText(cell.label, cellX + 40, info.y + 80);

        context.fillStyle = colors.ink;
        context.font = `800 68px ${sans}`;
        let valueLines = wrapText(context, cell.value, textWidth);
        if (valueLines.length > 1) {
            context.font = `800 52px ${sans}`;
            valueLines = wrapText(context, cell.value, textWidth).slice(0, 2);
        }
        const lineHeight = valueLines.length > 1 ? 66 : 80;
        valueLines.forEach((line, index) => {
            context.fillText(line, cellX + 40, info.y + 180 + index * lineHeight, textWidth);
        });

        if (cell.detail) {
            context.fillStyle = colors.muted;
            context.font = `400 34px ${sans}`;
            wrapText(context, cell.detail, textWidth)
                .slice(0, 2)
                .forEach((line, index) => {
                    context.fillText(
                        line,
                        cellX + 40,
                        info.y + 180 + valueLines.length * lineHeight - 10 + index * 44,
                        textWidth,
                    );
                });
        }

        cellX += cell.width + info.gap;
    }

    // QR mở thiệp riêng.
    const qr = { x: card.margin, y: 2500, size: 720 };
    drawBox(context, qr.x, qr.y, qr.size + 60, qr.size + 60, colors.acid);
    context.drawImage(
        await loadImage(await qrDataUrl(inviteUrl, qr.size)),
        qr.x + 30,
        qr.y + 30,
        qr.size,
        qr.size,
    );

    const copyX = qr.x + qr.size + 150;
    const copyWidth = card.width - card.margin - copyX;
    context.textAlign = "left";
    context.fillStyle = colors.ink;
    context.font = `800 70px ${sans}`;
    wrapText(context, "Quét mã để mở thiệp riêng của bạn", copyWidth).forEach((line, index) => {
        context.fillText(line, copyX, qr.y + 80 + index * 88);
    });
    context.fillStyle = colors.muted;
    context.font = `400 40px ${sans}`;
    wrapText(
        context,
        `Trên web có đồng hồ đếm ngược và bản đồ. Bạn cũng có thể tải file này lên ${new URL(inviteUrl).host}/homie.`,
        copyWidth,
    ).forEach((line, index) => {
        context.fillText(line, copyX, qr.y + 290 + index * 56);
    });

    // QR chỉ đường, đặt xa QR chính để máy quét không nhầm.
    if (directionsUrl) {
        const map = { size: 300 };
        const mapX = card.width - card.margin - map.size - 40;
        const mapY = qr.y + qr.size + 60 - map.size - 40;
        drawBox(context, mapX, mapY, map.size + 40, map.size + 40);
        context.drawImage(
            await loadImage(await qrDataUrl(directionsUrl, map.size)),
            mapX + 20,
            mapY + 20,
            map.size,
            map.size,
        );
        context.textAlign = "right";
        context.fillStyle = colors.blue;
        context.font = `700 64px ${doodle}`;
        context.fillText("chỉ đường →", mapX - 40, mapY + map.size / 2 + 40);
    }

    context.textAlign = "center";
    context.fillStyle = colors.muted;
    context.font = `700 30px ${mono}`;
    context.fillText("MADE WITH CODE + CHAOS + FRIENDSHIP", centerX, card.height - 130);

    return new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Không tạo được ảnh."))), "image/png"),
    );
}

/** Đóng gói thiệp PNG thành PDF khổ A4. */
export async function inviteCardToPdf(png: Blob) {
    const { PDFDocument, PageSizes } = await import("pdf-lib");
    const pdf = await PDFDocument.create();
    const [width, height] = PageSizes.A4;
    const page = pdf.addPage([width, height]);
    const image = await pdf.embedPng(await png.arrayBuffer());
    page.drawImage(image, { x: 0, y: 0, width, height });

    const bytes = (await pdf.save()) as Uint8Array<ArrayBuffer>;
    return new Blob([bytes], { type: "application/pdf" });
}

export function downloadBlob(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
