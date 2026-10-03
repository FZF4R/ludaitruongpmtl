/**
 * Prayer.js
 *
 * @description :: Lời cầu an / cầu siêu người dùng viết ở trang chủ.
 *
 * Mỗi người tối đa 3 lời mỗi ngày (theo giờ Việt Nam): `dayKey` = "YYYY-MM-DD",
 * kiểm tra ở controller. Như bình luận, chỉ lưu `userId` - tên và avatar đọc
 * từ hồ sơ lúc trả về; `anonymous` thì ẩn cả hai khi hiện công khai.
 * Xoá là ẩn (`status: 'hidden'`) để kiểm duyệt còn tra lại được.
 */

module.exports = {

    tableName: 'Prayer',
    attributes: {
        userId: {
            type: 'string',
            required: true,
        },
        kind: {
            type: 'string',
            isIn: ['cau-an', 'cau-sieu'],
            required: true,
        },
        forName: {
            type: 'string',
            defaultsTo: '',
            description: 'Người được cầu nguyện (tuỳ chọn): người thân, hương linh...'
        },
        body: {
            type: 'string',
            required: true,
        },
        anonymous: {
            type: 'boolean',
            defaultsTo: false,
        },
        dayKey: {
            type: 'string',
            required: true,
            description: 'Ngày viết theo giờ Việt Nam, YYYY-MM-DD'
        },
        // Đã được kiểm duyệt chọn làm lời nguyện nổi bật: hiện trong slideshow
        // phía trên ô viết ở trang chủ (GET /v1/public/prayers/featured).
        featured: {
            type: 'boolean',
            defaultsTo: false,
        },
        featuredBy: {
            type: 'string',
            defaultsTo: '',
        },
        status: {
            type: 'string',
            isIn: ['visible', 'hidden', 'flagged'],
            defaultsTo: 'visible',
            description: 'flagged = chứa từ cấm, chờ duyệt ở tab Phê duyệt'
        },
        flaggedWords: {
            type: 'json',
            defaultsTo: [],
        },
        hiddenBy: {
            type: 'string',
            defaultsTo: '',
        }
    },

};
