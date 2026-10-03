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
            type: 'json',
            defaultsTo: '',
            description: 'Dai thong bao dau trang chu. Nhan MOT chuoi (dat cung mot cau) hoac MOT MANG chuoi - mang thi PublicController.getSettings rut ngau nhien mot cau moi luot goi. API luon tra ve chuoi.'
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
        // Khung liên hệ góc dưới phải trang chủ (FrontEnd components/home/contact-dock.tsx).
        // Nhận link đầy đủ hoặc dạng rút gọn (số điện thoại Zalo, @tên TikTok).
        zalosupportinfo: {
            type: 'string',
            description: 'Kenh Zalo (Zalo OA / nhom) - link zalo.me/...'
        },
        zaloadminsupportinfo: {
            type: 'string',
            description: 'Zalo admin - so dien thoai hoac link zalo.me/...'
        },
        supporttiktok: {
            type: 'string',
            description: 'Kenh TikTok - link hoac @ten'
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
        bannedWords: {
            type: 'json',
            defaultsTo: [],
            description: 'Tu khoa bi cam trong binh luan (api/utils/tuCam.js). KHONG tra ra o /v1/public/settings.'
        },
        articleLayout: {
            type: 'string',
            isIn: ['card', 'list'],
            defaultsTo: 'card',
            description: 'Kieu hien thi danh sach /bai-viet: card (luoi the) hoac list (danh sach doc).'
        },
        themeDark: {
            type: 'json',
            defaultsTo: {},
            description: 'Nhu tren nhung cho che do toi. De trong thi dung bang toi mac dinh.'
        }
    }
};
