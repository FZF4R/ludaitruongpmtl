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
            isIn: ['comment', 'reply', 'warning', 'published', 'rejected', 'edit-proposal', 'edit-accepted', 'edit-rejected', 'broadcast'],
            required: true,
            description: [
                'comment = có bình luận ở bài của bạn; reply = có người trả lời bạn;',
                'warning = bị cảnh cáo (excerpt = lý do, contentTitle = "lần/5");',
                'published = bài của bạn đã được duyệt / đăng; rejected = bài bị trả lại (excerpt = lý do);',
                'edit-proposal = ban biên tập đề xuất sửa bài của bạn, chờ bạn đồng ý;',
                'edit-accepted / edit-rejected = tác giả đã đồng ý / từ chối đề xuất sửa của bạn'
            ].join(' ')
        },
        link: {
            type: 'string',
            defaultsTo: '',
            description: 'Đường dẫn (không tiền tố ngôn ngữ) mà thông báo mở ra; rỗng = FrontEnd tự dựng như cũ'
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
