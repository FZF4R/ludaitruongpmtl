let userNotify = require('../../config/notification');

const CATALOGS = {
    en: require('../../config/notification.en').notificationEn,
    vi: require('../../config/notification.vi').notificationVi,
    zh: require('../../config/notification.zh').notificationZh,
    ru: require('../../config/notification.ru').notificationRu,
    th: require('../../config/notification.th').notificationTh,
    fil: require('../../config/notification.fil').notificationFil,
};

const FALLBACK_CHAIN = ['en', 'vi'];

function lookup(catalog, messageNode, message) {
    let entry = catalog && catalog[messageNode] && catalog[messageNode][message];
    return entry && typeof entry.message === 'string' ? entry.message : null;
}

function resolveText(lang, messageNode, message, legacy) {
    let chain = [lang].concat(FALLBACK_CHAIN.filter(item => item !== lang));
    for (let code of chain) {
        let text = lookup(CATALOGS[code], messageNode, message);
        if (text !== null) return text;
    }
    if (legacy && typeof legacy.messageEN === 'string') return legacy.messageEN;
    if (legacy && typeof legacy.messageVNI === 'string') return legacy.messageVNI;
    return '';
}

module.exports = function (inputObject) {
    let req = this.req;
    let res = this.res;
    let node = userNotify.notification[inputObject.messageNode];
    let detailNotify = node ? node[inputObject.message] : null;

    let lang = sails.Ultils.resolveLang(req);

    let responseToClient = {};

    if (detailNotify && detailNotify.message) {
        responseToClient.message = Object.assign({}, detailNotify.message, {
            lang: lang,
            text: resolveText(lang, inputObject.messageNode, inputObject.message, detailNotify.message)
        });
    }

    if (inputObject.data) {
        responseToClient.data = inputObject.data;
    }

    if (inputObject.data && inputObject.data.accessToken) {
        res.cookie('accessToken', inputObject.data.accessToken, {
            httpOnly: false,
            secure: true,
            sameSite: 'strict',
            path: '/',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });
    }

    res.send(responseToClient);
}
