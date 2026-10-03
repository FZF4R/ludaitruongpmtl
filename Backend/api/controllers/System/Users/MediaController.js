/**
 * MediaController (người dùng đã đăng nhập): tải ảnh / âm thanh lên để dùng
 * trong bài viết và nội dung thư viện. Trả đường dẫn công khai của tệp.
 *
 * Quyền: có một trong các quyền soạn nội dung (config/permissions.js).
 */
const { ngayVN } = require('../../../utils/loiNguyen')

const GIOI_HAN = {
    image: { mime: /^image\/(jpeg|png|webp|gif)$/, toiDa: 4 * 1024 * 1024 },
    audio: { mime: /^audio\/(mpeg|mp3|wav|x-wav|wave|ogg|mp4|x-m4a|aac|webm)$/, toiDa: 10 * 1024 * 1024 }
}
/** Mỗi người tối đa chừng này tệp mỗi ngày. */
const TEP_TOI_DA_NGAY = 40

const loi = (exits, message) => sails.checkErrorOutput({ messageNode: 'Content', message }, exits)

module.exports = {

    upload: ({
        inputs: sails.config.inputs.Users.Media.upload,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let khop = String(inputs.file || '').match(/^data:([\w/+.-]+);base64,([A-Za-z0-9+/=]+)$/)
                if (!khop) return loi(exits, 'mediaInvalid')
                let mime = khop[1].toLowerCase()
                let kind = Object.keys(GIOI_HAN).find(k => GIOI_HAN[k].mime.test(mime))
                if (!kind) return loi(exits, 'mediaInvalid')
                let size = Math.floor(khop[2].length * 3 / 4)
                if (size > GIOI_HAN[kind].toiDa) return loi(exits, 'mediaTooLarge')

                let tuDauNgay = new Date(`${ngayVN()}T00:00:00+07:00`).getTime()
                let daTai = await MediaFile.count({ userId: String(inputs.User.id), createdAt: { '>=': tuDauNgay } })
                if (daTai >= TEP_TOI_DA_NGAY) return loi(exits, 'mediaTooMany')

                let moi = await MediaFile.create({
                    userId: String(inputs.User.id),
                    kind, mime, data: khop[2], sizeBytes: size,
                    name: String(inputs.name || '').slice(0, 200)
                }).fetch()

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: { id: String(moi.id), kind, url: `/v1/public/media/${moi.id}/file`, sizeBytes: size }
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

};
