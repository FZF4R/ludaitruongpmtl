/**
 * HeroImage.js
 *
 * @description :: Ảnh xoay vòng ở khối mở đầu trang chủ, admin tải lên ở /admin/dashboard.
 *
 * Lưu thẳng trong Mongo (base64) giống UserAvatar thay vì ghi ra đĩa: không
 * phải lo thư mục tĩnh, sao lưu CSDL là có luôn ảnh, và chạy nhiều tiến trình
 * vẫn thấy cùng một bộ ảnh. Ảnh đã được trình duyệt thu nhỏ trước khi gửi
 * nên mỗi bản ghi chỉ vài trăm KB.
 *
 * Danh sách công khai KHÔNG trả `data`; ảnh lấy qua endpoint riêng
 * /v1/public/hero-images/:id/file để trình duyệt và Next cache được.
 */

module.exports = {

    tableName: 'HeroImage',
    attributes: {
        data: {
            type: 'string',
            required: true,
            description: 'Nội dung ảnh, base64 không kèm tiền tố data:'
        },
        mime: {
            type: 'string',
            isIn: ['image/jpeg', 'image/png', 'image/webp'],
            required: true
        },
        width: {
            type: 'number',
            defaultsTo: 0
        },
        height: {
            type: 'number',
            defaultsTo: 0
        },
        alt: {
            type: 'string',
            defaultsTo: ''
        },
        order: {
            type: 'number',
            defaultsTo: 0
        },
        uploadedBy: {
            type: 'string',
            defaultsTo: ''
        }
    },

};
