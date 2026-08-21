/**
 * Google reCAPTCHA v2
 * (sails.config.ReCaptcha)
 *
 * Xác thực token captcha do FrontEnd gửi lên với Google trước khi cho login/register.
 *
 * Cấu hình bằng biến môi trường (ưu tiên) hoặc `recaptchaSecretKey` trong config/env.js:
 *   RECAPTCHA_SECRET_KEY  - Secret key lấy tại https://www.google.com/recaptcha/admin
 *                           (cặp với VITE_RECAPTCHA_SITE_KEY của FrontEnd, loại reCAPTCHA v2 Checkbox).
 *                           Để trống = BỎ QUA xác thực captcha (chỉ dùng khi dev).
 *   RECAPTCHA_FAIL_OPEN   - 'true' thì vẫn cho đăng nhập khi không gọi được Google
 *                           (mất mạng / Google chặn IP server). Mặc định 'false' = chặn.
 *   RECAPTCHA_VERIFY_URL  - Đổi endpoint verify, ví dụ dùng
 *                           https://www.recaptcha.net/recaptcha/api/siteverify
 *                           khi server không truy cập được google.com.
 *
 * ⚠️ Secret key ở đây phải cùng cặp với VITE_RECAPTCHA_SITE_KEY của FrontEnd.
 *    Nếu chỉ điền một bên thì mọi lượt đăng nhập/đăng ký đều bị từ chối.
 */
const axios = require('axios')

// config/env.js nằm ngoài git nên có thể chưa tồn tại trên máy mới -> chỉ dùng biến môi trường
let envConfig = {}
try {
  envConfig = require('./env').env || {}
} catch (error) {
  envConfig = {}
}

const SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY || envConfig.recaptchaSecretKey || ''
const FAIL_OPEN = process.env.RECAPTCHA_FAIL_OPEN === 'true'
const VERIFY_URL = process.env.RECAPTCHA_VERIFY_URL || 'https://www.google.com/recaptcha/api/siteverify'
const REQUEST_TIMEOUT = 8000

/**
 * Xác thực token captcha.
 * Luôn resolve (không throw) để controller tự quyết định response trả về.
 *
 * @param   {String} token     Token FrontEnd gửi lên (g-recaptcha-response)
 * @param   {String} remoteIp  IP của client (tuỳ chọn)
 * @returns {Object} { success, skipped, errorCodes }
 */
const verifyToken = async (token, remoteIp) => {
  // Chưa cấu hình secret key -> không chặn user, chỉ cảnh báo trong log
  if (!SECRET_KEY) {
    sails.log.warn('[reCAPTCHA] Chưa cấu hình RECAPTCHA_SECRET_KEY -> bỏ qua bước xác thực captcha.')

    return { success: true, skipped: true, errorCodes: [] }
  }

  if (!token) {
    return { success: false, skipped: false, errorCodes: ['missing-input-response'] }
  }

  const params = new URLSearchParams()

  params.append('secret', SECRET_KEY)
  params.append('response', token)
  if (remoteIp) params.append('remoteip', remoteIp)

  try {
    const { data } = await axios.post(VERIFY_URL, params.toString(), {
      timeout: REQUEST_TIMEOUT,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })

    const errorCodes = (data && data['error-codes']) || []

    if (!data || data.success !== true) {
      sails.log.warn('[reCAPTCHA] Token không hợp lệ:', errorCodes)
    }

    return { success: !!data && data.success === true, skipped: false, errorCodes: errorCodes }
  } catch (error) {
    // Không gọi được Google: mặc định chặn, trừ khi bật RECAPTCHA_FAIL_OPEN
    sails.log.error('[reCAPTCHA] Lỗi khi gọi Google siteverify:', error.message)

    return { success: FAIL_OPEN, skipped: FAIL_OPEN, errorCodes: ['verify-request-failed'] }
  }
}

/**
 * Trả về tên message trong config/notification.js (node `Users`) tương ứng với kết quả verify.
 */
const getErrorMessageName = verifyResult => {
  return verifyResult.errorCodes.includes('missing-input-response') ? 'captchaRequired' : 'captchaInvalid'
}

module.exports.ReCaptcha = {
  verifyToken,
  getErrorMessageName,
  isEnabled: !!SECRET_KEY
}
