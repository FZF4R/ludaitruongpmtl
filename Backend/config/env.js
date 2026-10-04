/**
 * Environment-driven settings
 * (sails.config.env)
 *
 * File này AN TOÀN để commit: không chứa secret, chỉ đọc từ biến môi trường
 * (xem .env.example). Secret thật khai báo trong `.env` ở mỗi máy/server,
 * không commit `.env`.
 *
 * - JWT_ENCRYPT_KEY: bắt buộc ở production — thiếu thì sails.jwtProcess
 *   (api/controllers/BusinessProcess/jwtProcess.js) sẽ throw ngay lúc khởi
 *   động, không để app chạy với key rỗng/đoán được.
 * - Ở development, nếu chưa set thì dùng key mẫu để chạy ngay được, kèm
 *   cảnh báo — không bao giờ dùng key mẫu này khi deploy thật.
 */

const isProd = process.env.NODE_ENV === 'production';
const KHOA_MAU_DEV = 'dev-only-jwt-encrypt-key-change-me';

let jwtKey = process.env.JWT_ENCRYPT_KEY;
if (!jwtKey && !isProd) {
  jwtKey = KHOA_MAU_DEV;
  // eslint-disable-next-line no-console
  console.warn('[config/env] Chưa set JWT_ENCRYPT_KEY — đang dùng key mẫu CHỈ DÙNG CHO DEV.');
}

const fallbackKeys = (process.env.JWT_ENCRYPT_FALLBACK_KEYS || '')
  .split(',')
  .map(key => key.trim())
  .filter(Boolean);

module.exports.env = {

  jwtEncryptSetting: {
    key: jwtKey,
    algorithm: 'aes-256-cbc',
    fallbackKeys: fallbackKeys,
  },

};
