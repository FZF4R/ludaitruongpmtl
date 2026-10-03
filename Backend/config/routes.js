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
    //==== Public (khong can dang nhap) =====
    'POST /v1/public/healthserver': 'System.Public.PublicController.checkHealth',
    'GET  /v1/public/notify': 'System.Public.PublicController.getNotify',
    'GET  /v1/public/get2fa': 'System.Public.PublicController.get2FA',
    'GET  /v1/public/settings': 'System.Public.PublicController.getSettings',
    'GET  /v1/public/settings/warning': 'System.Public.PublicController.getSystemWarning',

    //==== Noi dung (khong can dang nhap) =====
    // '/content/list' PHAI dung truoc '/content/:slug', neu khong thi chuoi
    // 'list' se roi vao :slug va khong bao gio goi duoc danh sach.
    'GET  /v1/public/content/list': 'System.Public.ContentController.listContent',
    'GET  /v1/public/content/:slug': 'System.Public.ContentController.getContentBySlug',
    'GET  /v1/public/search': 'System.Public.ContentController.search',
    'GET  /v1/public/category/tree': 'System.Public.ContentController.categoryTree',
    'GET  /v1/public/calendar': 'System.Public.ContentController.calendar',
    'GET  /v1/public/slugs': 'System.Public.ContentController.slugs',
    // Chu giao dien admin da sua truc tiep tren trang, theo ngon ngu.
    'GET  /v1/public/texts': 'System.Public.SiteTextController.getTexts',

    //==== Auth =====
    'POST /v1/user/login': 'System.Users.UsersController.login',
    'POST /v1/user/login/google': 'System.Users.UsersController.loginGoogle',
    'POST /v1/user/login/facebook': 'System.Users.UsersController.loginFacebook',
    'POST /v1/user/register': 'System.Users.UsersController.register',
    'POST /v1/user/verify2FA': 'System.Users.UsersController.verify2FA',

    //==== User (yeu cau token) =====
    'GET  /v1/user/detail': 'System.Users.UsersController.getUserInfo',
    // Ho so Phat tu + khao sat tu tap, dien sau lan dang nhap dau tien.
    'GET  /v1/user/profile': 'System.Users.UsersController.getProfile',
    'POST /v1/user/profile': 'System.Users.UsersController.saveProfile',
    'POST /v1/user/updateinfo': 'System.Users.UsersController.updateinfo',
    'POST /v1/user/updatepassword': 'System.Users.UsersController.updatepassword',
    'POST /v1/user/avatar': 'System.Users.UsersController.uploadAvatar',
    'POST /v1/user/update2FA': 'System.Users.UsersController.update2FA',
    'POST /v1/user/generateQRCode': 'System.Users.UsersController.generateQRCode',

    //==== Admin =====
    'GET  /v1/admin/user/list': 'System.Admin.UsersController.getListUser',
    'GET  /v1/admin/user/detail': 'System.Admin.UsersController.getUserDetail',
    'POST /v1/admin/user/update': 'System.Admin.UsersController.updateUser',
    'POST /v1/admin/user/changepass': 'System.Admin.UsersController.changePass',

    //==== Sua chu giao dien ngay tren trang =====
    'POST /v1/admin/texts/update': 'System.Admin.SiteTextController.updateText',

    //==== Phan quyen: chinh quyen cua tung vai tro =====
    'GET  /v1/admin/roles/permissions': 'System.Admin.RolesController.getPermissions',
    'POST /v1/admin/roles/permissions/update': 'System.Admin.RolesController.updatePermissions',
    'POST /v1/admin/roles/permissions/reset': 'System.Admin.RolesController.resetPermissions',

    'GET  /v1/admin/settings': 'System.Admin.SystemController.getSettings',
    'POST /v1/admin/settings/update': 'System.Admin.UsersController.updateSettings',
    'POST /v1/admin/settings/updateServiceMaintain': 'System.Admin.UsersController.updateServiceMaintain',
    // Dai thong bao dau trang chu: them / sua / xoa tung cau.
    'POST /v1/admin/settings/notify/add': 'System.Admin.SystemController.addSettingNotify',
    'POST /v1/admin/settings/notify/update': 'System.Admin.SystemController.updateSettingNotify',
    'POST /v1/admin/settings/notify/delete': 'System.Admin.SystemController.deleteSettingNotify',

    //==== Quan tri noi dung (bai viet + kinh sach, chung mot bang Content) ====
    // '/content/list' va cac duong dan chu PHAI dung truoc bat ky route :param nao.
    'GET  /v1/admin/content/list': 'System.Admin.ContentController.listContent',
    'GET  /v1/admin/content/detail': 'System.Admin.ContentController.getContent',
    'GET  /v1/admin/content/categories': 'System.Admin.ContentController.listCategories',
    'POST /v1/admin/content/create': 'System.Admin.ContentController.createContent',
    'POST /v1/admin/content/update': 'System.Admin.ContentController.updateContent',
    'POST /v1/admin/content/status': 'System.Admin.ContentController.setStatus',
    'POST /v1/admin/content/delete': 'System.Admin.ContentController.deleteContent',

    'GET  /v1/admin/notify': 'System.Admin.SystemController.getListNotify',
    'POST /v1/admin/notify/add': 'System.Admin.SystemController.addNotify',
    'POST /v1/admin/notify/edit': 'System.Admin.SystemController.updateNotify',
    'POST /v1/admin/notify/delete': 'System.Admin.SystemController.deleteNotify',

    'GET  /v1/admin/systemsetting/supportInfo': 'System.Admin.SystemController.getSupportInfo',
    'POST /v1/admin/systemsetting/supportinfo/update': 'System.Admin.SystemController.updateSupportInfo',
};
