/**
 * ApprovalController (quản trị) - tab "Phê duyệt" (/admin/phe-duyet).
 *
 * Bình luận và lời nguyện bị giữ lại vì chứa từ cấm (status = flagged) của
 * TOÀN SITE, mới nhất trước. Người có `comment.moderate` (Kiểm duyệt viên trở
 * lên) duyệt cho hiện, hoặc từ chối (ẩn - vẫn lưu lại để tra). Cảnh cáo / khoá
 * / giảm cảnh cáo người viết làm ở trang chi tiết tài khoản (ModerationController).
 */
const { ganTacGia } = require('../../../utils/binhLuan')
const { guiThongBao } = require('../../../utils/thongBao')
const { ghiCongDuc } = require('../../../utils/congDuc')
const { layAvatarUrls } = require('../../../utils/avatar')

const LOAI = ['comment', 'prayer']
const ok = (exits, data) => exits.successRequest({ messageNode: 'GlobalNotifications', message: 'success', data })
const baoLoi = (exits, message) => sails.checkErrorOutput({ messageNode: 'Users', message }, exits)

const layIp = req => {
    let chuyenTiep = req && req.headers && req.headers['x-forwarded-for']
    return chuyenTiep ? String(chuyenTiep).split(',')[0].trim() : ((req && req.ip) || '')
}

/** Thông tin người viết cần cho việc xử lý: tên, avatar, vai trò, số cảnh cáo, đã khoá chưa. */
const thongTinNguoiViet = async ids => {
    ids = Array.from(new Set(ids.map(String)))
    let [taiKhoan, avatar] = await Promise.all([ids.length ? Users.find({ id: { in: ids } }) : [], layAvatarUrls(ids)])
    let kq = {}
    taiKhoan.forEach(u => {
        kq[String(u.id)] = {
            userId: String(u.id),
            name: u.fullName || u.username || '',
            username: u.username || '',
            role: u.role || 'User',
            warningCount: u.warningCount || 0,
            banned: u.status === 2,
            avatarUrl: avatar[String(u.id)] || ''
        }
    })
    return kq
}

module.exports = {

    listPending: ({
        inputs: sails.config.inputs.Admin.Approval.listPending,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let loai = LOAI.includes(inputs.type) ? inputs.type : 'comment'
                let model = loai === 'comment' ? Comment : Prayer
                let [ds, demBl, demLn] = await Promise.all([
                    model.find({ where: { status: 'flagged' }, sort: 'createdAt DESC', skip: (inputs.page - 1) * 30, limit: 30 }),
                    Comment.count({ status: 'flagged' }),
                    Prayer.count({ status: 'flagged' })
                ])
                let nguoi = await thongTinNguoiViet(ds.map(x => x.userId))

                let bai = {}
                if (loai === 'comment') {
                    let ids = Array.from(new Set(ds.map(b => b.contentId)))
                    let dsBai = ids.length ? await Content.find({ id: { in: ids } }) : []
                    dsBai.forEach(b => { bai[String(b.id)] = { slug: b.slug, title: b.title, type: b.type } })
                }

                ok(exits, {
                    type: loai,
                    counts: { comment: demBl, prayer: demLn },
                    total: loai === 'comment' ? demBl : demLn,
                    page: inputs.page,
                    data: ds.map(x => ({
                        id: String(x.id),
                        type: loai,
                        body: x.body,
                        forName: x.forName || '',
                        flaggedWords: x.flaggedWords || [],
                        parentId: x.parentId || '',
                        createdAt: new Date(x.createdAt).toISOString(),
                        author: nguoi[String(x.userId)] || { userId: String(x.userId), name: '', username: '', role: 'User', warningCount: 0, banned: false, avatarUrl: '' },
                        content: loai === 'comment' ? (bai[x.contentId] || { slug: '', title: '', type: '' }) : null
                    }))
                })
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    /** Duyệt: hiện công khai. Bình luận được duyệt thì báo người được trả lời / tác giả bài như lúc đăng thường. */
    approve: ({
        inputs: sails.config.inputs.Admin.Approval.approve,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                if (!LOAI.includes(inputs.type)) return baoLoi(exits, 'commentNotFound')
                let model = inputs.type === 'comment' ? Comment : Prayer
                let muc = await model.findOne({ id: String(inputs.id) })
                if (!muc || muc.status !== 'flagged') return baoLoi(exits, 'commentNotFound')

                await model.updateOne({ id: muc.id }).set({ status: 'visible', approvedBy: String(inputs.User.id), approvedAt: Date.now() })

                if (inputs.type === 'comment') {
                    let bai = await Content.findOne({ id: muc.contentId })
                    if (bai) {
                        await guiThongBao({
                            danhSach: [
                                { userId: muc.replyToUserId, type: 'reply' },
                                { userId: bai.authorId || bai.createdById, type: 'comment' }
                            ],
                            actorId: muc.userId,
                            bai,
                            binhLuan: muc
                        })
                    }
                    await ghiCongDuc(muc.userId, 'comment', { refId: String(muc.id) })
                }
                await ModerationLog.create({
                    targetUserId: String(muc.userId), action: 'approve', commentId: String(muc.id),
                    commentBody: String(muc.body || '').slice(0, 2000), reason: inputs.type,
                    actorId: String(inputs.User.id), actorName: inputs.User.fullName || inputs.User.username || '', ip: layIp(this.req)
                }).catch(() => {})

                ok(exits, { id: String(muc.id) })
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    /** Từ chối: ẩn (không xoá) - vẫn tra lại được ở chi tiết tài khoản. */
    reject: ({
        inputs: sails.config.inputs.Admin.Approval.reject,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                if (!LOAI.includes(inputs.type)) return baoLoi(exits, 'commentNotFound')
                let model = inputs.type === 'comment' ? Comment : Prayer
                let muc = await model.findOne({ id: String(inputs.id) })
                if (!muc || muc.status !== 'flagged') return baoLoi(exits, 'commentNotFound')

                await model.updateOne({ id: muc.id }).set(Object.assign(
                    { status: 'hidden', hiddenBy: String(inputs.User.id) },
                    inputs.type === 'comment' ? { hiddenByModerator: true, deletedAt: Date.now() } : {}
                ))
                await ModerationLog.create({
                    targetUserId: String(muc.userId), action: 'reject', commentId: String(muc.id),
                    commentBody: String(muc.body || '').slice(0, 2000), reason: inputs.type,
                    actorId: String(inputs.User.id), actorName: inputs.User.fullName || inputs.User.username || '', ip: layIp(this.req)
                }).catch(() => {})

                ok(exits, { id: String(muc.id) })
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

};
