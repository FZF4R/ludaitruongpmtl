/**
 * Seed Function
 * (sails.config.bootstrap)
 *
 * A function that runs just before your Sails app gets lifted.
 * > Need more flexibility?  You can also create a hook.
 *
 * For more information on seeding your app with fake data, check out:
 * https://sailsjs.com/config/bootstrap
 */

module.exports.bootstrap = async function() {
    // // Register hook to clear sails.sid cookie after Express is loaded
    // sails.on('hook:express:loaded', function() {
    //     // Add middleware to completely remove sails.sid cookie on every response
    //     sails.hooks.http.app.use(function(req, res, next) {
    //         // Completely remove the sails.sid cookie if it exists
    //         res.clearCookie('sails.sid', {
    //             path: '/',
    //             httpOnly: true,
    //             secure: true,
    //             sameSite: 'strict',
    //             maxAge: 0,
    //             expires: new Date(0)
    //         });
    //         return next();
    //     });
    // });

    const moment = require('moment-timezone')
    const crypto = require('crypto')
    const jwtEcnrypter = require('jwt-token-encrypt');
    const UserRelate = require('../api/controllers/BusinessProcess/UserRelate')
    const BotTelegramService = require('../api/controllers/BusinessProcess/BotTelegramService')
    const ProductService = require('../api/controllers/BusinessProcess/ProductService')
    const DataProcess = require('../api/utils/dataProcess')
    const ErrorOutput = require('../api/utils/errorOutput')
    const jwtProcesser = require('../api/controllers/BusinessProcess/jwtProcess')
    const CloneServices = require('../api/controllers/BusinessProcess/Clone/CloneServices')
    const CategoryRelate = require('../api/controllers/BusinessProcess/CategoryRelate')
    const BankServices = require('../api/controllers/BusinessProcess/Bank/BankServices')
    const Ultils = require('../api/utils/Ultils')
    const CategoryService = require('../api/controllers/BusinessProcess/CategoryService')

    sails.Ultils = new Ultils()
    sails.path = require('path')
    sails.fs = require('fs')
    sails.jwtEcnrypter = jwtEcnrypter
    sails.jwtProcess = new jwtProcesser()
    sails.UserRelate = new UserRelate();
    sails.BotTelegramService = new BotTelegramService()
    sails.checkErrorOutput = new ErrorOutput().checkErrorOutput
    sails.dataProcess = new DataProcess()
    sails.ProductService = new ProductService()
    sails.objectId = require('mongodb').ObjectID
    sails.PromiseMap = require('bluebird').map
    sails.moment = moment
    sails.crypto = crypto
    sails.CloneServices = new CloneServices()
    sails.CategoryRelate = new CategoryRelate()
    sails.BankServices = new BankServices()
    sails.CategoryService = new CategoryService()

    sails.ID_CONFIG = "111111111111111111111111";
    sails.SERVICE_ID = "333333333333333333333333";
    sails.PUBLIC_ID = "000000000000000000000000";
    sails.CategoryService.initCronJob();
    sails.Ultils.initSecretaryTeleBot();
};
