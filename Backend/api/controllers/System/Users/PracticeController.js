/**
 * PracticeController (người dùng đã đăng nhập)
 *
 * Ghi nhật ký tu tập và trả thống kê cho trang Quá trình tu tập. Chỉ cần đăng
 * nhập (userPolices); mọi truy vấn khoá theo userId của người gọi.
 */
const { ngayVN } = require('../../../utils/loiNguyen')
const { ghiCongDuc } = require('../../../utils/congDuc')

const LOAI = ['tung-kinh', 'niem-phat', 'thien', 'go-mo', 'chuoi-hat']
/** Trần mỗi bản ghi, chặn số liệu vô lý: 12 giờ thiền, 100.000 câu/tiếng/hạt, 50 lần tụng. */
const TRAN = { thien: 12 * 3600, 'tung-kinh': 50, 'niem-phat': 100000, 'go-mo': 100000, 'chuoi-hat': 100000 }
const MOT_NGAY = 86400000

/**
 * Chống số liệu giả: các loại này phải lưu kèm phiên do máy chủ mở
 * (startSession). Số lần tối đa = thời gian thật đã trôi qua / khoảng tối
 * thiểu mỗi lần - mõ 0,4 giây/tiếng, chuỗi 0,6 giây/hạt; thiền không quá thời
 * gian thật. Vượt thì hạ xuống mức tối đa (không từ chối cả buổi).
 */
const KHOANG_TOI_THIEU_MS = { 'go-mo': 400, 'chuoi-hat': 600 }
const CAN_PHIEN = ['thien', 'go-mo', 'chuoi-hat']
const PHIEN_SONG_MS = 12 * 3600 * 1000
/** Dung sai: lần chạm đầu tiên (lúc mở phiên) + trễ mạng. */
const DUNG_SAI_LAN = 2
const DUNG_SAI_GIAY = 10
const CAU_HINH_TOI_DA = 30
const LOAI_CAU_HINH = ['thien', 'cau-an']
/** Nhạc riêng của mỗi tài khoản: tối đa 10 tệp, mỗi tệp 10 MB. */
const NHAC_RIENG_TOI_DA = 10
const NHAC_RIENG_BYTE = 10 * 1024 * 1024
const dinhDangNhac = f => ({ id: String(f.id || f._id), name: f.name || '', url: `/v1/public/media/${f.id || f._id}/file`, sizeBytes: f.sizeBytes || 0 })
const BYTE_CAU_HINH = 8 * 1024

const bangPhien = () => PracticeSession.getDatastore().manager.collection(PracticeSession.tableName)

const dinhDangCauHinh = p => ({
    id: String(p.id || p._id),
    name: p.name,
    config: p.config || {},
    lastUsedAt: p.lastUsedAt || 0
})

const baoLoi = (exits, message) => sails.checkErrorOutput({ messageNode: 'Users', message: message }, exits)

module.exports = {

    /** Mở phiên cho gõ mõ / lần chuỗi / thiền - gọi ở lần chạm đầu tiên (hoặc lúc bắt đầu thiền). */
    startSession: ({
        inputs: sails.config.inputs.Users.Practice.startSession,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                if (!CAN_PHIEN.includes(inputs.type)) return baoLoi(exits, 'practiceLogInvalid')
                let moi = await PracticeSession.create({
                    userId: String(inputs.User.id),
                    type: inputs.type,
                    startedAt: Date.now()
                }).fetch()
                // Dọn phiên quá hạn của người này (không chờ).
                PracticeSession.destroy({ userId: String(inputs.User.id), startedAt: { '<': Date.now() - PHIEN_SONG_MS } }).catch(() => {})
                exits.successRequest({ messageNode: 'GlobalNotifications', message: 'success', data: { sessionId: String(moi.id) } });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    listPresets: ({
        inputs: sails.config.inputs.Users.Practice.listPresets,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let kind = LOAI_CAU_HINH.includes(inputs.kind) ? inputs.kind : 'thien'
                let ds = await PracticePreset.find({ where: { userId: String(inputs.User.id), kind }, sort: 'createdAt ASC' })
                exits.successRequest({ messageNode: 'GlobalNotifications', message: 'success', data: ds.map(dinhDangCauHinh) });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    /** Tạo (không id) hoặc ghi đè bộ cấu hình của mình. `used: true` chỉ ghi lần dùng gần nhất. */
    savePreset: ({
        inputs: sails.config.inputs.Users.Practice.savePreset,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let userId = String(inputs.User.id)
                if (inputs.id && inputs.used) {
                    let p = await PracticePreset.updateOne({ id: String(inputs.id), userId }).set({ lastUsedAt: Date.now() })
                    if (!p) return baoLoi(exits, 'practiceLogInvalid')
                    return exits.successRequest({ messageNode: 'GlobalNotifications', message: 'success', data: dinhDangCauHinh(p) });
                }
                let ten = String(inputs.name || '').trim().slice(0, 60)
                let cauHinh = inputs.config && typeof inputs.config === 'object' && !Array.isArray(inputs.config) ? inputs.config : null
                if (!ten || !cauHinh || JSON.stringify(cauHinh).length > BYTE_CAU_HINH) return baoLoi(exits, 'practiceLogInvalid')

                let kq
                if (inputs.id) {
                    kq = await PracticePreset.updateOne({ id: String(inputs.id), userId }).set({ name: ten, config: cauHinh })
                    if (!kq) return baoLoi(exits, 'practiceLogInvalid')
                } else {
                    let kind = LOAI_CAU_HINH.includes(inputs.kind) ? inputs.kind : 'thien'
                    if (await PracticePreset.count({ userId, kind }) >= CAU_HINH_TOI_DA) return baoLoi(exits, 'practicePresetTooMany')
                    kq = await PracticePreset.create({ userId, kind, name: ten, config: cauHinh, lastUsedAt: Date.now() }).fetch()
                }
                exits.successRequest({ messageNode: 'GlobalNotifications', message: 'success', data: dinhDangCauHinh(kq) });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    /** Nhạc riêng (âm nền cầu nguyện...) của chính mình. */
    listMyAudio: ({
        inputs: sails.config.inputs.Users.Practice.listMyAudio,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let ds = await MediaFile.getDatastore().manager.collection(MediaFile.tableName)
                    .find({ userId: String(inputs.User.id), purpose: 'practice' }, { projection: { data: 0 } })
                    .sort({ createdAt: 1 }).toArray()
                exits.successRequest({ messageNode: 'GlobalNotifications', message: 'success', data: ds.map(dinhDangNhac) });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    /** Tải một tệp nhạc riêng lên (data:audio/...;base64). Chỉ cần đăng nhập - không cần quyền viết bài. */
    uploadMyAudio: ({
        inputs: sails.config.inputs.Users.Practice.uploadMyAudio,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let khop = String(inputs.file || '').match(/^data:(audio\/(?:mpeg|mp3|wav|x-wav|wave|ogg|mp4|x-m4a|aac|webm));base64,([A-Za-z0-9+/=]+)$/i)
                if (!khop) return baoLoi(exits, 'practiceAudioInvalid')
                let size = Math.floor(khop[2].length * 3 / 4)
                if (size > NHAC_RIENG_BYTE) return baoLoi(exits, 'practiceAudioInvalid')
                let userId = String(inputs.User.id)
                if (await MediaFile.count({ userId, purpose: 'practice' }) >= NHAC_RIENG_TOI_DA) return baoLoi(exits, 'practiceAudioTooMany')
                let moi = await MediaFile.create({
                    userId, kind: 'audio', mime: khop[1].toLowerCase(), data: khop[2], sizeBytes: size,
                    name: String(inputs.name || '').replace(/\.[^.]+$/, '').trim().slice(0, 120) || 'Nhạc của tôi',
                    purpose: 'practice'
                }).fetch()
                exits.successRequest({ messageNode: 'GlobalNotifications', message: 'success', data: dinhDangNhac(moi) });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    deleteMyAudio: ({
        inputs: sails.config.inputs.Users.Practice.deleteMyAudio,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                await MediaFile.destroyOne({ id: String(inputs.id), userId: String(inputs.User.id), purpose: 'practice' })
                exits.successRequest({ messageNode: 'GlobalNotifications', message: 'success', data: { id: String(inputs.id) } });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    deletePreset: ({
        inputs: sails.config.inputs.Users.Practice.deletePreset,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                await PracticePreset.destroyOne({ id: String(inputs.id), userId: String(inputs.User.id) })
                exits.successRequest({ messageNode: 'GlobalNotifications', message: 'success', data: { id: String(inputs.id) } });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    addLog: ({
        inputs: sails.config.inputs.Users.Practice.addLog,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let soLuong = Math.round(Number(inputs.amount))
                if (!LOAI.includes(inputs.type) || !(soLuong > 0) || soLuong > TRAN[inputs.type]) {
                    return baoLoi(exits, 'practiceLogInvalid')
                }

                let daHa = false
                if (CAN_PHIEN.includes(inputs.type)) {
                    let { ObjectId } = require('mongodb')
                    let idPhien = String(inputs.sessionId || '')
                    let phien = ObjectId.isValid(idPhien) ? await bangPhien().findOne({ _id: new ObjectId(idPhien) }) : null
                    let bayGio = Date.now()
                    if (!phien || phien.userId !== String(inputs.User.id) || phien.type !== inputs.type ||
                        phien.usedAt || bayGio - phien.startedAt > PHIEN_SONG_MS) {
                        return baoLoi(exits, 'practiceSessionInvalid')
                    }
                    // Đánh dấu đã dùng TRƯỚC khi ghi (điều kiện usedAt = 0): hai lượt lưu
                    // song song cùng một phiên thì chỉ một lượt qua.
                    let chiem = await bangPhien().updateOne({ _id: phien._id, usedAt: 0 }, { $set: { usedAt: bayGio } })
                    if (!chiem.modifiedCount) return baoLoi(exits, 'practiceSessionInvalid')

                    let daQua = bayGio - phien.startedAt
                    let toiDa = inputs.type === 'thien'
                        ? Math.ceil(daQua / 1000) + DUNG_SAI_GIAY
                        : Math.floor(daQua / KHOANG_TOI_THIEU_MS[inputs.type]) + DUNG_SAI_LAN
                    if (soLuong > toiDa) {
                        sails.log.warn('[practice] Hạ số liệu', inputs.type, soLuong, '->', toiDa, 'của', inputs.User.username)
                        soLuong = toiDa
                        daHa = true
                    }
                }

                let moi = await PracticeLog.create({
                    userId: String(inputs.User.id),
                    type: inputs.type,
                    amount: soLuong,
                    note: String(inputs.note || '').trim().slice(0, 160),
                    dayKey: ngayVN()
                }).fetch()
                await ghiCongDuc(inputs.User.id, 'practice', { refId: String(moi.id) })

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: { id: String(moi.id), amount: soLuong, adjusted: daHa }
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    /**
     * Thống kê: tổng từng loại (hôm nay / 7 ngày / toàn bộ), chuỗi ngày tu
     * liên tục, từng ngày trong 30 ngày gần nhất, 20 bản ghi mới nhất.
     */
    getStats: ({
        inputs: sails.config.inputs.Users.Practice.getStats,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let userId = String(inputs.User.id)
                let bang = PracticeLog.getDatastore().manager.collection(PracticeLog.tableName)
                let homNay = ngayVN()
                let mocNgay = n => ngayVN(Date.now() - n * MOT_NGAY)
                let tu30 = mocNgay(29)
                let tu7 = mocNgay(6)

                let [tongTatCa, theoNgay, cacNgay, ganDay] = await Promise.all([
                    bang.aggregate([
                        { $match: { userId: userId } },
                        { $group: { _id: '$type', amount: { $sum: '$amount' }, count: { $sum: 1 } } }
                    ]).toArray(),
                    bang.aggregate([
                        { $match: { userId: userId, dayKey: { $gte: tu30 } } },
                        { $group: { _id: { day: '$dayKey', type: '$type' }, amount: { $sum: '$amount' } } }
                    ]).toArray(),
                    bang.distinct('dayKey', { userId: userId }),
                    PracticeLog.find({ where: { userId: userId }, sort: 'createdAt DESC', limit: 20 })
                ])

                let tong = {}
                LOAI.forEach(l => { tong[l] = { today: 0, week: 0, all: 0, sessions: 0 } })
                tongTatCa.forEach(r => { if (tong[r._id]) Object.assign(tong[r._id], { all: r.amount, sessions: r.count }) })

                let ngay = {}
                theoNgay.forEach(r => {
                    let { day, type } = r._id
                    if (!tong[type]) return
                    ngay[day] = ngay[day] || {}
                    ngay[day][type] = r.amount
                    if (day === homNay) tong[type].today += r.amount
                    if (day >= tu7) tong[type].week += r.amount
                })

                // Chuỗi ngày liên tục tính tới hôm nay (hôm nay chưa tu thì tính tới hôm qua).
                let coNgay = new Set(cacNgay)
                let chuoi = 0
                let lui = coNgay.has(homNay) ? 0 : 1
                while (coNgay.has(mocNgay(lui))) { chuoi++; lui++ }

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: {
                        totals: tong,
                        streak: chuoi,
                        activeDays: coNgay.size,
                        days: Array.from({ length: 30 }, (_, i) => {
                            let d = mocNgay(29 - i)
                            return { day: d, values: ngay[d] || {} }
                        }),
                        recent: ganDay.map(l => ({
                            id: String(l.id),
                            type: l.type,
                            amount: l.amount,
                            note: l.note,
                            createdAt: new Date(l.createdAt).toISOString()
                        }))
                    }
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

};
