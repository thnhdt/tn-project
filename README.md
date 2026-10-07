# Graduation Invitation — Lê Thành Đạt

Website là trang tĩnh, mọi dữ liệu đi thẳng từ trình duyệt đến Supabase. Project
gồm hai phần:

- `fe`: giao diện Blue Notebook và thiệp tốt nghiệp, build ra HTML/JS tĩnh.
- `be/supabase`: migration (RLS, hàm RPC) và Edge Function chạy trên Supabase.
  `be/scripts` chứa các lệnh áp dụng migration, seed và cấp quyền quản trị.

## Quy tắc typography

Mọi font trong giao diện phải hỗ trợ đầy đủ tiếng Việt. Theme hiện dùng:

- Be Vietnam Pro cho nội dung và phong cách doodle.
- Roboto Mono cho terminal, code và nhãn kỹ thuật.
- Shantell Sans cho chữ viết tay, doodle và ghi chú vui nhộn.

Không thêm font mới nếu chưa xác minh font đó có subset `vietnamese`.

Yêu cầu Node.js 22.13 trở lên. Project có `.nvmrc` để dùng Node.js 24:

```bash
nvm use
```

## Chạy frontend

```bash
cd fe
npm run dev
```

Frontend mặc định chạy tại `http://localhost:3000`.

Trang chính dùng cố định theme Blue Notebook với phong cách sketchnote,
hand-drawn và sketchy. Khu vực cuối trang lấy GIF tốt nghiệp ngẫu nhiên qua
Edge Function `giphy`, hiển thị attribution GIPHY và cho phép tải file GIF theo ID. Một lớp
sticker tương tác cho phép kéo, ném, click để làm nảy và tắt/bật theo từng phiên
trình duyệt. Trên mobile, số sticker được tự giảm để giữ hiệu năng.

Dashboard quản lý khách mời:

```text
http://localhost:3000/dev
```

Đây là trang duy nhất cần đăng nhập, dùng Supabase Auth email/password ngay
trên trình duyệt. Dashboard đọc và ghi bảng `invitations` trực tiếp qua
Supabase; Row Level Security chỉ cho phép user có id nằm trong bảng `admins`.
Tài khoản khác đăng nhập được cũng không đọc hay ghi được dòng nào.

Thêm, sửa, xoá khách, tải ảnh chụp chung, tạo QR và tải thiệp mời khổ A4 (PNG
hoặc PDF) đều làm trên dashboard `/dev`.

Thiệp A4 in sẵn tên khách, lời mời riêng, ngày giờ, địa điểm, QR mở thiệp và
một QR chỉ đường. Ảnh chụp chung chỉ hiện trên web, không in vào thiệp.

## Sửa giao diện

- Nội dung chữ của trang chủ (tên, ngày đếm ngược, địa điểm, link bản đồ, kỷ
  niệm…) nằm trong `fe/app/site-content.ts`.
- Thứ tự các khối trên trang chủ nằm trong `fe/app/home/home-page.tsx`. Mỗi khối
  là một component trong `fe/app/home/`.
- Màu sắc dùng chung là biến CSS trong `:root` ở `fe/app/globals.css`.
- Giờ, địa điểm, địa chỉ và link bản đồ của buổi lễ là `ceremony` trong
  `fe/app/site-content.ts`. Có địa chỉ thì trang thiệp riêng hiện bản đồ và
  thiệp A4 có thêm QR chỉ đường.
- Bố cục thiệp A4 khi tải về nằm trong `fe/app/lib/qr-card.ts`.

## Vào thiệp riêng bằng QR

Trang `/homie` không có đăng nhập. Mỗi khách có một mã `qr_code`: mặc định là
mã ngẫu nhiên 128-bit, hoặc mã tự đặt trên dashboard (8–64 ký tự chữ không
dấu, số, `-`, `_`; ví dụ `mybeautifuldearlover`). Mã này được in trong QR dưới
dạng link `<site>/homie?code=<mã>`. Mã tự đặt càng dễ đoán thì người lạ càng dễ
mở được thiệp đó.
Khách có ba cách mở thiệp:

1. Quét QR bằng camera điện thoại. Link sẽ mở thẳng vào trang.
2. Bấm "Quét bằng camera" ngay trên trang `/homie`.
3. Tải lên ảnh hoặc file PDF có QR. File được đọc ngay trên trình duyệt,
   không gửi lên server.

Trình duyệt gửi mã cho hàm RPC `open_invitation`. Hàm chỉ trả về đúng một lời
mời khớp mã; khách không có quyền đọc bảng `invitations` nên không thể liệt kê
khách khác. Mã hợp lệ được nhớ trong `localStorage` của máy khách để trang
`/homie/invite` mở lại thiệp mà không cần quét lại. Trang này hiện lời mời,
ảnh chụp chung (nếu có), đồng hồ đếm ngược, thời gian, địa điểm và bản đồ.

QR là mã tĩnh, nên ai có ảnh QR cũng mở được thiệp. Nếu QR bị lộ, bấm
**Tạo mã mới** trên dashboard; QR cũ sẽ hết hiệu lực ngay.

## Chuẩn bị Supabase

Các secret đặt trong `.env.local` ở thư mục gốc (xem `be/.env.example`) và
không được commit. Frontend chỉ cần hai giá trị công khai trong
`fe/.env.local`: `NEXT_PUBLIC_SUPABASE_URL` và
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Không bao giờ đặt
`SUPABASE_SECRET_KEY` vào frontend.

1. Tạo user quản trị trong Supabase Dashboard → Authentication, dùng đúng email
   khai báo ở `ADMIN_EMAIL`. Nên tắt "Allow new users to sign up".
2. Áp dụng migration, seed dữ liệu test (chỉ ở môi trường local) và cấp quyền
   quản trị:

```bash
cd be
npm install
npm run db:migrate
npm run db:seed
npm run db:admin
```

3. Deploy Edge Function và khai báo secret cho chúng:

```bash
cd be
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase secrets set GIPHY_API_KEY=... TELE_BOT_TOKEN=... CHAT_ID=... \
    TELEGRAM_WEBHOOK_SECRET=... SITE_URL=https://domain-cua-ban
npx supabase functions deploy giphy
npx supabase functions deploy telegram-bot
```

### Quyền truy cập trong database

Toàn bộ bảo mật nằm ở `be/supabase/migrations/008_static_site_access.sql` và
`009_invitation_photos.sql`:

| Đối tượng | Khách (`anon`) | Quản trị viên |
|---|---|---|
| `events` | không truy cập | đọc |
| `invitations` | không truy cập | đọc, thêm, sửa, xoá |
| `page_visits` | không truy cập | đọc |
| Ảnh trong bucket `invitation-photos` | xem khi biết đúng tên file | tải lên, xoá |
| `admins` | không truy cập | không truy cập |
| `client_errors` | không truy cập | không truy cập (chỉ Edge Function) |
| `open_invitation(code)` | gọi được | gọi được |
| `record_page_visit(...)` | gọi được | gọi được |

Khi sửa policy hoặc hàm RPC, hãy kiểm thử lại bằng cả ba vai: `anon`, user
thường và admin.

## Telegram bot

Edge Function `telegram-bot` là webhook của bot, chỉ trả lời đúng `CHAT_ID`:

- `/check`: kiểm tra `SITE_URL` còn phản hồi không.
- `/using`: tổng hợp lượt truy cập trong 12 giờ gần nhất từ bảng `page_visits`.

Sau khi deploy function, đặt `TELEGRAM_WEBHOOK_SECRET` (chuỗi ngẫu nhiên, trùng
với secret đã khai báo cho function) vào `.env.local` rồi trỏ webhook về nó:

```bash
cd be
npm run telegram:webhook
```

### Báo lỗi của khách

Edge Function `error-report` là webhook công khai: khi khách gặp lỗi (QR không
hợp lệ, không mở được thiệp, không lấy được GIF, lỗi JavaScript), trình duyệt
gọi vào đây, function ghi lỗi vào bảng `client_errors` rồi nhắn cho `CHAT_ID`
qua Telegram. Để bot không bị spam, mỗi visitor chỉ báo tối đa 5 lỗi và cả
website tối đa 20 tin trong 10 phút; lỗi trùng không báo lại. Lỗi khi chạy ở
`localhost` và trong dashboard `/dev` không được báo.

```bash
cd be
npx supabase functions deploy error-report
```

Function này dùng chung secret `TELE_BOT_TOKEN` và `CHAT_ID` với `telegram-bot`.

Không còn tiến trình monitor chạy nền nên bot không tự gửi cảnh báo downtime.
Nếu cần, dùng một dịch vụ uptime bên ngoài trỏ vào domain của website.

## Test

```bash
cd fe
npm test
```

`npm test` build website rồi kiểm tra các trang HTML tĩnh trong `dist/client`.

## QR test

`npm run db:seed` tạo 5 khách test với mã cố định, từ
`d0000000000000000000000000000001` đến `d0000000000000000000000000000005`.
Ví dụ: `http://localhost:3000/homie?code=d0000000000000000000000000000001`.
Các mã này dễ đoán nên chỉ dùng cho môi trường local, không seed lên
production.

## Deploy

`cd fe && npm run build` xuất website tĩnh ra `fe/dist/client`. Đưa thư mục này
lên bất kỳ dịch vụ host tĩnh nào (Cloudflare Pages, Netlify, GitHub Pages…).

- Đặt `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  **trước khi build**, vì giá trị này được nhúng vào bundle.
- Dịch vụ host phải phục vụ `/homie` bằng file `homie.html` (clean URL). Các
  dịch vụ kể trên đều làm sẵn việc này.
- Camera trên trang `/homie` chỉ hoạt động qua HTTPS (hoặc `localhost`).
- QR in trên thẻ chứa domain lúc tạo thẻ, nên hãy tải thẻ từ dashboard trên
  domain chính thức.

Theme preview hiện dùng khung ảnh bằng CSS. Khi có ảnh thật, có thể đặt ảnh tối ưu
trong `fe/public/images` cho phiên bản đầu. Supabase Storage chỉ cần thiết khi bật
upload ảnh từ người dùng hoặc khi thư viện ảnh lớn cần quản lý độc lập.
