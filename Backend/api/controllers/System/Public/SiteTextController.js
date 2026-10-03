/**
 * SiteTextController (công khai)
 *
 * Trả mọi chữ giao diện đã được admin sửa của một ngôn ngữ, dạng phẳng
 * { "home.latest": "...", ... }. FrontEnd gộp lên từ điển mặc định lúc render.
 */

const LANGS = ['vi', 'en', 'zh', 'ko']

module.exports = {

    getTexts: ({
        inputs: sails.config.inputs.Public.SiteText.getTexts,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let lang = LANGS.includes(inputs.lang) ? inputs.lang : 'vi'
                let banGhi = await SiteText.find({ lang: lang })

                let data = {}
                banGhi.forEach(muc => { data[muc.key] = muc.value })

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: data
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

};
