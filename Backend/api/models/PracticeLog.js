/**
 * PracticeLog.js
 *
 * @description :: Nhật ký tu tập: mỗi lần người dùng dùng xong một công cụ ở
 *                 /tu-tap/* và bấm "Lưu vào nhật ký" (tụng xong bộ kinh, thiền
 *                 20 phút, niệm 1.080 câu, gõ hết vòng chuỗi...). Trang
 *                 /qua-trinh-tu-tap tổng hợp từ bảng này.
 *
 * `amount` theo đơn vị của `type`: thien = giây; tung-kinh = số lần tụng
 * (thường là 1); niem-phat, go-mo, chuoi-hat = số câu / tiếng / hạt.
 */

module.exports = {

    tableName: 'PracticeLog',
    attributes: {
        userId: {
            type: 'string',
            required: true,
        },
        type: {
            type: 'string',
            isIn: ['tung-kinh', 'niem-phat', 'thien', 'go-mo', 'chuoi-hat'],
            required: true,
        },
        amount: {
            type: 'number',
            required: true,
        },
        note: {
            type: 'string',
            defaultsTo: '',
            description: 'Ghi chú ngắn, vd tên bộ kinh đã tụng'
        },
        dayKey: {
            type: 'string',
            required: true,
            description: 'Ngày theo giờ Việt Nam, YYYY-MM-DD'
        }
    },

};
