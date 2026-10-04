/**
 * BadgeController: số việc đang chờ cho từng tab Khu quản trị (hiện thành
 * con số trên thanh tab). Chỉ đếm những tab người xem có quyền:
 *   - blog: bài viết / bài giảng đang chờ duyệt (content.editAny | content.review)
 *   - library: kinh sách chờ duyệt (sutra.manage)
 *   - thu-vien: nội dung thư viện chờ duyệt (library.manage)
 *   - phe-duyet: bình luận + lời nguyện bị giữ, bình luận bị báo cáo (comment.moderate)
 */
const co = (u, q) => sails.config.roles.can(u.role, q)

module.exports = {

    getBadges: ({
        inputs: sails.config.inputs.Admin.Badge.getBadges,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let u = inputs.User
                let kq = {}
                let viec = []
                const dem = (khoa, hua) => viec.push(hua.then(n => { kq[khoa] = n }))

                if (co(u, 'content.editAny') || co(u, 'content.review')) {
                    dem('blog', Content.count({ status: 'pending', type: { in: ['article', 'blog', 'audio', 'video'] } }))
                }
                if (co(u, 'sutra.manage')) dem('library', Content.count({ status: 'pending', type: 'sutra' }))
                if (co(u, 'library.manage')) dem('thu-vien', Content.count({ status: 'pending', type: 'library' }))
                if (co(u, 'comment.moderate')) {
                    dem('phe-duyet', Promise.all([
                        Comment.count({ status: 'flagged' }),
                        Prayer.count({ status: 'flagged' }),
                        CommentReport.getDatastore().manager.collection(CommentReport.tableName).distinct('commentId', { status: 'pending' })
                    ]).then(([a, b, c]) => a + b + c.length))
                }
                await Promise.all(viec)

                exits.successRequest({ messageNode: 'GlobalNotifications', message: 'success', data: kq });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

};
