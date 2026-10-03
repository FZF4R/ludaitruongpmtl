/**
 * Công đức: bảng điểm, giới hạn mỗi ngày và ghi điểm.
 *
 * Mọi chỗ cộng điểm gọi `ghiCongDuc(userId, action, { refId })`. Hàm này
 * KHÔNG BAO GIỜ làm hỏng thao tác chính (bình luận đã lưu, bài đã duyệt...):
 * lỗi chỉ ghi log.
 *
 * Bảng điểm admin chỉnh ở /admin/merit, lưu ở MeritConfig; thiếu thì dùng
 * mặc định dưới đây. Đọc lại tối đa mỗi 60 giây (đổi điểm có hiệu lực gần như ngay).
 */
const { ngayVN } = require('./loiNguyen')

/**
 * points: điểm mỗi lần; dailyCap: tối đa điểm loại này mỗi ngày (0 = không giới hạn).
 * Thứ tự ở đây là thứ tự hiện ở trang admin và trang thống kê.
 */
const QUY_TAC_MAC_DINH = {
    checkin: { points: 2, dailyCap: 2, label: 'Điểm danh mỗi ngày' },
    comment: { points: 1, dailyCap: 10, label: 'Viết bình luận' },
    'reply-received': { points: 1, dailyCap: 10, label: 'Bình luận được người khác trả lời' },
    'content-approved': { points: 20, dailyCap: 0, label: 'Bài viết / nội dung thư viện được duyệt' },
    'views-100': { points: 5, dailyCap: 0, label: 'Bài của mình đạt thêm mỗi 100 lượt xem' },
    practice: { points: 3, dailyCap: 15, label: 'Lưu một buổi tu tập vào nhật ký' },
    prayer: { points: 1, dailyCap: 3, label: 'Viết lời nguyện' }
}
const HANH_DONG = Object.keys(QUY_TAC_MAC_DINH)

let boNho = null
let napLuc = 0

/** Bảng điểm đang dùng: mặc định đè bởi bản admin đã lưu. */
const layQuyTac = async () => {
    if (boNho && Date.now() - napLuc < 60 * 1000) return boNho
    let daLuu = {}
    try {
        let cauHinh = await MeritConfig.findOne({ key: 'default' })
        daLuu = (cauHinh && cauHinh.rules) || {}
    } catch (err) {
        sails.log.error('[congDuc] Không đọc được bảng điểm, dùng mặc định:', err.message)
    }
    let kq = {}
    HANH_DONG.forEach(a => {
        let goc = QUY_TAC_MAC_DINH[a]
        let luu = daLuu[a] || {}
        kq[a] = {
            label: goc.label,
            points: Number.isFinite(luu.points) ? luu.points : goc.points,
            dailyCap: Number.isFinite(luu.dailyCap) ? luu.dailyCap : goc.dailyCap,
            enabled: luu.enabled !== false
        }
    })
    boNho = kq
    napLuc = Date.now()

    return kq
}

const xoaBoNho = () => { boNho = null }

const bangCongDuc = () => MeritLog.getDatastore().manager.collection(MeritLog.tableName)

/**
 * Cộng điểm. `soLan` nhân điểm (vd. bài vượt 2 mốc 100 lượt xem cùng lúc).
 * Trả số điểm đã cộng (0 nếu không cộng: tắt, trùng, chạm trần ngày).
 */
const ghiCongDuc = async (userId, action, { refId = '', soLan = 1 } = {}) => {
    try {
        let id = String(userId || '')
        if (!id || !QUY_TAC_MAC_DINH[action]) return 0
        let quyTac = (await layQuyTac())[action]
        if (!quyTac.enabled || quyTac.points <= 0) return 0

        if (refId && await MeritLog.findOne({ userId: id, action, refId: String(refId) })) return 0

        let diem = quyTac.points * Math.max(1, Math.floor(soLan))
        let ngay = ngayVN()
        if (quyTac.dailyCap > 0) {
            let [tong] = await bangCongDuc().aggregate([
                { $match: { userId: id, action, dayKey: ngay } },
                { $group: { _id: null, n: { $sum: '$points' } } }
            ]).toArray()
            let daCo = tong ? tong.n : 0
            if (daCo >= quyTac.dailyCap) return 0
            diem = Math.min(diem, quyTac.dailyCap - daCo)
        }

        await MeritLog.create({ userId: id, action, points: diem, refId: String(refId || ''), dayKey: ngay })

        return diem
    } catch (err) {
        sails.log.error('[congDuc] Không ghi được công đức:', err.message)
        return 0
    }
}

/**
 * Bài vừa được xem: tác giả nhận điểm khi bài vượt mỗi mốc 100 lượt (mốc dùng
 * làm refId nên mỗi mốc chỉ cộng một lần).
 */
const congDucLuotXem = async (bai, luotXemMoi) => {
    if (!bai || !bai.authorId || !luotXemMoi || luotXemMoi % 100 !== 0) return
    await ghiCongDuc(bai.authorId, 'views-100', { refId: `${bai.id || bai._id}:${luotXemMoi}` })
}

/** Tổng công đức, hôm nay, và theo từng loại của một người. */
const tongCongDuc = async userId => {
    let id = String(userId)
    let [tong, homNay] = await Promise.all([
        bangCongDuc().aggregate([
            { $match: { userId: id } },
            { $group: { _id: '$action', n: { $sum: '$points' }, lan: { $sum: 1 } } }
        ]).toArray(),
        bangCongDuc().aggregate([
            { $match: { userId: id, dayKey: ngayVN() } },
            { $group: { _id: null, n: { $sum: '$points' } } }
        ]).toArray()
    ])
    let theoLoai = {}
    tong.forEach(t => { theoLoai[t._id] = { points: t.n, times: t.lan } })

    return {
        total: tong.reduce((s, t) => s + t.n, 0),
        today: homNay[0] ? homNay[0].n : 0,
        byAction: theoLoai
    }
}

module.exports = { QUY_TAC_MAC_DINH, HANH_DONG, layQuyTac, xoaBoNho, ghiCongDuc, congDucLuotXem, tongCongDuc, bangCongDuc }
