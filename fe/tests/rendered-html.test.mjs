import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

/** Đọc trang HTML tĩnh mà `npm run build` xuất ra `dist/client`. */
function readPage(fileName) {
    return readFile(new URL(`../dist/client/${fileName}`, import.meta.url), "utf8");
}

test("exports the graduation theme lab as static HTML", async () => {
    const html = await readPage("index.html");
    assert.match(html, /Blue Notebook — Lễ Tốt Nghiệp Lê Thành Đạt/i);
    assert.match(html, /LÊ THÀNH/);
    assert.match(html, /Cử nhân Khoa học Máy tính/);
    assert.match(html, /BLUE_NOTEBOOK/);
    assert.match(html, /SAVE THE DATE/);
    assert.match(html, /ĐỊA ĐIỂM/);
    assert.doesNotMatch(html, /THEME_LOCKED/);
    assert.doesNotMatch(html, /backdrop-filter/);
    assert.match(html, /QUICK SKETCH/);
    assert.match(html, /4 NĂM TRONG 1 DÒNG/);
    assert.match(html, /BUILD PASSED/);
    assert.match(html, /1 TẤM BẰNG!/);
    assert.match(html, /ĐẾM NGƯỢC/);
    assert.match(html, /01\.11\.2026/);
    assert.match(html, /NGÀY/);
    assert.match(html, /GIÂY/);
    assert.match(html, /BỐC MỘT CHIẾC/);
    assert.match(html, /BỐC GIF NGẪU NHIÊN/);
    assert.match(html, /POWERED BY GIPHY/);
    assert.match(html, /STICKERS: ON • KÉO \+ NÉM/);
    assert.match(html, /Sticker SHIPPED!/);
    assert.match(html, /Sticker drag me!/);
    assert.doesNotMatch(html, /Desktop 2004/);
    assert.doesNotMatch(html, /Meme Compiler/);
    assert.doesNotMatch(html, /codex-preview/);
    assert.doesNotMatch(html, /react-loading-skeleton/);
});

test("exports the protected guest dashboard gate", async () => {
    const html = await readPage("dev.html");
    assert.match(html, /Guest List\.dev — Lê Thành Đạt/i);
    assert.match(html, /Đang kiểm tra phiên quản trị/i);
    assert.doesNotMatch(html, /DATABASE_RECORDS/);
});

test("exports the QR homie gate without any login form", async () => {
    const html = await readPage("homie.html");
    assert.match(html, /Thiệp của bạn/);
    assert.match(html, /QUÉT BẰNG CAMERA/);
    assert.match(html, /TẢI ẢNH \/ PDF CÓ QR/);
    assert.match(html, /accept="image\/\*,application\/pdf,\.pdf"/);
    assert.doesNotMatch(html, /@username/);
    assert.doesNotMatch(html, /type="password"/);
});

test("exports the private invitation without embedding any guest data", async () => {
    const html = await readPage("homie/invite.html");
    assert.match(html, /Đang mở thiệp của bạn/);
    assert.doesNotMatch(html, /PERSONAL_MESSAGE DELIVERED/);
});

test("the static bundle never contains server-side secrets", async () => {
    const { readdir } = await import("node:fs/promises");
    const assetsUrl = new URL("../dist/client/assets/", import.meta.url);
    const scripts = (await readdir(assetsUrl)).filter((name) => name.endsWith(".js"));
    assert.ok(scripts.length > 0);

    for (const name of scripts) {
        const source = await readFile(new URL(name, assetsUrl), "utf8");
        assert.ok(
            !/sb_secret_\w{8,}|api\.giphy\.com|api\.telegram\.org|localhost:3001/.test(source),
            `${name} must not reference server-only services`,
        );
    }
});

test("every configured font explicitly supports Vietnamese", async () => {
    const fontDataUrl = new URL(
        "../node_modules/next/dist/compiled/@next/font/dist/google/font-data.json",
        import.meta.url,
    );
    const fontData = JSON.parse(await readFile(fontDataUrl, "utf8"));

    for (const fontName of [
        "Be Vietnam Pro",
        "Roboto Mono",
        "Shantell Sans",
    ]) {
        assert.ok(
            fontData[fontName]?.subsets?.includes("vietnamese"),
            `${fontName} must declare the Vietnamese subset`,
        );
    }
});
