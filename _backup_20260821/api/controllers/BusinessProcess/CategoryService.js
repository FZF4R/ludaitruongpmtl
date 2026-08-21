const crypto = require('crypto')
const ENCRYPTION_KEY = sails.config.env.cloneEncrypt.ENCRYPTION_KEY
const SALT = sails.config.env.cloneEncrypt.SALT
const key = crypto.pbkdf2Sync(ENCRYPTION_KEY, SALT, 10000, 32, 'sha512')

const cron = require('node-cron');
const fs = require('fs');
let job = null;
module.exports = class CategoryService {
    initCronJob(){
        // return new Promise((resolve, reject) => {
        //     if (job) job.stop();
        //     console.log("Deposit Transaction Reloading...");
        //     this.runNewLoadTransactionJob();
        //     resolve(true)
        // });
    }

    runNewLoadTransactionJob() {
        try {
            // Tạo cron job mới
            job = cron.schedule(`*/1 * * * *`, async () => {
                try {
                    this.updateUserDepositHash();
                    // this.loadNewDepositTransactionService().then((res)=> {}).catch((err)=> {});
                } catch (err) {
                    console.log("Lỗi load giao dịch");
                    console.log(err);
                }
            });
            // Khởi chạy cron job mới
            job.start();
        } catch (error) {
            console.log("Lỗi tạo CronJob");
            console.log(error);
        }
    }

    updateUserDepositHash(){
      return new Promise(async (resolve, reject) => {
        let filterUser = {
          condition: {
              depositHash: {$exists:  null}
          },
          limit: 5000,
          page: 1,
          orderBy: [ { createdAt: 'ASC' }]
        }
        var updateUsers = await sails.dataProcess.getListDataNative(Users, filterUser);
        try {
          await Promise.all(updateUsers.data.map(((updateUser) => {
            var newHashCode = sails.Ultils.getDepositHashCode(updateUser._id.toString());
            sails.dataProcess.updateDocument(Users, {condition: {id: updateUser._id.toString()},  updateObject: {depositHash:  newHashCode}})
          })))
        } catch(error) {

        }


        filterUser = {
          condition: {
              depositHash: ""
          },
          limit: 5000,
          page: 1,
          orderBy: [ { createdAt: 'ASC' }]
        }
        updateUsers = await sails.dataProcess.getListDataNative(Users, filterUser);
        Promise.all(updateUsers.data.map(((updateUser) => {
          var newHashCode = sails.Ultils.getDepositHashCode(updateUser._id.toString());
          sails.dataProcess.updateDocument(Users, {condition: {id: updateUser._id.toString()},  updateObject: {depositHash:  newHashCode}})
        })))
      }).then((succ) => {
          console.log(succ);
        }).catch((err) => {
          console.log(err);
        });
    }

    loadNewDepositTransactionService() {
        return new Promise(async (resolve, reject) => {
            sails.BankServices.saveNewTransactionsContent({}).then((res)=> {
                res = JSON.parse(res);
                if (res && res.transactions && res.transactions.length){
                    this.addDepositByBankTransactions(res);
                } else {
                    this.addDepositByBankTransactions({transactions: []});
                }
            }).catch((err)=> {
                this.addDepositByBankTransactions({transactions: []});
                console.log(err);
            });
        });
    }


    async addDepositByBankTransactions(inputs){
        var { transactions } = inputs;
        // Kiểm tra thời gian hợp lệ => Tối thiểu trong khoảng thời gian
        let preprocessTransactions = function (inputTransactions) {
            inputTransactions = inputTransactions.filter(x => x.CD == "+");
            inputTransactions = inputTransactions.map(x => {
                return {
                    sothamchieu: x.Reference.replace(" - ", ""),
                    ngay: x.TransactionDate,
                    noidung: x.Description,
                    sotien: x.Amount
                }
            })
            return inputTransactions;
        }

        transactions = preprocessTransactions(transactions);
        let systemUsers = await sails.dataProcess.find(Users, { condition: {}, orderBy: { createdAt: "ASC" } });

        // Lấy toàn bộ Transaction để check
        let filterTransactions = {
            condition: {
                method: "DEPOSIT",
            },
            limit: 999,
            page: 1,
            orderBy: [
                { createdAt: 'DESC' }
            ],
        }

        var transactionPaging = await sails.dataProcess.getListDataFromModel(Transaction, filterTransactions);
        var existedTransactions = transactionPaging.data;

        // Lấy thông tin Sale => Khuyến mãi nạp tiền
        let filterSale = {
            condition: {
                saleConfig: true
            },
            limit: 1,
            page: 1,
            orderBy: [
                { createdAt: 'DESC' }
            ],
        }
        let saleConfigs = await sails.dataProcess.find(SaleConfig, filterSale)
        let saleConfigData = null;
        if (saleConfigs && saleConfigs.length) {
            saleConfigs = saleConfigs.sort(function (a, b) { return b.createdAt - a.createdAt });
            saleConfigData = saleConfigs[0];
        }

        if (!transactions || !transactions.length) {
            var filePath = sails.path.resolve('..', '', "transactions.txt");
            fs.readFile(filePath, 'utf-8', (err, data) => {
                if (err) { };
                try {
                    transactions = JSON.parse(data);
                } catch (error) { }

                if (!transactions || !transactions.transactions || !transactions.transactions.length) {
                    return;
                }
                transactions = preprocessTransactions(transactions.transactions);

                Promise.all(
                    transactions.map(transaction => {
                        if (existedTransactions.filter(x => x.transactionId == transaction.sothamchieu).length) return;

                        var userDeposits = systemUsers.filter((x) => transaction.noidung.toLowerCase().indexOf(x.depositHash.toLowerCase()) > 0);
                        if (!userDeposits.length) return;

                        var userDeposit = userDeposits[0];
                        var depositInfo = {
                            phone: `${userDeposit.phone ? ('0' + userDeposit.phone) : ""}`,
                            userId: userDeposit.id,
                            User: userDeposit,
                            giaodich: transaction
                        }

                        return sails.BankServices.process_payment(depositInfo, saleConfigData);
                    })
                ).then((res) => {

                }).catch((err) => {
                    console.log("Lỗi tạo giao dịch nạp tiền ===> ");
                    console.log(err);
                })

            });
        } else {
            Promise.all(
                transactions.map(transaction => {
                    if (existedTransactions.filter(x => x.transactionId == transaction.sothamchieu).length) return;

                    var userDeposits = systemUsers.filter((x) => transaction.noidung.toLowerCase().indexOf(x.depositHash.toLowerCase()) > 0);
                    if (!userDeposits.length) return;

                    var userDeposit = userDeposits[0];
                    var depositInfo = {
                        phone: `${userDeposit.phone ? ('0' + userDeposit.phone) : ""}`,
                        userId: userDeposit.id,
                        User: userDeposit,
                        giaodich: transaction
                    }

                    return sails.BankServices.process_payment(depositInfo, saleConfigData);
                })
            ).then((res) => {

            }).catch((err) => {
                console.log("Lỗi tạo giao dịch nạp tiền ===> ");
                console.log(err);
            })
        }
    }
}
