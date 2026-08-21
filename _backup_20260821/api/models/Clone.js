/**
 * Clone.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  tableName: 'Clone',
  attributes: {
    groupId: {
      model: 'Group'
    },
    cloneData: {
      type: 'string',
      required: true
    },
    Admin: {
      type: 'string',
      defaultsTo: 'None'
    },
    balance: {
      type: 'number',
      defaultsTo: 1000
    },
    isSell: {
      type: 'boolean',
      defaultsTo: false
    },
    buyByUser: {
      type: 'string',
      defaultsTo: 'None'
    },
  }
};

