/**
 * Transaction.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
    tableName: 'SaleConfig',
    attributes: {
        salePercent: {
            type: 'number',
            required: true,
        },
        userAction: {
            type: 'string',
            required: true,
        },
    }
};