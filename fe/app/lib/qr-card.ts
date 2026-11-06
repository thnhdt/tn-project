import QRCode from "qrcode";
import { loveCardStickers } from "./love-card-stickers";
import { ceremony, graduate } from "../site-content";
import {
    ceremonyAddress,
    ceremonyDate,
    ceremonyLocation,
    ceremonyTime,
    directionsUrl,
} from "./ceremony";
import { fallbackCardMessage } from "./invite-lines";

/** Thiệp mời khổ A4 ở 300 dpi. Muốn đổi bố cục thiệp tải về: sửa file này. */
const card = { width: 2480, height: 3508, margin: 220 };
const palettes = {
    blue: {
        ink: "#082d72",
        blue: "#0868ff",
        acid: "#d9ff51",
        paper: "#fffdf7",
        grid: "#dce8f8",
        muted: "#5d77a1",
        white: "#ffffff",
    },
    discord: {
        ink: "#23243d",
        blue: "#5865f2",
        acid: "#b8f5d8",
        paper: "#f4f3ff",
        grid: "#e1defa",
        muted: "#66658a",
        white: "#ffffff",
    },
    /** Thiệp hồng dành cho người thương. */
    love: {
        ink: "#7a0f45",
        blue: "#ff2f86",
        acid: "#ffd84d",
        paper: "#fff6fa",
        grid: "#ffd9e8",
        muted: "#b0607f",
        white: "#ffffff",
    },
};
let colors = palettes.blue;

type CardGuest = {
    displayName: string;
    personalMessage: string;
    themeVariant?: string;
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

/** Mũi tên vẽ tay: đường cong từ `from` qua `bend` tới `to`, đầu mũi tên ở `to`. */
function drawArrow(
    context: CanvasRenderingContext2D,
    from: [number, number],
    bend: [number, number],
    to: [number, number],
) {
    const angle = Math.atan2(to[1] - bend[1], to[0] - bend[0]);
    const head = 56;

    context.strokeStyle = colors.blue;
    context.lineWidth = 11;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();
    context.moveTo(from[0], from[1]);
    context.quadraticCurveTo(bend[0], bend[1], to[0], to[1]);
    context.stroke();
    context.beginPath();
    context.moveTo(to[0] - head * Math.cos(angle - 0.5), to[1] - head * Math.sin(angle - 0.5));
    context.lineTo(to[0], to[1]);
    context.lineTo(to[0] - head * Math.cos(angle + 0.5), to[1] - head * Math.sin(angle + 0.5));
    context.stroke();
    context.lineCap = "butt";
    context.lineJoin = "miter";
}

/** Trái tim kiểu sticker (viền đậm), tâm tại (x, y). */
function drawHeart(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    rotation: number,
    fill: string,
) {
    context.save();
    context.translate(x, y);
    context.rotate(rotation);
    context.scale(size / 100, size / 100);
    context.beginPath();
    context.moveTo(0, 38);
    context.bezierCurveTo(-70, -8, -42, -62, 0, -26);
    context.bezierCurveTo(42, -62, 70, -8, 0, 38);
    context.closePath();
    context.fillStyle = fill;
    context.fill();
    context.strokeStyle = colors.ink;
    context.lineWidth = 7;
    context.lineJoin = "round";
    context.stroke();
    context.restore();
}

/** Vẽ thiệp mời A4 của một khách (lời mời, thời gian, địa điểm, QR), trả về PNG. */
export async function renderInviteCard(guest: CardGuest, inviteUrl: string) {
    const love = guest.themeVariant === "love";
    const discord = guest.themeVariant === "discord";
    colors = love ? palettes.love : discord ? palettes.discord : palettes.blue;
    const sans = fontFamily("--font-be-vietnam");
    const mono = fontFamily("--font-roboto-mono");
    const doodle = fontFamily("--font-doodle");
    // Khách không có lời nhắn riêng thì in lời mời chung.
    const message = guest.personalMessage.trim() || fallbackCardMessage;
    const sample = `${ceremony.title} ${guest.displayName} ${message}`;
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

    if (love) {
        const hearts: [number, number, number, number, string][] = [
            [300, 420, 120, -0.3, colors.blue],
            [2190, 400, 150, 0.25, colors.blue],
            [2060, 560, 80, -0.2, colors.acid],
            [420, 600, 70, 0.3, colors.white],
            [520, 900, 110, -0.25, colors.acid],
            [1830, 800, 60, -0.4, colors.white],
        ];
        for (const [x, y, size, rotation, fill] of hearts) {
            drawHeart(context, x, y, size, rotation, fill);
        }
    }

    // Tiêu đề buổi lễ.
    context.textBaseline = "alphabetic";
    context.textAlign = "left";
    context.fillStyle = colors.blue;
    context.font = `700 40px ${mono}`;
    context.fillText(discord ? "# GRADUATION-PARTY / PRIVATE SERVER" : "GRADUATION_INVITE.PDF", card.margin, 240);
    context.textAlign = "right";
    context.fillText(graduate.badge, card.width - card.margin, 240);

    context.textAlign = "center";
    context.fillStyle = colors.ink;
    context.font = `700 170px ${doodle}`;
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
    context.fillText(love ? "Thương mời ♥" : discord ? "Hội bạn ơi, lên kèo!" : "Thân mời", centerX, 860);
    context.font = `700 150px ${doodle}`;
    const nameWidth = Math.min(context.measureText(guest.displayName).width, contentWidth);
    context.fillStyle = colors.acid;
    context.fillRect(centerX - nameWidth / 2 - 30, 960, nameWidth + 60, 70);
    context.fillStyle = colors.ink;
    context.fillText(guest.displayName, centerX, 1010, contentWidth);

    // Lá thư riêng: tự giảm cỡ chữ cho tới khi lời mời vừa khung.
    const letter = { x: card.margin, y: 1120, width: contentWidth, height: 720, padding: 70 };
    drawBox(context, letter.x, letter.y, letter.width, letter.height);
    context.textAlign = "left";
    context.fillStyle = colors.muted;
    context.font = `700 34px ${mono}`;
    context.fillText(
        discord ? `ĐẠT → @${guest.displayName.toLocaleUpperCase("vi")}` : `TO: ${guest.displayName.toLocaleUpperCase("vi")}`,
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
        lines = wrapText(context, message, letter.width - letter.padding * 2);
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
    const info = { y: 1930, height: 330, gap: 40 };
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

    // QR giữ vuông để dễ quét; khung oval có nét khoanh tay chồng nhẹ.
    const qr = { x: 740, y: 2840, size: 500, radiusX: 430, radiusY: 330 };
    context.save();
    context.translate(qr.x, qr.y);
    context.lineCap = "round";
    for (let index = 0; index < 16; index += 1) {
        const accent = index % 3 === 2;
        const angle = (index * Math.PI) / 8;
        const radius = 1 / Math.sqrt(
            (Math.cos(angle) / qr.radiusX) ** 2 + (Math.sin(angle) / qr.radiusY) ** 2,
        );
        const from = radius + 48 + (index % 4 === 3 ? 10 : 0);
        context.save();
        context.rotate((index * Math.PI) / 8);
        context.strokeStyle = accent ? colors.blue : colors.ink;
        context.lineWidth = accent ? 14 : 11;
        context.beginPath();
        context.moveTo(from, 0);
        context.lineTo(from + (accent ? 62 : 42), 0);
        context.stroke();
        context.restore();
    }
    context.lineCap = "round";
    context.rotate(-0.04);
    context.fillStyle = colors.white;
    context.strokeStyle = colors.ink;
    context.lineWidth = 9;
    context.beginPath();
    context.ellipse(0, 0, qr.radiusX, qr.radiusY, 0, 0, Math.PI * 2);
    context.fill();
    // Đường cong lệch nhẹ, có đoạn vượt nét như khoanh bằng bút mực.
    context.beginPath();
    context.moveTo(420, -38);
    context.bezierCurveTo(404, -228, 210, -342, -22, -330);
    context.bezierCurveTo(-268, -320, -442, -194, -430, 14);
    context.bezierCurveTo(-418, 226, -220, 342, 24, 328);
    context.bezierCurveTo(276, 316, 452, 184, 426, -42);
    context.bezierCurveTo(422, -92, 404, -134, 380, -164);
    context.stroke();
    context.strokeStyle = colors.blue;
    context.lineWidth = 5;
    context.beginPath();
    context.moveTo(-342, 208);
    context.bezierCurveTo(-148, 390, 226, 364, 390, 160);
    context.bezierCurveTo(462, 72, 452, -70, 410, -132);
    context.stroke();
    context.restore();
    context.drawImage(
        await loadImage(await qrDataUrl(inviteUrl, qr.size)),
        qr.x - qr.size / 2,
        qr.y - qr.size / 2,
        qr.size,
        qr.size,
    );

    const host = new URL(inviteUrl).host;
    const copyX = 1350;
    const copyWidth = card.width - card.margin - copyX - (directionsUrl ? 400 : 0);
    context.textAlign = "left";
    context.fillStyle = colors.blue;
    context.font = `700 92px ${doodle}`;
    context.fillText("quét link này nhaaa", copyX, 2540, card.width - card.margin - copyX);
    context.fillStyle = colors.ink;
    context.font = `700 58px ${doodle}`;
    context.fillText("(không có vi rút đâu!)", copyX + 20, 2632, card.width - card.margin - copyX);

    context.font = `800 60px ${sans}`;
    context.fillText("truy cập web", copyX, 2960, copyWidth);
    context.font = `700 76px ${mono}`;
    const hostWidth = Math.min(context.measureText(host).width, copyWidth);
    context.fillStyle = colors.acid;
    context.fillRect(copyX - 16, 3018, hostWidth + 32, 62);
    context.fillStyle = colors.ink;
    context.fillText(host, copyX, 3064, copyWidth);
    context.fillStyle = colors.blue;
    context.font = `700 80px ${doodle}`;
    context.fillText("để vàooo", copyX, 3176, copyWidth);
    context.fillStyle = colors.muted;
    context.font = `400 34px ${sans}`;
    wrapText(context, `Hoặc tải file này lên ${host}/homie.`, copyWidth).forEach((line, index) => {
        context.fillText(line, copyX, 3256 + index * 46, copyWidth);
    });

    drawArrow(context, [1620, 2690], [1500, 2800], [1262, 2760]);
    drawArrow(context, [1320, 3110], [1250, 3170], [1160, 3112]);
    drawArrow(context, [250, 2400], [370, 2400], [396, 2502]);
    drawArrow(context, [250, 3290], [290, 3190], [394, 3180]);
    drawArrow(context, [1010, 2330], [1060, 2400], [940, 2392]);

    // QR chỉ đường, đặt xa QR chính để máy quét không nhầm.
    if (directionsUrl) {
        const map = { size: 300 };
        const mapX = card.width - card.margin - map.size - 40;
        const mapY = 3330 - map.size - 40;
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
        context.font = `700 56px ${doodle}`;
        context.fillText("chỉ đường ↓", card.width - card.margin, mapY - 36);
    }

    if (love) {
        const stickers = await Promise.all(loveCardStickers.map(loadImage));
        // Chia đều hai lề; sticker có thể đè lên viền hộp nhưng tránh vùng chữ/QR.
        // Kích thước bằng 180% bản đầu, góc nghiêng vẫn giới hạn ±12°.
        stickers.forEach((sticker, index) => {
            const side = index % 2;
            const count = Math.ceil((stickers.length - side) / 2);
            const row = Math.floor(index / 2);
            const diagonal = (120 + Math.random() * 40) * 1.8;
            const scale = diagonal / Math.hypot(sticker.naturalWidth, sticker.naturalHeight);
            const width = sticker.naturalWidth * scale;
            const height = sticker.naturalHeight * scale;
            context.save();
            context.translate(side ? card.width - 145 : 145, 420 + row * (2750 / Math.max(count - 1, 1)));
            context.rotate((Math.random() * 24 - 12) * Math.PI / 180);
            context.drawImage(sticker, -width / 2, -height / 2, width, height);
            context.restore();
        });
    }

    context.textAlign = "center";
    context.fillStyle = colors.muted;
    context.font = `700 30px ${mono}`;
    context.fillText(
        love ? "MADE WITH CODE + CHAOS + LOVE ♥" : discord ? "VOICE CHAT → GẶP NHAU NGOÀI ĐỜI / HỘI BẠN THÂN" : "MADE WITH CODE + CHAOS + FRIENDSHIP",
        centerX,
        card.height - 130,
    );

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
