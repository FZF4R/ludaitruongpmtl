/**
 * PrayerController (người dùng đã đăng nhập)
 *
 * Viết, xem, xoá lời cầu an / cầu siêu. Quyền `prayer.write`
 * (config/permissions.js). Xoá lời của NGƯỜI KHÁC cần thêm `comment.moderate`
 * - dùng chung quyền kiểm duyệt với bình luận.
 */
const { ngayVN, dinhDangLoiNguyen } = require('../../../utils/loiNguyen')

const DAI_TOI_THIEU = 2
const DAI_TOI_DA = 500
/** Số lời nguyện tối đa mỗi người mỗi ngày (giờ Việt Nam). */
const TOI_DA_MOI_NGAY = 3

const baoLoi = (exits, message) => sails.checkErrorOutput({ messageNode: 'Users', message: message }, exits)

module.exports = {

    /** Như bản công khai nhưng có cờ `mine` và cho biết hôm nay mình đã viết chưa. */
    listMine: ({
        inputs: sails.config.inputs.Users.Prayer.listMine,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let { User } = inputs
                let dieuKien = { status: 'visible' }
                if (inputs.kind === 'cau-an' || inputs.kind === 'cau-sieu') dieuKien.kind = inputs.kind

                let [ds, total, homNay, cuaToi] = await Promise.all([
                    Prayer.find({
                        where: dieuKien,
                        sort: 'createdAt DESC',
                        skip: inputs.limit * (inputs.page - 1),
                        limit: inputs.limit
                    }),
                    Prayer.count(dieuKien),
                    Prayer.count({ status: 'visible', dayKey: ngayVN() }),
                    Prayer.count({ userId: String(User.id), dayKey: ngayVN() })
                ])

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: {
                        data: await dinhDangLoiNguyen(ds, User.id),
                        total: total,
                        today: homNay,
                        // Hết lượt hôm nay (đã viết đủ TOI_DA_MOI_NGAY lời).
                        wroteToday: cuaToi >= TOI_DA_MOI_NGAY,
                        remainingToday: Math.max(0, TOI_DA_MOI_NGAY - cuaToi),
                        page: inputs.page,
                        limit: inputs.limit
                    }
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    addPrayer: ({
        inputs: sails.config.inputs.Users.Prayer.addPrayer,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let { User } = inputs
                if (!['cau-an', 'cau-sieu'].includes(inputs.kind)) return baoLoi(exits, 'prayerInvalid')

                let body = String(inputs.body || '').replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim()
                if (body.length < DAI_TOI_THIEU || body.length > DAI_TOI_DA) return baoLoi(exits, 'prayerInvalid')

                // Tối đa TOI_DA_MOI_NGAY lời mỗi ngày. Đếm cả lời đã tự xoá: xoá rồi
                // viết lại không phải đường vòng để vượt giới hạn.
                let homNay = ngayVN()
                if (await Prayer.count({ userId: String(User.id), dayKey: homNay }) >= TOI_DA_MOI_NGAY) {
                    return baoLoi(exits, 'prayerOncePerDay')
                }

                let moi = await Prayer.create({
                    userId: String(User.id),
                    kind: inputs.kind,
                    forName: String(inputs.forName || '').trim().slice(0, 120),
                    body: body,
                    anonymous: !!inputs.anonymous,
                    dayKey: homNay
                }).fetch()

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: (await dinhDangLoiNguyen([moi], User.id))[0]
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    deletePrayer: ({
        inputs: sails.config.inputs.Users.Prayer.deletePrayer,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let { User } = inputs
                let ln = await Prayer.findOne({ id: inputs.id })
                if (!ln || ln.status !== 'visible') return baoLoi(exits, 'prayerNotFound')

                let chinhChu = String(ln.userId) === String(User.id)
                if (!chinhChu && !sails.config.roles.can(User.role, 'comment.moderate')) {
                    return baoLoi(exits, 'prayerForbidden')
                }

                await Prayer.updateOne({ id: ln.id }).set({ status: 'hidden', hiddenBy: String(User.id) })

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: { id: String(ln.id) }
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

};
