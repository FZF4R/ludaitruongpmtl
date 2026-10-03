/**
 * PrayerController (công khai)
 *
 * Danh sách lời cầu an / cầu siêu đang hiện, mới nhất trước, kèm số lời đã
 * viết trong hôm nay. Không biết người xem là ai nên không trả cờ `mine` -
 * FrontEnd đã đăng nhập thì gọi bản /v1/user/prayers/list để có cờ đó.
 */
const { ngayVN, dinhDangLoiNguyen } = require('../../../utils/loiNguyen')

module.exports = {

    /** Lời nguyện đã được duyệt nổi bật (featured), mới nhất trước - cho slideshow trang chủ. */
    listFeatured: ({
        inputs: {},
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let ds = await Prayer.find({
                    where: { status: 'visible', featured: true },
                    sort: 'createdAt DESC',
                    limit: 20
                })

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: await dinhDangLoiNguyen(ds, null)
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    listPrayers: ({
        inputs: sails.config.inputs.Public.Prayer.listPrayers,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let dieuKien = { status: 'visible' }
                if (inputs.kind === 'cau-an' || inputs.kind === 'cau-sieu') dieuKien.kind = inputs.kind

                let [ds, total, homNay] = await Promise.all([
                    Prayer.find({
                        where: dieuKien,
                        sort: 'createdAt DESC',
                        skip: inputs.limit * (inputs.page - 1),
                        limit: inputs.limit
                    }),
                    Prayer.count(dieuKien),
                    Prayer.count({ status: 'visible', dayKey: ngayVN() })
                ])

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: {
                        data: await dinhDangLoiNguyen(ds, null),
                        total: total,
                        today: homNay,
                        page: inputs.page,
                        limit: inputs.limit
                    }
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

};
