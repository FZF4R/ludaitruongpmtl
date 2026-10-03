/**
 * CommentController (người dùng đã đăng nhập)
 *
 * Viết và xoá bình luận. Cả hai cần quyền `comment.write`
 * (config/permissions.js); xoá bình luận của NGƯỜI KHÁC cần thêm
 * `comment.moderate`, kiểm tra trong action vì phụ thuộc chủ bình luận.
 */
const { ganTacGia } = require('../../../utils/binhLuan')

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

                let moi = await Comment.create({
                    contentId: String(bai.id),
                    userId: String(User.id),
                    body: body
                }).fetch()

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
