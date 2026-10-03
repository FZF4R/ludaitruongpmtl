/**
 * Avatar người dùng.
 *
 * Ảnh lưu base64 trong UserAvatar (một bản ghi mỗi người). Ra ngoài luôn đi
 * qua `/v1/public/avatar/:userId?v=<updatedAt>`: `v` đổi mỗi lần thay ảnh nên
 * trình duyệt cache vĩnh viễn được mà không bao giờ hiện ảnh cũ.
 *
 * Đọc hàng loạt bằng truy vấn Mongo trực tiếp có projection - app để
 * schema:false nên Waterline không `select` được, mà kéo cả base64 của hai
 * chục avatar chỉ để biết "có ảnh không" là vài MB vô ích.
 */

const MIME_HOP_LE = ['image/jpeg', 'image/png', 'image/webp']

/** Mấy byte đầu thật sự là ảnh đúng loại khai báo không - không tin mime client gửi. */
const dungLoai = (buf, mime) => {
    if (mime === 'image/jpeg') return buf[0] === 0xff && buf[1] === 0xd8
    if (mime === 'image/png') return buf[0] === 0x89 && buf[1] === 0x50
    if (mime === 'image/webp') return buf.slice(8, 12).toString('ascii') === 'WEBP'
    return false
}

/**
 * `data:image/...;base64,...` -> { mime, base64 } nếu là ảnh hợp lệ, không quá
 * `toiDaByte` sau khi giải mã; ngược lại null.
 */
const docAnhBase64 = (dataUrl, toiDaByte) => {
    let khop = String(dataUrl || '').match(/^data:(image\/[a-z]+);base64,(.+)$/)
    if (!khop || !MIME_HOP_LE.includes(khop[1])) return null

    let buf = Buffer.from(khop[2], 'base64')
    if (!buf.length || buf.length > toiDaByte || !dungLoai(buf, khop[1])) return null

    return { mime: khop[1], base64: khop[2] }
}

const urlAvatar = (userId, phienBan) => `/v1/public/avatar/${userId}?v=${phienBan || 0}`

const bangAvatar = () => UserAvatar.getDatastore().manager.collection(UserAvatar.tableName)

/** { userId: url } cho những người CÓ avatar trong danh sách. */
const layAvatarUrls = async userIds => {
    let ids = Array.from(new Set((userIds || []).map(String).filter(Boolean)))
    if (!ids.length) return {}

    let rows = await bangAvatar()
        .find({ userId: { $in: ids } }, { projection: { userId: 1, updatedAt: 1 } })
        .toArray()
    let kq = {}
    rows.forEach(r => { kq[String(r.userId)] = urlAvatar(r.userId, r.updatedAt) })

    return kq
}

/** URL avatar của một người, hoặc '' nếu chưa có. */
const layAvatarUrl = async userId => (await layAvatarUrls([userId]))[String(userId)] || ''

module.exports = { docAnhBase64, urlAvatar, layAvatarUrls, layAvatarUrl, bangAvatar }
