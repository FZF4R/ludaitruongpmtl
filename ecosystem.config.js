/**
 * Cấu hình PM2 cho cả Backend (Sails) và FrontEnd (Next.js) trên VPS.
 *
 * Trước khi start lần đầu (hoặc sau mỗi lần đổi code):
 *   cd Backend  && npm ci && cp -n .env.example .env   # rồi điền .env
 *   cd FrontEnd && npm ci && cp -n .env.example .env.production && npm run build
 *
 * Start / áp bản build mới / xem log:
 *   pm2 start ecosystem.config.js
 *   pm2 reload ecosystem.config.js   # reload không rớt request (zero-downtime)
 *   pm2 logs
 *   pm2 save && pm2 startup          # tự chạy lại sau khi VPS reboot
 */

module.exports = {
  apps: [
    {
      name: 'backend',
      cwd: './Backend',
      script: 'app.js',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'frontend',
      cwd: './FrontEnd',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
