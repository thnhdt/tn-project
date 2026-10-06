import { InteractiveStickers } from "../interactive-stickers";
import { CountdownClock } from "./countdown-clock";
import { GifMachine } from "./gif-machine";
import {
    EventInfo,
    Footer,
    Hero,
    Journey,
    Memories,
    Story,
    Toolbar,
} from "./sections";

/**
 * Thứ tự các khối trên trang chủ. Muốn ẩn/đổi chỗ một khối: sửa danh sách này.
 * Nội dung chữ nằm trong `app/site-content.ts`.
 */
export function HomePage() {
    return (
        <main className="theme-shell" data-theme="notebook">
            <InteractiveStickers />
            <Toolbar />
            <Hero />
            <EventInfo />
            <CountdownClock />
            <Journey />
            <Story />
            <Memories />
            <GifMachine />
            <Footer />
        </main>
    );
}
