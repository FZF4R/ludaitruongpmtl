/**
 * FeedbackController (quản trị)
 *
 * Xem đề xuất / góp ý và đánh dấu đã xử lý. Quyền `system.settings` - cùng
 * nhóm với trang Tổng quan, nơi đặt danh sách này.
 */

module.exports = {

    listFeedback: ({
        inputs: sails.config.inputs.Admin.Feedback.listFeedback,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let dieuKien = {}
                if (inputs.status === 'new' || inputs.status === 'done') dieuKien.status = inputs.status

                let [ds, total, chuaXuLy] = await Promise.all([
                    Feedback.find({
                        where: dieuKien,
                        sort: 'createdAt DESC',
                        skip: inputs.limit * (inputs.page - 1),
                        limit: inputs.limit
                    }),
                    Feedback.count(dieuKien),
                    Feedback.count({ status: 'new' })
                ])

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: {
                        data: ds.map(f => ({
                            id: String(f.id),
                            kind: f.kind,
                            name: f.name,
                            contact: f.contact,
                            body: f.body,
                            loggedIn: !!f.userId,
                            userId: f.userId || '',
                            anonymous: !!f.anonymous,
                            status: f.status,
                            handledByName: f.handledByName,
                            handledAt: f.handledAt ? new Date(f.handledAt).toISOString() : '',
                            createdAt: new Date(f.createdAt).toISOString()
                        })),
                        total: total,
                        unhandled: chuaXuLy,
                        page: inputs.page,
                        limit: inputs.limit
                    }
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    setStatus: ({
        inputs: sails.config.inputs.Admin.Feedback.setStatus,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let xong = inputs.status === 'done'
                let kq = await Feedback.updateOne({ id: String(inputs.id) }).set({
                    status: xong ? 'done' : 'new',
                    handledByName: xong ? (inputs.User.fullName || inputs.User.username || '') : '',
                    handledAt: xong ? Date.now() : 0
                })
                if (!kq) return sails.checkErrorOutput({ messageNode: 'Users', message: 'feedbackNotFound' }, exits)

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: { id: String(kq.id), status: kq.status }
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

};
