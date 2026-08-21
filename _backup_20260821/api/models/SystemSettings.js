/**
 * Product.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

    tableName: 'SystemSettings',

    attributes: {
        websiteConfigs: {
            type: 'json',
            columnType: 'array',
            defaultsTo: []
        },
        bankApiUrl: {
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
        loginUser: {
            type: 'string',
        },
        loginPass: {
            type: 'string',
        },
        loginPageUrl: {
            type: 'string',
        },
        accountSessionUrl: {
            type: 'string',
        },
        followServiceUrl: {
            type: 'string',
        },
        jsessionId: {
            type: 'string',
        },
        pageTK: {
            type: 'string',
        },
        buyServiceUrl: {
            type: 'string'
        },
        isMaintaning: {
            type: 'boolean'
        },
        mainfolder: {
            type: 'json'
        },
        langLib: {
            type: 'json',
            defaultsTo: [],
            description: 'Danh sach noi dung theo ngon ngu: [{ lang, title, notify, note, mainWarning, mainPolicy }]'
        }
    }
};
