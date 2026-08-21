/**
 * ProductCategory.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

    tableName: 'ProductCategory',
    attributes: {
        name: {
            type: 'string',
            required: true
        },
        countryName: {
            type: 'string',
        },
        countryCode: {
            type: 'string',
        },
        isActive: {
            type: 'boolean',
            defaultsTo: true
        },
        note: {
            type: 'string'
        },
        hash_key: {
            type: 'string',
            defaultsTo: "san_pham"
        },
        icon: {
            type: 'string',
            defaultsTo: "ri-facebook-fill"
        },
        imgUrl: {
            type: 'string',
            defaultsTo: "ri-facebook-fill"
        },
        color: {
            type: 'string',
            defaultsTo: "ri-facebook-fill"
        },
        folderType: {
            type: 'number',
            defaultsTo: 0,
        },
        langLib: {
            type: 'json',
            defaultsTo: [],
            description: 'Danh sách nội dung theo ngôn ngữ: [{ lang, name, note, description }]'
        },
    },

};
