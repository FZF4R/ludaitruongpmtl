/**
 * DayEventController (công khai): sự kiện theo ngày dương trong một khoảng
 * ngày - lịch trang chủ / Phật lịch tải ở trình duyệt để admin thêm là thấy ngay.
 */
const { dinhDangSuKienNgay } = require('../../../utils/suKienNgay')

const NGAY = /^\d{4}-\d{2}-\d{2}$/

module.exports = {

    listEvents: ({
        inputs: sails.config.inputs.Public.DayEvent.listEvents,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                if (!NGAY.test(inputs.from) || !NGAY.test(inputs.to)) {
                    return exits.successRequest({ messageNode: 'GlobalNotifications', message: 'success', data: [] })
                }
                // Chuỗi YYYY-MM-DD so sánh được theo thứ tự chữ. Tối đa 500 sự kiện một lượt.
                let ds = await DayEvent.find({ where: { date: { '>=': inputs.from, '<=': inputs.to } }, sort: 'date ASC', limit: 500 })
                exits.successRequest({ messageNode: 'GlobalNotifications', message: 'success', data: ds.map(dinhDangSuKienNgay) })
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

};
