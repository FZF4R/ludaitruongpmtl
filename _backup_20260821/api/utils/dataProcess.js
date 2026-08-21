module.exports = class dataProcess {
    createDocument(processModel = '', newDocument) {
        return new Promise((resolve, reject) => {
            processModel.create(newDocument).intercept('E_UNIQUE', (err) => {
                /* Hanlder Duplication Error */
                if (err.raw.message.includes('usernameAlreadyInUse')) {
                    err.message = 'usernameAlreadyInUse';
                    err.messageNode = 'Users'
                }
                return err
            }).fetch().then(function(objectCreated) {
                resolve(objectCreated);
            }).catch(function(err) {
                reject(err);
            });
        });
    }
    findOne(processModel = '', { condition, selectCols, populate }) {
        return new Promise((resolve, reject) => {
            var FilterQuery = {
                where: condition
            }
            if (selectCols && selectCols.length) {
                FilterQuery.select = selectCols
            }
            var query = processModel.findOne(FilterQuery);
            if (populate && populate.pipeline) {
                populate.pipeline.forEach((item) => {
                    query = query.populate(item.by, { select: item.selectCols })
                })
            }
            query.meta({ enableExperimentalDeepTargets: true }).then((result) => {
                resolve(result)
            }).catch((err) => {
                reject(err);
            });
        });
    }
    find(processModel = '', { condition, selectCols, populate }) {
        return new Promise((resolve, reject) => {
            var FilterQuery = {
                where: condition
            }
            if (selectCols && selectCols.length) {
                FilterQuery.select = selectCols
            }
            var query = processModel.find(FilterQuery);
            if (populate && populate.pipeline) {
                populate.pipeline.forEach((item) => {
                    query = query.populate(item.by, { select: item.selectCols })
                })
            }
            query.meta({ enableExperimentalDeepTargets: true }).then((result) => {
                resolve(result)
            }).catch((err) => {
                reject(err);
            });
        });
    }
    updateDocument(processModel = '', { condition, updateObject }) {
        return new Promise((resolve, reject) => {
            processModel.updateOne(condition).set(updateObject).then(function(result) {
                resolve(result)
            }).catch(function(err) {
                reject(err);
            });

        });
    }
    updateManyDocument(processModel = '', { condition, updateObject }) {
        return new Promise((resolve, reject) => {
            processModel.update(condition).set(updateObject).then(function(result) {
                resolve(result)
            }).catch(function(err) {
                reject(err);
            });

        });
    }
    getListDataFromModel(processModel = '', { condition, limit, page, selectCols, inTime, orderBy, countOnly, populate, dateRange }) {
        return new Promise((resolve, reject) => {
            if (!limit) {
                limit = 20
            }
            if (!page) {
                page = 1
            }
            var limitFromRequest = limit != 0 ? limit : limit;
            var pageFromRequest = (page != 0 && page != 1) ? (page - 1) * limitFromRequest : page - 1;
            var objectCondition = {
                skip: pageFromRequest,
                limit: limitFromRequest,
                where: condition,

            };
            if (selectCols) {
                Object.assign(objectCondition, { select: selectCols });
            }
            if (inTime) {
                /* this condition will filter time ranger by inTime Condition.
                 example : { time: 'day', field: 'createdAt' }
                 */
                var timeFilter = {
                    fromTime: '',
                    toTime: ''
                }
                timeFilter.fromTime = sails.moment().startOf(inTime.time).valueOf()
                timeFilter.toTime = sails.moment().endOf(inTime.time).valueOf()
                var timeFilterObject = {}
                timeFilterObject[inTime.field] = {
                    '>=': timeFilter.fromTime,
                    '<=': timeFilter.toTime
                }
                objectCondition.where = Object.assign(objectCondition.where, timeFilterObject)
            } else if (dateRange) {
                var timeFilter = {
                    fromTime: '',
                    toTime: ''
                }
                timeFilterObject = {}
                timeFilterObject[dateRange.field] = {}

                if (dateRange.from) {
                    timeFilterObject[dateRange.field]['>='] = dateRange.from
                }
                if (dateRange.to) {
                    timeFilterObject[dateRange.field]['<='] = dateRange.to
                }
                objectCondition.where = Object.assign(objectCondition.where, timeFilterObject)

            }
            var count = 0
            processModel.count(condition).then((totalCount) => {
                if (totalCount) {
                    count = totalCount
                }
                if (countOnly) {
                    return count
                }
                var query = processModel.find(objectCondition)
                if (orderBy && orderBy.length) {
                    query.sort(orderBy);
                }
                if (populate) {
                    if (!populate.selectCols) {
                        populate.selectCols = ["*"]
                    }
                    var conditionSelectPopulate = { select: populate.selectCols }
                    if (populate.condition) {
                        conditionSelectPopulate.where = populate.condition
                    }
                    query.populate(populate.by, conditionSelectPopulate)
                }
                return query
            }).then((listRaw) => {
                if (countOnly) {
                    resolve({
                        total: count
                    });
                } else {
                    var objectListRaw = this.createTableObject(page, listRaw, count);
                    resolve(objectListRaw);
                }
            }).catch((err) => {
                reject(err);
            });
        })
    }
    createTableObject(page, listData, count) {
        var objectListData = {
            Page: page,
            total: count,
            TotalInList: listData.length,
            data: listData
        }

        return objectListData;
    }
    increment(processModel, { condition, incrementDetail }) {
        return new Promise((resolve, reject) => {
            var processAdapter = processModel.getDatastore().manager;
            var rawCollection = processAdapter.collection(processModel.tableName);
            var filter = condition
            if (filter.id) {
                filter._id = sails.objectId(filter.id)
                delete filter.id
            }
            rawCollection.findOneAndUpdate(filter, { $inc: incrementDetail }).then((result) => {
                if (result && result.lastErrorObject && result.lastErrorObject.n && result.lastErrorObject.n == 1) {
                    resolve(true)
                } else {
                    return Promise.reject()
                }
            }).catch((err) => {
                reject(err)
            });

        });
    }
    updateNative(processModel = '', condition = {}, updateObject = {}) {
        if (condition && condition.id) {
            condition._id = sails.objectId(condition.id)
            delete condition.id
        }
        return new Promise((resolve, reject) => {
            let processAdapter = processModel.getDatastore().manager;
            let rawCollection = processAdapter.collection(processModel.tableName);
            rawCollection.update(condition, updateObject).then((result) => {
                resolve(result)
            }).catch((err) => {
                reject(err)
            });
        });
    }
    getListDataNative(processModel, { condition, selectCols, limit = 25, page = 1, sort = { createdAt: -1 }, inTime }) {
        return new Promise((resolve, reject) => {
            let processAdapter = processModel.getDatastore().manager;
            let rawCollection = processAdapter.collection(processModel.tableName);
            let from = limit * (page - 1)
            let listRaw
            if (inTime && inTime['from'] && inTime['to']) {
                var start = sails.moment(inTime['from'], 'DD-MM-YYYY').startOf('day').valueOf();
                var end = sails.moment(inTime['to'], 'DD-MM-YYYY').endOf('day').valueOf();
                let objectTimeFilter = {
                    createdAt: {
                        $gte: start,
                        $lte: end
                    }
                }
                condition = {...condition, ...objectTimeFilter }
            }
            rawCollection.find(condition, selectCols).skip(from).limit(limit).sort(sort).toArray().then((result) => {
                listRaw = result
                return rawCollection.find(condition).count()
            }).then((count) => {
                var objectListRaw = this.createTableObject(page, listRaw, count);
                resolve(objectListRaw);
            }).catch((err) => {
                reject(err)
            });
        });
    }
    removeDocument(processModel = '', condition = '') {
        return new Promise((resolve, reject) => {
            processModel.destroy(condition).fetch().then(function(removedDoc) {
                resolve({
                    successRemove: removedDoc.length,
                });
            }).catch(function(err) {
                reject(err);
            });
        })
    };
}