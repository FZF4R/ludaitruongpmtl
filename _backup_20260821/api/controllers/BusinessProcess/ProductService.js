const Promise = require('bluebird')
const fs = require('fs')
const crypto = require('crypto')
const ENCRYPTION_KEY = sails.config.env.cloneEncrypt.ENCRYPTION_KEY
const SALT = sails.config.env.cloneEncrypt.SALT
const IV_LENGTH = sails.config.env.cloneEncrypt.IV_LENGTH
const NONCE_LENGTH = sails.config.env.cloneEncrypt.NONCE_LENGTH
let key = crypto.pbkdf2Sync(ENCRYPTION_KEY, SALT, 10000, 32, 'sha512')
module.exports = class ProductService {
    backupProductToTable(productCount) {
        return new Promise(async(resolve, reject) => {
            let soldProducts = await sails.dataProcess.find(Product, { condition: { isSell: true } });
            if (soldProducts.length == productCount) {
                let name = `BackUp_Product_` + new Date().getTime().toString() + ".txt";
                let File = sails.path.resolve('..', 'BackUpProduct', name)
                fs.writeFile(File, JSON.stringify(soldProducts), function(err) {
                    if (err) {
                        return console.log(err);
                    }
                    console.log("The file was saved!");
                    return Promise.all([
                        sails.dataProcess.removeDocument(Product, { isSell: true })
                    ]).then((res) => { resolve(true) }).catch((err) => { resolve(false) })
                });
            }
            resolve(true)
        })
    }

    userDownload({ backup }) {
        return new Promise((resolve, reject) => {
            return sails.PromiseMap(backup, (data) => {
                return `accountIds[]=${data.idBackup.trim()}`
            }).then(async(result) => {
                let kq = result.join('&')
                let backupzmmo = await sails.Ultils._request({
                    url: `${API_ZMMO}?${kq}`,
                    options: { authorization }
                })
                return backupzmmo.data
            }).then((result) => {
                resolve(result)
            }).catch((err) => {
                reject(err)
            });
        })

    }
    userBuyClone({ User, amount, groupId }) {
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
            let payBalance = amount * grInfo.balance
            let userBalance = userInfo.coin
            let userBouns = userInfo.ref
            let coinBouns = (payBalance * userBouns) / 100
            let coinPayUpdate = 0
            let messagePay = `Mua ${amount} ${grInfo.name}`
            userBouns == 0 ? payBalance = payBalance : payBalance = payBalance - coinBouns
            userBouns == 0 ? messagePay = `Mua ${amount} ${grInfo.name}` : messagePay = `(CTV CK ${userBouns}%) - Mua ${amount} ${grInfo.name}`
            coinPayUpdate = userBalance - payBalance
            let data = ''
            let backup = []
            if (payBalance > userBalance) {
                reject({
                    messageNode: 'Group',
                    message: 'notEnoughCoin'
                })
            } else if (totalClone < amount) {
                reject({
                    messageNode: 'Clone',
                    message: 'soldOutClone'
                })
            } else {
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
                        // Trừ tiền, Tạo File, Tạo Log
                        let name = `(${amount} Clone)${userInfo.id}${Math.floor((Math.random() * 999999) + 11111)}-${sails.moment().format('DD-MM-YYY')}.txt`
                        let File = sails.path.resolve('..', 'myClone', name)
                        fs.writeFile(File, data, function(err) {
                            if (err) {
                                return console.log(err);
                            }
                            console.log("The file was saved!");
                        })
                        let updateUser = {
                            condition: userInfo,
                            updateObject: { coin: coinPayUpdate }
                        }
                        let createLog = {
                            phone: userInfo.phone,
                            userId: userInfo.id,
                            totalPay: payBalance,
                            message: messagePay,
                            method: 'BuyClone',
                            file: name,
                            backup,
                            amount
                        }
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
}
