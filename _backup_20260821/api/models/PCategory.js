/**
 * PCategory.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
    tableName: 'PCategory',
    attributes: {
        name: {
            type: 'string',
        },
        p_id: {
            type: "number",
        },
        object_id: { // Sử dụng cho nguyenlieummo4, mlocalus
            type: 'string',
        },
        price: {
            type: 'number',
            required: true,
        },
        category: {
            type: 'string',
            defaultsTo: ''
        },
        type: {
            type: "number",
            defaultsTo: 4
        },
        updatefolder: {
            type: 'string',
        },
        updatefoldername: {
            type: 'string',
        },
        expiredupdatetime: {
            type: 'number'
        },
        impPrice: {
            type: 'number'
        },
        salePrice: {
            type: 'number'
        },
        productCount: {
          type: 'number',
        },
        totalProduct: {
          type: 'number',
        },
        sold: {
          type: 'number',
          defaultsTo: 0
        },
        isHidden: {
            type: 'boolean',
            defaultsTo: false,
        },
        isHot: {
            type: 'boolean',
            defaultsTo: false,
        },
        isSalePrice: {
            type: 'boolean',
            defaultsTo: true,
        },
        isNotPartnerPrice: {
            type: 'boolean',
            defaultsTo: false,
        },
        isPayFirst: {
            type: 'boolean',
            defaultsTo: false,
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
        baseName: {
            type: 'string',
            defaultsTo: ''
        },
        basedescription: {
          type: 'string'
        },
        usageGuide: {
            type: 'string'
        },
        baseHidden: {
          type: 'boolean',
          defaultsTo: false,
        },
        botProductType: {
          type: 'string'
        },
        supportNote: {
          type: 'string',
          defaultsTo: ''
        },
        langLib: {
          type: 'json',
          defaultsTo: [],
          description: 'Danh sách nội dung theo ngôn ngữ: [{ lang, name, note, description }]'
        }
    },

};
