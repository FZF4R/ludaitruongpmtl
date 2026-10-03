/**
 * Feedback.js
 *
 * @description :: Đề xuất và góp ý người xem gửi từ trang chủ.
 *
 * Không bắt đăng nhập (ai cũng góp ý được), nên tên và cách liên hệ là tuỳ
 * chọn; `userId` chỉ có khi người gửi đang đăng nhập. Chống spam bằng giới
 * hạn theo IP và một ô bẫy ẩn (xem Public/FeedbackController).
 */

module.exports = {

    tableName: 'Feedback',
    attributes: {
        kind: {
            type: 'string',
            isIn: ['de-xuat', 'gop-y'],
            defaultsTo: 'gop-y',
        },
        name: {
            type: 'string',
            defaultsTo: '',
        },
        contact: {
            type: 'string',
            defaultsTo: '',
            description: 'Email / số điện thoại để ban quản trị phản hồi (tuỳ chọn)'
        },
        body: {
            type: 'string',
            required: true,
        },
        userId: {
            type: 'string',
            defaultsTo: '',
        },
        // Hiện công khai là ẩn danh (người gửi thấy "Gửi ẩn danh"), nhưng tên,
        // liên hệ, userId vẫn lưu để quản trị kiểm tra tài khoản khi cần.
        anonymous: {
            type: 'boolean',
            defaultsTo: false,
        },
        ip: {
            type: 'string',
            defaultsTo: '',
        },
        status: {
            type: 'string',
            isIn: ['new', 'done'],
            defaultsTo: 'new',
        },
        handledByName: {
            type: 'string',
            defaultsTo: '',
        },
        handledAt: {
            type: 'number',
            defaultsTo: 0,
        }
    },

};
