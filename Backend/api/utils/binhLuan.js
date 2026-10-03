/**
 * Định dạng bình luận trả cho FrontEnd, kèm tên người viết đọc từ hồ sơ.
 * Dùng chung cho đường đọc công khai và đường ghi của người dùng.
 */

const { layAvatarUrls } = require('./avatar')

/**
 * Gắn tên hiển thị (và tên người được trả lời) cho một loạt bình luận bằng
 * ba truy vấn, không truy vấn theo từng dòng.
 */
const ganTacGia = async binhLuan => {
    let ids = Array.from(new Set(binhLuan.flatMap(b => [String(b.userId), String(b.replyToUserId || ''), String(b.hiddenBy || '')]).filter(Boolean)))
    if (!binhLuan.length) return []

    let [taiKhoan, hoSo, avatar] = await Promise.all([
        Users.find({ id: { in: ids } }),
        UserProfile.find({ userId: { in: ids } }),
        layAvatarUrls(ids)
    ])
    let theoId = {}
    taiKhoan.forEach(u => { theoId[String(u.id)] = { name: u.fullName || u.username || '', dharmaName: '' } })
    hoSo.forEach(h => {
        let cu = theoId[h.userId] || { name: '', dharmaName: '' }
        theoId[h.userId] = { name: h.fullName || cu.name, dharmaName: h.dharmaName || '' }
    })

    return binhLuan.map(b => {
        let kq = {
            id: String(b.id || b._id),
            userId: String(b.userId),
            parentId: b.parentId || '',
            body: b.body,
            createdAt: new Date(b.createdAt || Date.now()).toISOString(),
            author: Object.assign(
                { name: '', dharmaName: '' },
                theoId[String(b.userId)],
                { avatarUrl: avatar[String(b.userId)] || '' }
            )
        }
        if (b.replyToUserId) {
            kq.replyTo = { userId: String(b.replyToUserId), name: (theoId[String(b.replyToUserId)] || {}).name || '' }
        }
        // Đã xoá: không lộ nội dung, chỉ nói ai xoá. Bình luận xoá trước khi có
        // `hiddenByModerator` thì suy ra từ việc người xoá có phải chính chủ không.
        if (b.status === 'hidden') {
            let boiQuanTri = b.hiddenByModerator !== undefined
                ? !!b.hiddenByModerator
                : !!b.hiddenBy && String(b.hiddenBy) !== String(b.userId)
            kq.body = ''
            kq.deleted = {
                byModerator: boiQuanTri,
                byName: boiQuanTri ? '' : (theoId[String(b.hiddenBy || b.userId)] || {}).name || kq.author.name
            }
        }

        return kq
    })
}

module.exports = { ganTacGia }
