/**
 * LunarEvent.js
 *
 * @description :: Ngày vía, ngày lễ, giỗ tổ, bát quan trai theo âm lịch.
 *
 * Bám theo FrontEnd/lib/schema.ts (lunarEventSchema).
 *
 * solarYear = null nghĩa là sự kiện lặp lại hằng năm (đa số ngày vía).
 * Đặt một năm dương cụ thể khi đó là sự kiện chỉ diễn ra một lần.
 */

module.exports = {

    tableName: 'LunarEvent',
    attributes: {
        lunarDay: {
            type: 'number',
            required: true
        },
        lunarMonth: {
            type: 'number',
            required: true
        },
        isLeapMonth: {
            type: 'boolean',
            defaultsTo: false
        },
        solarYear: {
            type: 'number',
            // allowNull đã tự đặt mặc định là null; thêm defaultsTo: null nữa
            // thì Waterline từ chối nạp model.
            allowNull: true,
            description: 'null = lặp lại hằng năm'
        },
        kind: {
            type: 'string',
            isIn: ['via', 'le', 'gio-to', 'bat-quan-trai'],
            required: true
        },
        title: {
            type: 'string',
            required: true
        },
        description: {
            type: 'string',
            defaultsTo: ''
        },
        contentSlug: {
            type: 'string',
            defaultsTo: '',
            description: 'Slug bài viết nói kỹ về ngày này, nếu có'
        }
    },

};
