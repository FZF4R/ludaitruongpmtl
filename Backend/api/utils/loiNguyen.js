/**
 * Định dạng lời cầu an / cầu siêu trả cho FrontEnd. Dùng chung cho đường đọc
 * công khai và đường ghi của người dùng.
 */
const { layAvatarUrls } = require('./avatar')

/** "YYYY-MM-DD" theo giờ Việt Nam (UTC+7) - mốc của luật "mỗi ngày một lời". */
const ngayVN = (ms = Date.now()) => new Date(ms + 7 * 3600 * 1000).toISOString().slice(0, 10)

/**
 * Gắn tên, pháp danh, avatar người viết. Lời ẩn danh không lộ tên lẫn
 * avatar, và cũng không lộ userId ra ngoài (chỉ trả cờ `mine` cho chính chủ).
 */
const dinhDangLoiNguyen = async (ds, nguoiXemId) => {
    let ids = Array.from(new Set(ds.map(p => String(p.userId))))
    if (!ids.length) return []

    let [taiKhoan, hoSo, avatar] = await Promise.all([
        Users.find({ id: { in: ids } }),
        UserProfile.find({ userId: { in: ids } }),
        layAvatarUrls(ids)
    ])
    let ten = {}
    taiKhoan.forEach(u => { ten[String(u.id)] = { name: u.fullName || u.username || '', dharmaName: '' } })
    hoSo.forEach(h => {
        let cu = ten[h.userId] || { name: '', dharmaName: '' }
        ten[h.userId] = { name: h.fullName || cu.name, dharmaName: h.dharmaName || '' }
    })

    return ds.map(p => {
        let uid = String(p.userId)
        let tacGia = p.anonymous
            ? { name: '', dharmaName: '', avatarUrl: '' }
            : Object.assign({ name: '', dharmaName: '' }, ten[uid], { avatarUrl: avatar[uid] || '' })

        return {
            id: String(p.id || p._id),
            kind: p.kind,
            forName: p.forName || '',
            body: p.body,
            anonymous: !!p.anonymous,
            featured: !!p.featured,
            mine: !!nguoiXemId && uid === String(nguoiXemId),
            createdAt: new Date(p.createdAt || Date.now()).toISOString(),
            author: tacGia
        }
    })
}

module.exports = { ngayVN, dinhDangLoiNguyen }
