/**
 * SystemSettings.js
 *
 * @description :: Cau hinh chung cua website (tieu de, thong bao, thong tin ho tro, che do bao tri).
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

    tableName: 'SystemSettings',

    attributes: {
        title: {
            type: 'string',
        },
        notify: {
            type: 'string',
        },
        warning: {
            type: 'string',
        },
        note: {
            type: 'string',
        },
        supportphonenumber: {
            type: 'string',
        },
        pagefacebookinfo: {
            type: 'string',
        },
        supportfacebook: {
            type: 'string',
        },
        supporttelegram: {
            type: 'string',
        },
        isMaintaning: {
            type: 'boolean'
        },
        langLib: {
            type: 'json',
            defaultsTo: [],
            description: 'Danh sach noi dung theo ngon ngu: [{ lang, title, notify, note, mainWarning, mainPolicy }]'
        }
    }
};
