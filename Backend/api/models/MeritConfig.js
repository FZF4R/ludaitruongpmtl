/**
 * MeritConfig.js
 *
 * @description :: Bảng điểm công đức admin chỉnh ở /admin/merit (một bản ghi
 *                 duy nhất, key = 'default'), kèm thông tin ủng hộ (QR).
 *                 Thiếu bản ghi / thiếu quy tắc nào thì dùng mặc định trong
 *                 api/utils/congDuc.js.
 */

module.exports = {

    tableName: 'MeritConfig',
    attributes: {
        key: {
            type: 'string',
            required: true,
        },
        rules: {
            type: 'json',
            defaultsTo: {},
            description: '{ [action]: { points, dailyCap, enabled } }'
        },
        greetings: {
            type: 'json',
            defaultsTo: [],
            description: 'Lời nhắn an lành hiện ngẫu nhiên trong popup chào ngày mới (mảng chuỗi). Rỗng = dùng mặc định.'
        },
        donate: {
            type: 'json',
            defaultsTo: {},
            description: '{ title, description, accountName, accountNumber, bank, qrData (base64), qrMime }'
        },
        updatedBy: {
            type: 'string',
            defaultsTo: '',
        }
    },

};
