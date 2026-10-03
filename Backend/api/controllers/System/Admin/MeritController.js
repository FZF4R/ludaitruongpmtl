/**
 * MeritController (quản trị, quyền `merit.manage`): bảng điểm công đức, bảng
 * xếp hạng và thông tin ủng hộ (mã QR) hiện ở trang thống kê người dùng.
 */
const { QUY_TAC_MAC_DINH, HANH_DONG, layQuyTac, xoaBoNho, bangCongDuc } = require('../../../utils/congDuc')
const { layAvatarUrls } = require('../../../utils/avatar')

const QR_TOI_DA = 1.5 * 1024 * 1024
const ok = (exits, data) => exits.successRequest({ messageNode: 'GlobalNotifications', message: 'success', data })
const loi = (exits, message) => sails.checkErrorOutput({ messageNode: 'Users', message }, exits)

const layCauHinh = async () => (await MeritConfig.findOne({ key: 'default' })) ||
    await MeritConfig.create({ key: 'default', rules: {}, donate: {} }).fetch()

/** Thông tin ủng hộ trả ra ngoài: không kèm dữ liệu ảnh, chỉ đường dẫn. */
const dinhDangUngHo = (donate, updatedAt) => ({
    title: donate.title || '',
    description: donate.description || '',
    accountName: donate.accountName || '',
    accountNumber: donate.accountNumber || '',
    bank: donate.bank || '',
    link: donate.link || '',
    qrUrl: donate.qrData ? `/v1/public/donate/qr?v=${updatedAt || 0}` : ''
})

module.exports = {

    getMerit: ({
        inputs: sails.config.inputs.Admin.Merit.getMerit,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let cauHinh = await layCauHinh()
                let quyTac = await layQuyTac()
                let xepHang = await bangCongDuc().aggregate([
                    { $group: { _id: '$userId', n: { $sum: '$points' } } },
                    { $sort: { n: -1 } },
                    { $limit: 20 }
                ]).toArray()
                let ids = xepHang.map(x => x._id)
                let [taiKhoan, avatar] = await Promise.all([ids.length ? Users.find({ id: { in: ids } }) : [], layAvatarUrls(ids)])
                let ten = {}
                taiKhoan.forEach(u => { ten[String(u.id)] = { name: u.fullName || u.username || '', role: u.role } })

                ok(exits, {
                    rules: HANH_DONG.map(a => Object.assign({ action: a, defaultPoints: QUY_TAC_MAC_DINH[a].points, defaultDailyCap: QUY_TAC_MAC_DINH[a].dailyCap }, quyTac[a])),
                    donate: dinhDangUngHo(cauHinh.donate || {}, cauHinh.updatedAt),
                    top: xepHang.map(x => Object.assign({ userId: x._id, points: x.n, avatarUrl: avatar[x._id] || '' }, ten[x._id] || { name: '', role: '' }))
                })
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    /** `rules`: { [action]: { points, dailyCap, enabled } } - chỉ nhận action có trong bảng. */
    saveRules: ({
        inputs: sails.config.inputs.Admin.Merit.saveRules,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let vao = inputs.rules && typeof inputs.rules === 'object' ? inputs.rules : {}
                let rules = {}
                for (let a of HANH_DONG) {
                    let r = vao[a]
                    if (!r) continue
                    let points = Math.round(Number(r.points))
                    let dailyCap = Math.round(Number(r.dailyCap))
                    if (!Number.isFinite(points) || points < 0 || points > 1000) return loi(exits, 'meritInvalid')
                    if (!Number.isFinite(dailyCap) || dailyCap < 0 || dailyCap > 100000) return loi(exits, 'meritInvalid')
                    rules[a] = { points, dailyCap, enabled: r.enabled !== false }
                }
                let cauHinh = await layCauHinh()
                await MeritConfig.updateOne({ id: cauHinh.id }).set({ rules, updatedBy: inputs.User.username || '' })
                xoaBoNho()
                let quyTac = await layQuyTac()
                ok(exits, { rules: HANH_DONG.map(a => Object.assign({ action: a, defaultPoints: QUY_TAC_MAC_DINH[a].points, defaultDailyCap: QUY_TAC_MAC_DINH[a].dailyCap }, quyTac[a])) })
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    /** `qr`: data URL ảnh mới; '' = giữ ảnh cũ; 'remove' = bỏ ảnh. */
    saveDonate: ({
        inputs: sails.config.inputs.Admin.Merit.saveDonate,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let cauHinh = await layCauHinh()
                let cu = cauHinh.donate || {}
                let chu = (v, n) => String(v || '').trim().slice(0, n)
                let link = chu(inputs.link, 500)
                if (link && !/^https?:\/\//i.test(link)) return loi(exits, 'meritInvalid')
                let moi = {
                    title: chu(inputs.title, 200),
                    description: chu(inputs.description, 2000),
                    accountName: chu(inputs.accountName, 200),
                    accountNumber: chu(inputs.accountNumber, 60),
                    bank: chu(inputs.bank, 200),
                    link: link,
                    qrData: cu.qrData || '',
                    qrMime: cu.qrMime || ''
                }
                if (inputs.qr === 'remove') {
                    moi.qrData = ''
                    moi.qrMime = ''
                } else if (inputs.qr) {
                    let khop = String(inputs.qr).match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/)
                    if (!khop || khop[2].length * 3 / 4 > QR_TOI_DA) return loi(exits, 'meritInvalid')
                    moi.qrMime = khop[1]
                    moi.qrData = khop[2]
                }
                let sau = await MeritConfig.updateOne({ id: cauHinh.id }).set({ donate: moi, updatedBy: inputs.User.username || '' })
                ok(exits, { donate: dinhDangUngHo(moi, sau.updatedAt) })
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

};
