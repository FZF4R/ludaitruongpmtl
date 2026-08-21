const Promise = require('bluebird')
const fs = require('fs')
const crypto = require('crypto')
const ENCRYPTION_KEY = sails.config.env.cloneEncrypt.ENCRYPTION_KEY
const SALT = sails.config.env.cloneEncrypt.SALT
const IV_LENGTH = sails.config.env.cloneEncrypt.IV_LENGTH
const NONCE_LENGTH = sails.config.env.cloneEncrypt.NONCE_LENGTH
let key = crypto.pbkdf2Sync(ENCRYPTION_KEY, SALT, 10000, 32, 'sha512')

let preData = `Lưu ý: Tài khoản Via sau khi mua vui lòng đăng nhập ngay để kiểm tra và thay đổi thông tin.Tất cả các trường hợp chưa đổi pass, mail Via mà bị back bên mình sẽ không chịu trách nhiệm !!!
ĐIỀU KIỆN BẢO HÀNH
CHẤP NHẬN BẢO HÀNH :
Trong vòng 12 giờ kể từ khi Via được mua trên hệ thống, khách hàng có quyền được bảo hành khi gặp các trường hợp sau:
Login lần đầu thất bại (sai pass,bị Checkpoint trước khi mua)
Via bị vô hiệu hóa tài khoản quảng cáo cá nhân từ trước thời gian mua nick (Đối với trường hợp via live ads/xmdt...)
Thông tin Via không đúng với thông tin được ghi trên Website (Ngày tạo,tuổi.giới tính nếu có)

TỪ CHỐI BẢO HÀNH
Khách hàng không được bảo hành Via trong các trường hợp sau:
Via bị bạn làm checkpoint do lên Camp, Add thẻ, Add BM, Reg BM...
Via bị bạn làm hạn chế quảng cáo do lên Camp, Add thẻ, Add BM, Reg BM...
Via bị bạn làm vô hiệu hóa tài khoản quảng cáo cá nhân do lên Camp, Add thẻ
Checkpoint do đăng nhập ip nát
Via bị chủ Via back lại do không thay đổi thông tin sau khi nhận Via
Nên nhớ ko đc đổi pass bằng mail gốc từ con via đã ngâm 30 ngày nếu đổi sẻ bị trường hợp mất checkpoint mail

`;

module.exports = class CloneServices {
    async loadPreDataFromSystemSettings() {
        try {
            const setting = await sails.dataProcess.findOne(SystemSettings, {
                condition: { id: '222222222222222222222222' }
            })
            if (setting && setting.guidLine) {
                return setting.guidLine;
            } else {
              return preData;
            }
        } catch (e) { }
    }

    userBuyCloneByPartnerSite({ User, amount, categoryId, config }) {
        return new Promise(async(resolve, reject) => {

            let filterCategory = {
                condition: { id: categoryId }
            }
            let filterUser = {
                condition: { id: User.id }
            }
            const tranHistory = sails.Ultils.getDepositHashCode(User.id.toString());
            let grInfo = await sails.dataProcess.findOne(PCategory, filterCategory)

            if (!grInfo) {
              reject({
                  messageNode: 'Group',
                  message: 'invalidCategory'
              })
              return;
            }

            let userInfo = await sails.dataProcess.findOne(Users, filterUser)
            let payBalance = amount * grInfo.price;
            let userBalance = userInfo.coin
            let userBouns = (userInfo.ref) ? userInfo.ref : 0;
            let coinBouns = grInfo.isNotPartnerPrice ? 0 : Math.round(((payBalance * userBouns) / 100))

            let coinPayUpdate = 0
            let messagePay = `Mua ${amount} ${grInfo.name}`
            userBouns == (config && config.isSale && userBouns) ? ( userBouns ?(payBalance = payBalance - coinBouns) : (payBalance = payBalance)) : 0;
            userBouns == 0 ? messagePay = `Mua ${amount} ${grInfo.name}` : messagePay = `Mua ${amount} ${grInfo.name}`
            coinPayUpdate = userBalance - payBalance
            let data = await this.loadPreDataFromSystemSettings();
            let backup = []
            if (payBalance > userBalance) {
                reject({
                    messageNode: 'Group',
                    message: 'notEnoughCoin'
                })
            } else if (grInfo.productCount < amount) {
                reject({
                    messageNode: 'Clone',
                    message: 'soldOutClone'
                })
            } else {
                let updateUser = {
                    condition: { id: User.id },
                    updateObject: { coin: coinPayUpdate }
                }
                let createLog = {
                    transactionId: tranHistory,
                    User: userInfo,
                    updateUser: updateUser,
                    method: 'PreBuyClone',
                    amount: amount,
                    totalPay: payBalance,
                    message: messagePay,
                    discountPercent: userInfo.ref,
                    discountAmount: coinBouns,
                    backup,
                    price: grInfo.price,
                    buyname: grInfo.name,
                    transactionType: grInfo.type,
                    note: `${grInfo.supportContact || ''}|${tranHistory}|${userInfo?.username}`
                }

                try {
                  await sails.dataProcess.createDocument(TransactionHistory, createLog);
                } catch(errorHis) { }

                var buyResponse = false;
                let configSettings = await sails.dataProcess.findOne(SystemSettings, {condition: {id: sails.ID_CONFIG}})
                sails.dataProcess.updateDocument(Users, updateUser).then((resultUser) => {
                    // Check if product is marked as isPayFirst
                    if (grInfo.isPayFirst) {
                        // For Pay First products: create file with payment instruction
                        buyResponse = true;
                        let folderName = grInfo.name.replace(":", "").replace("$", "").replace("$", "").replace("+", "").replace("%", "");
                        let name = `(${amount} ${folderName})${userInfo.id}${Math.floor((Math.random() * 999999) + 11111)}-${sails.moment().format('DD-MM-YY')}.txt`
                        name = sails.Ultils.removeInvalidChar(name);
                        let File = sails.path.resolve('..', 'myClone', name)

                        // Create payment instruction message
                        let payFirstMessage = data + `Sao chép mã đơn và gửi cho admin để nhận tài khoản | ${amount} ${grInfo.name} | Mã đơn ${tranHistory}`

                        // Write file with payment instruction
                        fs.writeFile(File, payFirstMessage, function (err) {
                            if (err) {
                                return console.log(err);
                            }
                            console.log("The file was saved!");
                        })

                        // Create transaction record
                        var buyTransaction = {
                          userId: userInfo.id,
                          username: userInfo.username,
                          method: 'BuyClone',
                          amount: amount,
                          totalPay: payBalance,
                          message: messagePay,
                          discountPercent: userInfo.ref,
                          discountAmount: coinBouns,
                          backup,
                          price: grInfo.price,
                          buyname: grInfo.name,
                          file: name,
                          impPrice: grInfo.impPrice ? grInfo.impPrice : 0,
                          transactionType: grInfo.type,
                          apiResponse: { isPayFirst: true, paymentCode: tranHistory },
                          note: `${grInfo.supportContact || ''} | Mã đơn: ${tranHistory} | Loại: ${grInfo.botProductType || 'sẵn account'}`
                        }

                        sails.Ultils.sendMessageToGroup(userInfo, grInfo, 0, amount, payBalance, 0, false, configSettings);
                        return Promise.all([
                            sails.dataProcess.createDocument(Transaction, buyTransaction),
                            sails.dataProcess.updateDocument(PCategory, {condition: {id: grInfo.id}, updateObject: {sold: grInfo.sold ? (grInfo.sold + amount) : amount}}),
                        ])
                    } else {
                        // Original logic: call API to get accounts
                        return this.buyAccountViaAPIMainPage(amount, grInfo, configSettings)
                            .then(async (result) => {
                                // Lưu Log response về Server
                                try {
                                  var tranHis = {
                                    transactionId: tranHistory,
                                    User: resultUser,
                                    method: 'BuyClone',
                                    amount: amount,
                                    totalPay: payBalance,
                                    message: messagePay,
                                    discountPercent: userInfo.ref,
                                    discountAmount: coinBouns,
                                    backup,
                                    price: grInfo.price,
                                    impPrice: grInfo.impPrice ? grInfo.impPrice : 0,
                                    buyname: grInfo.name,
                                    transactionType: grInfo.type,
                                    apiResponse: result
                                  }
                                  await sails.dataProcess.createDocument(TransactionHistory, tranHis);
                                } catch(errBuy) {
                                }

                                if (result && result.success && result.data && result.data.length) {
                                    buyResponse = true;
                                    // Trừ tiền, Tạo File, Tạo Log
                                    data = data + result.data.join('\n');
                                    let folderName = grInfo.name.replace(":", "").replace("$", "").replace("$", "").replace("+", "").replace("%", "");
                                    let name = `(${amount} ${folderName})${userInfo.id}${Math.floor((Math.random() * 999999) + 11111)}-${sails.moment().format('DD-MM-YY')}.txt`
                                    name = sails.Ultils.removeInvalidChar(name);
                                    let File = sails.path.resolve('..', 'myClone', name)

                                    if (createLog.id) delete createLog.id;

                                    result.data.forEach(accountInfo => {
                                        if (accountInfo) backup.push({ idBackup: accountInfo.split('|')[0] });
                                    });

                                    var buyTransaction = {
                                      userId: userInfo.id,
                                      username: userInfo.username,
                                      method: 'BuyClone',
                                      amount: amount,
                                      totalPay: payBalance,
                                      message: messagePay,
                                      discountPercent: userInfo.ref,
                                      discountAmount: coinBouns,
                                      backup,
                                      price: grInfo.price,
                                      buyname: grInfo.name,
                                      file: name,
                                      impPrice: grInfo.impPrice ? grInfo.impPrice : 0,
                                      transactionType: grInfo.type,
                                      apiResponse: result,
                                      note: `${grInfo.supportContact || ''} | Mã đơn: ${tranHistory} | ${grInfo.botProductType || ''}`
                                    }
                                    fs.writeFile(File, data, function (err) {
                                        if (err) {
                                            return console.log(err);
                                        }
                                        console.log("The file was saved!");
                                    })

                                    sails.Ultils.sendMessageToGroup(userInfo, grInfo, 0, amount, payBalance, 0, false, configSettings);
                                    return Promise.all([
                                        sails.dataProcess.createDocument(Transaction, buyTransaction),
                                        sails.dataProcess.updateDocument(PCategory, {condition: {id: grInfo.id}, updateObject: {sold: grInfo.sold ? (grInfo.sold + amount) : amount}}),
                                    ])
                                } else {
                                    return Promise.all([
                                        sails.dataProcess.updateDocument(Users, {
                                            condition: { id: User.id },
                                            updateObject: { coin: userInfo.coin }
                                        }),
                                    ])
                                }
                            })
                    }
                }).then((resultUpdate) => {
                    resolve({
                        data: data,
                        success: buyResponse,
                        response: resultUpdate
                    })
                }).catch((err) => {
                    console.log("err ===> ");
                    reject(err)
                });
            }
        })
    }

    userBuyClone({ User, amount, categoryId, grInfo, config }) {
        return new Promise(async(resolve, reject) => {
            let filterUser = {
                condition: { id: User.id }
            }
            let userInfo = await sails.dataProcess.findOne(Users, filterUser)
            let totalProduct = await Product.count({ categoryId, isSell: false })
            let payBalance = amount * grInfo.price;
            let userBalance = userInfo.coin
            let userBouns = userInfo.ref
            let coinBouns = grInfo.isNotPartnerPrice ? 0 : Math.round(((payBalance * userBouns) / 100))

            let coinPayUpdate = 0
            let messagePay = `Mua ${amount} ${grInfo.name}`
            userBouns == (config && config.isSale && userBouns) ? ( userBouns ?(payBalance = payBalance - coinBouns) : (payBalance = payBalance)) : 0;
            userBouns == 0 ? messagePay = `Mua ${amount} ${grInfo.name}` : messagePay = `SALE (CTV ${userBouns}%) - Mua ${amount} ${grInfo.name}`
            coinPayUpdate = userBalance - payBalance
            let data = await this.loadPreDataFromSystemSettings();
            let backup = []
            if (payBalance > userBalance) {
                reject({
                    messageNode: 'Group',
                    message: 'notEnoughCoin'
                })
            } else if (totalProduct < amount) {
                reject({
                    messageNode: 'Clone',
                    message: 'soldOutClone'
                })
            } else {
                let filterClone = {
                    condition: {
                        categoryId,
                        isSell: false,
                    },
                    limit: amount
                }
                sails.dataProcess.getListDataFromModel(Product, filterClone).then((result) => {
                    sails.PromiseMap(result.data, e => {
                            let update = {
                                condition: e,
                                updateObject: { isSell: true, buyByUser: userInfo.username}
                            }
                            data += `${this.decrypt(key, e.data)}\n`
                            let uid = this.decrypt(key, e.data).split("|")[0]
                            backup.push({ idBackup: uid })
                            return sails.dataProcess.updateDocument(Product, update);
                        })
                        .then((result) => {
                            // Trừ tiền, Tạo File, Tạo Log
                            let name = `(${amount} ${grInfo.name})${userInfo.id}${Math.floor((Math.random() * 999999) + 11111)}-${sails.moment().format('DD-MM-YY')}.txt`
                            let File = sails.path.resolve('..', 'myClone', name)
                            fs.writeFile(File, data, function(err) {
                                if (err) {
                                    return console.log(err);
                                }
                                console.log("The file was saved!");
                            })
                            let updateUser = {
                                condition: {id: userInfo.id, username: userInfo.username},
                                updateObject: { coin: coinPayUpdate }
                            }
                            let createLog = {
                                userId: userInfo.id,
                                username: userInfo.username,
                                method: 'BuyClone',
                                amount: amount,
                                totalPay: payBalance,
                                message: messagePay,
                                file: name,
                                backup,
                                price: grInfo.price,
                                buyname: grInfo.name,
                                impPrice: grInfo.importPrice ? grInfo.importPrice : 0,
                                transactionType: grInfo.type ? grInfo.type : 0
                            }
                            sails.Ultils.sendMessageToGroup(userInfo, grInfo, totalProduct, amount, payBalance, 0, false);
                            return Promise.all([
                                sails.dataProcess.createDocument(Transaction, createLog),
                                sails.dataProcess.updateDocument(Users, updateUser),
                                sails.dataProcess.updateDocument(Category, {condition: {id: grInfo.id}, updateObject: {sold: grInfo.sold ? (grInfo.sold + amount) : amount}}),
                            ])
                        }).then((result) => {
                            resolve(true)
                        }).catch((err) => {
                            reject(err)
                        });
                }).catch((err) => {
                    reject(err)
                });

            }
        })
    }

    adminGetClone({ User, amount, groupId }) {
        return new Promise(async(resolve, reject) => {
            let filterGroup = {
                condition: { id: groupId }
            }
            let filterUser = {
                condition: { id: User.id }
            }
            let grInfo = await sails.dataProcess.findOne(Group, filterGroup)
            let userInfo = await sails.dataProcess.findOne(Users, filterUser)
            let totalClone = await Clone.count({ groupId, isSell: false })
            if (totalClone < amount) {
                return Promise.reject({
                    messageNode: 'Clone',
                    message: 'soldOutClone'
                })
            }
            let data = ''
            let backup = []
            let filterClone = {
                condition: {
                    groupId,
                    isSell: false,
                },
                limit: amount
            }
            sails.dataProcess.getListDataFromModel(Clone, filterClone).then((result) => {
                sails.PromiseMap(result.data, e => {
                    let update = {
                        condition: e,
                        updateObject: { isSell: true, buyByUser: userInfo.username}
                    }
                    data += `${this.decrypt(key, e.cloneData)}\n`
                    let getZid = this.decrypt(key, e.cloneData).split("ZID: ")[1]
                    if (getZid) {
                        backup.push({ data: this.decrypt(key, e.cloneData), idBackup: getZid })
                    }
                    return sails.dataProcess.updateDocument(Clone, update)
                }).then((result) => {
                    let name = `(${amount} Clone)${userInfo.id}${Math.floor((Math.random() * 999999) + 11111)}-${sails.moment().format('DD-MM-YYY')}.txt`
                    let File = sails.path.resolve('..', 'myClone', name)
                    fs.writeFile(File, data, function(err) {
                        if (err) {
                            return console.log(err);
                        }
                        console.log("The file was saved!");
                    })
                    let createLog = {
                        phone: userInfo.phone,
                        userId: userInfo.id,
                        totalPay: 0,
                        message: `Admin ${userInfo.phone} lấy ${amount} Clone ${grInfo.name}`,
                        method: 'AdminGetClone',
                        file: name,
                        backup,
                        amount
                    }
                    return Promise.all([sails.dataProcess.createDocument(Transaction, createLog)])
                }).then((result) => {
                    resolve(true)
                }).catch((err) => {
                    reject(err)
                });
            }).catch((err) => {
                reject(err)
            });
        })
    }

    adminGetConfig({ User }) {
        return new Promise(async(resolve, reject) => {
            let response = {}
            let groupCount = await Group.count()
            let totalSell = await Transaction.sum('totalPay').where({ method: 'BuyClone' })
            let total = await Transaction.sum('amount').where({ method: 'BuyClone' })
            let totalDeps = await Transaction.sum('totalPay').where({ method: 'DEPOSIT' })
            let totalPen = await Transaction.sum('totalPay').where({ method: 'DEPOSIT', message: 'PENDING' })
            let totalFai = await Transaction.sum('totalPay').where({ method: 'DEPOSIT', message: 'FAILED' })
            let totalDep = totalDeps - (totalPen + totalFai)
            resolve({
                groupCount,
                totalSell,
                total,
                totalDep
            })
        })
    }

    encrypt(key, text) {
        let message = Buffer.from(text, 'base64')
        let nonce = crypto.randomBytes(NONCE_LENGTH);
        let iv = Buffer.alloc(IV_LENGTH)
        nonce.copy(iv)
        let cipher = crypto.createCipheriv('aes-256-ctr', key, iv);
        let encrypted = cipher.update(text.toString());
        message = Buffer.concat([nonce, encrypted, cipher.final()]);
        return message.toString('base64')
    }

    decrypt(key, text) {
        let message = Buffer.from(text, 'base64')
        let iv = Buffer.alloc(IV_LENGTH)
        message.copy(iv, 0, 0, NONCE_LENGTH)
        let encryptedText = message.slice(NONCE_LENGTH)
        let decipher = crypto.createDecipheriv('aes-256-ctr', key, iv);
        let decrypted = decipher.update(encryptedText);
        try {
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            return decrypted.toString();
        } catch (Err) {
            return 'NULL';
        }
    }

    userBuyCloneFileContent({ User, amount, categoryId, config }) {
        return new Promise(async(resolve, reject) => {

            let filterCategory = {
                condition: { id: categoryId }
            }
            let filterUser = {
                condition: { id: User.id }
            }
            let grInfo = await sails.dataProcess.findOne(Category, filterCategory)
            if (!grInfo) {
              reject({
                  messageNode: 'Group',
                  message: 'invalidCategory'
              })
              return;
            }

            let userInfo = await sails.dataProcess.findOne(Users, filterUser)
            let totalProduct = await Product.count({ categoryId, isSell: false })
            let payBalance = amount * grInfo.price;
            let userBalance = userInfo.coin
            let userBouns = userInfo.ref
            // let coinBouns = Math.round((payBalance * userBouns) / 100)
            let coinBouns = grInfo.isNotPartnerPrice ? 0 : Math.round(((payBalance * userBouns) / 100))

            let coinPayUpdate = 0
            let messagePay = `Mua ${amount} ${grInfo.name}`
            userBouns == (config && config.isSale && userBouns) ? ( userBouns ?(payBalance = payBalance - coinBouns) : (payBalance = payBalance)) : 0;
            userBouns == 0 ? messagePay = `Mua ${amount} ${grInfo.name}` : messagePay = `SALE (CTV ${userBouns}%) - Mua ${amount} ${grInfo.name}`
            coinPayUpdate = userBalance - payBalance
            let data = ''
            let backup = [];
            let arrData = [];
            if (payBalance > userBalance) {
                reject({
                    messageNode: 'Group',
                    message: 'notEnoughCoin'
                })
            } else if (totalProduct < amount) {
                reject({
                    messageNode: 'Clone',
                    message: 'soldOutClone'
                })
            } else {
                let filterClone = {
                    condition: {
                        categoryId,
                        isSell: false,
                    },
                    limit: amount
                }
                sails.dataProcess.getListDataFromModel(Product, filterClone).then((result) => {
                    sails.PromiseMap(result.data, e => {
                        let update = {
                            condition: e,
                            updateObject: { isSell: true, buyByUser: userInfo.username}
                        }
                        data += `${this.decrypt(key, e.data)}\n`
                        arrData.push(`${this.decrypt(key, e.data)}`);
                        let uid = this.decrypt(key, e.data).split("|")[0]
                        backup.push({ idBackup: uid })

                        return sails.dataProcess.updateDocument(Product, update);
                    }).then((result) => {
                        // Trừ tiền, Tạo File, Tạo Log
                        let name = `(${amount} Clone)${userInfo.id}${Math.floor((Math.random() * 999999) + 11111)}-${sails.moment().format('DD-MM-YY')}.txt`
                        let File = sails.path.resolve('..', 'myClone', name)
                        fs.writeFile(File, data, function(err) {
                            if (err) {
                                return console.log(err);
                            }
                            console.log("The file was saved!");
                        })
                        let updateUser = {
                            condition: {id: userInfo.id, username: userInfo.username},
                            updateObject: { coin: coinPayUpdate }
                        }
                        let createLog = {
                            userId: userInfo.id,
                            username: userInfo.username,
                            method: 'BuyClone',
                            amount: amount,
                            totalPay: payBalance,
                            message: messagePay,
                            file: name,
                            backup,
                            price: grInfo.price,
                            buyname: grInfo.name,
                            impPrice: grInfo.importPrice ? grInfo.importPrice : 0,
                            transactionType: grInfo.type ? grInfo.type : 0
                        }
                        sails.Ultils.sendMessageToGroup(userInfo, grInfo, totalProduct, amount, payBalance, 0, true);
                        return Promise.all([
                            sails.dataProcess.createDocument(Transaction, createLog),
                            sails.dataProcess.updateDocument(Users, updateUser),
                            sails.dataProcess.updateDocument(Category, {condition: {id: grInfo.id}, updateObject: {sold: grInfo.sold ? (grInfo.sold + amount) : amount}}),
                        ]);

                    }).then((result) => {
                        resolve(arrData)
                    }).catch((err) => {
                        reject(err)
                    });
                }).catch((err) => {
                    reject(err)
                });

            }
        })
    }

    markViewedNotification(notifications) {
        return new Promise(async (resolve, reject) => {
            Promise.all(
                notifications.map(notification => sails.dataProcess.updateDocument(Transaction, { condition: { id: notification.id }, updateObject: { isViewed: true } }))
            ).then((res) => {
                resolve(res);
            }).catch((err) => {
                reject(err)
            })
        })
    }

    buyAccountViaAPIMainPage(amount, category, configSettings) {
        return new Promise(async (resolve, reject) => {
            var websiteConfig = null;
            if (configSettings && configSettings.websiteConfigs && configSettings.websiteConfigs.length) {
              websiteConfig = configSettings.websiteConfigs.find(x=>(x.DomainType == category.type && x.Domain == category.baseDomain));
            };

            if (!websiteConfig || !websiteConfig.Domain || !websiteConfig.DomainType) {
              resolve({
                success: false,
                response: {config: websiteConfig},
                message: {
                    "messageEN": "Buy Error",
                    "messageVNI": "Thiếu cấu hình tài khoản"
                }
              });
            }

            websiteConfig.type = websiteConfig.type ? parseInt(websiteConfig.type) : parseInt(websiteConfig.DomainType);

            switch (websiteConfig.type) {
              /// Mua hàng qua API Muabmvip.com
              case 4:
                var apiKey = websiteConfig.DomainApiKey;
                if (!apiKey) {
                  resolve({
                    success: false,
                    response: {config: websiteConfig},
                    message: {
                        "messageEN": "Buy Error",
                        "messageVNI": "Thiếu API Key..."
                    }
                  });
                }

                let requestBody = {
                    "api_key": apiKey,
                    "id_product": category.p_id,
                    "quantity": amount
                }

                let serviceRequestParam = {
                    url: `${category.baseDomain}/api/v1/buy`,
                    payload: requestBody,
                }

                sails.Ultils._request_body(serviceRequestParam)
                  .then(async (response) => {
                      if (response && response.status == true && response.order_id) {
                          setTimeout(async () => {
                              let orderResponse = (await sails.Ultils._request_body({ url: `${category.baseDomain}/api/v1/order`, payload: { order_id: response.order_id, api_key: apiKey } }));

                              if (orderResponse && orderResponse.data && Array.isArray(orderResponse.data)) {
                                  resolve({ success: true, data: orderResponse.data.map(x => x.full_info) });
                              } else {
                                  resolve({ success: true, data: orderResponse.msg });
                              }
                              return;
                          }, 500);
                      } else {
                          resolve({
                              success: false,
                              response: response,
                              message: {
                                  "messageEN": "Buy Error",
                                  "messageVNI":  (response && response.msg) ? response.msg : "Có lỗi xảy ra"
                              }
                          });
                      }
                }).catch((err) => {
                    resolve({ success: false ,message: (err && err.message) ? `Lỗi API ${err.message}` : "Lỗi API..." });
                });
                break;
              /// Mua hàng Qua API RegClone
              case 5:
                sails.Ultils._request_body({url: `${websiteConfig.Domain}/api/BResource.php?username=${websiteConfig.username}&password=${websiteConfig.password}&id=${category.p_id}&amount=${amount}`}).then((response) => {
                  if (response && response.status == "success" && response.data && response.data.trans_id && response.data.lists && response.data.lists.length) {
                      let orderResponse = response.data.lists;
                      resolve({ success: true, data: orderResponse.map(x => x.account) });
                  } else {
                      resolve({
                          success: false,
                          response: response,
                          message: {
                              "messageEN": "Buy Error",
                              "messageVNI": (response && response.msg) ? response.msg : "Có lỗi xảy ra"
                          }
                      });
                  }
                }).catch((err) => {
                  resolve({ success: false ,message: (err && err.message) ? `Lỗi API ${err.message}` : "Lỗi API..." });
                });
                // /api/BResource.php?username=admin&password=admin&id=19&amount=1
                break;
              case 6: // Mua hàng qua Nguyenlieummo4.com
                sails.Ultils._request_body({url: `${websiteConfig.Domain}/v1/partner/buy`, payload: {categoryId: category.object_id, amount: amount}, options: {headers: {"api-key": websiteConfig.DomainApiKey}}}).then((response) => {
                  if (response && response.message && response.data && response.data.length) {
                      let orderResponse = response.data;
                      resolve({ success: true, data: orderResponse});
                  } else {
                      resolve({
                          success: false,
                          response: response,
                          message: {
                              "messageEN": "Buy Error",
                              "messageVNI": (response && response.msg) ? response.msg : "Có lỗi xảy ra"
                          }
                      });
                  }
                }).catch((err) => {
                  resolve({ success: false ,message: (err && err.message) ? `Lỗi API ${err.message}` : "Lỗi API..." });
                });
                break;

              case 7: // Mua hàng qua Mlocal.us
                sails.Ultils._request_body({url: `${websiteConfig.Domain}/v1/partner/buy`, payload: {categoryId: category.object_id, amount: amount}, options: {headers: {"api-key": websiteConfig.DomainApiKey}}}).then((response) => {
                  if (response && response.message && response.data && response.data.length) {
                      let orderResponse = response.data;
                      resolve({ success: true, data: orderResponse});
                  } else {
                      resolve({
                          success: false,
                          response: response,
                          message: {
                              "messageEN": "Buy Error",
                              "messageVNI": (response && response.msg) ? response.msg : "Có lỗi xảy ra"
                          }
                      });
                  }
                }).catch((err) => {
                  resolve({ success: false ,message: (err && err.message) ? `Lỗi API ${err.message}` : "Lỗi API..." });
                });
                break;
              /// Mua hàng qua API vlclone.com
              case 8:
                var apiKey = websiteConfig.DomainApiKey;
                if (!apiKey) {
                  resolve({
                    success: false,
                    response: {config: websiteConfig},
                    message: {
                        "messageEN": "Buy Error",
                        "messageVNI": "Thiếu API Key..."
                    }
                  });
                }

                let requestBodyVlClone = {
                    "api_key": apiKey,
                    "id_product": category.p_id,
                    "quantity": amount
                }

                let serviceRequestParamVlClone = {
                    url: `${category.baseDomain}/api/v1/buy`,
                    payload: requestBodyVlClone,
                }

                sails.Ultils._request_body(serviceRequestParamVlClone)
                  .then(async (response) => {
                      if (response && response.status == true && response.order_id) {
                          setTimeout(async () => {
                              let orderResponse = (await sails.Ultils._request_body({ url: `${category.baseDomain}/api/v1/order`, payload: { order_id: response.order_id, api_key: apiKey } }));

                              if (orderResponse && orderResponse.data && Array.isArray(orderResponse.data)) {
                                  resolve({ success: true, data: orderResponse.data.map(x => x.full_info) });
                              } else {
                                  resolve({ success: true, data: orderResponse.msg });
                              }
                              return;
                          }, 500);
                      } else {
                          resolve({
                              success: false,
                              response: response,
                              message: {
                                  "messageEN": "Buy Error",
                                  "messageVNI":  (response && response.msg) ? response.msg : "Có lỗi xảy ra"
                              }
                          });
                      }
                }).catch((err) => {
                    resolve({ success: false ,message: (err && err.message) ? `Lỗi API ${err.message}` : "Lỗi API..." });
                });
                break;
              case 9:
                var apiKey = websiteConfig.DomainApiKey;
                if (!apiKey) {
                  resolve({
                    success: false,
                    response: {config: websiteConfig},
                    message: {
                        "messageEN": "Buy Error",
                        "messageVNI": "Thiếu API Key..."
                    }
                  });
                }

                let requestBodyCloneTut = {
                    "api_key": apiKey,
                    "id": category.p_id,
                    "action": "buyProduct",
                    "amount": amount,
                };

                let serviceRequestParamCloneTut = {
                    url: `${category.baseDomain}/api/buy_product?api_key=${apiKey}&id=${category.p_id}&action=buyProduct&amount=${amount}`,
                    // payload: requestBodyCloneTut,
                }

                sails.Ultils._request_body(serviceRequestParamCloneTut)
                .then(async (orderResponse) => {
                    if (orderResponse && orderResponse.data && Array.isArray(orderResponse.data)) {
                        resolve({success: true, data: orderResponse.data});
                    } else {
                        resolve({success: true, data: orderResponse});
                    }
                    return;
                }).catch((err) => {
                    resolve({success: false, error: "Lỗi thực thi..."});
                });
                break;
              default:
                resolve({
                    success: false,
                    response: {config: websiteConfig},
                    message: {
                        "messageEN": "Buy Error",
                        "messageVNI": "Lỗi cấu hình mua hàng"
                    }
                });
                console.log(`Thiếu cấu hình cho Domain ${websiteConfig.Domain} - ${websiteConfig.DomainType}`);
                break;
            }

        }
      )
    }

    downloadLiveAccounts({ User, uids, categoryId, config }) {
        return new Promise(async (resolve, reject) => {
            var amount = uids.length;
            let filterCategory = {
                condition: { id: categoryId }
            }
            let filterUser = {
                condition: { id: User.id }
            }

            let grInfo = await sails.dataProcess.findOne(Category, filterCategory)

            if (!grInfo) {
              reject({
                  messageNode: 'Group',
                  message: 'invalidCategory'
              })
              return;
            }

            let userInfo = await sails.dataProcess.findOne(Users, filterUser)
            let totalProduct = await Product.count({ categoryId, isSell: false, isDie: false });
            // let soldProduct = await Product.count({ categoryId, isSell: true});
            // let dieProduct = await Product.count({ categoryId, isDie: true});

            let payBalance = amount * grInfo.price;
            let userBalance = userInfo.coin
            let userBouns = userInfo.ref
            // let coinBouns = grInfo.isNotPartnerPrice ? 0 : ((payBalance * userBouns) / 100)
            let coinBouns = grInfo.isNotPartnerPrice ? 0 : Math.round(((payBalance * userBouns) / 100))
            // Huỷ vai trò CTV
            //coinBouns = 0;

            let coinPayUpdate = 0
            let messagePay = `Mua ${amount} ${grInfo.name}`
            userBouns == (config && config.isSale && userBouns) ? ( userBouns ?(payBalance = payBalance - coinBouns) : (payBalance = payBalance)) : 0;
            userBouns == 0 ? messagePay = `Mua ${amount} ${grInfo.name}` : messagePay = `SALE (CTV ${userBouns}%) - Mua ${amount} ${grInfo.name}`
            coinPayUpdate = userBalance - payBalance
            await this.loadPreDataFromSystemSettings()
            let data = preData;

            let backup = []
            if (payBalance > userBalance) {
                reject({
                    messageNode: 'Group',
                    message: 'notEnoughCoin'
                })
            } else if (totalProduct < amount) {
                reject({
                    messageNode: 'Clone',
                    message: 'soldOutClone'
                })
            } else {
                let filterClone = {
                    condition: {
                        categoryId,
                        uid: {in: uids},
                        isSell: false,
                        isDie: false,
                    },
                    limit: uids.length
                }
                sails.dataProcess.getListDataFromModel(Product, filterClone).then((result) => {
                    var saveAccounts = result.data;
                    saveAccounts.forEach(account => {
                      data += `${this.decrypt(key, account.data)}\n`
                      let uid = this.decrypt(key, account.data).split("|")[0]
                      backup.push({ idBackup: uid })
                    });

                    let update = {
                        condition: {
                          categoryId,
                          uid: {in: uids},
                        },
                        updateObject: { isSell: true, buyByUser: userInfo.username }
                    }
                    sails.dataProcess.updateManyDocument(Product, update).then((result) => {
                      // Trừ tiền, Tạo File, Tạo Log
                      // let name = `(${amount} ${grInfo.name})${userInfo.id}${Math.floor((Math.random() * 999999) + 11111)}-${sails.moment().format('DD-MM-YY')}.txt`
                      let name = `(${amount} ${grInfo.name})${userInfo.id}${Math.floor((Math.random() * 999999) + 11111)}-${sails.moment().format('DD-MM-YY')}.txt`
                      name = sails.Ultils.removeInvalidChar(name);
                      let File = sails.path.resolve('..', 'myClone', name)
                      fs.writeFile(File, data, function (err) {
                          if (err) {
                              return console.log(err);
                          }
                          console.log("The file was saved!");
                      })
                      let updateUser = {
                          condition: { id: userInfo.id },
                          updateObject: { coin: coinPayUpdate }
                      }
                      let createLog = {
                          userId: userInfo.id,
                          username: userInfo.username,
                          method: 'BuyClone',
                          amount: amount,
                          totalPay: payBalance,
                          message: messagePay,
                          file: name,
                          backup,
                          price: grInfo.price,
                          buyname: grInfo.name,
                          impPrice: grInfo.importPrice ? grInfo.importPrice * amount : 0,
                          transactionType: 0
                      }

                      sails.Ultils.sendMessageToGroup(userInfo, grInfo, totalProduct, amount, payBalance, 0, false);
                      return Promise.all([
                          sails.dataProcess.createDocument(Transaction, createLog),
                          sails.dataProcess.updateDocument(Users, updateUser)

                      ])
                  }).then((result) => {
                      resolve(true)
                  }).catch((err) => {
                      reject(err)
                  });
                }).catch((err) => {
                    reject(err)
                });

            }
        })
    }

    markDieProducts({ categoryId, uids, User }) {
        return new Promise(async (resolve, reject) => {
            sails.dataProcess.updateManyDocument(Product, {condition: {uid: {in: uids}, categoryId: categoryId}, updateObject: { isDie: true, buyByUser: User.username}}).
            then((res)=> {
              resolve({ success: true, message: "Thành công..." });
            }).catch((err) => {
              resolve({ success: false, message: "Có lỗi xảy ra" });
            });
        })
    }

    createFileContentByProducts(products, isLiveFolder = false) {
        return new Promise(async (resolve, reject) => {
            try {
                let data = "";
                products.forEach(product => {
                    data += `${this.decrypt(key, product.data)}\n`
                });
                var fileName = `${isLiveFolder ? 'liveClone' : 'dieClone'}_${products.length}_${new Date().getTime()}.txt`;
                let File = sails.path.resolve('..', 'dieClone', fileName)
                fs.writeFile(File, data, function (err) {
                    if (err) {
                        return console.log(err);
                    }
                })
                resolve({ fileName: fileName });
            } catch (err) {
                reject(err);
            }
        })
    }
}
