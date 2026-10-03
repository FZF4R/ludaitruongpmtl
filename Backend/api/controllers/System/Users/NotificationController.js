/**
 * NotificationController (người dùng đã đăng nhập)
 *
 * Thông báo riêng của chính mình: danh sách, số chưa đọc, đánh dấu đã đọc.
 * Chỉ cần đăng nhập (userPolices) - ai cũng có quyền đọc thông báo của mình,
 * và mọi truy vấn đều khoá theo `userId` của người đang gọi.
 */
const { dinhDangThongBao } = require('../../../utils/thongBao')

module.exports = {

    listNotifications: ({
        inputs: sails.config.inputs.Users.Notification.listNotifications,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let cuaToi = { userId: String(inputs.User.id) }
                let [ds, chuaDoc] = await Promise.all([
                    inputs.onlyCount
                        ? []
                        : UserNotification.find({ where: cuaToi, sort: 'createdAt DESC', limit: inputs.limit }),
                    UserNotification.count(Object.assign({ read: false }, cuaToi))
                ])

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: { data: await dinhDangThongBao(ds), unread: chuaDoc }
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    /** `ids` rỗng = đánh dấu tất cả đã đọc. */
    markRead: ({
        inputs: sails.config.inputs.Users.Notification.markRead,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let dieuKien = { userId: String(inputs.User.id), read: false }
                if (Array.isArray(inputs.ids) && inputs.ids.length) dieuKien.id = { in: inputs.ids.map(String) }

                await UserNotification.update(dieuKien).set({ read: true })

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: { unread: await UserNotification.count({ userId: String(inputs.User.id), read: false }) }
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

};
