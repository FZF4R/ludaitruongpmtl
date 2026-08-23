/**
 * ContentCategory.js
 *
 * @description :: Chuyên mục nội dung.
 *
 * Bám theo FrontEnd/lib/schema.ts (categorySchema).
 *
 * Cố tình KHÔNG lưu trường `count`: số bài trong chuyên mục được đếm lúc trả
 * về. Lưu sẵn thì mỗi lần đăng, gỡ hay đổi chuyên mục của một bài đều phải
 * nhớ cập nhật lại - và chỉ cần quên một đường là con số sai vĩnh viễn.
 */

module.exports = {

    tableName: 'ContentCategory',
    attributes: {
        slug: {
            type: 'string',
            required: true,
            unique: true
        },
        name: {
            type: 'string',
            required: true
        },
        description: {
            type: 'string',
            defaultsTo: ''
        },
        coverUrl: {
            type: 'string',
            defaultsTo: ''
        },
        kind: {
            type: 'string',
            isIn: ['article', 'sutra', 'audio', 'video', 'all'],
            defaultsTo: 'all',
            description: 'Loại nội dung chính của chuyên mục, để giao diện chọn cách trình bày'
        },
        children: {
            type: 'json',
            defaultsTo: [],
            description: 'Chuyên mục con dạng rút gọn: [{ slug, name }]'
        },
        order: {
            type: 'number',
            defaultsTo: 0,
            description: 'Thứ tự hiển thị, nhỏ đứng trước'
        }
    },

};
