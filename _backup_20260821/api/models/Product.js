/**
 * Product.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

    tableName: 'Product',
    attributes: {
        categoryId: {
            type: 'string',
            required: true
        },
        uid: {
            type: 'string',
            required: true
        },
        data: {
            type: 'string',
            required: true
        },
        isSell: {
            type: 'boolean',
            defaultsTo: false
        },
        isDie: {
            type: 'boolean',
            defaultsTo: false
        },
        buyByUser: {
            type: 'string',
            defaultsTo: ''
        },
        addByUserName: {
            type: 'string',
            required: true
        },
        addByUserId: {
            type: 'string',
            required: true
        },
    }
};
