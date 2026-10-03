/**
 * UserNotification.js
 *
 * @description :: Thông báo gửi tới một người dùng (chuông trên đầu trang).
 *
 * Khác model `Notify` (dải thông báo chung của site): đây là thông báo RIÊNG
 * từng người - có bình luận mới ở bài của mình, có người trả lời bình luận
 * của mình. Chỉ lưu dữ kiện (ai, bài nào, loại gì); câu chữ do FrontEnd dựng
 * theo ngôn ngữ người đọc.
 */

module.exports = {

    tableName: 'UserNotification',
    attributes: {
        userId: {
            type: 'string',
            required: true,
            description: 'Người nhận'
        },
        type: {
            type: 'string',
            isIn: ['comment', 'reply', 'warning'],
            required: true,
            description: 'comment = có bình luận ở bài của bạn; reply = có người trả lời bạn; warning = bị cảnh cáo (excerpt = lý do, contentTitle = "lần/5")'
        },
        actorId: {
            type: 'string',
            required: true,
        },
        contentId: {
            type: 'string',
            defaultsTo: '',
        },
        contentSlug: {
            type: 'string',
            defaultsTo: '',
        },
        contentTitle: {
            type: 'string',
            defaultsTo: '',
        },
        commentId: {
            type: 'string',
            defaultsTo: '',
        },
        excerpt: {
            type: 'string',
            defaultsTo: '',
            description: 'Vài chục ký tự đầu của bình luận'
        },
        read: {
            type: 'boolean',
            defaultsTo: false,
        }
    },

};
