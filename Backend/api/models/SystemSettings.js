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
        },
        theme: {
            type: 'json',
            defaultsTo: {},
            description: 'Mau giao dien sang, ghi de bang mac dinh cua FrontEnd. Dang { accent: "#8a6414", paper: "#ffffff", ... }. Chi nhan ma hex; FrontEnd bo qua khoa la va gia tri sai dinh dang.'
        },
        themeDark: {
            type: 'json',
            defaultsTo: {},
            description: 'Nhu tren nhung cho che do toi. De trong thi dung bang toi mac dinh.'
        }
    }
};
