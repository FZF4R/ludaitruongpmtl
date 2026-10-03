/**
 * CommentController (công khai)
 *
 * Đọc bình luận đang hiện của một bài viết đã đăng, mới nhất trước.
 */
const { ganTacGia } = require('../../../utils/binhLuan')

module.exports = {

    listComments: ({
        inputs: sails.config.inputs.Public.Comment.listComments,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let bai = await Content.findOne({ slug: inputs.slug, status: 'published' })
                if (!bai) {
                    return exits.successRequest({
                        messageNode: 'GlobalNotifications',
                        message: 'success',
                        data: { data: [], total: 0, page: 1, limit: inputs.limit }
                    });
                }

                let dieuKien = { contentId: String(bai.id), status: 'visible' }
                let [ds, total] = await Promise.all([
                    Comment.find({
                        where: dieuKien,
                        sort: 'createdAt DESC',
                        skip: inputs.limit * (inputs.page - 1),
                        limit: inputs.limit
                    }),
                    Comment.count(dieuKien)
                ])

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: { data: await ganTacGia(ds), total: total, page: inputs.page, limit: inputs.limit }
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

};
