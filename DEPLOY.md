# Triển khai lên VPS CentOS 9 (Node.js + MongoDB đã cài sẵn)

Domain thật của bạn:

| | |
| --- | --- |
| FrontEnd | `https://ludaitruongpmtl.com` (+ `www.ludaitruongpmtl.com`) |
| Backend / API | `https://api.ludaitruongpmtl.com` |
| Database Mongo | `ludaitruong` |

Cả 2 domain đã trỏ sẵn về IP VPS qua Cloudflare (proxy bật - đám mây cam).
FrontEnd và Backend là **hai domain khác nhau** (không chung path như mẫu cũ),
nên Backend phải bật CORS cho đúng domain FrontEnd — xem `FRONTEND_URL` ở
bước 2.

Backend (Sails, cổng nội bộ 1337) và FrontEnd (Next.js, cổng nội bộ 3000)
chạy như hai tiến trình Node riêng, quản lý bằng PM2; Nginx đứng trước mỗi
domain, route sang đúng cổng — xem `deploy/ludaitruongpmtl.com.conf`.

## 0. Kiểm tra trước (một lần)

```bash
node -v        # cần >= 20 (Next.js 16 không chạy được trên Node cũ)
systemctl status mongod   # Mongo phải đang chạy (active (running))
```

## 1. Lấy code lên VPS

```bash
git clone <repo-url> ludaitruongpmtl
cd ludaitruongpmtl
```

## 2. Backend

```bash
cd Backend
npm ci
cp .env.example .env
nano .env
```

Điền tối thiểu trong `.env` (`.env.example` đã điền sẵn domain thật, chỉ cần sửa 2 dòng bí mật):

- `JWT_ENCRYPT_KEY` — tạo bằng `openssl rand -hex 32`, **không dùng giá trị mẫu**
- `MONGO_URL` — nếu Mongo có bật auth thì thêm `user:password@` vào URL; không thì giữ nguyên `mongodb://127.0.0.1:27017/ludaitruong`

Các biến còn lại (Google/Facebook login, reCAPTCHA...) để trống thì tính năng
tương ứng tự tắt, không chặn app chạy — điền sau khi cần.

## 3. FrontEnd

```bash
cd ../FrontEnd
npm ci
cp .env.example .env.production
```

`.env.example` đã điền sẵn `NEXT_PUBLIC_API_URL=https://api.ludaitruongpmtl.com`
và `NEXT_PUBLIC_SITE_URL=https://ludaitruongpmtl.com` — chỉ cần kiểm tra lại
cho đúng, không phải sửa gì thêm trừ khi cần bật Google/Facebook login hay
webhook revalidate.

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

## 5. Nginx + HTTPS (CentOS 9: dnf + firewalld + SELinux)

```bash
# Cài Nginx + certbot (certbot cần kho EPEL, CentOS không có sẵn)
sudo dnf install -y nginx epel-release
sudo dnf install -y certbot python3-certbot-nginx
sudo systemctl enable --now nginx

# Mở cổng 80/443 trên firewalld (KHÔNG mở 1337/3000 - để nội bộ, Nginx proxy)
sudo firewall-cmd --permanent --add-service=http --add-service=https
sudo firewall-cmd --reload

# QUAN TRỌNG trên CentOS/RHEL: SELinux mặc định CHẶN Nginx kết nối ra cổng
# Node nội bộ (1337/3000) dù firewalld đã mở - thiếu dòng này thì mọi request
# qua Nginx đều trả 502 Bad Gateway.
sudo setsebool -P httpd_can_network_connect 1

# Copy cấu hình 2 domain (đã viết sẵn đúng domain thật, không cần sửa tên miền)
sudo cp deploy/ludaitruongpmtl.com.conf /etc/nginx/conf.d/ludaitruongpmtl.com.conf
sudo nginx -t && sudo systemctl reload nginx

# Cấp SSL cho cả 2 domain - certbot tự thêm "listen 443 ssl" vào từng server block
sudo certbot --nginx -d ludaitruongpmtl.com -d www.ludaitruongpmtl.com -d api.ludaitruongpmtl.com
```

Sau khi certbot chạy xong, vào Cloudflare đổi **SSL/TLS mode sang "Full (strict)"**
(không để "Flexible" — dễ gây lặp chuyển hướng HTTPS vì chặng Cloudflare↔VPS
lúc đó không có chứng chỉ thật để xác thực).

> `certbot --nginx` cấp chứng chỉ qua thử thách HTTP (cổng 80) - nếu Cloudflare
> đang có rule "Always Use HTTPS" hoặc Page Rule ép chuyển hướng HTTPS cho
> toàn site, thử thách này có thể không tới được origin và certbot báo lỗi
> "Invalid response"/timeout. Tắt tạm rule đó (hoặc đặt SSL/TLS mode về
> "Flexible" lúc xin chứng chỉ lần đầu) rồi bật lại sau khi certbot xong.

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
curl -I https://api.ludaitruongpmtl.com/v1/public/settings   # Backend, phải trả 200
curl -I https://ludaitruongpmtl.com/                           # FrontEnd, phải trả 200
```

Nếu 502: xem `pm2 logs` trước (app có chạy không), rồi mới nghi SELinux
(`sudo setsebool -P httpd_can_network_connect 1` ở bước 5) nếu app chạy bình
thường nhưng Nginx vẫn không proxy được.
