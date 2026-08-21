/**
 * Category.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

    tableName: 'Category',
    attributes: {
        name: {
            type: 'string',
            required: true,
        },
        price: {
            type: 'number',
            required: true
        },
        note: {
            type: 'string',
            defaultsTo: ''
        },
        description: {
            type: 'string',
            defaultsTo: ''
        },
        imgUrl: {
            type: 'string',
            defaultsTo: ''
        },
        importPrice: {
            type: 'number',
            defaultsTo: 0
        },
        sold: {
            type: 'number',
            defaultsTo: 0
        },
        discount: {
            type: 'number',
            defaultsTo: 0
        },
        totalProduct: {
            type: 'number',
            defaultsTo: 0
        },
        isHot: {
            type: 'boolean',
            defaultsTo: false
        },
        isActive: {
            type: 'boolean',
            defaultsTo: true
        },
        isSalePrice: {
            type: 'boolean',
            defaultsTo: true
        },
        isCheckLive: {
            type: 'boolean',
            defaultsTo: true
        },
        category: {
            type: 'string',
            required: true,
        },
        isNotPartnerPrice: {
          type: 'boolean',
          defaultsTo: false,
        },
        langLib: {
          type: 'json',
          defaultsTo: [],
          description: 'Danh sách nội dung theo ngôn ngữ: [{ lang, name, note, description }]'
        }
    },

};
