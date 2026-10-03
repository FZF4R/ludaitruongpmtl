/**
 * PracticeSession.js
 *
 * @description :: Phiên tu tập do MÁY CHỦ mở, để chặn số liệu giả (script tự
 *                 bấm, sửa bộ đếm trong DevTools). Gõ mõ / lần chuỗi / thiền
 *                 lưu nhật ký phải kèm id phiên: máy chủ lấy thời gian đã trôi
 *                 qua từ lúc mở phiên (giờ của MÁY CHỦ, trình duyệt không sửa
 *                 được) để tính số lần tối đa có thể (mõ 0,4 giây/tiếng, hạt
 *                 0,6 giây/hạt, thiền không quá thời gian thật). Mỗi phiên dùng
 *                 một lần.
 */

module.exports = {

    tableName: 'PracticeSession',
    attributes: {
        userId: {
            type: 'string',
            required: true,
        },
        type: {
            type: 'string',
            isIn: ['thien', 'go-mo', 'chuoi-hat'],
            required: true,
        },
        startedAt: {
            type: 'number',
            required: true,
        },
        usedAt: {
            type: 'number',
            defaultsTo: 0,
        }
    },

};
