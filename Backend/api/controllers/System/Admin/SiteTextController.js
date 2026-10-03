/**
 * SiteTextController (quản trị)
 *
 * Lưu một chuỗi giao diện admin vừa sửa ngay trên trang. Quyền
 * `site.text.edit` (config/permissions.js).
 *
 * Giá trị chỉ là CHỮ THUẦN: FrontEnd render qua React nên HTML bị escape,
 * không có đường nào để chèn mã vào trang qua đây.
 */

const LANGS = ['vi', 'en', 'zh', 'ko']
const KEY_HOP_LE = /^[A-Za-z0-9_.-]{1,80}$/
const DAI_TOI_DA = 2000

module.exports = {

    updateText: ({
        inputs: sails.config.inputs.Admin.SiteText.updateText,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let { User, lang, key } = inputs
                let baoLoi = message => sails.checkErrorOutput({ messageNode: 'Users', message: message }, exits)

                if (!LANGS.includes(lang) || !KEY_HOP_LE.test(key)) return baoLoi('siteTextInvalid')

                // Bỏ \r để chữ nhiều dòng gõ trên Windows không lệch với bản mặc định.
                let value = String(inputs.value || '').replace(/\r/g, '').trim()
                if (value.length > DAI_TOI_DA) return baoLoi('siteTextInvalid')

                let banGhi = await SiteText.findOne({ lang: lang, key: key })

                if (!value) {
                    if (banGhi) await SiteText.destroyOne({ id: banGhi.id })
                } else {
                    let giaTri = {
                        value: value,
                        updatedById: String(User.id),
                        updatedByUsername: User.username || ''
                    }
                    if (banGhi) await SiteText.updateOne({ id: banGhi.id }).set(giaTri)
                    else await SiteText.create(Object.assign({ lang: lang, key: key }, giaTri))
                }

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: { lang: lang, key: key, value: value }
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

};
