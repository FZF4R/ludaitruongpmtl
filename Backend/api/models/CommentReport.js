/**
 * CommentReport.js
 *
 * @description :: Báo cáo bình luận không phù hợp do người dùng gửi. Mỗi người
 *                 báo cáo một bình luận tối đa một lần, tối đa 20 báo cáo mỗi
 *                 ngày. Kiểm duyệt viên trở lên xử lý ở tab Phê duyệt → Báo cáo:
 *                 ẩn bình luận (resolved) hoặc bỏ qua (dismissed).
 */

module.exports = {

    tableName: 'CommentReport',
    attributes: {
        commentId: { type: 'string', required: true },
        contentId: { type: 'string', defaultsTo: '' },
        reporterId: { type: 'string', required: true },
        reason: { type: 'string', defaultsTo: '', description: 'Lý do, tối đa 300 ký tự' },
        status: {
            type: 'string',
            isIn: ['pending', 'resolved', 'dismissed'],
            defaultsTo: 'pending',
        },
        handledBy: { type: 'string', defaultsTo: '' },
        handledAt: { type: 'number', defaultsTo: 0 },
        dayKey: { type: 'string', required: true, description: 'Ngày gửi (giờ VN) - tính giới hạn 20/ngày' }
    },

};
