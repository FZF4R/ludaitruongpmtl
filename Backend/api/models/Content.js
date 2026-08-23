/**
 * Content.js
 *
 * @description :: Bài viết, kinh sách, bài giảng audio/video.
 *
 * Hình dạng các trường bám theo FrontEnd/lib/schema.ts (contentSchema).
 * Sửa ở đây thì phải sửa cả bên đó, nếu không zod sẽ ném lỗi parse ngay
 * tại tầng fetch của Next thay vì lỗi lúc render.
 *
 * Ghi chú về thời gian:
 *   publishedAt - chuỗi ISO, do biên tập viên đặt, có thể lùi ngày.
 *   updatedAt   - Waterline tự quản (kiểu number, ms). Controller đổi sang
 *                 ISO khi trả về. Đây mới là thứ sitemap dùng làm lastmod.
 */
const { boDau } = require('../utils/vietnamese')

/** Gom các trường đáng tìm kiếm thành một chuỗi đã bỏ dấu. */
const dungSearchText = doc => boDau([
    doc.title || '',
    doc.summary || '',
    Array.isArray(doc.tags) ? doc.tags.join(' ') : ''
].join(' '))

module.exports = {

    tableName: 'Content',
    attributes: {
        type: {
            type: 'string',
            isIn: ['article', 'blog', 'sutra', 'audio', 'video'],
            required: true
        },
        slug: {
            type: 'string',
            required: true,
            unique: true
        },
        title: {
            type: 'string',
            required: true
        },
        summary: {
            type: 'string',
            defaultsTo: ''
        },
        coverUrl: {
            type: 'string',
            defaultsTo: ''
        },
        bodyHtml: {
            type: 'string',
            defaultsTo: ''
        },
        chapters: {
            type: 'json',
            defaultsTo: [],
            description: 'Kinh sách chia chương: [{ order, title, slug, bodyHtml }]'
        },
        media: {
            type: 'json',
            defaultsTo: {},
            description: 'Bài giảng audio/video: { provider, url, durationSec, transcript }'
        },
        author: {
            type: 'json',
            defaultsTo: {},
            description: '{ name, title } - title là Hoà thượng, Thượng toạ, Cư sĩ...'
        },
        source: {
            type: 'json',
            defaultsTo: {},
            description: '{ name, url } - nguồn bản dịch hoặc nơi trích đăng'
        },
        categories: {
            type: 'json',
            defaultsTo: [],
            description: 'Bản sao nhẹ của chuyên mục: [{ slug, name }]'
        },
        tags: {
            type: 'json',
            defaultsTo: []
        },
        publishedAt: {
            type: 'string',
            defaultsTo: '',
            description: 'Chuỗi ISO. Biên tập viên đặt, có thể khác ngày tạo bản ghi.'
        },
        readingMinutes: {
            type: 'number',
            defaultsTo: 0
        },
        viewCount: {
            type: 'number',
            defaultsTo: 0
        },
        seo: {
            type: 'json',
            defaultsTo: {},
            description: '{ title, description, ogImage, canonical }'
        },
        status: {
            type: 'string',
            isIn: ['draft', 'pending', 'published'],
            defaultsTo: 'draft',
            description: 'Cộng tác viên soạn draft -> gửi pending -> kiểm duyệt/quản trị đẩy lên published. Endpoint public chỉ trả published.'
        },
        searchText: {
            type: 'string',
            defaultsTo: '',
            description: 'title + summary + tags đã bỏ dấu. Máy sinh, đừng sửa tay.'
        }
    },

    // Cho tầng sửa nội dung (giai đoạn 4) gọi lại khi cần: Content.dungSearchText(doc)
    dungSearchText: dungSearchText,

    // Giữ searchText luôn khớp nội dung. Đặt ở model chứ không ở controller
    // để mọi đường ghi - seed, API, sửa tay qua ORM - đều đi qua đây.
    beforeCreate: async function (doc, proceed) {
        doc.searchText = dungSearchText(doc)
        return proceed()
    },

    beforeUpdate: async function (doc, proceed) {
        let nguon = ['title', 'summary', 'tags']
        let coMat = nguon.filter(ten => doc[ten] !== undefined)

        if (coMat.length === 0) {
            // Update không đụng gì tới nội dung tìm kiếm (vd: tăng viewCount).
            return proceed()
        }

        if (coMat.length === nguon.length) {
            doc.searchText = dungSearchText(doc)
            return proceed()
        }

        // Update một phần: không đọc được bản ghi cũ ở đây nên không thể ghép đủ.
        // Tính bừa sẽ XOÁ MẤT phần không được gửi lên (vd: chỉ sửa summary thì
        // tiêu đề biến khỏi searchText). Thà để cũ còn hơn để hỏng.
        sails.log.warn(
            '[Content] Update chỉ có', coMat.join(', '), '- giữ nguyên searchText cũ.',
            'Gửi đủ title + summary + tags để nó được tính lại.'
        )
        return proceed()
    },

};
