/**
 * ModerationLog.js
 *
 * @description :: Nhật ký kỷ luật: cảnh cáo, khoá, mở khoá tài khoản, xoá hẳn
 *                 bình luận vi phạm. Chỉ ghi thêm - để tra "ai đã khoá người
 *                 này, vì sao, lúc nào". Ghi cả tên lẫn id vì tài khoản có thể
 *                 đổi tên hoặc bị xoá về sau.
 */

module.exports = {

    tableName: 'ModerationLog',
    attributes: {
        targetUserId: {
            type: 'string',
            required: true,
        },
        action: {
            type: 'string',
            isIn: ['warn', 'ban', 'unban', 'delete-comment'],
            required: true,
        },
        reason: {
            type: 'string',
            defaultsTo: '',
        },
        commentId: {
            type: 'string',
            defaultsTo: '',
        },
        commentBody: {
            type: 'string',
            defaultsTo: '',
            description: 'Nội dung bình luận lúc bị xoá hẳn - để còn đối chiếu'
        },
        actorId: {
            type: 'string',
            required: true,
        },
        actorName: {
            type: 'string',
            defaultsTo: '',
        },
        ip: {
            type: 'string',
            defaultsTo: '',
        }
    },

};
