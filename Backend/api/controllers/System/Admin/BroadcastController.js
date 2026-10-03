/**
 * BroadcastController (quản trị, quyền `notify.manage`): gửi một thông báo tới
 * TOÀN BỘ tài khoản đang hoạt động - hiện ở chuông thông báo của từng người.
 *
 * Ghi thành UserNotification từng người (type = broadcast) để dùng chung cơ
 * chế đã đọc / chưa đọc; ghi theo lô 1.000 bản ghi. Mỗi lần gửi lưu một dòng
 * Broadcast làm lịch sử.
 */
const LO = 1000
const ok = (exits, data) => exits.successRequest({ messageNode: 'GlobalNotifications', message: 'success', data })
const baoLoi = (exits, message) => sails.checkErrorOutput({ messageNode: 'Users', message }, exits)

const dinhDang = b => ({
    id: String(b.id),
    title: b.title,
    body: b.body,
    link: b.link || '',
    recipients: b.recipients || 0,
    createdByName: b.createdByName || '',
    createdAt: new Date(b.createdAt).toISOString()
})

module.exports = {

    send: ({
        inputs: sails.config.inputs.Admin.Broadcast.send,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let title = String(inputs.title || '').trim().slice(0, 120)
                let body = String(inputs.body || '').replace(/\r/g, '').trim().slice(0, 1000)
                let link = String(inputs.link || '').trim().slice(0, 300)
                if (!title) return baoLoi(exits, 'broadcastInvalid')
                // Link: đường dẫn trong site ("/bai-viet/...") hoặc http(s).
                if (link && !/^(\/[^/]|https?:\/\/)/i.test(link)) return baoLoi(exits, 'broadcastInvalid')

                // Tài khoản đang hoạt động (bỏ tài khoản bị khoá status = 2). Chỉ lấy _id.
                let ds = await Users.getDatastore().manager.collection(Users.tableName)
                    .find({ status: { $ne: 2 } }, { projection: { _id: 1 } })
                    .toArray()
                let actorId = String(inputs.User.id)
                for (let i = 0; i < ds.length; i += LO) {
                    await UserNotification.createEach(ds.slice(i, i + LO).map(u => ({
                        userId: String(u._id),
                        type: 'broadcast',
                        actorId,
                        contentTitle: title,
                        excerpt: body,
                        link
                    })))
                }
                let moi = await Broadcast.create({
                    title, body, link, recipients: ds.length,
                    createdById: actorId, createdByName: inputs.User.fullName || inputs.User.username || ''
                }).fetch()

                ok(exits, dinhDang(moi))
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    list: ({
        inputs: sails.config.inputs.Admin.Broadcast.list,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let ds = await Broadcast.find({ sort: 'createdAt DESC', limit: 30 })
                ok(exits, ds.map(dinhDang))
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

};
