/**
 * ProductController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const crypto = require('crypto')
const ENCRYPTION_KEY = sails.config.env.cloneEncrypt.ENCRYPTION_KEY
const SALT = sails.config.env.cloneEncrypt.SALT
const key = crypto.pbkdf2Sync(ENCRYPTION_KEY, SALT, 10000, 32, 'sha512')
const Promise = require('bluebird')
const fs = require('fs')
module.exports = {
    add: ({
        inputs: sails.config.inputs.Admin.Product.add,
        exits: sails.config.responseType,
        fn: async function(inputs, exits) {
            let responseToClient = {}
            let { User, listClone } = inputs

            if (!User || !User.id) {
              exits.successRequest({
                  messageNode: 'GlobalNotifications',
                  message: 'error',
              });
              return;
            }

            responseToClient = JSON.parse(listClone)
            sails.PromiseMap(responseToClient, e => {
                e.uid = e.cloneData.split('|')[0]
                e.data = sails.ProductService.encrypt(key, e.cloneData)
                e.addByUserName = User.username
                e.addByUserId = User.id
                delete e.cloneData

                return sails.dataProcess.createDocument(Product, e).then((result) => {
                    return
                }).catch((err) => {
                    return
                });
            }).then((result) => {
                exits.successRequest({
                    messageNode: 'Clone',
                    message: 'uploadSuccess',
                    data: {success: true}
                });
            }).catch((err) => {
                console.log(err)
                sails.checkErrorOutput(err, exits)
            });
        }
    }),

    deleteProduct: ({
        inputs: sails.config.inputs.Admin.Product.deleteProduct,
        exits: sails.config.responseType,
        fn: async function(inputs, exits) {
            let { ids } = inputs;
            sails.dataProcess.removeDocument(Product, {
                id: {in: ids}
            }).then((result) => {
                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: {success: true}
                });
            }).catch((err) => {
                sails.checkErrorOutput(err, exits);
            });
        }
    }),

    list: ({
        inputs: sails.config.inputs.Admin.Product.list,
        exits: sails.config.responseType,
        fn: async function(inputs, exits) {
            let { filter, limit, page, categoryId, UID } = inputs
            let filterObject = {
                condition: {
                    categoryId
                },
                orderBy: [
                    { createdAt: 'DESC' }
                ],
                limit: limit,
                page: page
            }
            if (filter) {
                filterObject.condition = filter
            }
            /* UID là điều kiện tìm kiếm tùy chọn, chỉ lọc khi client có gửi lên */
            if (UID && UID.trim()) {
                filterObject.condition.uid = UID.trim()
            }
            sails.dataProcess.getListDataFromModel(Product, filterObject).then((result) => {
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

    productCount: ({
        inputs: sails.config.inputs.Admin.Product.list,
        exits: sails.config.responseType,
        fn: async function(inputs, exits) {
            let { categoryId } = inputs
            let totalProduct = await Product.count({ categoryId, isSell: false })
            return totalProduct;
        }
    }),

    productDieList: ({
        inputs: sails.config.inputs.Admin.Product.productDieList,
        exits: sails.config.responseType,
        fn: async function(inputs, exits) {
            let { filter, limit, page, categoryId, User } = inputs
            let filterObject = {
                condition: {
                    categoryId,
                    isSell: false,
                    isDie: true,
                },
                orderBy: [
                    { createdAt: 'DESC' }
                ],
                limit: limit,
                page: page
            }

            let filterUser = {
                condition: {
                    id: User.id
                }
            }
            var dbUser = await sails.dataProcess.findOne(Users, filterUser);
            if (dbUser.role != "Admin") {
                sails.checkErrorOutput({error: "Not Permission"}, exits);
                return;
            }

            if (filter) {
                filterObject.condition = Object.assign(filterObject.condition,filter)
            }
            sails.dataProcess.getListDataFromModel(Product, filterObject).then((result) => {
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

    deleteAllDieAccount: ({
        inputs: sails.config.inputs.Admin.Product.deleteAllDieAccount,
        exits: sails.config.responseType,
        fn: async function(inputs, exits) {
            let { User, deleteCount } = inputs
            let filterUser = {
                condition: {
                    id: User.id
                }
            }
            var dbUser = await sails.dataProcess.findOne(Users, filterUser);
            if (dbUser.role != "Admin") {
                sails.checkErrorOutput({error: "Not Permission"}, exits);
                return;
            }

            sails.CloneServices.deleteAllDieAccount(deleteCount).then((result) => {
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

    productNotSellDownload: ({
        inputs: sails.config.inputs.Admin.Product.productNotSellDownload,
        exits: sails.config.responseType,
        fn: async function(inputs, exits) {
            let { User, categoryId } = inputs
            let filterObject = {
                condition: {
                    isSell: false,
                    isDie: false,
                    categoryId: categoryId,
                },
                orderBy: [
                    { createdAt: 'DESC' }
                ],
                limit: 999999,
                page: 1
            }
            let filterUser = {
                condition: {
                    id: User.id
                }
            }
            var dbUser = await sails.dataProcess.findOne(Users, filterUser);
            if (dbUser.role != "Admin") {
                sails.checkErrorOutput({error: "Not Permission"}, exits);
                return;
            }
            var products = await sails.dataProcess.find(Product, filterObject);
            if  (products && products.length) {
                sails.CloneServices.createFileContentByProducts(products).then((result) => {
                    exits.successRequest({
                        messageNode: 'GlobalNotifications',
                        message: 'success',
                        data: result.fileName
                    });
                }).catch((err) => {
                    sails.checkErrorOutput(err, exits);
                });
            } else {
                sails.checkErrorOutput({error: "Not Valid Accounts"}, exits);
            }

        }
    }),

    productDieDownload: ({
        inputs: sails.config.inputs.Admin.Product.productDieDownload,
        exits: sails.config.responseType,
        fn: async function(inputs, exits) {
            let { User, categoryId } = inputs
            let filterObject = {
                condition: {
                    isDie: true,
                    categoryId: categoryId,
                },
                orderBy: [
                    { createdAt: 'DESC' }
                ],
                limit: 999999,
                page: 1
            }
            let filterUser = {
                condition: {
                    id: User.id
                }
            }
            var dbUser = await sails.dataProcess.findOne(Users, filterUser);
            if (dbUser.role != "Admin") {
                sails.checkErrorOutput({error: "Not Permission"}, exits);
                return;
            }
            var products = await sails.dataProcess.find(Product, filterObject);
            if  (products && products.length) {
                sails.CloneServices.createFileContentByProducts(products).then((result) => {
                    exits.successRequest({
                        messageNode: 'GlobalNotifications',
                        message: 'success',
                        data: result.fileName
                    });
                }).catch((err) => {
                    sails.checkErrorOutput(err, exits);
                });
            } else {
                sails.checkErrorOutput({error: "Not Valid Accounts"}, exits);
            }

        }
    }),

    downloadDieAccounts: ({
        inputs: sails.config.inputs.Admin.Product.downloadDieAccounts,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            let file = sails.path.resolve('..', 'dieClone', inputs.nameFile)
            let fileold = sails.path.resolve('..', 'dieClone', inputs.nameFile)
            if (fs.existsSync(file)) {
                this.res.download(file)
            } else if (fs.existsSync(fileold)) {
                this.res.download(fileold)
            } else {
                this.res.json({ error: "File not Found" })
            }
        }
    }),
};
