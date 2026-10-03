/**
 * PracticeSound.js
 *
 * @description :: Âm thanh cho các công cụ tu tập (/tu-tap/*): chuông, tiếng
 *                 mõ, âm nền, tụng mẫu, thiền có hướng dẫn. Admin quản lý ở
 *                 /admin/practice; người dùng chọn trong danh sách ở từng mục.
 *
 * Hai nguồn: tải tệp lên (base64 trong Mongo như ảnh - sao lưu CSDL là có
 * luôn) hoặc dán link ngoài (tệp dài như bài tụng 30 phút để ở nơi khác cho
 * nhẹ CSDL). Tệp tải lên phát qua /v1/public/sounds/:id/file (hỗ trợ Range
 * để tua được). Danh sách công khai không bao giờ kéo `data`.
 */

module.exports = {

    tableName: 'PracticeSound',
    attributes: {
        category: {
            type: 'string',
            isIn: ['tung-kinh', 'thien-dinh', 'go-mo', 'cau-an'],
            required: true,
            description: 'Mục tu tập dùng âm thanh này'
        },
        kind: {
            type: 'string',
            isIn: ['chuong', 'mo', 'am-nen', 'tung-mau', 'huong-dan', 'hat'],
            required: true,
            description: 'chuong = chuông; mo = tiếng mõ; am-nen = âm nền phát lặp; tung-mau = bài tụng mẫu; huong-dan = thiền / nghi thức có hướng dẫn'
        },
        title: {
            type: 'string',
            required: true,
        },
        source: {
            type: 'string',
            isIn: ['upload', 'url'],
            defaultsTo: 'upload',
        },
        data: {
            type: 'string',
            defaultsTo: '',
            description: 'Base64 (source = upload)'
        },
        mime: {
            type: 'string',
            defaultsTo: '',
        },
        url: {
            type: 'string',
            defaultsTo: '',
            description: 'Link ngoài (source = url)'
        },
        sizeBytes: {
            type: 'number',
            defaultsTo: 0,
        },
        loop: {
            type: 'boolean',
            defaultsTo: false,
            description: 'Phát lặp (âm nền)'
        },
        active: {
            type: 'boolean',
            defaultsTo: true,
            description: 'Tắt = ẩn khỏi người dùng nhưng không xoá'
        },
        order: {
            type: 'number',
            defaultsTo: 0,
        },
        uploadedBy: {
            type: 'string',
            defaultsTo: '',
        }
    },

};
