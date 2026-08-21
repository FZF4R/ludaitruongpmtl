/**
 * TransactionUsdt.js
 *
 * @description :: A model definition represents a database table/collection for USDT deposits.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

    tableName: 'TransactionUsdt',
    attributes: {
        userId: {
            type: 'string',
            required: true,
        },
        username: {
            type: 'string',
            required: true,
        },
        amount: {
            type: 'number',
            required: true,
            columnType: 'decimal(20,8)'
        },
        txHash: {
            type: 'string',
            required: true,
            unique: true
        },
        fromAddress: {
            type: 'string',
            defaultsTo: ''
        },
        network: {
            type: 'string',
            defaultsTo: 'BSC (BEP20)'
        },
        screenshot: {
            type: 'string',
            defaultsTo: ''
        },
        status: {
            type: 'string',
            isIn: ['Pending', 'Confirmed', 'Rejected'],
            defaultsTo: 'Pending'
        },
        confirmedAt: {
            type: 'ref',
            columnType: 'datetime',
            defaultsTo: null
        },
        confirmedBy: {
            type: 'string',
            defaultsTo: ''
        },
        rejectionReason: {
            type: 'string',
            defaultsTo: ''
        },
        createdAt: {
            type: 'ref',
            columnType: 'datetime',
            required: true
        },
        updatedAt: {
            type: 'ref',
            columnType: 'datetime',
            required: true
        }
    }

};
