/**
 * SoundController (quản trị)
 *
 * Quản lý âm thanh cho các mục tu tập ở /admin/practice: thêm (tải tệp lên
 * hoặc dán link), sửa tên / loại / mục / bật-tắt / phát lặp, xoá, sắp xếp.
 * Quyền `practice.manage` (config/permissions.js).
 */
const { DANH_MUC, LOAI, bangAmThanh, dinhDangAmThanh, docTepAmThanh, linkHopLe } = require('../../../utils/amThanh')

const TOI_DA_MOI_MUC = 50

const baoLoi = (exits, message) => sails.checkErrorOutput({ messageNode: 'Users', message: message }, exits)
const thanhCong = (exits, data) => exits.successRequest({ messageNode: 'GlobalNotifications', message: 'success', data: data })

module.exports = {

    /** Toàn bộ âm thanh (kể cả đang tắt), kèm thông tin quản trị. */
    listAll: ({
        inputs: sails.config.inputs.Admin.Sound.listAll,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let ds = await bangAmThanh()
                    .find({}, { projection: { data: 0 } })
                    .sort({ category: 1, order: 1, createdAt: 1 })
                    .toArray()
                thanhCong(exits, ds.map(r => dinhDangAmThanh(r, { quanTri: true })))
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    addSound: ({
        inputs: sails.config.inputs.Admin.Sound.addSound,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                if (!DANH_MUC.includes(inputs.category) || !LOAI.includes(inputs.kind)) return baoLoi(exits, 'soundInvalid')
                let title = String(inputs.title || '').trim().slice(0, 120)
                if (!title) return baoLoi(exits, 'soundInvalid')

                let ban = {
                    category: inputs.category,
                    kind: inputs.kind,
                    title: title,
                    loop: inputs.kind === 'am-nen' ? true : !!inputs.loop,
                    uploadedBy: inputs.User.username || ''
                }
                if (inputs.file) {
                    let tep = docTepAmThanh(inputs.file)
                    if (!tep) return baoLoi(exits, 'soundFileInvalid')
                    Object.assign(ban, { source: 'upload', data: tep.base64, mime: tep.mime, sizeBytes: tep.size })
                } else if (linkHopLe(inputs.url)) {
                    Object.assign(ban, { source: 'url', url: String(inputs.url).trim() })
                } else {
                    return baoLoi(exits, 'soundFileInvalid')
                }

                let soMuc = await PracticeSound.count({ category: inputs.category })
                if (soMuc >= TOI_DA_MOI_MUC) return baoLoi(exits, 'soundTooMany')
                ban.order = soMuc

                let moi = await PracticeSound.create(ban).fetch()
                thanhCong(exits, dinhDangAmThanh(moi, { quanTri: true }))
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    updateSound: ({
        inputs: sails.config.inputs.Admin.Sound.updateSound,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let ban = {}
                if (inputs.title !== undefined) {
                    let t = String(inputs.title).trim().slice(0, 120)
                    if (!t) return baoLoi(exits, 'soundInvalid')
                    ban.title = t
                }
                if (inputs.category !== undefined) {
                    if (!DANH_MUC.includes(inputs.category)) return baoLoi(exits, 'soundInvalid')
                    ban.category = inputs.category
                }
                if (inputs.kind !== undefined) {
                    if (!LOAI.includes(inputs.kind)) return baoLoi(exits, 'soundInvalid')
                    ban.kind = inputs.kind
                }
                if (inputs.active !== undefined) ban.active = !!inputs.active
                if (inputs.loop !== undefined) ban.loop = !!inputs.loop
                if (inputs.url !== undefined) {
                    if (!linkHopLe(inputs.url)) return baoLoi(exits, 'soundFileInvalid')
                    ban.url = String(inputs.url).trim()
                }

                let sau = await PracticeSound.updateOne({ id: String(inputs.id) }).set(ban)
                if (!sau) return baoLoi(exits, 'soundNotFound')
                thanhCong(exits, dinhDangAmThanh(sau, { quanTri: true }))
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    deleteSound: ({
        inputs: sails.config.inputs.Admin.Sound.deleteSound,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let xoa = await PracticeSound.destroyOne({ id: String(inputs.id) })
                if (!xoa) return baoLoi(exits, 'soundNotFound')
                thanhCong(exits, { id: String(inputs.id) })
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    /** Thứ tự mới của MỘT mục (danh sách id theo thứ tự hiển thị). */
    reorderSounds: ({
        inputs: sails.config.inputs.Admin.Sound.reorderSounds,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                if (!Array.isArray(inputs.ids)) return baoLoi(exits, 'soundInvalid')
                for (let i = 0; i < inputs.ids.length; i++) {
                    await PracticeSound.updateOne({ id: String(inputs.ids[i]) }).set({ order: i })
                }
                thanhCong(exits, { ids: inputs.ids })
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

};
