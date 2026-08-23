# FrontEnd — giao diện web Phật pháp

Next.js 16 (App Router) + React 19 + Tailwind CSS 4, render phía máy chủ,
lấy dữ liệu từ API Sails ở `../Backend`.

## Chạy

```bash
npm install
cp .env.example .env.local
npm run dev          # http://localhost:3000
```

| Lệnh | Việc |
| --- | --- |
| `npm run dev` | Máy chủ phát triển |
| `npm run build` | Build production |
| `npm start` | Chạy bản đã build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Kiểm thử thuật toán lịch âm |

## Biến môi trường

| Biến | Ý nghĩa |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | URL công khai — dùng cho canonical, sitemap, OG |
| `NEXT_PUBLIC_API_URL` | Địa chỉ API Sails (mặc định `http://localhost:1337`) |
| `CONTENT_SOURCE` | `mock` (mặc định) hoặc `api` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Client ID Google — bỏ trống thì nút Google không hiện |
| `NEXT_PUBLIC_FACEBOOK_APP_ID` | App ID Facebook — bỏ trống thì nút Facebook không hiện |
| `REVALIDATE_SECRET` | Secret cho webhook `POST /api/revalidate` |

### `CONTENT_SOURCE=mock`

Backend nội dung (`Content`, `ContentCategory`, `LunarEvent`) chưa được dựng,
nên mặc định app đọc dữ liệu mẫu trong `lib/mock.ts`. Khi backend sẵn sàng, đổi
sang `CONTENT_SOURCE=api` — không component nào phải sửa, vì `lib/mock.ts` có
cùng hình dạng với hợp đồng API.

Tầng API **cố tình không tự rơi về mock khi gọi thật bị lỗi**. Một sự cố backend
trên production mà trang vẫn hiện nội dung giả là kiểu lỗi tệ nhất — không ai
phát hiện ra.

## Chiến lược render

Kiểm chứng bằng `npm run build`, cột `Revalidate` trong bảng route.

| Route | Kiểu | Chu kỳ |
| --- | --- | --- |
| `/` | Static + ISR | 5 phút |
| `/bai-viet`, `/kinh-sach`, `/bai-giang` | Static + ISR | 1 giờ |
| `/bai-viet/[slug]`, `/bai-giang/[slug]` | SSG + ISR | 1 giờ |
| `/kinh-sach/[slug]/[chuong]` | SSG + ISR | 1 giờ |
| `/danh-muc/[slug]` | SSG + ISR | 1 giờ |
| `/phat-lich/[nam]/[thang]` | SSG + ISR | 1 ngày |
| `/tim-kiem`, `/tai-khoan` | Động | không cache, `noindex` |
| `/dang-nhap`, `/hoan-thien-ho-so` | Động | không cache, `noindex` |

**Phân trang nằm ở route con** (`/bai-viet/trang/2`) chứ không phải `?page=2`.
Lý do: chỉ cần đọc `searchParams` là cả trang chuyển sang render động — kể cả
lượt truy cập trang 1, vốn chiếm gần hết traffic và là trang nhận backlink.

> Hệ quả: `trang` là slug dành riêng. Đừng đặt slug nội dung là `trang`.

Dự án dùng mô hình cache cũ (`export const revalidate`, `next: { revalidate, tags }`),
không bật cờ `cacheComponents` của Next 16.

## Làm mới nội dung khi admin đăng bài

Sails gọi webhook sau khi ghi DB:

```http
POST /api/revalidate
x-revalidate-secret: <REVALIDATE_SECRET>

{ "slug": "kinh-phap-cu", "type": "sutra" }
```

Không có webhook này thì bài mới phải chờ hết hạn ISR (tới 1 giờ) mới xuất hiện.

## Đăng nhập và hồ sơ Phật tử

```
/dang-nhap  ──►  SDK Google/Facebook mở popup, trả ACCESS token của họ
                 │
                 ▼
                 POST /v1/user/login/{google|facebook}
                 backend tự hỏi lại Google/Facebook xem token có thật không,
                 rồi phát access token của site + cờ isNewUser
                 │
      isNewUser ─┴─ false ──►  /tai-khoan
              │
              true
              ▼
      /hoan-thien-ho-so  ──►  POST /v1/user/profile  ──►  /tai-khoan
```

`isNewUser` là `!Users.profileCompleted` chứ không phải "tài khoản vừa được
tạo": bỏ dở form giữa chừng thì lần đăng nhập sau vẫn được hỏi lại.

Token của site lưu ở `localStorage` và gắn vào header `Authorization`. Cookie
`accessToken` mà Sails đặt kèm không dùng được — nó là `sameSite: strict` mà
API lại khác origin với trang. Đánh đổi và đường nâng cấp ghi ở đầu `lib/auth.ts`.

Bộ câu hỏi khảo sát có **hai nửa phải khớp nhau**: id ở `lib/survey.ts` và danh
sách trắng ở `Backend/config/survey.js`. Thêm lựa chọn ở một bên thôi thì nó bị
lọc lặng lẽ lúc lưu. Chữ hiển thị nằm ở `lib/dictionaries/*.json` cho cả bốn
ngôn ngữ.

## Cấu trúc

```
app/          route, metadata, sitemap, robots, webhook revalidate
components/
  ui/         nút, thẻ, badge, ô nhập — nền của hệ thiết kế
  auth/       đăng nhập mạng xã hội, form hồ sơ, màn hình tài khoản
  layout/     header, footer, đổi sáng/tối
  content/    thẻ nội dung, prose, breadcrumb, phân trang, mục lục
  media/      trình phát audio, nhúng video
  calendar/   lưới lịch âm
lib/
  api.ts      gọi Sails từ server, cấu hình cache và tag
  auth.ts     gọi Sails từ trình duyệt: đăng nhập, hồ sơ cá nhân
  survey.ts   cấu trúc bộ khảo sát (khớp Backend/config/survey.js)
  vietnam-address.ts  34 tỉnh/thành sau sáp nhập 2025
  mock.ts     dữ liệu mẫu (xoá khi backend xong)
  schema.ts   zod — DÙNG CHUNG với app mobile sau này
  lunar.ts    thuật toán lịch âm Hồ Ngọc Đức
  sanitize.ts làm sạch HTML, chỉ chạy trên server
  seo.ts      metadata + JSON-LD
tests/        kiểm thử lịch âm
```

## Ghi chú kỹ thuật

**Lịch âm.** `lib/lunar.ts` cài thuật toán Hồ Ngọc Đức, tính điểm sóc và trung
khí theo múi giờ **UTC+7**. Lịch âm Việt Nam khác lịch âm Trung Quốc ở đúng chỗ
này — mỗi năm có vài ngày hai lịch lệch nhau một ngày. Đừng thay bằng thư viện
lịch âm Trung Quốc. `npm test` kiểm tra round-trip 1.344 ngày, độ dài tháng âm và
mốc Tết Bính Ngọ 17/02/2026.

**XSS.** `bodyHtml` là HTML thô do admin nhập. `lib/sanitize.ts` lọc bằng
allow-list và có `import "server-only"` để không bao giờ lọt vào bundle client.
Đây là lớp phòng thủ **thứ hai** — lớp thứ nhất phải nằm ở Sails, lọc lúc **ghi**,
nếu không app mobile và mọi client khác đều nhận nguyên payload độc.

**Client Component.** Header (menu mobile), nút đổi sáng/tối, trình phát audio,
bộ đánh dấu "hôm nay" trên lịch, và toàn bộ phần tài khoản (`components/auth/`).
Mọi thứ còn lại render trên server. Toàn văn bài giảng nằm ở Server Component
bao ngoài trình phát — không có nó thì trang bài giảng gần như vô hình với bộ
máy tìm kiếm.

**Font.** Literata (thân bài, tiêu đề) + Be Vietnam Pro (giao diện), tải qua
`next/font` nên tự host, không có request chặn render sang Google. Cả hai đều có
bộ dấu tiếng Việt đầy đủ — đây là tiêu chí loại trừ đầu tiên khi chọn font.

**Giao diện tối.** Toàn bộ màu đi qua CSS variable. `next-themes` gắn class
`.light`/`.dark`, và có thêm khối `@media (prefers-color-scheme: dark)` lo giai
đoạn trước khi script chạy hoặc khi JavaScript bị chặn.

## Chưa làm

- Đăng nhập bằng tài khoản/mật khẩu và màn hình đăng ký (backend đã có
  `POST /v1/user/login`, `/v1/user/register`); hiện chỉ có Google/Facebook
- Bước nhập mã 2FA sau khi đăng nhập mạng xã hội
- Trang quản trị nội dung
- OG image động (`opengraph-image.tsx`)
- RSS (`/rss.xml` đã có link ở footer nhưng chưa có route)
- Tải bài giảng về nghe offline
