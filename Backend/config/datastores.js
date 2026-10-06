/**
 * Datastore settings
 * (sails.config.datastores)
 *
 * File này AN TOÀN để commit: không chứa secret, chỉ đọc MONGO_URL từ biến
 * môi trường (xem .env.example). Không set thì mặc định dùng MongoDB local
 * không mật khẩu — chỉ phù hợp cho dev.
 */

module.exports.datastores = {

  default: {
    adapter: 'sails-mongo',
    url: process.env.MONGO_URL || 'mongodb://localhost:27017/ludaitruong',
  },

};
