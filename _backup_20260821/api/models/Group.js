/**
 * Groups.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  tableName: 'Group',
  attributes: {
    category: {
      model: 'Category'
    },
    name: {
      type: 'string',
      required: true,
    },
    balance: {
      type: 'number',
      defaultsTo: 1000
    },
    Admin: {
      type: 'string',
      defaultsTo: ''
    }
  },
};

