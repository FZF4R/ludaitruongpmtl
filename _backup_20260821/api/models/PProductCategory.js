/**
 * PProductCategory.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

    tableName: 'PProductCategory',
    attributes: {
        name: {
            type: 'string',
        },
        countryName: {
            type: 'string',
        },
        countryCode: {
            type: 'string',
        },
        type: {
            type: "number",
            defaultsTo: 4
        },
        p_id: {
            type: "string"
        },
        object_id: { // Sử dụng cho nguyenlieummo4, mlocalus
            type: 'string',
        },
        isHidden: {
            type: 'boolean',
            defaultsTo: false,
        },
        imgUrl: {
            type: 'string',
            defaultsTo: "ri-facebook-fill"
        },
        hash_key: {
            type: 'string',
            defaultsTo: '#facebook',
        },
        folderType: {
            type: 'number',
            defaultsTo: 0,
        },
        autoUpdate: {
            type: 'boolean',
            defaultsTo: true,
        },
        description: {
            type: 'string',
            defaultsTo: '',
        },
        color: {
            type: 'string',
            defaultsTo: '',
        },
        icon: {
            type: 'string',
            defaultsTo: '',
        },
        note: {
            type: 'string',
            defaultsTo: '',
        },
        langLib: {
            type: 'json',
            defaultsTo: [],
            description: 'Danh sách nội dung theo ngôn ngữ: [{ lang, name, note, description }]'
        }
    },

};
