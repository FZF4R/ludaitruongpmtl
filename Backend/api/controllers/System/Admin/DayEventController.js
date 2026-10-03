/**
 * DayEventController (quản trị, quyền `calendar.manage`): sự kiện gắn vào một
 * NGÀY DƯƠNG cụ thể trên lịch (khác LunarEvent - ngày vía âm lịch lặp hằng
 * năm). Thêm / sửa / xoá ngay trên ô lịch (components/home/month-calendar.tsx).
 */
const { dinhDangSuKienNgay, chuanHoaSuKienNgay } = require('../../../utils/suKienNgay')

const ok = (exits, data) => exits.successRequest({ messageNode: 'GlobalNotifications', message: 'success', data })
const baoLoi = (exits, message) => sails.checkErrorOutput({ messageNode: 'Users', message }, exits)

module.exports = {

    saveEvent: ({
        inputs: sails.config.inputs.Admin.DayEvent.saveEvent,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let { ban, loi } = chuanHoaSuKienNgay(inputs)
                if (loi) return baoLoi(exits, 'dayEventInvalid')
                Object.assign(ban, { updatedById: String(inputs.User.id), updatedByName: inputs.User.fullName || inputs.User.username || '' })

                let kq
                if (inputs.id) {
                    kq = await DayEvent.updateOne({ id: String(inputs.id) }).set(ban)
                    if (!kq) return baoLoi(exits, 'dayEventInvalid')
                } else {
                    if (await DayEvent.count({ date: ban.date }) >= 10) return baoLoi(exits, 'dayEventInvalid')
                    kq = await DayEvent.create(Object.assign(ban, { createdById: String(inputs.User.id) })).fetch()
                }
                ok(exits, dinhDangSuKienNgay(kq))
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    deleteEvent: ({
        inputs: sails.config.inputs.Admin.DayEvent.deleteEvent,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                await DayEvent.destroyOne({ id: String(inputs.id) })
                ok(exits, { id: String(inputs.id) })
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

};
