/**
 * HeroImageController (quản trị)
 *
 * Thêm, xoá, sắp xếp ảnh xoay vòng trang chủ. Quyền `system.settings`
 * (config/permissions.js), cùng quyền với phần cấu hình giao diện khác.
 */

const MIME_HOP_LE = ['image/jpeg', 'image/png', 'image/webp']
// Trần sau khi giải base64. Trình duyệt đã thu nhỏ còn vài trăm KB, nên chạm
// trần này nghĩa là ảnh gốc gửi thẳng lên - từ chối để CSDL không phình.
const TOI_DA_BYTE = 5 * 1024 * 1024
const TOI_DA_SO_ANH = 12

const { dinhDangAnh: dinhDang, chuanNhom, dieuKienNhom } = require('../../../utils/heroImage')

/** Ba byte đầu thật sự là ảnh đúng loại khai báo không, đừng tin `mime` client gửi. */
const dungLoai = (buf, mime) => {
    if (mime === 'image/jpeg') return buf[0] === 0xff && buf[1] === 0xd8
    if (mime === 'image/png') return buf[0] === 0x89 && buf[1] === 0x50
    if (mime === 'image/webp') return buf.slice(8, 12).toString('ascii') === 'WEBP'
    return false
}

const baoLoi = (exits, message) => sails.checkErrorOutput({ messageNode: 'Users', message: message }, exits)

module.exports = {

    addImage: ({
        inputs: sails.config.inputs.Admin.HeroImage.addImage,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let khop = String(inputs.image).match(/^data:(image\/[a-z]+);base64,(.+)$/)
                if (!khop || !MIME_HOP_LE.includes(khop[1])) return baoLoi(exits, 'heroImageInvalid')

                let buf = Buffer.from(khop[2], 'base64')
                if (!buf.length || buf.length > TOI_DA_BYTE || !dungLoai(buf, khop[1])) {
                    return baoLoi(exits, 'heroImageInvalid')
                }

                // Giới hạn và thứ tự tính RIÊNG từng nhóm (ảnh bìa / ảnh lời nguyện).
                let nhom = chuanNhom(inputs.group)
                let soAnh = await HeroImage.getDatastore().manager.collection(HeroImage.tableName)
                    .countDocuments(dieuKienNhom(nhom))
                if (soAnh >= TOI_DA_SO_ANH) return baoLoi(exits, 'heroImageTooMany')

                let moi = await HeroImage.create({
                    data: khop[2],
                    mime: khop[1],
                    width: Math.round(inputs.width) || 0,
                    height: Math.round(inputs.height) || 0,
                    alt: sails.config.survey.chuoiNgan(inputs.alt, 200),
                    // Ảnh mới xếp cuối hàng.
                    order: soAnh,
                    group: nhom,
                    uploadedBy: inputs.User.username || ''
                }).fetch()

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: dinhDang(moi)
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    deleteImage: ({
        inputs: sails.config.inputs.Admin.HeroImage.deleteImage,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                await HeroImage.destroyOne({ id: inputs.id })
                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: { id: inputs.id }
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    /** Nhận toàn bộ thứ tự mới; id lạ bị bỏ qua, id thiếu giữ thứ tự sau cùng. */
    reorderImages: ({
        inputs: sails.config.inputs.Admin.HeroImage.reorderImages,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                if (!Array.isArray(inputs.ids)) return baoLoi(exits, 'heroImageInvalid')

                let ids = inputs.ids.map(String)
                for (let i = 0; i < ids.length; i++) {
                    await HeroImage.updateOne({ id: ids[i] }).set({ order: i })
                }

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: { ids: ids }
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

};
