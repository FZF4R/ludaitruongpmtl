/**
 * Định dạng bình luận trả cho FrontEnd, kèm tên người viết đọc từ hồ sơ.
 * Dùng chung cho đường đọc công khai và đường ghi của người dùng.
 */

/** Gắn tên hiển thị cho một loạt bình luận bằng hai truy vấn, không truy vấn theo từng dòng. */
const ganTacGia = async binhLuan => {
    let ids = Array.from(new Set(binhLuan.map(b => String(b.userId))))
    if (!ids.length) return []

    let [taiKhoan, hoSo] = await Promise.all([
        Users.find({ id: { in: ids } }),
        UserProfile.find({ userId: { in: ids } })
    ])
    let theoId = {}
    taiKhoan.forEach(u => { theoId[String(u.id)] = { name: u.fullName || u.username || '', dharmaName: '' } })
    hoSo.forEach(h => {
        let cu = theoId[h.userId] || { name: '', dharmaName: '' }
        theoId[h.userId] = { name: h.fullName || cu.name, dharmaName: h.dharmaName || '' }
    })

    return binhLuan.map(b => ({
        id: String(b.id || b._id),
        userId: String(b.userId),
        body: b.body,
        createdAt: new Date(b.createdAt || Date.now()).toISOString(),
        author: theoId[String(b.userId)] || { name: '', dharmaName: '' }
    }))
}

module.exports = { ganTacGia }
