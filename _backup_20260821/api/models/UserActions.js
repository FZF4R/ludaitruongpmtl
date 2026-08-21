/**
 * Users.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
    tableName: 'Users',
    attributes: {
        username: {
            type: 'string',
            required: true,
            minLength: 6,
            maxLength: 100,
        },
        coin: {
            type: 'number',
            defaultsTo: 0,
            min: 0
        },
        status: {
            type: "number",
            defaultsTo: 1
        },
        email: {
            type: "string",
            defaultsTo: ""
        },
        fullName: {
            type: "string",
            defaultsTo: ""
        },
        address: {
            type: "string",
            defaultsTo: ""
        },
    },
};
