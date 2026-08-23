/**
 * UsersController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
module.exports = {
    // API load websiteConfigs


    getListUser: ({
        inputs: sails.config.inputs.Admin.Users.getListUser,
        exits: sails.config.responseType,
        fn: async function(inputs, exits) {
            let { filter, limit, page, search } = inputs
            let filterObject = {
                condition: {

                },
                // Không có projection thì Mongo trả về ĐỦ MỌI TRƯỜNG, gồm cả hash
                // mật khẩu - mà hash đó chính là thứ được nhúng vào JWT
                // (jwtProcess.signAndEncryptJwt) và là thứ verifyPasswordFromDB
                // đối chiếu ở mọi request. Bắt buộc phải loại trước khi mở
                // endpoint này cho vai trò thấp hơn Admin.
                selectCols: { projection: { password: 0 } },
                sort: { createdAt: -1 },
                limit: limit,
                page: page
            }
            if (search) {
              let key = search
              filterObject.condition['$or'] = [
                { username: { '$regex': key , '$options': 'i'} },
                { email: { '$regex': key, '$options': 'i' } },
                { fullName: { '$regex': key, '$options': 'i' } },
              ]
              delete filterObject.search
            }
            sails.dataProcess.getListDataNative(Users, filterObject).then((result) => {
                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: result
                });
            }).catch((err) => {
                sails.checkErrorOutput(err, exits);
            });
        }
    }),
    changePass: ({
        inputs: sails.config.inputs.Admin.Users.changePass,
        exits: sails.config.responseType,
        fn: async function(inputs, exits) {
            let { newPass, username, userId } = inputs
            sails.dataProcess.findOne(Users, { condition: { username, id: userId } }).then(async(result) => {
                if (!result) {
                    return Promise.reject({
                        message: 'userNotExits',
                        messageNode: 'Users'
                    })
                }
                let passChange = await sails.helpers.passwords.hashPassword(newPass)
                let filterUpdate = {
                    condition: {
                        username
                    },
                    updateObject: {
                        password: passChange
                    }
                }
                sails.dataProcess.updateDocument(Users, filterUpdate).then((result) => {
                    exits.successRequest({
                        messageNode: 'GlobalNotifications',
                        message: 'success'
                    });
                }).catch((err) => {
                    sails.checkErrorOutput(err, exits);
                });
            }).catch(error => {
                sails.checkErrorOutput(error, exits);
            })

        }
    }),


    updateServiceMaintain: ({
        inputs: sails.config.inputs.Admin.Users.updateServiceMaintain,
        exits: sails.config.responseType,
        fn: async function(inputs, exits) {
            let { id, isMaintaning } = inputs
            let filter = {
                condition: {
                    id: id
                }
            }
            sails.dataProcess.findOne(SystemSettings, filter).then((result) => {
                let condition = {
                    id: result.id
                }
                let updateObject = { isMaintaning }
                return sails.dataProcess.updateDocument(SystemSettings, { condition, updateObject })
            }).then((result) => {
                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: result
                });
            }).catch((err) => {
                console.log(err);
                sails.checkErrorOutput(err, exits);
            });
        }
    }),

    updateSettings: ({
        inputs: sails.config.inputs.Admin.Users.updateSettings,
        exits: sails.config.responseType,
        fn: async function(inputs, exits) {
            let { id } = inputs
            let filter = {
                condition: {
                    id: id
                }
            }
            sails.dataProcess.findOne(SystemSettings, filter).then((result) => {
                let condition = {
                    id: result.id
                }
                let updateObject = inputs
                if (inputs.langLib !== undefined) {
                    updateObject.langLib = sails.Ultils.normalizeLangLib(inputs.langLib, sails.Ultils.langLibFields('systemSettings'))
                }
                return sails.dataProcess.updateDocument(SystemSettings, { condition, updateObject })
            }).then((result) => {
                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success'
                });
            }).catch((err) => {
                console.log(err);
                sails.checkErrorOutput(err, exits);
            });
        }
    }),



};
