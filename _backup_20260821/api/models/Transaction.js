/**
 * Transaction.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

    tableName: 'Transaction',
    attributes: {
        message: {
            type: 'string',
            required: true,
        },
        username: {
            type: 'string',
            required: true,
        },
        method: {
            type: 'string',
            required: true,
        },
        totalPay: {
            type: 'number',
            required: true,
        },
        amount: {
            type: 'number',
            required: true,
        },
        isShow: {
            type: 'boolean',
            defaultsTo: true
        },
        phone: {
            type: 'string',
            defaultsTo: ""
        },
        discountPercent: {
            type: 'number',
            defaultsTo: 0,
        },
        discountAmount: {
            type: 'number',
            defaultsTo: 0,
        },
        impPrice: {
            type: 'number'
        },
        transactionType: {
            type: 'number'
        },
        note: {
            type: 'string'
        },

    }

};
