/**
 * Thông báo riêng từng người (UserNotification).
 *
 * Gửi đi KHÔNG bao giờ làm hỏng thao tác chính: bình luận đã lưu rồi, thông
 * báo lỗi thì chỉ ghi log máy chủ.
 */
const { layAvatarUrls } = require('./avatar')

/**
 * Gửi cùng một sự kiện tới nhiều người. Bỏ qua chính người gây ra sự kiện và
 * người trùng lặp - mỗi người nhận đúng một thông báo cho một bình luận, dù
 * họ vừa là tác giả bài vừa là người được trả lời (ưu tiên loại `reply`).
 *
 * @param danhSach [{ userId, type }]
 */
const guiThongBao = async ({ danhSach, actorId, bai, binhLuan }) => {
    try {
        let daGui = new Set([String(actorId)])
        let banGhi = []
        // `reply` đứng trước để thắng `comment` khi trùng người nhận.
        let sapXep = danhSach.slice().sort((a, b) => (a.type === 'reply' ? -1 : 0) - (b.type === 'reply' ? -1 : 0))

        for (let { userId, type } of sapXep) {
            let id = String(userId || '')
            if (!id || daGui.has(id)) continue
            daGui.add(id)
            banGhi.push({
                userId: id,
                type: type,
                actorId: String(actorId),
                contentId: String(bai.id || bai._id || ''),
                contentSlug: bai.slug || '',
                contentTitle: bai.title || '',
                commentId: String(binhLuan.id || ''),
                excerpt: String(binhLuan.body || '').replace(/\s+/g, ' ').slice(0, 120)
            })
        }

        if (banGhi.length) await UserNotification.createEach(banGhi)
    } catch (err) {
        sails.log.error('[thongBao] Không gửi được thông báo:', err.message)
    }
}

/**
 * Thông báo về MỘT bài cho MỘT người (bài được duyệt, bị trả lại, có đề xuất
 * sửa...). Không gửi cho chính người gây ra sự kiện. Lỗi chỉ ghi log.
 */
const guiThongBaoBai = async ({ userId, type, actorId, bai, excerpt = '', link = '' }) => {
    try {
        let id = String(userId || '')
        if (!id || id === String(actorId || '')) return
        await UserNotification.create({
            userId: id,
            type: type,
            actorId: String(actorId || ''),
            contentId: String(bai.id || bai._id || ''),
            contentSlug: bai.slug || '',
            contentTitle: bai.title || '',
            excerpt: String(excerpt || '').replace(/\s+/g, ' ').slice(0, 200),
            link: link
        })
    } catch (err) {
        sails.log.error('[thongBao] Không gửi được thông báo bài:', err.message)
    }
}

/** Gắn tên + avatar người gây ra sự kiện, đọc từ hồ sơ hiện tại. */
const dinhDangThongBao = async ds => {
    let ids = Array.from(new Set(ds.map(t => String(t.actorId))))
    let [taiKhoan, hoSo, avatar] = await Promise.all([
        ids.length ? Users.find({ id: { in: ids } }) : [],
        ids.length ? UserProfile.find({ userId: { in: ids } }) : [],
        layAvatarUrls(ids)
    ])
    let ten = {}
    taiKhoan.forEach(u => { ten[String(u.id)] = u.fullName || u.username || '' })
    hoSo.forEach(h => { if (h.fullName) ten[h.userId] = h.fullName })

    return ds.map(t => ({
        id: String(t.id),
        type: t.type,
        read: !!t.read,
        contentSlug: t.contentSlug,
        contentTitle: t.contentTitle,
        commentId: t.commentId,
        excerpt: t.excerpt,
        link: t.link || '',
        createdAt: new Date(t.createdAt || Date.now()).toISOString(),
        actor: { name: ten[String(t.actorId)] || '', avatarUrl: avatar[String(t.actorId)] || '' }
    }))
}

module.exports = { guiThongBao, guiThongBaoBai, dinhDangThongBao }
