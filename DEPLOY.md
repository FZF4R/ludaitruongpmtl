# Triển khai lên VPS (Node.js + MongoDB đã cài sẵn)

Backend (Sails, cổng 1337) và FrontEnd (Next.js, cổng 3000) chạy như hai
tiến trình Node riêng, quản lý bằng PM2; Nginx đứng trước, route theo path
để cả hai dùng chung một domain — xem lý do trong `deploy/nginx.conf.example`.

## 1. Lấy code lên VPS

```bash
git clone <repo-url> buddhist-site
cd buddhist-site
```

## 2. Backend

```bash
cd Backend
npm ci
cp .env.example .env
```

Mở `.env`, điền tối thiểu:

- `MONGO_URL` — Mongo đã cài sẵn trên VPS, ví dụ `mongodb://127.0.0.1:27017/buddhist_production`
- `JWT_ENCRYPT_KEY` — tạo bằng `openssl rand -hex 32`, **không dùng giá trị mẫu**
- `FRONTEND_URL` — domain thật (bỏ trống được nếu dùng chung domain qua Nginx như hướng dẫn ở bước 4)

Các biến còn lại (Google/Facebook login, reCAPTCHA...) để trống thì tính năng
tương ứng tự tắt, không chặn app chạy — điền sau khi cần.

## 3. FrontEnd

```bash
cd ../FrontEnd
npm ci
cp .env.example .env.production
```

Mở `.env.production`, điền:

- `NEXT_PUBLIC_API_URL` và `NEXT_PUBLIC_SITE_URL` — domain thật, ví dụ `https://example.com`
  (không phải `http://localhost:1337`)
- `CONTENT_SOURCE=api` — nếu để `mock` thì trang chạy nhưng hiện dữ liệu mẫu

```bash
npm run build
```

Build lại (`npm run build`) mỗi khi đổi code hoặc sửa biến `NEXT_PUBLIC_*` —
các biến này được nhúng cứng vào bundle lúc build, sửa `.env.production` rồi
không build lại sẽ không có tác dụng.

## 4. Chạy bằng PM2

```bash
cd ..   # về thư mục gốc repo, nơi có ecosystem.config.js
npm install -g pm2   # nếu VPS chưa có
pm2 start ecosystem.config.js
pm2 save
pm2 startup          # lệnh này in ra 1 dòng lệnh khác — chạy nốt dòng đó để
                      # PM2 tự khởi động lại cùng VPS sau khi reboot
```

Kiểm tra: `pm2 status`, `pm2 logs backend`, `pm2 logs frontend`.

## 5. Nginx + HTTPS

```bash
sudo apt install nginx certbot python3-certbot-nginx
sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/example.com
sudo nano /etc/nginx/sites-available/example.com   # đổi "example.com" thành domain thật
sudo ln -s /etc/nginx/sites-available/example.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d example.com -d www.example.com
```

## 6. Deploy bản cập nhật sau này

```bash
git pull
cd Backend  && npm ci && cd ..
cd FrontEnd && npm ci && npm run build && cd ..
pm2 reload ecosystem.config.js   # zero-downtime, không rớt request đang chạy
```

Chỉ sửa code mà không đổi `package.json`/`.env*` thì bỏ qua `npm ci`, chỉ cần
build lại FrontEnd và `pm2 reload`.

## Kiểm tra sau khi deploy

```bash
curl -I https://example.com/v1/public/settings   # Backend qua Nginx, phải trả 200
curl -I https://example.com/                      # FrontEnd qua Nginx, phải trả 200
```
