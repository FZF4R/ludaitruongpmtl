/**
 * Comment.js
 *
 * @description :: Bình luận của người dùng dưới một bài viết.
 *
 * Chỉ lưu `userId`, KHÔNG lưu tên: tên hiển thị (họ tên + pháp danh) đọc từ
 * hồ sơ lúc trả về, nên người dùng đổi hồ sơ là mọi bình luận cũ đổi theo.
 *
 * Gắn với `contentId` chứ không phải slug - slug sửa được, id thì không.
 * Xoá là ẩn (`status: 'hidden'`) để kiểm duyệt viên còn tra lại được.
 */

module.exports = {

    tableName: 'Comment',
    attributes: {
        contentId: {
            type: 'string',
            required: true,
        },
        userId: {
            type: 'string',
            required: true,
        },
        body: {
            type: 'string',
            required: true,
        },
        // Trả lời MỘT cấp: `parentId` luôn là bình luận gốc (cấp 1). Trả lời
        // một câu trả lời thì vẫn gắn vào bình luận gốc, còn người được trả
        // lời ghi ở `replyToUserId` để hiện "@tên" và gửi thông báo đúng người.
        parentId: {
            type: 'string',
            defaultsTo: '',
            description: 'Rỗng = bình luận gốc'
        },
        replyToUserId: {
            type: 'string',
            defaultsTo: '',
        },
        status: {
            type: 'string',
            // flagged = chứa từ cấm: vẫn lưu nhưng không hiện công khai, chỉ
            // người có `moderation.manage` thấy (System/Admin/ModerationController).
            isIn: ['visible', 'hidden', 'flagged'],
            defaultsTo: 'visible',
        },
        flaggedWords: {
            type: 'json',
            defaultsTo: [],
            description: 'Các từ cấm đã khớp khi status = flagged'
        },
        hiddenBy: {
            type: 'string',
            defaultsTo: '',
            description: 'userId người đã ẩn bình luận (chính chủ hoặc kiểm duyệt viên)'
        }
    },

};
