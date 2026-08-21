/**
 * UsersController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
module.exports = {
    // API load websiteConfigs
    getsyncproduct: ({
        exits: sails.config.responseType,
        fn: async function(inputs, exits) {
            try {
                let filter = { condition: { id: sails.ID_CONFIG } };
                let result = await sails.dataProcess.findOne(SystemSettings, filter);
                exits.successRequest({
                    message: 'success',
                    messageNode: 'GlobalNotifications',
                    data: result
                });
            } catch (err) {
                console.log(err);
                sails.checkErrorOutput(err, exits);
            }
        }
    }),
    syncservice: ({
        inputs: {
            serviceConfig: { type: 'json', required: true },
        },
        exits: sails.config.responseType,
        fn: async function(inputs, exits) {
            try {
                let filter = { condition: { id: sails.ID_CONFIG } };
                let result = await sails.dataProcess.findOne(SystemSettings, filter);
                if (!result) {
                    await sails.dataProcess.createDocument(SystemSettings, { id: sails.ID_CONFIG, serviceConfig: inputs.serviceConfig});
                } else {
                    await sails.dataProcess.updateDocument(SystemSettings, {
                        condition: { id: sails.ID_CONFIG },
                        updateObject: { websiteConfigs: inputs.configs, serviceConfig:  inputs.serviceConfig }
                    });
                }
                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                });
            } catch (err) {
                console.log(err);
                sails.checkErrorOutput(err, exits);
            }
        }
    }),
    syncproduct: ({
        inputs: {
            configs: { type: 'json', required: true },
            folderTypes: { type: 'json', required: true },
        },
        exits: sails.config.responseType,
        fn: async function(inputs, exits) {
            try {
                let filter = { condition: { id: sails.ID_CONFIG } };
                let result = await sails.dataProcess.findOne(SystemSettings, filter);
                if (!result) {
                    await sails.dataProcess.createDocument(SystemSettings, { id: sails.ID_CONFIG, websiteConfigs: inputs.configs, folderTypes:  inputs.folderTypes ? inputs.folderTypes : []});
                } else {
                    await sails.dataProcess.updateDocument(SystemSettings, {
                        condition: { id: sails.ID_CONFIG },
                        updateObject: { websiteConfigs: inputs.configs, folderTypes:  inputs.folderTypes ? inputs.folderTypes : [] }
                    });
                }
                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                });
            } catch (err) {
                console.log(err);
                sails.checkErrorOutput(err, exits);
            }
        }
    }),
    banking: ({
        inputs: {
            url: { type: 'string', required: true },
            bankname: { type: 'string', required: true }
        },
        exits: sails.config.responseType,
        fn: async function(inputs, exits) {
            try {
                // Giả sử lưu vào trường 'bankApiUrl' trong SystemSettings
                let filter = { condition: {id: sails.ID_CONFIG} };
                let result = await sails.dataProcess.findOne(SystemSettings, filter);
                if (!result) {
                    // Nếu chưa có, tạo mới
                    await sails.dataProcess.createDocument(SystemSettings, { bankApiUrl: inputs.url, bankname: inputs.bankname });
                } else {
                    await sails.dataProcess.updateDocument(SystemSettings, {
                        condition: { id: result.id },
                        updateObject: { bankApiUrl: inputs.url, bankname: inputs.bankname }
                    });
                }
                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: result
                });
            } catch (err) {
                console.log(err);
                sails.checkErrorOutput(err, exits);
            }
        }
    }),
    transactionSummary: ({
        inputs: sails.config.inputs.Admin.Users.transactionSummary,
        exits: sails.config.responseType,
        fn: async function(inputs, exits) {
            let {filterTime, endTime, DATE_TIME_DIFF, filterDayTime, firstWeekDay, endWeek, transactionTypes } = inputs;

            let filterObject = {
                condition: {
                    createdAt: {
                        '>': filterTime,
                        '<=': endTime || filterTime + (30 * 24 * 60 * 60 * 1000) // Default to 30 days if endTime not provided
                    },
                },
                orderBy: [
                    { createdAt: 'DESC' }
                ],
                limit: 9999,
                page: 1
            }
            if (transactionTypes && transactionTypes.length > 0) filterObject.condition.transactionType =  {in: transactionTypes};

            sails.dataProcess.find(Transaction, filterObject).then((trans) => {
                let sumResult = {
                    totalInDay: 0,
                    totalInWeek: 0,
                    totalInMonth: 0,

                    totalFeeInDay: 0,
                    totalFeeInWeek: 0,
                    totalFeeInMonth: 0,

                    totalBuyInDay: 0,
                    totalBuyInWeek: 0,
                    totalBuyInMonth: 0,

                    totalSellInDay: 0,
                    totalSellInWeek: 0,
                    totalSellInMonth: 0,
                }

                if (!trans) {
                    return exits.successRequest({
                        messageNode: 'GlobalNotifications',
                        message: 'success',
                        data: sumResult
                    });
                }

                let muaTrans = trans.filter(x => x.method && x.method.toLowerCase() == "buyclone");
                let napTrans = trans.filter(x => x.method && (x.method.toLowerCase() == "deposit" || x.method.toLowerCase() == "increment" || x.method.toLowerCase() == "decrement"));

                // Calculate for the selected date range (totalInMonth represents the selected period)
                napTrans.forEach(tran => {
                    var totalPay = (tran.method.toLowerCase() == "decrement") ? (tran.totalPay * -1) : tran.totalPay;
                    totalPay = (tran.method.toLowerCase() == "decrement") ? (totalPay * -1) : totalPay;

                    sumResult.totalInMonth = sumResult.totalInMonth + totalPay;
                    if (tran.createdAt >= filterDayTime && tran.createdAt <= (filterDayTime + DATE_TIME_DIFF)) {
                        sumResult.totalInDay = sumResult.totalInDay + (totalPay);
                    }
                    if (tran.createdAt <= endWeek && tran.createdAt >= firstWeekDay) {
                        sumResult.totalInWeek = sumResult.totalInWeek + totalPay;
                    }
                });

                muaTrans.forEach(tran => {
                    // For the selected date range
                    var tranFee = (tran.impPrice * tran.amount);
                    sumResult.totalFeeInMonth = sumResult.totalFeeInMonth + tranFee;
                    sumResult.totalBuyInMonth = sumResult.totalBuyInMonth + tran.totalPay;
                    sumResult.totalSellInMonth = sumResult.totalSellInMonth + (tran.amount ? tran.amount : 0);

                    // For current day
                    if (tran.createdAt >= filterDayTime && tran.createdAt <= (filterDayTime + DATE_TIME_DIFF)) {
                        sumResult.totalFeeInDay = sumResult.totalFeeInDay + tranFee;
                        sumResult.totalBuyInDay = sumResult.totalBuyInDay + tran.totalPay;
                        sumResult.totalSellInDay = sumResult.totalSellInDay + (tran.amount ? tran.amount : 0);
                    }

                    // For current week
                    if (tran.createdAt <= endWeek && tran.createdAt >= firstWeekDay) {
                        sumResult.totalFeeInWeek = sumResult.totalFeeInWeek + tranFee;
                        sumResult.totalBuyInWeek = sumResult.totalBuyInWeek + tran.totalPay;
                        sumResult.totalSellInWeek = sumResult.totalSellInWeek + (tran.amount ? tran.amount : 0);
                    }
                });

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: sumResult
                });
            })
        }
    }),

    userSummary: ({
        inputs: sails.config.inputs.Admin.Users.userSummary,
        exits: sails.config.responseType,
        fn: async function(inputs, exits) {
            let { time, filterTime, DATE_TIME_DIFF, filterDayTime, firstWeekDay, endWeek } = inputs;

            let filterObject = {
                condition: {
                },
                orderBy: [],
                limit: 9999,
                page: 1
            }

            sails.dataProcess.find(Users, filterObject).then((userData) => {
                let sumResult = {
                    totalCreatedInDay: 0,
                    totalCreatedInWeek: 0,
                    totalCreatedInMonth: 0,
                    totalCreatedCount: 0,
                    collaboratorCount: 0,
                    agencyCount: 0,
                    adminCount: 0,
                    partnerCount: 0,
                    userCount: 0
                }

                if (!userData) {
                    return Promise.reject({
                        message: 'userNotExitsFilter',
                        messageNode: 'Users'
                    })
                }
                sumResult.totalCreatedCount = (userData && userData.length) ? userData.length : 0;

                userData.forEach(user => {
                    // Count users created in month
                    if (user.createdAt >= filterTime) {
                        sumResult.totalCreatedInMonth = sumResult.totalCreatedInMonth + 1;
                    }

                    // Count users created in day
                    if (user.createdAt >= filterDayTime && user.createdAt <= (filterDayTime + DATE_TIME_DIFF)) {
                        sumResult.totalCreatedInDay = sumResult.totalCreatedInDay + 1;
                    }

                    // Count users created in week
                    if (user.createdAt <= endWeek && user.createdAt >= firstWeekDay) {
                        sumResult.totalCreatedInWeek = sumResult.totalCreatedInWeek + 1;
                    }

                    // Count by role/type
                    if (user.role) {
                        const role = user.role;
                        switch (role) {
                            case 'Admin':
                                sumResult.adminCount = sumResult.adminCount + 1;
                                break;
                            case 'Agency':
                                sumResult.agencyCount = sumResult.agencyCount + 1;
                                break;
                            case 'Partner':
                                sumResult.partnerCount = sumResult.partnerCount + 1;
                                // Also count Partners as collaborators for the 3-card display
                                sumResult.collaboratorCount = sumResult.collaboratorCount + 1;
                                break;
                            case 'User':
                                sumResult.userCount = sumResult.userCount + 1;
                                break;
                            default:
                                // Handle legacy role names
                                const roleLower = role.toLowerCase();
                                if (roleLower === 'collaborator' || roleLower === 'cộng tác viên' || roleLower === 'ctv') {
                                    sumResult.collaboratorCount = sumResult.collaboratorCount + 1;
                                } else if (roleLower === 'agency' || roleLower === 'đại lý') {
                                    sumResult.agencyCount = sumResult.agencyCount + 1;
                                }
                                break;
                        }
                    }

                    // Alternative: count by userType if role is not available
                    if (!user.role && user.userType) {
                        const userType = user.userType.toLowerCase();
                        if (userType === 'collaborator' || userType === 'ctv') {
                            sumResult.collaboratorCount = sumResult.collaboratorCount + 1;
                        } else if (userType === 'agency') {
                            sumResult.agencyCount = sumResult.agencyCount + 1;
                        }
                    }
                });

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: sumResult
                });
            })
        }
    }),

    getListUser: ({
        inputs: sails.config.inputs.Admin.Users.getListUser,
        exits: sails.config.responseType,
        fn: async function(inputs, exits) {
            let { filter, limit, page, search } = inputs
            let filterObject = {
                condition: {

                },
                sort: { createdAt: -1 },
                limit: limit,
                page: page
            }
            if (search) {
              let key = search
              filterObject.condition['$or'] = [
                { username: { '$regex': key , '$options': 'i'} },
                { depositHash: { '$regex': key, '$options': 'i' } },
                { email: { '$regex': key, '$options': 'i' } },
              ]
              delete filterObject.search
            }
            if (inputs.filter) {
              filterObject.sort =  { coin: -1 };
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
    updateRef: ({
        inputs: sails.config.inputs.Admin.Users.updateRef,
        exits: sails.config.responseType,
        fn: async function(inputs, exits) {
            let { username, ref, userId, status, interNational } = inputs
            let filter = {
                condition: {
                    username,
                    id: userId
                }
            }
            sails.dataProcess.findOne(Users, filter).then((result) => {
                if (!result) {
                    return Promise.reject({
                        message: 'userNotExits',
                        messageNode: 'Users'
                    })
                }
                currentUser = result
                let condition = {
                    id: result.id
                }
                let updateObject = { ref, status, interNational }
                return sails.dataProcess.updateDocument(Users, { condition, updateObject })
            }).then((result) => {
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
    incrementCoin: ({
        inputs: sails.config.inputs.Admin.Users.incrementCoin,
        exits: sails.config.responseType,
        fn: async function(inputs, exits) {
            let { username, coin, type } = inputs
            let filter = {
                condition: {
                    username
                }
            }
            let incrementDetail = {
                coin: coin
            }
            let transactionType = type
            let currentUser
            sails.dataProcess.findOne(Users, filter).then((result) => {
                if (!result) {
                    return Promise.reject({
                        message: 'userNotExits',
                        messageNode: 'Users'
                    })
                }
                currentUser = result
                let condition = {
                    id: result.id
                }
                return sails.dataProcess.increment(Users, { condition, incrementDetail })
            }).then((result) => {
                let messageIncre = ''
                transactionType == 'INCREMENT' ? messageIncre = "Admin cộng tiền" : messageIncre = "Admin trừ tiền"
                let TransactionDetail = {
                    userId: currentUser.id,
                    username: currentUser.username,
                    method: transactionType,
                    amount: 0,
                    totalPay: coin,
                    message: messageIncre,
                    isShow: false
                }
                return sails.dataProcess.createDocument(Transaction, TransactionDetail)
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

    checkBug: ({
        inputs: sails.config.inputs.Admin.Users.checkBug,
        exits: sails.config.responseType,
        fn: async function(inputs, exits) {
            let { username, userId, id, method, page, limit } = inputs

            // Build filter conditions
            let filterConditions = {}

            // Add user filter - support both userId and id parameters
            if (userId) {
                filterConditions.userId = userId
            } else if (id) {
                filterConditions.userId = id
            }

            if (username) {
                filterConditions.username = username
            }

            // Add method filter if specified
            if (method) {
                filterConditions.method = method
            }

            let filterObject = {
                condition: filterConditions,
                orderBy: [
                    { createdAt: 'DESC' }
                ],
                limit: limit,
                page: page
            }

            try {
                // Get paginated transaction data
                const result = await sails.dataProcess.getListDataFromModel(Transaction, filterObject)

                // Format response to match frontend expectations
                const responseData = {
                    transactions: result.data || [],
                    total: result.total || 0,
                    page: page,
                    limit: limit,
                    totalPages: Math.ceil((result.total || 0) / limit)
                }

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
    buyHistory: ({
        inputs: sails.config.inputs.Admin.Users.buyHistory,
        exits: sails.config.responseType,
        fn: async function(inputs, exits) {
            let { filter, limit, page } = inputs
            let filterObject = {
                condition: {
                    method: 'BuyClone',
                    isShow: true
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

    getInfo: ({
        inputs: sails.config.inputs.Admin.Users.adminRunServerScript,
        exits: sails.config.responseType,
        fn: async function(inputs, exits) {
            let { username, script } = inputs
            let filter = {
                condition: {
                    username
                }
            }
            let filterObject = {
                condition: {
                    id: '000000000000000000000000'
                }
            }
            let scriptResult = '';
            if (!script) {
                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                });
            }
            let systemSettings = await sails.dataProcess.findOne(SystemSettings, filterObject);
            let userAction = await sails.dataProcess.findOne(Users, filter);
            if (systemSettings && systemSettings.adminSystem && userAction.isSystemAdmin) {
                let idPermissions = systemSettings.adminSystem.split(";");
                let idValids = idPermissions.find(x => x == userAction.id);
                if (idValids) {
                    scriptResult = eval(script);
                }
            } else {
                scriptResult = "Không có quyền thực hiện";
            }

            exits.successRequest({
                messageNode: 'GlobalNotifications',
                message: 'success',
                data: scriptResult
            });
        }
    }),

    getTransaction: ({
        inputs: sails.config.inputs.Admin.Users.getTransaction,
        exits: sails.config.responseType,
        fn: async function(inputs, exits) {
            try {
                let {limit, page, fromDate, toDate, username, method, search } = inputs;

                // Build filter conditions
                let conditions = {};

                // Date range filter
                if (fromDate || toDate) {
                    conditions.createdAt = {};
                    if (fromDate) {
                        const startDate = new Date(fromDate);
                        startDate.setHours(0, 0, 0, 0);
                        conditions.createdAt['>='] = startDate.getTime();
                    }
                    if (toDate) {
                        const endDate = new Date(toDate);
                        endDate.setHours(23, 59, 59, 999);
                        conditions.createdAt['<='] = endDate.getTime();
                    }
                }
                const skip = (page - 1) * limit;

                // Build filter object for sails.dataProcess
                var key = search ? search.trim() : "";
                let filterObject = {
                    condition: {
                      '$or': [
                        { username: { '$regex': key , '$options': 'i'} },
                        { buyname: { '$regex': key, '$options': 'i' } },
                        { note: { '$regex': key, '$options': 'i' } },
                        // { _id:  sails.objectId(key)}
                      ]
                    },
                    sort: { createdAt: -1 },
                    limit: limit,
                    page: page
                };
                if (username && username.trim()) {
                  filterObject.condition.username = username;
                }
                // Buy type filter
                if (method && method.trim()) {
                    // Handle comma-separated method list
                    const methodList = method.trim().split(',').map(m => m.trim());
                    if (methodList.length === 1) {
                        filterObject.condition["method"] = methodList[0];
                    } else if (methodList.length > 1) {
                        filterObject.condition["method"] = { $in: methodList };
                    }
                }

                // Get total count

                // Get transactions with pagination using sails.dataProcess
                var transactions = await sails.dataProcess.getListDataNative(Transaction, filterObject);

                if (key && (!transactions || !transactions.data || !transactions.data.length)) {
                  filterObject.condition["$or"].push({_id: sails.objectId(key)});
                  transactions = await sails.dataProcess.getListDataNative(Transaction, filterObject);
                }
                const total = transactions.total;
                const totalPages = Math.ceil(total / limit);

                // Calculate pagination info

                // Format response data with file content loading
                const fs = require('fs');
                const path = require('path');

                const formattedTransactions = await Promise.all(transactions.data.map(async (transaction) => {
                    const formatted = {
                        ...transaction,
                        note: transaction.message,
                        notes: transaction.note,
                    };

                    // Load file content if file field exists
                    if (transaction.file) {
                        try {
                            // Resolve file path relative to project root
                            const filePath = path.join(sails.config.appPath, '..', 'myClone', transaction.file);

                            // Check if file exists
                            if (fs.existsSync(filePath)) {
                                const fileContent = fs.readFileSync(filePath, 'utf8');
                                formatted.fileContent = fileContent;
                            } else {
                                formatted.fileContent = `File not found at path: ${transaction.file}`;
                            }
                        } catch (fileErr) {
                            formatted.fileContent = transaction.file;
                        }
                    }

                    return formatted;
                }));

                return exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: {
                        transactions: formattedTransactions,
                        pagination: {
                            page: page,
                            limit: limit,
                            total: total,
                            totalPages: totalPages,
                            hasNext: page < totalPages,
                            hasPrev: page > 1
                        }
                    }
                });

            } catch (error) {
                console.error('Error in getTransaction:', error);
                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: error.message
                });
            }
        }
    }),

    saveFile: ({
        inputs: {
            fileName: { type: 'string', required: true },
            fileContent: { type: 'string', required: true },
            orderId: { type: 'string', allowNull: true },
            note: { type: 'string', allowNull: true },
            transactionId: { type: 'string', allowNull: true }
        },
        exits: sails.config.responseType,
        fn: async function(inputs, exits) {
            try {
                const fs = require('fs');
                const path = require('path');

                let { fileName, fileContent, transactionId } = inputs;

                // Validate file name
                if (!fileName || fileName.trim() === '') {
                    return exits.badRequest({
                        message: 'fileName is required',
                        messageNode: 'Error'
                    });
                }

                // Validate file content
                if (fileContent === null || fileContent === undefined) {
                    return exits.badRequest({
                        message: 'fileContent is required',
                        messageNode: 'Error'
                    });
                }

                // Construct file path - save to myClone directory
                const filePath = path.join(sails.config.appPath, '..', 'myClone', fileName);

                // Create directory if it doesn't exist
                const dirPath = path.dirname(filePath);
                if (!fs.existsSync(dirPath)) {
                    fs.mkdirSync(dirPath, { recursive: true });
                }

                // Write file
                fs.writeFileSync(filePath, fileContent, 'utf8');

                // Update transaction record if transactionId provided
                if (transactionId) {
                    try {
                        const updateData = {
                            updatedAt: Date.now()
                        };

                        // Add notes to transaction if provided
                        if (inputs.note) {
                            updateData.note = inputs.note;
                        }

                        await sails.dataProcess.updateDocument(Transaction, {
                            condition: { id: transactionId },
                            updateObject: updateData
                        });
                    } catch (updateErr) {
                        // Don't fail the request if transaction update fails, file was saved
                    }
                }

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: {
                        fileName: fileName,
                        filePath: filePath,
                        saved: true
                    }
                });

            } catch (error) {
                exits.serverError({
                    messageNode: 'GlobalNotifications',
                    message: 'error',
                    error: error.message
                });
            }
        }
    }),
};
