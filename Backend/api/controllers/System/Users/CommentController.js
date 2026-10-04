/**
 * CommentController (người dùng đã đăng nhập)
 *
 * Viết và xoá bình luận. Cả hai cần quyền `comment.write`
 * (config/permissions.js); xoá bình luận của NGƯỜI KHÁC cần thêm
 * `comment.moderate`, kiểm tra trong action vì phụ thuộc chủ bình luận.
 */
const { ganTacGia } = require('../../../utils/binhLuan')
const { guiThongBao } = require('../../../utils/thongBao')
const { timTuCam } = require('../../../utils/tuCam')
const { ghiCongDuc } = require('../../../utils/congDuc')
const { ngayVN } = require('../../../utils/loiNguyen')

const DAI_TOI_THIEU = 2
const DAI_TOI_DA = 2000
/** Khoảng cách tối thiểu giữa hai bình luận của cùng một người - chặn spam bấm liên tục. */
const CACH_NHAU_MS = 20 * 1000

/**
 * Giới hạn số bình luận theo vai trò: mỗi bài và mỗi ngày (giờ Việt Nam). Vai
 * trò không có ở đây (Kiểm duyệt viên trở lên) không bị giới hạn. Đếm cả bình
 * luận đã xoá / bị giữ lại - xoá đi viết lại không lách được giới hạn.
 */
/** Mỗi người tối đa chừng này báo cáo bình luận mỗi ngày. */
const BAO_CAO_TOI_DA_NGAY = 20

const GIOI_HAN = {
    User: { moiBai: 5, moiNgay: 50 },
    Partner: { moiBai: 5, moiNgay: 100 }
}

const baoLoi = (exits, message) => sails.checkErrorOutput({ messageNode: 'Users', message: message }, exits)

module.exports = {

    addComment: ({
        inputs: sails.config.inputs.Users.Comment.addComment,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let { User } = inputs
                // Gộp khoảng trắng thừa nhưng giữ xuống dòng; nội dung chỉ là chữ
                // thuần, FrontEnd render qua React nên HTML bị escape.
                let body = String(inputs.body || '').replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim()
                if (body.length < DAI_TOI_THIEU || body.length > DAI_TOI_DA) return baoLoi(exits, 'commentInvalid')

                // Chỉ bài viết đã đăng mới nhận bình luận.
                let bai = await Content.findOne({ slug: inputs.slug, status: 'published' })
                if (!bai || !['article', 'blog'].includes(bai.type)) return baoLoi(exits, 'commentNotFound')

                let han = GIOI_HAN[User.role]
                if (han) {
                    let tuDauNgay = new Date(`${ngayVN()}T00:00:00+07:00`).getTime()
                    let [trongBai, homNay] = await Promise.all([
                        Comment.count({ userId: String(User.id), contentId: String(bai.id) }),
                        Comment.count({ userId: String(User.id), createdAt: { '>=': tuDauNgay } })
                    ])
                    if (trongBai >= han.moiBai) return baoLoi(exits, 'commentLimitPost')
                    if (homNay >= han.moiNgay) return baoLoi(exits, 'commentLimitDay')
                }

                let ganNhat = await Comment.find({
                    where: { userId: String(User.id) },
                    sort: 'createdAt DESC',
                    limit: 1
                })
                if (ganNhat[0] && Date.now() - ganNhat[0].createdAt < CACH_NHAU_MS) {
                    return baoLoi(exits, 'commentTooFast')
                }

                // Trả lời: chỉ một cấp. Trả lời một câu trả lời thì gắn vào bình
                // luận gốc của nó, và ghi người được trả lời để báo đúng người.
                let parentId = ''
                let replyToUserId = ''
                if (inputs.parentId) {
                    let cha = await Comment.findOne({ id: String(inputs.parentId) })
                    if (!cha || cha.status !== 'visible' || cha.contentId !== String(bai.id)) {
                        return baoLoi(exits, 'commentNotFound')
                    }
                    parentId = cha.parentId || String(cha.id)
                    replyToUserId = String(cha.userId)
                }

                // Chứa từ cấm: VẪN lưu (để quản trị xem, xử lý người viết) nhưng ở
                // trạng thái `flagged` - không hiện công khai, không gửi thông báo.
                let tuCam = await timTuCam(body)

                let moi = await Comment.create({
                    contentId: String(bai.id),
                    userId: String(User.id),
                    body: body,
                    parentId: parentId,
                    replyToUserId: replyToUserId,
                    status: tuCam.length ? 'flagged' : 'visible',
                    flaggedWords: tuCam
                }).fetch()

                if (tuCam.length) {
                    // Không nói từ nào bị bắt - nói ra là chỉ cách lách.
                    return exits.successRequest({
                        messageNode: 'Users',
                        message: 'commentFlagged',
                        data: Object.assign((await ganTacGia([moi]))[0], { flagged: true })
                    });
                }

                // Báo cho người được trả lời, và cho tác giả bài (bài lấy tác giả
                // theo hồ sơ, hoặc người tạo bài). guiThongBao tự bỏ chính mình
                // và người trùng.
                await guiThongBao({
                    danhSach: [
                        { userId: replyToUserId, type: 'reply' },
                        { userId: bai.authorId || bai.createdById, type: 'comment' }
                    ],
                    actorId: User.id,
                    bai: bai,
                    binhLuan: moi
                })
                // Công đức: người viết, và người được trả lời (khác người viết).
                await ghiCongDuc(User.id, 'comment', { refId: String(moi.id) })
                if (replyToUserId && replyToUserId !== String(User.id)) {
                    await ghiCongDuc(replyToUserId, 'reply-received', { refId: String(moi.id) })
                }

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: (await ganTacGia([moi]))[0]
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    deleteComment: ({
        inputs: sails.config.inputs.Users.Comment.deleteComment,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let { User } = inputs
                let bl = await Comment.findOne({ id: inputs.id })
                if (!bl || bl.status !== 'visible') return baoLoi(exits, 'commentNotFound')

                let chinhChu = String(bl.userId) === String(User.id)
                if (!chinhChu && !sails.config.roles.can(User.role, 'comment.moderate')) {
                    return baoLoi(exits, 'commentForbidden')
                }

                // Xoá mềm: bản ghi giữ nguyên nội dung để ban quản trị xem lại; trang
                // bài hiện dòng "đã xoá" kèm người xoá (chính chủ hay quản trị viên).
                await Comment.updateOne({ id: bl.id }).set({
                    status: 'hidden',
                    hiddenBy: String(User.id),
                    hiddenByModerator: !chinhChu,
                    deletedAt: Date.now()
                })

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: { id: String(bl.id) }
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),


    /**
     * Báo cáo một bình luận không phù hợp. Không báo cáo bình luận của chính
     * mình; mỗi bình luận một lần; tối đa 20 báo cáo / ngày.
     */
    reportComment: ({
        inputs: sails.config.inputs.Users.Comment.reportComment,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let { User } = inputs
                let bl = await Comment.findOne({ id: String(inputs.id) })
                if (!bl || bl.status !== 'visible') return baoLoi(exits, 'commentNotFound')
                if (String(bl.userId) === String(User.id)) return baoLoi(exits, 'reportSelf')
                if (await CommentReport.findOne({ commentId: String(bl.id), reporterId: String(User.id) })) {
                    return baoLoi(exits, 'reportDuplicate')
                }
                let homNay = ngayVN()
                if (await CommentReport.count({ reporterId: String(User.id), dayKey: homNay }) >= BAO_CAO_TOI_DA_NGAY) {
                    return baoLoi(exits, 'reportLimit')
                }
                await CommentReport.create({
                    commentId: String(bl.id),
                    contentId: String(bl.contentId || ''),
                    reporterId: String(User.id),
                    reason: String(inputs.reason || '').replace(/\s+/g, ' ').trim().slice(0, 300),
                    dayKey: homNay
                })
                exits.successRequest({ messageNode: 'Users', message: 'reportSent', data: { id: String(bl.id) } });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    /** Nội dung bình luận đã xoá - chỉ người có `comment.moderate` (kiểm tra ở config/permissions.js). */
    getDeleted: ({
        inputs: sails.config.inputs.Users.Comment.getDeleted,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let bl = await Comment.findOne({ id: String(inputs.id) })
                if (!bl || bl.status !== 'hidden') return baoLoi(exits, 'commentNotFound')
                let nguoiXoa = bl.hiddenBy ? await Users.findOne({ id: String(bl.hiddenBy) }) : null

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: {
                        id: String(bl.id),
                        body: bl.body,
                        deletedAt: bl.deletedAt ? new Date(bl.deletedAt).toISOString() : '',
                        deletedBy: nguoiXoa ? (nguoiXoa.fullName || nguoiXoa.username || '') : ''
                    }
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

};
