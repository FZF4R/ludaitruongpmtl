/**
 * SystemController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const fs = require('fs');
const path = require('path');
module.exports = {

    getTransactionConfigV2: ({
        inputs: sails.config.inputs.Public.getTransactionConfig,
        exits: sails.config.responseType,
        fn: async function(inputs, exits) {
            try {
                // Load latest BuyClone transaction
                const filterBuyClone = {
                    condition: {
                        method: 'BuyClone'
                    },
                    limit: 1,
                    orderBy: [
                        { createdAt: 'DESC' }
                    ]
                };

                // Load latest DEPOSIT or INCREMENT transaction
                const filterDeposit = {
                    condition: {
                        method: { in: ['DEPOSIT', 'INCREMENT'] }
                    },
                    limit: 1,
                    orderBy: [
                        { createdAt: 'DESC' }
                    ]
                };

                const [buyCloneResult, depositResult] = await Promise.all([
                    sails.dataProcess.getListDataFromModel(Transaction, filterBuyClone),
                    sails.dataProcess.getListDataFromModel(Transaction, filterDeposit)
                ]);

                const responseData = {
                    data: [buyCloneResult.data[0] || null, depositResult.data[0] || null]
                };

                // Clean and format transaction data
                responseData.data.forEach(tran => {
                    if (!tran || !tran.username) return;

                    // Remove unnecessary fields
                    if (tran.userId) delete tran.userId;
                    if (tran.backup) delete tran.backup;
                    if (tran.transactionType) delete tran.transactionType;
                    if (tran.impPrice) delete tran.impPrice;
                    if (tran.file) delete tran.file;
                    if (tran.apiResponse) delete tran.apiResponse;
                    if (tran.discountPercent) delete tran.discountPercent;
                    if (tran.discountAmount) delete tran.discountAmount;

                    // Extract product name for BuyClone
                    if (tran.method === 'BuyClone') {
                        let messageContent = tran.message.split(' ');
                        messageContent.shift();
                        tran.buyname = messageContent.join(' ');
                    }

                    // Mask username
                    tran.username = `${tran.username.substring(0, 2)}*****${tran.username.substring(tran.username.length - 2)}`;
                });

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: responseData
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    getTransactionConfig: ({
        inputs: sails.config.inputs.Public.getTransactionConfig,
        exits: sails.config.responseType,
        fn: async function(inputs, exits) {
            try {
                // Load latest BuyClone transaction
                const filterBuyClone = {
                    condition: {
                        method: 'BuyClone'
                    },
                    limit: 10,
                    orderBy: [
                        { createdAt: 'DESC' }
                    ]
                };

                // Load latest DEPOSIT or INCREMENT transaction
                const filterDeposit = {
                    condition: {
                        method: { in: ['DEPOSIT', 'INCREMENT'] }
                    },
                    limit: 10,
                    orderBy: [
                        { createdAt: 'DESC' }
                    ]
                };

                const [buyCloneResult, depositResult] = await Promise.all([
                    sails.dataProcess.getListDataFromModel(Transaction, filterBuyClone),
                    sails.dataProcess.getListDataFromModel(Transaction, filterDeposit)
                ]);

                const responseData = {
                    data: [...buyCloneResult.data, ...depositResult.data]
                };

                // Clean and format transaction data
                responseData.data.forEach(tran => {
                    if (!tran || !tran.username) return;

                    // Remove unnecessary fields
                    if (tran.userId) delete tran.userId;
                    if (tran.backup) delete tran.backup;
                    if (tran.transactionType) delete tran.transactionType;
                    if (tran.impPrice) delete tran.impPrice;
                    if (tran.file) delete tran.file;
                    if (tran.apiResponse) delete tran.apiResponse;
                    if (tran.discountPercent) delete tran.discountPercent;
                    if (tran.discountAmount) delete tran.discountAmount;

                    // Extract product name for BuyClone
                    if (tran.method === 'BuyClone') {
                        let messageContent = tran.message.split(' ');
                        messageContent.shift();
                        tran.buyname = messageContent.join(' ');
                    }

                    // Mask username
                    tran.username = `${tran.username.substring(0, 2)}*****${tran.username.substring(tran.username.length - 2)}`;
                });

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: responseData
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),
    getConfig: ({
        inputs: sails.config.inputs.Admin.System.getConfig,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            sails.CloneServices.adminGetConfig(inputs).then((result) => {
                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: result
                });
            }).catch((err) => {
                console.log(err)
                sails.checkErrorOutput(err, exits);
            });
        }
    }),
    getReport: ({
        inputs: sails.config.inputs.Admin.System.getReport,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            let { filter } = inputs
            if (filter) {
                sails.reportProcess.getTransactionReportRange(filter).then((result) => {
                    exits.successRequest({
                        messageNode: 'GlobalNotifications',
                        message: 'success',
                        data: result
                    });
                }).catch((err) => {
                    sails.checkErrorOutput(err, exits);
                });
            } else {
                sails.reportProcess.getDashBoardStats().then((result) => {
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
    addNotify: ({
        inputs: sails.config.inputs.Admin.System.addNotify,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            let notifyData = Object.assign({}, inputs, {
                langLib: sails.Ultils.normalizeLangLib(inputs.langLib, sails.Ultils.langLibFields('notify'))
            });
            sails.dataProcess.createDocument(Notify, notifyData).then((result) => {
                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success'
                });
            }).catch((err) => {
                console.log(err)
                sails.checkErrorOutput(err, exits);
            });
        }
    }),
    getListNotify: ({
        inputs: sails.config.inputs.Admin.System.getListNotify,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            let { filter, limit, page } = inputs
            let filterObject = {
                condition: {

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
            sails.dataProcess.getListDataFromModel(Notify, filterObject).then((result) => {
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
    deleteNotify: ({
        inputs: sails.config.inputs.Admin.System.deleteNotify,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            let filterObject = {
                condition: {
                    id: inputs.id
                }
            }
            sails.dataProcess.findOne(Notify, filterObject).then((result) => {
                if (result) {
                    sails.dataProcess.removeDocument(Notify, {
                        id: inputs.id
                    }).then((result) => {
                        exits.successRequest({
                            messageNode: 'GlobalNotifications',
                            message: 'success'
                        });
                    }).catch((err) => {
                        console.log(err)
                        sails.checkErrorOutput(err, exits);
                    });
                } else {
                    exits.successRequest({
                        messageNode: 'GlobalNotifications',
                        message: 'error'
                    });
                }
            }).catch((err) => {
                sails.checkErrorOutput(err, exits);
            });
        }
    }),

    updateNotify: ({
        inputs: sails.config.inputs.Admin.System.updateNotify,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            let { id, title, text, type, isShow, langLib } = inputs
            let filterObject = {
                condition: {
                    id: id
                }
            }
            sails.dataProcess.findOne(Notify, filterObject).then((result) => {
                if (result) {
                    let updateObject = { title, text, type, isShow }
                    if (langLib !== undefined) updateObject.langLib = sails.Ultils.normalizeLangLib(langLib, sails.Ultils.langLibFields('notify'));
                    sails.dataProcess.updateDocument(Notify, {
                        condition: { id },
                        updateObject: updateObject
                    }).then((result) => {
                        exits.successRequest({
                            messageNode: 'GlobalNotifications',
                            message: 'success'
                        });
                    }).catch((err) => {
                        console.log(err)
                        sails.checkErrorOutput(err, exits);
                    });
                } else {
                    exits.successRequest({
                        messageNode: 'GlobalNotifications',
                        message: 'error'
                    });
                }
            }).catch((err) => {
                sails.checkErrorOutput(err, exits);
            });
        }
    }),

    updateSale: ({
        inputs: sails.config.inputs.Admin.System.updateSale,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            let { salePercent, username } = inputs;
            let saleInfo = {
                salePercent: salePercent,
                userAction: username,
                saleConfig: true
            }
            sails.dataProcess.createDocument(SaleConfig, saleInfo).then((result) => {
                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success'
                });
            }).catch((err) => {
                console.log(err)
                sails.checkErrorOutput(err, exits);
            });
        }
    }),

    getSaleConfig: ({
        inputs: sails.config.inputs.Admin.System.saleConfig,
        exits: sails.config.responseType,

        fn: async function (inputs, exits) {
            let filterObject = {
                condition: {
                    saleConfig: true
                },
                orderBy: [
                    { createdAt: 'DESC' }
                ],
            }
            sails.dataProcess.find(SaleConfig, filterObject).then((result) => {
                result = result.sort(function (a, b) { return b.createdAt - a.createdAt });
                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: result.length ? result[0] : {}
                });
            }).catch((err) => {
                console.log(err)
                sails.checkErrorOutput(err, exits);
            });
        }
    }),

    addtutshare: ({
        inputs: sails.config.inputs.Admin.System.addTutShare,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            let tutShareData = Object.assign({}, inputs, {
                langLib: sails.Ultils.normalizeLangLib(inputs.langLib, sails.Ultils.langLibFields('tutShare'))
            });
            sails.dataProcess.createDocument(TutShare, tutShareData).then((result) => {
                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success'
                });
            }).catch((err) => {
                console.log(err)
                sails.checkErrorOutput(err, exits);
            });
        }
    }),

    addProductCategory: ({
        inputs: sails.config.inputs.Admin.System.addProductCategory,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            let { name, countryName, countryCode, type, icon, imgUrl, hash_key, color, description, folderType, langLib } = inputs;
            let categoryData = { name, countryName, countryCode, type, hash_key, color, description, folderType, langLib: sails.Ultils.normalizeLangLib(langLib) };

            // Use imgUrl if provided, otherwise fall back to icon
            if (imgUrl) {
                categoryData.imgUrl = imgUrl;
            } else if (icon) {
                categoryData.icon = icon;
            }

            sails.dataProcess.createDocument(ProductCategory, categoryData).then((result) => {
                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success'
                });
            }).catch((err) => {
                console.log(err)
                sails.checkErrorOutput(err, exits);
            });
        }
    }),

    getListProductCategory: ({
        inputs: sails.config.inputs.Admin.System.getListProductCategory,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            let { filter, limit, page } = inputs
            let filterObject = {
                condition: {

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
    }),

    getListPartnerTransaction: ({
        inputs: sails.config.inputs.Admin.System.getListPartnerTransaction,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            let { filter, limit, page, type } = inputs

            let filterObject = {
                condition: {
                  transactionType: {in: type.split(',')},
                  method: "BuyClone"
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
            sails.dataProcess.getListDataFromModel(Transaction, filterObject).then((result) => {
                result.data.forEach(transaction => {
                  delete transaction.baseInfo;
                  delete transaction.products;
                  transaction.notes = transaction.note;

                  if (transaction.file) {
                      try {
                          // Resolve file path relative to project root
                          const filePath = path.join(sails.config.appPath, '..', 'myClone', transaction.file);

                          // Check if file exists
                          if (fs.existsSync(filePath)) {
                              const fileContent = fs.readFileSync(filePath, 'utf8');
                              transaction.fileContent = fileContent;
                          } else {
                              transaction.fileContent = `File not found at path: ${transaction.file}`;
                          }
                      } catch (fileErr) {
                          transaction.fileContent = transaction.file;
                      }
                  }
                });
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

    getListPartnerProductCategory: ({
        inputs: sails.config.inputs.Admin.System.getListPartnerProductCategory,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            let { filter, limit, page, domain, type } = inputs
            let filterObject = {
                condition: {

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
            if (domain) {
              filterObject.condition.baseDomain = domain
            }
            if (type) {
              filterObject.condition.type = type
            }

            sails.dataProcess.getListDataFromModel(PProductCategory, filterObject).then((result) => {
                result.data.forEach(pcategory => {
                  delete pcategory.baseInfo;
                  delete pcategory.products;
                });
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

    addPartnerProductCategory: ({
        inputs: sails.config.inputs.Admin.System.addPartnerProductCategory,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            let { name, countryName, countryCode, type, icon, imgUrl, hash_key, color, description, folderType, autoUpdate, isHidden, baseDomain, object_id, langLib } = inputs;
            if (!name || !name.trim()) {
                return sails.checkErrorOutput({ message: 'Tên danh mục không được để trống' }, exits);
            }
            let categoryData = {
                name: name.trim(),
                countryName: countryName || '',
                countryCode: countryCode || '',
                type: typeof type === 'number' ? type : 4,
                hash_key: hash_key || '',
                color: color || '',
                description: description || '',
                folderType: folderType || 0,
                autoUpdate: autoUpdate !== false,
                isHidden: !!isHidden,
                langLib: sails.Ultils.normalizeLangLib(langLib),
            };

            // Use imgUrl if provided, otherwise fall back to icon
            if (imgUrl) {
                categoryData.imgUrl = imgUrl;
            } else if (icon) {
                categoryData.icon = icon;
            }

            // Map website domain config (từ "Cài đặt website") sang field model
            if (object_id) {
                categoryData.object_id = String(object_id);
            }
            if (baseDomain) {
                categoryData.p_id = baseDomain;
            }

            sails.dataProcess.createDocument(PProductCategory, categoryData).then((result) => {
                exits.successRequest({
                    data: result,
                    messageNode: 'GlobalNotifications',
                    message: 'success'
                });
            }).catch((err) => {
                console.log(err)
                sails.checkErrorOutput(err, exits);
            });
        }
    }),

    updatePartnerProductCategory: ({
        inputs: sails.config.inputs.Admin.System.updatePartnerProductCategory,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            let { id, name, countryName, countryCode, icon, imgUrl, isHidden, hash_key, color, description, note, folderType, autoUpdate, langLib } = inputs;
            let updateObject = { name, countryName, isHidden, countryCode, hash_key, color, description, folderType, autoUpdate };
            if (typeof note === 'string') updateObject.note = note;
            if (langLib !== undefined) updateObject.langLib = sails.Ultils.normalizeLangLib(langLib);

            // Use imgUrl if provided, otherwise fall back to icon
            if (imgUrl) {
                updateObject.imgUrl = imgUrl;
            } else if (icon) {
                updateObject.icon = icon;
            }

            let updateInfo = { condition: { id }, updateObject };

            sails.dataProcess.updateDocument(PProductCategory, updateInfo).then((result) => {
                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success'
                });
            }).catch((err) => {
                console.log(err)
                sails.checkErrorOutput(err, exits);
            });
        }
    }),

    updatePartnerCategory: ({
        inputs: sails.config.inputs.Admin.System.updatePartnerCategory,
        exits: sails.config.responseType,
        fn: async function(inputs, exits) {
            let { name, id, price, note, description, imgUrl, isHot, isHidden, isSalePrice, isPayFirst, isNotPartnerPrice, importPrice, productCount, langLib } = inputs

            if (importPrice > 0 && price < Math.ceil(importPrice * 1.1)) {
                return exits.badRequest({
                    messageNode: 'GlobalNotifications',
                    message: `Giá bán phải >= 110% giá nhập (tối thiểu ${Math.ceil(importPrice * 1.1)} VNĐ)!`
                })
            }

            let updateObject = { name, price, note, description, imgUrl, isHot, isHidden, isSalePrice, isPayFirst, isNotPartnerPrice, productCount, baseHidden: isHidden, totalProduct: productCount }
            if (langLib !== undefined) updateObject.langLib = sails.Ultils.normalizeLangLib(langLib)

            let updateInfo = { condition: { id }, updateObject }
            sails.dataProcess.updateDocument(PCategory, updateInfo).then((result) => {
                // return sails.dataProcess.updateManyDocument(Product, { condition: { categoryId: id }, updateObject: { price } })
                return result
            }).then(result => {
                exits.successRequest({
                    messageNode: 'Category',
                    message: 'updateSuccess',
                })
            }).catch((err) => {
                sails.checkErrorOutput(err, exits);
            });
        }
    }),

    updateProductCategory: ({
        inputs: sails.config.inputs.Admin.System.updateProductCategory,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            let { id, name, countryName, countryCode, type, icon, imgUrl, hash_key, color, description, folderType, langLib } = inputs;
            let updateObject = { name, countryName, countryCode, type, hash_key, color, description, folderType };
            if (langLib !== undefined) updateObject.langLib = sails.Ultils.normalizeLangLib(langLib);

            // Use imgUrl if provided, otherwise fall back to icon
            if (imgUrl) {
                updateObject.imgUrl = imgUrl;
            } else if (icon) {
                updateObject.icon = icon;
            }

            let updateInfo = { condition: { id }, updateObject };

            sails.dataProcess.updateDocument(ProductCategory, updateInfo).then((result) => {
                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success'
                });
            }).catch((err) => {
                console.log(err)
                sails.checkErrorOutput(err, exits);
            });
        }
    }),

    updateTutShare: ({
        inputs: sails.config.inputs.Admin.System.updateTutShare,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            let { id, title, content, createby, description, tags, thumbnail, youtubelink, langLib } = inputs;
            let updateObject = { title, content, createby, description, tags, thumbnail, youtubelink }
            if (langLib !== undefined) updateObject.langLib = sails.Ultils.normalizeLangLib(langLib, sails.Ultils.langLibFields('tutShare'));
            let updateInfo = { condition: { id, isDeleted: false }, updateObject }

            sails.dataProcess.updateDocument(TutShare, updateInfo).then((result) => {
                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success'
                });
            }).catch((err) => {
                console.log(err)
                sails.checkErrorOutput(err, exits);
            });
        }
    }),

    deleteTutShare: ({
        inputs: sails.config.inputs.Admin.System.deleteTutShare,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            let { id } = inputs;
            let filterObject = {
                condition: {
                    id: id
                }
            }
            sails.dataProcess.findOne(TutShare, filterObject).then((result) => {
                if (result) {
                    sails.dataProcess.removeDocument(TutShare, {
                        id: id
                    }).then((result) => {
                        exits.successRequest({
                            messageNode: 'GlobalNotifications',
                            message: 'success'
                        });
                    }).catch((err) => {
                        console.log(err)
                        sails.checkErrorOutput(err, exits);
                    });
                } else {
                    exits.successRequest({
                        messageNode: 'GlobalNotifications',
                        message: 'error'
                    });
                }
            }).catch((err) => {
                sails.checkErrorOutput(err, exits);
            });
        }
    }),

    deleteProductCategory: ({
        inputs: sails.config.inputs.Admin.System.deleteProductCategory,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            let { id } = inputs;
            let filterObject = {
                condition: {
                    id: id
                }
            }
            sails.dataProcess.findOne(ProductCategory, filterObject).then((result) => {
                if (result) {
                    sails.dataProcess.removeDocument(ProductCategory, {
                        id: id
                    }).then((result) => {
                        exits.successRequest({
                            messageNode: 'GlobalNotifications',
                            message: 'success'
                        });
                    }).catch((err) => {
                        console.log(err)
                        sails.checkErrorOutput(err, exits);
                    });
                } else {
                    exits.successRequest({
                        messageNode: 'GlobalNotifications',
                        message: 'error'
                    });
                }
            }).catch((err) => {
                sails.checkErrorOutput(err, exits);
            });
        }
    }),

    deletePartnerProductCategory: ({
        inputs: sails.config.inputs.Admin.System.deletePartnerProductCategory,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            let { id } = inputs;

            try {
                // Check if category exists
                const category = await sails.dataProcess.findOne(PProductCategory, {
                    condition: { id }
                });

                if (!category) {
                    return sails.checkErrorOutput({
                        success: false,
                        message: 'Category not found'
                    }, exits);
                }

                // Delete all products in PCategory table that belong to this category
                await sails.dataProcess.removeDocument(PCategory, {
                    category: id
                });

                // Delete the category itself
                await sails.dataProcess.removeDocument(PProductCategory, {
                    id
                });

                exits.successRequest({
                    messageNode: 'Category',
                    message: 'deleteSuccess'
                });
            } catch (err) {
                console.error('Error deleting partner product category:', err);
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    deleteTransaction: ({
        inputs: sails.config.inputs.Admin.Users.deleteTransaction,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            let { id } = inputs;

            try {
                // Check if transaction exists
                const transaction = await sails.dataProcess.findOne(Transaction, {
                  condition: {
                    id: id
                  }
                });

                if (!transaction) {
                    return sails.checkErrorOutput({
                        success: false,
                        message: 'Transaction not found'
                    }, exits);
                }

                // Delete the transaction
                await sails.dataProcess.removeDocument(Transaction, {
                    _id: id
                });

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success'
                });
            } catch (err) {
                console.error('Error deleting transaction:', err);
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    // ===== Integrate Services =====
    getIntegrateServices: ({
        inputs: {},
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                //sails.log.info('[AdminAPI] Loading integrate services...');

                // Step 1: Get SystemSettings to find active service config
                const systemSettings = await sails.dataProcess.findOne(SystemSettings, {
                    condition: { id: sails.ID_CONFIG }
                });

                let domainType = null;

                // Step 2: Find the active serviceConfig and extract DomainType
                if (systemSettings && systemSettings.serviceConfig) {
                    let serviceConfigs = systemSettings.serviceConfig;

                    // Handle both array and single object
                    if (!Array.isArray(serviceConfigs)) {
                        serviceConfigs = [serviceConfigs];
                    }

                    // Find the config marked as active
                    const activeConfig = serviceConfigs.find(config => config.is_active === true);
                    if (activeConfig) {
                        domainType = activeConfig.DomainType;
                        //sails.log.info(`[AdminAPI] Found active config with DomainType: ${domainType}`);
                    }
                }

                // Step 3: Load IntergrateServices with filter based on domainType
                const filter = {
                    condition: {},
                    limit: 9999,
                    page: 1,
                    orderBy: [{ createdAt: 'DESC' }]
                };

                // If we have a domainType, filter IntergrateServices by serviceType
                if (domainType) {
                    filter.condition.serviceType = domainType;
                    //sails.log.info(`[AdminAPI] Filtering services by serviceType: ${domainType}`);
                }

                const services = await sails.dataProcess.find(
                    IntergrateServices,
                    filter
                );

                //sails.log.info(`[AdminAPI] Loaded ${services.total || 0} integrate services`);
                //sails.log.debug('Services data:', services);

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: services || [],
                    total: services.length || 0,
                    activeConfig: domainType,
                    info: `Loaded services for DomainType: ${domainType || 'None'}`
                });
            } catch (error) {
                //sails.log.error('Lỗi load danh sách dịch vụ tích hợp:', error);
                //sails.log.error('Error stack:', error.stack);
                sails.checkErrorOutput(error, exits);
            }
        }
    }),

    updateIntegrateServices: ({
        inputs: sails.config.inputs.Admin.System.updateIntegrateServices,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                const id = inputs.id;

                // Find existing record
                let existingService = await sails.dataProcess.findOne(IntergrateServices, {
                    condition: { pid: inputs.pid }
                });

                if (!existingService) {
                    return exits.notFound({
                        messageNode: 'GlobalNotifications',
                        message: 'integrateservice_not_found',
                        errorCode: 404,
                        errorName: 'IntegrateServiceNotFound'
                    });
                }

                // Build update object from inputs (update all provided fields)
                let updateObject = {};
                const allowedFields = [
                    'platform_id', 'platform_slug', 'is_hidden', 'is_maintaining', 'categories', 'pid', 'platformType', 'image_url', 'smmWarning', 'warning_content'
                ];

                for (let key of allowedFields) {
                    if (inputs.hasOwnProperty(key) && inputs[key] !== undefined) {
                        updateObject[key] = inputs[key];
                    }
                }

                // Add updatedAt timestamp
                updateObject.updatedAt = new Date();

                // Update the record
                let updateObj = {
                    condition: { id: id },
                    updateObject: updateObject
                };

                let result = await sails.dataProcess.updateDocument(IntergrateServices, updateObj);

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: result,
                    total: 1
                });
            } catch (error) {
                //sails.log.error('Lỗi cập nhật dịch vụ tích hợp:', error);
                sails.checkErrorOutput(error, exits);
            }
        }
    }),

    deleteMultiCategory: ({
        inputs: sails.config.inputs.Admin.Category.deleteMultiCategory,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            let { productIds } = inputs;

            if (!productIds || productIds.length === 0) {
                sails.checkErrorOutput({ success: false, message: 'productIds is required' }, exits);
                return;
            }

            try {
                // Delete all products in PCategory table with given productIds
                const result = await sails.dataProcess.removeDocument(PCategory, {
                    id: { in: productIds }
                });

                exits.successRequest({
                    messageNode: 'Category',
                    message: 'deleteSuccess',
                    data: { deletedCount: productIds.length }
                });
            } catch (err) {
                console.error('Error deleting products:', err);
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    getSupportInfo: ({
        inputs: sails.config.inputs.Admin.System.getSupportInfo || {},
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                // Fetch SystemSettings document with ID "222222222222222222222222"
                const supportData = await sails.dataProcess.findOne(SystemSettings, {
                    condition: { id: '222222222222222222222222' }
                });

                if (!supportData) {
                    return sails.checkErrorOutput({
                        success: false,
                        message: 'Support info not found'
                    }, exits);
                }

                // Extract only the support info fields (exclude _id and timestamps)
                const fieldExclusions = ['id', '_id', 'createdAt', 'updatedAt', 'isDeleted'];
                const supportInfo = {};

                for (const [key, value] of Object.entries(supportData)) {
                    if (!fieldExclusions.includes(key) && value !== null && value !== undefined) {
                        supportInfo[key] = value;
                    }
                }

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: supportInfo
                });
            } catch (err) {
                console.error('Error fetching support info:', err);
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    updateSupportInfo: ({
        inputs: sails.config.inputs.Admin.System.updateSupportInfo || {},
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                // Parse JSON string from input
                let supportInfoData = inputs.supportInfo;

                // Update SystemSettings document with ID "222222222222222222222222"
                const updateInfo = {
                    condition: { id: '222222222222222222222222' },
                    updateObject: supportInfoData
                };

                const result = await sails.dataProcess.updateDocument(SystemSettings, updateInfo);

                if (!result) {
                    return sails.checkErrorOutput({
                        success: false,
                        message: 'Failed to update support info'
                    }, exits);
                }

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: supportInfoData
                });
            } catch (err) {
                console.error('Error updating support info:', err);
                sails.checkErrorOutput(err, exits);
            }
        }
    }),
};
