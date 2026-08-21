/**
 * Notify.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

    tableName: 'Notify',
    attributes: {
        title: {
            type: 'string',
            required: true,
        },
        text: {
            type: 'string',
            required: true,
        },
        type: {
            type: 'string',
            defaultsTo: '',
        },
        isShow: {
            type: 'boolean',
            defaultsTo: true
        },
        langLib: {
            type: 'json',
            defaultsTo: [],
            description: 'Danh sach noi dung theo ngon ngu: [{ lang, title, text }]'
        }
    },

};
