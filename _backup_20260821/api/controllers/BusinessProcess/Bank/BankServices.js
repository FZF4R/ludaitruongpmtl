module.exports = class BankServices {
    ChiTietGiaoDich() {
        return new Promise(async (resolve, reject) => {
            let res = []
            if (response && response.transactions && response.transactions.length) {
                response.transactions.filter(x=> x.TransactionDate != "31/07/2022" && x.TransactionDate != "01/08/2022").map(e => {
                    if (e.CD == '+') {
                        let dataNap = {
                            sothamchieu: e.Reference,
                            ngay: e.TransactionDate,
                            noidung: e.Description,
                            sotien: e.Amount
                        }
                        res.push(dataNap)
                    }
                })
            }
            resolve(res)
        })
    }
    check_pay(data) {
        return new Promise(async (resolve, reject) => {
            this.ChiTietGiaoDich().then(async (a) => {
                if (!a.length) {
                    return Promise.reject()
                } else {
                    let cuphap = `naptien ${data.User.username} muaviaxmdt`;
                    cuphap = cuphap.toLowerCase();
                    let filter = a.filter(e => {
                        e.noidung = e.noidung.toLowerCase()
                        return e.noidung.includes(cuphap)
                    })

                    if (!filter.length) {
                        return Promise.reject();
                    } else {
                        let filterObject = {
                            condition: {
                                saleConfig: true
                            },
                            orderBy: [
                                { createdAt: 'DESC' }
                            ],
                        }
                        await sails.dataProcess.find(SaleConfig, filterObject).then((result) => {
                            result = result.sort(function (a, b) { return b.createdAt - a.createdAt });
                            data.giaodich = filter[0];
                            return this.process_payment(data, result[0]);
                        }).catch((err) => {
                            console.log(err)
                            data.giaodich = filter[0];
                            return this.process_payment(data, null);
                            // sails.checkErrorOutput(err, exits);
                        });
                    }
                }
            }).then((result) => {
                resolve({ success: true, message: 'Nạp tiền thành công' })
            }).catch((err) => {
                console.log('errr->', err)
                resolve({ error: true, message: 'Chưa có giao dịch' })
            });
        });
    }
    process_payment(data, saleConfig) {
        return new Promise((resolve, reject) => {
            try {
                let { phone, userId, User } = data
                let amount
                data.giaodich.sothamchieu = data.giaodich.sothamchieu.split(' ')
                data.giaodich.sothamchieu = data.giaodich.sothamchieu.join('')
                sails.dataProcess.findOne(Transaction, { condition: { userId: userId, transactionId: data.giaodich.sothamchieu } }).then((a) => {
                    if (a == null) {
                        amount = parseInt(data.giaodich.sotien.split(',').join(''))
                        let salePercent = 0;
                        if (saleConfig && saleConfig.salePercent) {
                            salePercent = saleConfig.salePercent;
                            amount = amount + parseInt(amount * (saleConfig.salePercent / 100));
                        }
                        let messageGiaoDich = `Nạp ${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} vào tài khoản` + (salePercent > 0 ? ` - Khuyến mại ${salePercent}%` : '');
                        let giaodich = { username: User.username, userId, transactionId: data.giaodich.sothamchieu, method: 'DEPOSIT', message: messageGiaoDich, amount: 0, totalPay: amount }
                        return sails.dataProcess.createDocument(Transaction, giaodich)
                    } else {
                        return Promise.reject()
                    }
                }).then(async (b) => {
                    return await this.incermentUserBalance({ User, amount: parseInt(amount) })
                }).then((c) => {
                    resolve(true)
                }).catch((err) => {
                    reject({ error: 'Chưa có giao dịch' })
                });
            } catch (error) {
                reject(error)
            }
        });
    }
    check_payment_momo(data) {
        return new Promise(async (resolve, reject) => {
            let { tranId, phone, userId, User } = data
            let payload = {
                "access_token": "uK1puVx5YvchHQG1ADulUiRUbas5dZ79wNRyuQJrCLOOPR5xx0",
                "tranId": tranId
            }
            let amount
            let response = await sails.Ultils._request_body({ url: `https://momofree.apimienphi.com/api/checkTranId`, payload })
            if (response && response.data && response.data.tranId) {
                sails.dataProcess.findOne(Transaction, { condition: { transactionId: tranId } }).then((a) => {
                    if (a == null) {
                        amount = response.data.amount
                        let giaodich = { phone, userId, transactionId: tranId, method: 'DEPOSIT', message: `Nạp ${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} vào tài khoản`, amount: 0, totalPay: parseInt(amount) }
                        return sails.dataProcess.createDocument(Transaction, giaodich)
                    } else {
                        return Promise.reject({ success: false, message: `Giao dịch ${tranId} đã hoàn thành` })
                    }
                }).then(async (b) => {
                    return await this.incermentUserBalance({ User, amount: parseInt(amount) })
                }).then((c) => {
                    resolve({ success: true, message: 'Nạp tiền thành công' })
                }).catch((err) => {
                    reject(err)
                });
            } else {
                reject({ success: false, message: 'Chưa có giao dịch' })
            }
        })
    }
    incermentUserBalance({ User, amount }) {
        return new Promise((resolve, reject) => {
            let incrementDetail = {
                coin: amount
            }
            let condition = {
                id: User.id
            }
            sails.dataProcess.increment(Users, { condition, incrementDetail }).then((result) => {
                resolve(true)
            }).catch((err) => {
                console.log(err)
                reject(err)
            });
        })
    }
}