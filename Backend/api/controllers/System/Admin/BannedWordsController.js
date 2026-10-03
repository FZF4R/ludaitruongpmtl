/**
 * BannedWordsController: đọc / ghi danh sách từ cấm MẶC ĐỊNH
 * (data/tu-cam-mac-dinh.txt). Danh sách này không hiện ở giao diện nào.
 *
 * Chỉ MỘT tài khoản dùng được: vai trò Admin và email đúng bằng
 * sails.config.custom.chuTuCamEmail. Không đi qua bảng quyền (permissions.js)
 * vì không muốn quyền này cấp được cho ai khác qua màn hình Phân quyền.
 * Người khác gọi nhận 404 như thể endpoint không tồn tại.
 */
const { docTepMacDinh, ghiTepMacDinh, lamSachDanhSach } = require('../../../utils/tuCam')

/** Tối đa 5.000 dòng, 200 KB. */
const DONG_TOI_DA = 5000
const BYTE_TOI_DA = 200 * 1024

const laChu = user => !!user && user.role === 'Admin' &&
    String(user.email || '').trim().toLowerCase() === sails.config.custom.chuTuCamEmail

const khongThay = exits => sails.checkErrorOutput({ messageNode: 'GlobalNotifications', message: 'error', reponseType: 'notFound' }, exits)

module.exports = {

    getDefault: ({
        inputs: sails.config.inputs.Admin.BannedWords.getDefault,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                if (!laChu(inputs.User)) return khongThay(exits)
                let noiDung = await docTepMacDinh()
                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: { content: noiDung, words: lamSachDanhSach(noiDung, DONG_TOI_DA).length }
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    /** Ghi đè cả tệp. `content`: mỗi dòng một từ / cụm (dấu phẩy cũng tách). */
    saveDefault: ({
        inputs: sails.config.inputs.Admin.BannedWords.saveDefault,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                if (!laChu(inputs.User)) return khongThay(exits)
                let ds = lamSachDanhSach(String(inputs.content || ''), DONG_TOI_DA)
                let noiDung = ds.join('\n') + (ds.length ? '\n' : '')
                if (Buffer.byteLength(noiDung, 'utf8') > BYTE_TOI_DA) {
                    return sails.checkErrorOutput({ messageNode: 'Users', message: 'meritInvalid' }, exits)
                }
                await ghiTepMacDinh(noiDung)
                sails.log.info('[tuCam] Danh sách mặc định được cập nhật bởi', inputs.User.username, '-', ds.length, 'từ')
                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: { words: ds.length }
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

};
