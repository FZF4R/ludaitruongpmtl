/**
 * PracticePreset.js
 *
 * @description :: Bộ cấu hình tu tập người dùng tự lưu (vd. "Thiền sáng: 20
 *                 phút, mưa rơi, mõ 60 nhịp, chuỗi 108 hạt") để mỗi ngày chọn
 *                 lại bằng một lần bấm. `config` do FrontEnd định nghĩa, máy
 *                 chủ chỉ giới hạn kích thước.
 */

module.exports = {

    tableName: 'PracticePreset',
    attributes: {
        userId: {
            type: 'string',
            required: true,
        },
        kind: {
            type: 'string',
            isIn: ['thien'],
            defaultsTo: 'thien',
        },
        name: {
            type: 'string',
            required: true,
        },
        config: {
            type: 'json',
            defaultsTo: {},
        },
        lastUsedAt: {
            type: 'number',
            defaultsTo: 0,
        }
    },

};
