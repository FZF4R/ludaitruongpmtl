/**
 * UsersController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const fs = require('fs')
module.exports = {
    getListCategory: ({
        inputs: sails.config.inputs.Partner.getListCategory,
        exits: sails.config.responseType,
        fn: async function(inputs, exits) {
            let filterCategory = {
                condition: {isActive: true},
                limit: inputs.limit,
                page: inputs.page,
                orderBy: [
                    { name: 'DESC' }
                ]
            }
            if (inputs.filter) {
                filterCategory.condition = inputs.filter
            }

            sails.dataProcess.getListDataFromModel(Category, filterCategory).then(({ data }) => {
                sails.PromiseMap(data, async cat => {
                    // let a = await sails.Product.getListGroupPublicByCategory(cat.id);
                    let totalGroupProduct = await Product.count({ categoryId: cat.id, isSell: false, isDie: false });
                    cat.totalProduct = totalGroupProduct ? totalGroupProduct : 0;
                    if (cat.importPrice) delete cat.importPrice;
                    let res = { category: cat }
                    return res
                }).then(async(result) => {
                    exits.successRequest({
                        messageNode: 'GlobalNotifications',
                        message: 'success',
                        data: result
                    });
                })

            }).catch((err) => {
                sails.checkErrorOutput(err, exits);
            });
        }
    }),

    getListProductCategory: ({
        inputs: sails.config.inputs.Partner.getListProductCategory,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            let { filter, limit, page } = inputs
            let filterObject = {
                condition: {
                  isActive: true
                },
                orderBy: [
                    { createdAt: 'DESC' }
                ],
                limit: limit,
                page: page
            }

            if (inputs.filter) {
                try {
                  filterObject.condition = JSON.parse(inputs.filter)
                } catch(error) {

                }
            }

            if (filterObject.condition.type == "P") {
                let filterPObject = {
                    condition: {

                    },
                    limit: 100,
                    page: 1,
                    orderBy: [
                        { name: 'DESC' }
                    ]
                }

                sails.dataProcess.getListDataFromModel(PProductCategory, filterPObject).then((vcloneProductCategories) => {
                  if (vcloneProductCategories && vcloneProductCategories.data) {
                      var visibleProductCategory = [];
                      vcloneProductCategories.data.forEach(vcloneProductCategory => {
                          if (vcloneProductCategory.isHidden) return;
                          vcloneProductCategory.isPartner = true;

                          delete vcloneProductCategory.products
                          delete vcloneProductCategory.baseInfo
                          delete vcloneProductCategory.baseDomain
                          delete vcloneProductCategory.isHidden
                          visibleProductCategory.push(vcloneProductCategory);
                      });

                      vcloneProductCategories.data = visibleProductCategory;
                  }
                  exits.successRequest({
                      messageNode: 'GlobalNotifications',
                      message: 'success',
                      data: vcloneProductCategories
                  });
              }).catch((err) => {
                  sails.checkErrorOutput(err, exits);
              });
            } else {
              sails.dataProcess.getListDataFromModel(ProductCategory, filterObject).then((result) => {
                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: result
                });
              }).catch((err) => {
                  sails.checkErrorOutput(err, exits);
              });
            }
        }
    }),

    getUserInfo: ({
        inputs: sails.config.inputs.Partner.getUserInfo,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            let { User } = inputs
            let total = await Transaction.sum('totalPay').where({ phone: User.phone, method: 'BuyClone' })
            delete User.password
            User.totalPay = total
            exits.successRequest({
                messageNode: 'GlobalNotifications',
                message: 'success',
                data: User
            });
        }
    }),

    getUserTransaction: ({
        inputs: sails.config.inputs.Partner.getUserTransaction,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            let { limit, page, filter, User, method } = inputs
            let FilterTransaction = {
                condition: { userId: User.id, method: {in: method.split(',').filter(x=>x.trim())} },
                limit: limit,
                page: page,
                orderBy: [
                    { createdAt: 'DESC' }
                ]
            }
            if (filter) {
                FilterTransaction.condition = Object.assign(FilterTransaction.condition, filter)
            }
            sails.dataProcess.getListDataFromModel(Transaction, FilterTransaction).then((result) => {
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

    buyCloneByFileContent: ({
        inputs: sails.config.inputs.Partner.buyCloneByFileContent,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            let filterObject = {
                condition: {
                    id: '000000000000000000000000'
                }
            }
            let systemSettings = await sails.dataProcess.findOne(SystemSettings, filterObject);
            if (systemSettings.isMaintaning) {
                sails.checkErrorOutput({
                    messageNode: 'Clone',
                    message: 'maitainingSystem'
                }, exits);
            } else {
                inputs.config = systemSettings;
                sails.CloneServices.userBuyCloneFileContent(inputs).then((result) => {
                    if (result.response) delete result.response;
                    exits.successRequest({
                        messageNode: 'Clone',
                        message: 'soldCloneSuccess',
                        data: result
                    });
                }).catch((err) => {
                    sails.checkErrorOutput(err, exits);
                });
            }
        }
    }),

};
