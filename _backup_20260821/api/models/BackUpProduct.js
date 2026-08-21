/**
 * Product.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

    tableName: 'BackUpProduct',
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
        price: {
            type: 'number',
            defaultsTo: 1000,
            min: 0
        },
        isSell: {
            type: 'boolean',
            defaultsTo: false
        },
        buyByUser: {
            type: 'string',
            defaultsTo: 'None'
        }
    }

};