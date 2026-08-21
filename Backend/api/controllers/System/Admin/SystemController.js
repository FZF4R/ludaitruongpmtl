/**
 * SystemController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const fs = require('fs');
const path = require('path');
module.exports = {


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

















    // ===== Integrate Services =====



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
