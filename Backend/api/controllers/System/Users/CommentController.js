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

const DAI_TOI_THIEU = 2
const DAI_TOI_DA = 2000
/** Khoảng cách tối thiểu giữa hai bình luận của cùng một người - chặn spam bấm liên tục. */
const CACH_NHAU_MS = 20 * 1000

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

                await Comment.updateOne({ id: bl.id }).set({ status: 'hidden', hiddenBy: String(User.id) })

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

};
