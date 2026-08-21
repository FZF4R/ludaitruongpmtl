/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes tell Sails what to do each time it receives a request.
 *
 * For more information on configuring custom routes, check out:
 * https://sailsjs.com/anatomy/config/routes-js
 */

module.exports.routes = {
    //====API Public=====
    // 'GET  /v1/public/productcategory/list': 'System.Public.PublicController.getListProductCategory',
    // 'GET  /v1/public/category/list': 'System.Public.PublicController.getListCategory',

    // 'GET  /v1/public/partnerproductcategory/list': 'System.Public.PublicController.getPartnerListProductCategory',
    // 'GET  /v1/public/partnercategory/list': 'System.Public.PublicController.getPartnerListCategory',

    'GET  /v2/public/productcategory/list': 'System.Public.PublicController.getListProductCategoryV2',
    'GET  /v2/public/productcategory/all': 'System.Public.PublicController.getAllProductCategoryV2',

    'GET  /v1/public/config': 'System.Public.PublicController.getConfig',
    'GET  /v1/public/notify': 'System.Public.PublicController.getNotify',
    'GET  /v1/public/get2fa': 'System.Public.PublicController.get2FA',
    'GET  /v1/public/settings': 'System.Public.PublicController.getSettings',
    'GET  /v1/public/settings/warning': 'System.Public.PublicController.getSystemWarning',
    'GET  /v1/public/servicesettings': 'System.Public.PublicController.getServiceSettings',
    'GET  /v1/public/integrates': 'System.Public.PublicController.getIntegrateServicesByType',
    'POST  /v1/public/healthserver': 'System.Public.PublicController.checkHealth',


    //==== User =====
    'GET  /v1/user/detail': 'System.Users.UsersController.getUserInfo',
    'GET  /v1/user/transaction': 'System.Users.UsersController.getUserTransaction',
    'GET  /v1/user/download': 'System.Users.UsersController.downloadUserFile',
    'GET  /v1/user/downloadBackup': 'System.Users.UsersController.downloadUserBackupFile',
    'GET  /v1/user/tutshare/list': 'System.Users.UsersController.getListTutShare',
    'GET  /v1/user/notify': 'System.Users.UsersController.getAllNotify',
    'POST  /v1/user/tutshare/viewed': 'System.Users.UsersController.markViewTUT',
    'POST  /v1/user/notify/viewed': 'System.Users.UsersController.markViewedNotification',
    'POST  /v1/user/tutshare/updatecomment': 'System.Users.UsersController.updateComment',
    'POST  /v1/user/update2FA': 'System.Users.UsersController.update2FA',
    'POST  /v1/user/generateQRCode': 'System.Users.UsersController.generateQRCode',
    'POST  /v1/user/verify2FA': 'System.Users.UsersController.verify2FA',
    'GET  /v1/user/setting/walletinfo': 'System.Users.UsersController.getWalletInfo',
    'POST  /v1/user/usdt/deposit': 'System.Users.UsersController.depositUsdt',

    'POST  /v1/user/login': 'System.Users.UsersController.login',
    'POST  /v1/user/login/google': 'System.Users.UsersController.loginGoogle',
    'POST  /v1/user/login/facebook': 'System.Users.UsersController.loginFacebook',
    'POST  /v1/user/buy': 'System.Users.UsersController.buyClone',
    'POST  /v1/user/updatepassword': 'System.Users.UsersController.updatepassword',

    'POST  /v1/user/product/markdie': 'System.Users.UsersController.markDieProducts',
    'POST  /v1/user/product/live/download': 'System.Users.UsersController.downloadLiveAccounts',
    'POST  /v1/user/category/product/alluid': 'System.Users.UsersController.getAllUidCategoryProduct',

    'POST  /v1/user/register': 'System.Users.UsersController.register',
    'POST  /v1/user/deleteFile': 'System.Users.UsersController.hideFile',
    'POST  /v1/user/downloadBackup': 'System.Users.UsersController.downloadListBackup',
    'POST  /v1/user/updateinfo': 'System.Users.UsersController.updateinfo',
    'POST  /v1/user/avatar': 'System.Users.UsersController.uploadAvatar',
    'POST  /v1/user/apikey/generate': 'System.Users.UsersController.generateApiKey',

    //==== Admin =====
    'GET  /v1/admin/config': 'System.Admin.SystemController.getConfig',
    'GET  /v1/admin/getReport': 'System.Admin.SystemController.getReport',
    'GET  /v1/admin/user/list': 'System.Admin.UsersController.getListUser',
    'GET  /v1/admin/user/buyhistory': 'System.Admin.UsersController.buyHistory',
    'GET  /v1/admin/saleConfig': 'System.Admin.SystemController.getSaleConfig',
    'POST  /v1/admin/saleConfig': 'System.Admin.SystemController.updateSale',
    'POST  /v1/admin/user/coin': 'System.Admin.UsersController.incrementCoin',
    'POST  /v1/admin/user/changepass': 'System.Admin.UsersController.changePass',
    'POST  /v1/admin/user/ref': 'System.Admin.UsersController.updateRef',
    'POST  /v1/admin/user/checkbug': 'System.Admin.UsersController.checkBug',
    'POST  /v1/admin/settings/update': 'System.Admin.UsersController.updateSettings',
    'POST  /v1/admin/settings/updateServiceMaintain': 'System.Admin.UsersController.updateServiceMaintain',
    'POST  /v1/admin/settings/banking': 'System.Admin.UsersController.banking',
    'POST  /v1/admin/settings/syncproduct': 'System.Admin.UsersController.syncproduct',
    'POST  /v1/admin/settings/syncservice': 'System.Admin.UsersController.syncservice',
    'GET   /v1/admin/settings/syncproduct': 'System.Admin.UsersController.getsyncproduct',
    'GET   /v1/admin/systemsetting/supportInfo': 'System.Admin.SystemController.getSupportInfo',
    'POST  /v1/admin/systemsetting/supportinfo/update': 'System.Admin.SystemController.updateSupportInfo',
    'POST  /v1/admin/user/getinfo': 'System.Admin.UsersController.getInfo',
    'GET  /v1/admin/transaction': 'System.Admin.UsersController.getTransaction',
    'POST  /v1/admin/transaction/totalInfo': 'System.Admin.UsersController.transactionSummary',
    'POST  /v1/admin/transaction/delete': 'System.Admin.SystemController.deleteTransaction',
    'POST  /v1/admin/user/summaryInfo': 'System.Admin.UsersController.userSummary',
    'POST  /v1/admin/file/save': 'System.Admin.UsersController.saveFile',
    'GET  /v1/admin/product/die/list': 'System.Admin.ProductController.productDieList',
    'POST  /v1/admin/product/die/download': 'System.Admin.ProductController.productDieDownload',
    'POST  /v1/admin/product/die/deleteall': 'System.Admin.ProductController.deleteAllDieAccount',
    'POST  /v1/admin/product/notsold/download': 'System.Admin.ProductController.productNotSellDownload',
    'GET  /v1/admin/downloadDieAccounts': 'System.Admin.ProductController.downloadDieAccounts',
    'GET  /v1/admin/transactionconfig': 'System.Admin.SystemController.getTransactionConfig',

    // API tích hợp website
    'GET  /v1/admin/partnercategory/list': 'System.Admin.CategoryController.getListPartnerCategory',
    'GET  /v1/admin/partnerproductcategory/list': 'System.Admin.SystemController.getListPartnerProductCategory',
    'POST  /v1/admin/partnertransaction/list': 'System.Admin.SystemController.getListPartnerTransaction',
    'POST  /v1/admin/partnerproductcategory/create': 'System.Admin.SystemController.addPartnerProductCategory',
    'POST  /v1/admin/partnerproductcategory/update': 'System.Admin.SystemController.updatePartnerProductCategory',
    'POST  /v1/admin/partnercategory/update': 'System.Admin.SystemController.updatePartnerCategory',
    'POST  /v1/admin/partnercategory/updatemulti': 'System.Admin.CategoryController.updateMultiCategory',
    'POST  /v1/admin/partnercategory/updatemultiimg': 'System.Admin.CategoryController.updateImageCategory',
    'POST  /v1/admin/partnercategory/updateproductimg': 'System.Admin.CategoryController.updateSingleProductImage',
    'POST  /v1/admin/partnercategory/updatemultihot': 'System.Admin.CategoryController.updateHotCategory',
    'POST  /v1/admin/partnercategory/updatemultihidden': 'System.Admin.CategoryController.updateHiddenCategory',
    'POST  /v1/admin/partnercategory/updatemultiname': 'System.Admin.CategoryController.updateNameCategory',
    'POST  /v1/admin/partnercategory/updatemuiltipay': 'System.Admin.CategoryController.updatePayFirstCategory',
    'POST  /v1/admin/partnercategory/updatemulticategory': 'System.Admin.CategoryController.updateCategoryAssignment',
    'POST  /v1/admin/partnerproductcategory/multiupdate': 'System.Admin.CategoryController.updatePartnerProductCategoryFolder',
    'POST  /v1/admin/partnercategory/multidelete': 'System.Admin.SystemController.deleteMultiCategory',
    'POST  /v1/admin/partnerproductcategory/delete': 'System.Admin.SystemController.deletePartnerProductCategory',


    //Category
    'GET  /v1/admin/category/list': 'System.Admin.CategoryController.getListCategory',
    'POST  /v1/admin/category/create': 'System.Admin.CategoryController.createCategory',
    'POST  /v1/admin/category/delete': 'System.Admin.CategoryController.deleteCategory',
    'POST  /v1/admin/category/update': 'System.Admin.CategoryController.updateCategory',

    //Product
    'GET  /v1/admin/product/list': 'System.Admin.ProductController.list',
    'POST  /v1/admin/product/add': 'System.Admin.ProductController.add',
    'POST  /v1/admin/product/delete': 'System.Admin.ProductController.deleteProduct',

    //Notify
    'POST  /v1/admin/notify/add': 'System.Admin.SystemController.addNotify',
    'POST  /v1/admin/notify/edit': 'System.Admin.SystemController.updateNotify',
    'POST  /v1/admin/notify/delete': 'System.Admin.SystemController.deleteNotify',
    'GET  /v1/admin/notify': 'System.Admin.SystemController.getListNotify',

    // ProductCategory
    'GET  /v1/admin/productcategory/list': 'System.Admin.SystemController.getListProductCategory',
    'POST  /v1/admin/productcategory/add': 'System.Admin.SystemController.addProductCategory',
    'POST  /v1/admin/productcategory/delete': 'System.Admin.SystemController.deleteProductCategory',
    'POST  /v1/admin/productcategory/update': 'System.Admin.SystemController.updateProductCategory',
    'POST  /v1/admin/productcategory/updatefolder': 'System.Admin.SystemController.updateProductCategoryFolder',

    // TUT
    'POST  /v1/admin/tutshare/add': 'System.Admin.SystemController.addTutShare',
    'POST  /v1/admin/tutshare/delete': 'System.Admin.SystemController.deleteTutShare',
    'POST  /v1/admin/tutshare/update': 'System.Admin.SystemController.updateTutShare',

    // Integrate Services
    'GET  /v1/admin/integrates': 'System.Admin.SystemController.getIntegrateServices',
    'POST  /v1/admin/integrates/update': 'System.Admin.SystemController.updateIntegrateServices',

    // // API Share
    // 'GET  /v1/partner/category/list': 'System.Users.UserPartnerController.getListCategory',
    // 'GET  /v1/partner/productcategory/list': 'System.Users.UserPartnerController.getListProductCategory',
    // 'GET  /v1/partner/info': 'System.Users.UserPartnerController.getUserInfo',
    // 'GET  /v1/partner/transaction': 'System.Users.UserPartnerController.getUserTransaction',
    // 'POST  /v1/partner/buy': 'System.Users.UserPartnerController.buyCloneByFileContent',
    // 'POST  /v1/partner/transaction': 'System.Users.UserPartnerController.getUserTransactionContent',
};
