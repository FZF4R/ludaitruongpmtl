/**
 * Chuẩn hoá + kiểm tra số điện thoại khi đăng ký bằng tài khoản / mật khẩu.
 *
 * Nhận:
 *   - số di động Việt Nam: 0xxxxxxxxx, 84xxxxxxxxx, +84xxxxxxxxx (đầu 3/5/7/8/9)
 *     -> lưu dạng 0xxxxxxxxx để một số không thành hai tài khoản;
 *   - số quốc tế dạng E.164 (+ mã nước, 8-15 chữ số) cho người dùng ở nước
 *     ngoài (site có bản en/zh/ko) -> lưu nguyên dạng +xxxxxxxx.
 * Dấu cách, chấm, gạch, ngoặc được bỏ trước khi kiểm.
 *
 * Trả về số đã chuẩn hoá, hoặc '' nếu không hợp lệ.
 */
const DI_DONG_VN = /^0[35789]\d{8}$/
const QUOC_TE = /^\+[1-9]\d{7,14}$/

function chuanHoaSoDienThoai(vao) {
    let so = String(vao || '').trim().replace(/[\s.\-()]/g, '')
    if (!so) return ''

    if (so.startsWith('+84')) so = `0${so.slice(3)}`
    else if (/^84[35789]\d{8}$/.test(so)) so = `0${so.slice(2)}`

    if (DI_DONG_VN.test(so)) return so
    if (QUOC_TE.test(so)) return so

    return ''
}

module.exports = { chuanHoaSoDienThoai }
