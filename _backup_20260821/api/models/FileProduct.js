/**
 * FileProduct.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  tableName: 'FileProduct',
  attributes: {
    file: {
      type: 'string',
      required: true
    },
    userId: {
      type: 'string',
      defaultsTo: 'None'
    }
  }

};

