const Promise = require('bluebird')
module.exports = class CategoryRelate {
    getListGroupByCategory(categoryId) {
        return new Promise(async(resolve, reject) => {
            sails.dataProcess.find(Group, { condition: { category: categoryId } }).then((result) => {
                return Promise.map(result, async(val) => {
                    let arr = val
                    let total = await Clone.count().where({ isSell: true, groupId: val.id })
                    let inStock = await Clone.count('isSell').where({ isSell: false, groupId: val.id })
                    let countSell = await Clone.count('isSell').where({ isSell: true, groupId: val.id })
                    let totalSell = await Clone.sum('balance').where({ isSell: true, groupId: val.id })
                    arr.total = total
                    arr.inStock = inStock
                    arr.totalSell = totalSell
                    arr.countSell = countSell
                    return arr
                })
            }).then((result) => {
                resolve(result)
            }).catch((err) => {
                reject(err)
            });

        })
    }
    getListGroupPublicByCategory(categoryId) {
        return new Promise(async(resolve, reject) => {
            sails.dataProcess.find(Group, { condition: { category: categoryId } }).then((result) => {
                return Promise.map(result, async(val) => {
                    let arr = val
                    let total = await Clone.count().where({ isSell: true, groupId: val.id })
                    let count = await Clone.count('isSell').where({ isSell: false, groupId: val.id })
                    arr.total = total
                    arr.count = count
                    return arr
                })
            }).then((result) => {
                resolve(result)
            }).catch((err) => {
                reject(err)
            });

        })
    }
}
