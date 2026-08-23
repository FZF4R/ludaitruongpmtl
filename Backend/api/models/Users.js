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
        role: {
            type: "string",
            // Danh sách lấy từ config/roles.js - sửa ở một chỗ thì sửa cả hai.
            // Waterline chỉ kiểm isIn lúc ghi nên dữ liệu cũ không bị chặn;
            // cũng không cần chặn, vì roles.can() coi vai trò lạ là không có quyền gì.
            isIn: ['User', 'Partner', 'Moderator', 'Manager', 'Admin'],
            defaultsTo: "User"
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
