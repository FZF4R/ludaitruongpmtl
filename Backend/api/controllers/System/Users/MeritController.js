/**
 * MeritController (người dùng đã đăng nhập): điểm danh và trang thống kê
 * cá nhân (/tai-khoan/thong-ke) - công đức, tu tập, bài viết, bình luận,
 * đóng góp thư viện, lời nguyện.
 */
const { ghiCongDuc, tongCongDuc, layQuyTac, bangCongDuc } = require('../../../utils/congDuc')
const { ngayVN } = require('../../../utils/loiNguyen')

const MOT_NGAY = 24 * 3600 * 1000
const col = model => model.getDatastore().manager.collection(model.tableName)
const ok = (exits, data) => exits.successRequest({ messageNode: 'GlobalNotifications', message: 'success', data })

/** Số ngày điểm danh liên tiếp tính tới hôm nay (hoặc hôm qua nếu hôm nay chưa điểm danh). */
const chuoiDiemDanh = async userId => {
    let ngay = new Set(await bangCongDuc().distinct('dayKey', { userId: String(userId), action: 'checkin' }))
    let lui = ngay.has(ngayVN()) ? 0 : 1
    let n = 0
    while (ngay.has(ngayVN(Date.now() - (lui + n) * MOT_NGAY))) n++

    return { streak: n, today: ngay.has(ngayVN()), days: ngay.size }
}

module.exports = {

    checkin: ({
        inputs: sails.config.inputs.Users.Merit.checkin,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                // refId = ngày: mỗi ngày chỉ cộng một lần dù bấm nhiều lần.
                let diem = await ghiCongDuc(inputs.User.id, 'checkin', { refId: ngayVN() })
                ok(exits, Object.assign({ points: diem }, await chuoiDiemDanh(inputs.User.id)))
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    getStats: ({
        inputs: sails.config.inputs.Users.Merit.getStats,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let id = String(inputs.User.id)
                let [congDuc, quyTac, diemDanh, ganDay, tuTap, baiViet, luotXem, binhLuan, loiNguyen] = await Promise.all([
                    tongCongDuc(id),
                    layQuyTac(),
                    chuoiDiemDanh(id),
                    MeritLog.find({ where: { userId: id }, sort: 'createdAt DESC', limit: 15 }),
                    col(PracticeLog).aggregate([
                        { $match: { userId: id } },
                        { $group: { _id: '$type', amount: { $sum: '$amount' }, sessions: { $sum: 1 } } }
                    ]).toArray(),
                    col(Content).aggregate([
                        { $match: { authorId: id } },
                        { $group: { _id: { type: '$type', status: '$status' }, n: { $sum: 1 } } }
                    ]).toArray(),
                    col(Content).aggregate([
                        { $match: { authorId: id, status: 'published' } },
                        { $group: { _id: null, n: { $sum: '$viewCount' } } }
                    ]).toArray(),
                    col(Comment).aggregate([
                        { $match: { userId: id } },
                        { $group: { _id: '$status', n: { $sum: 1 } } }
                    ]).toArray(),
                    Prayer.count({ userId: id })
                ])

                let noiDung = { article: { draft: 0, pending: 0, published: 0, archived: 0 }, library: { draft: 0, pending: 0, published: 0, archived: 0 } }
                baiViet.forEach(b => {
                    let loai = b._id.type === 'library' ? 'library' : 'article'
                    if (noiDung[loai][b._id.status] !== undefined) noiDung[loai][b._id.status] += b.n
                })
                let bl = { visible: 0, hidden: 0, flagged: 0 }
                binhLuan.forEach(b => { if (bl[b._id] !== undefined) bl[b._id] = b.n })
                let tt = {}
                tuTap.forEach(t => { tt[t._id] = { amount: t.amount, sessions: t.sessions } })

                ok(exits, {
                    merit: Object.assign(congDuc, {
                        rules: quyTac,
                        recent: ganDay.map(m => ({ action: m.action, points: m.points, createdAt: new Date(m.createdAt).toISOString() }))
                    }),
                    checkin: diemDanh,
                    practice: tt,
                    content: Object.assign(noiDung, { views: luotXem[0] ? luotXem[0].n : 0 }),
                    comments: { total: bl.visible, deleted: bl.hidden },
                    prayers: loiNguyen,
                    joinedAt: inputs.User.createdAt ? new Date(inputs.User.createdAt).toISOString() : ''
                })
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

};
