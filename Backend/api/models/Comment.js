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
        status: {
            type: 'string',
            isIn: ['visible', 'hidden'],
            defaultsTo: 'visible',
        },
        hiddenBy: {
            type: 'string',
            defaultsTo: '',
            description: 'userId người đã ẩn bình luận (chính chủ hoặc kiểm duyệt viên)'
        }
    },

};
