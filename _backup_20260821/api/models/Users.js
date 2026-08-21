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
            maxLength: 25,
        },
        password: {
            type: 'string',
            required: true,
            minLength: 6,
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
        phone: {
            type: "string",
            defaultsTo: ""
        },
        gender: {
            type: "string",
            defaultsTo: ""
        },
        ref: {
            type: "number",
            defaultsTo: 0
        },
        role: {
            type: "string",
            defaultsTo: "User"
        },
        depositHash: {
            type: "string",
            defaultsTo: "",
        },
        API_KEY: {
            type: "string",
            defaultsTo: "",
        },
        is2FAEnabled: {
            type: "boolean",
            defaultsTo: false
        },
        googleId: {
            type: "string",
            defaultsTo: ""
        },
        facebookId: {
            type: "string",
            defaultsTo: ""
        }
    },
    beforeCreate: async function(userAccount, proceed) {
        let { password, username } = userAccount
        Users.findOne({ username }).then((result) => {
            if (result) {
                return Promise.reject({
                    messageNode: 'Users',
                    message: 'usernameAlreadyInUse'
                })
            }
            return sails.helpers.passwords.hashPassword(password)
        }).then((result) => {
            userAccount.password = result
            return proceed()
        }).catch((err) => {
            return proceed(err)
        });
    },

};
