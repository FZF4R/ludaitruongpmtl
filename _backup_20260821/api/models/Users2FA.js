/**
 * Users.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
    tableName: 'Users2FA',
    attributes: {
        userID: {
            type: "string"
        },
        secretKey2FA: {
            type: "string"
        }
    }
};
