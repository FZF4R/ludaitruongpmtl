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
    'GET  /v1/public/about': 'System.Public.PublicController.getAbout',
    'GET  /v1/public/settings/warning': 'System.Public.PublicController.getSystemWarning',

    //==== Noi dung (khong can dang nhap) =====
    // '/content/list' PHAI dung truoc '/content/:slug', neu khong thi chuoi
    // 'list' se roi vao :slug va khong bao gio goi duoc danh sach.
    'GET  /v1/public/content/list': 'System.Public.ContentController.listContent',
    // Phai dung truoc '/content/:slug' (cung ly do voi '/content/list').
    'POST /v1/public/content/view': 'System.Public.ContentController.addView',
    'GET  /v1/public/content/related': 'System.Public.ContentController.relatedContent',
    'GET  /v1/public/content/:slug': 'System.Public.ContentController.getContentBySlug',
    'GET  /v1/public/search': 'System.Public.ContentController.search',
    'GET  /v1/public/category/tree': 'System.Public.ContentController.categoryTree',
    'GET  /v1/public/calendar': 'System.Public.ContentController.calendar',
    'GET  /v1/public/slugs': 'System.Public.ContentController.slugs',
    // Chu giao dien admin da sua truc tiep tren trang, theo ngon ngu.
    'GET  /v1/public/texts': 'System.Public.SiteTextController.getTexts',
    'GET  /v1/public/comments': 'System.Public.CommentController.listComments',
    'GET  /v1/public/prayers': 'System.Public.PrayerController.listPrayers',
    'GET  /v1/public/prayers/featured': 'System.Public.PrayerController.listFeatured',
    // Am thanh cho cac cong cu tu tap (/tu-tap/*).
    'GET  /v1/public/sounds': 'System.Public.SoundController.listSounds',
    'GET  /v1/public/sounds/:id/file': 'System.Public.SoundController.getFile',
    // Tep nguoi dung tai len (anh, am thanh trong bai viet / thu vien).
    'GET  /v1/public/media/:id/file': 'System.Public.MediaController.getFile',
    // Thong tin ung ho (QR) hien o trang thong ke nguoi dung.
    'GET  /v1/public/donate': 'System.Public.DonateController.getDonate',
    // Su kien theo ngay duong (lich trang chu / Phat lich).
    'GET  /v1/public/day-events': 'System.Public.DayEventController.listEvents',
    'GET  /v1/public/donate/qr': 'System.Public.DonateController.getQr',
    // De xuat & gop y tu trang chu (khong can dang nhap).
    'POST /v1/public/feedback': 'System.Public.FeedbackController.sendFeedback',
    'GET  /v1/public/avatar/:userId': 'System.Public.AvatarController.getFile',
    // Anh xoay vong trang chu: danh sach + noi dung tung anh.
    'GET  /v1/public/hero-images': 'System.Public.HeroImageController.listImages',
    'GET  /v1/public/hero-images/:id/file': 'System.Public.HeroImageController.getFile',

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
    // Binh luan bai viet (doc thi o /v1/public/comments).
    'POST /v1/user/comments': 'System.Users.CommentController.addComment',
    'POST /v1/user/comments/delete': 'System.Users.CommentController.deleteComment',
    // Thong bao rieng (binh luan moi o bai cua minh, co nguoi tra loi minh).
    'GET  /v1/user/notifications': 'System.Users.NotificationController.listNotifications',
    'POST /v1/user/notifications/read': 'System.Users.NotificationController.markRead',
    // Cau an / cau sieu: moi nguoi toi da 3 loi moi ngay.
    'GET  /v1/user/prayers/list': 'System.Users.PrayerController.listMine',
    // Nhat ky tu tap (trang Qua trinh tu tap).
    'POST /v1/user/practice/log': 'System.Users.PracticeController.addLog',
    'GET  /v1/user/practice/stats': 'System.Users.PracticeController.getStats',
    'POST /v1/user/practice/session': 'System.Users.PracticeController.startSession',
    'GET  /v1/user/practice/presets': 'System.Users.PracticeController.listPresets',
    'POST /v1/user/practice/presets/save': 'System.Users.PracticeController.savePreset',
    'POST /v1/user/practice/presets/delete': 'System.Users.PracticeController.deletePreset',
    // Bai viet cua toi: soan, gui duyet, tra loi de xuat sua.
    'GET  /v1/user/content/mine': 'System.Users.ContentController.listMine',
    'GET  /v1/user/content/detail': 'System.Users.ContentController.getMine',
    'POST /v1/user/content/save': 'System.Users.ContentController.saveMine',
    'POST /v1/user/content/delete': 'System.Users.ContentController.deleteMine',
    'POST /v1/user/content/proposal/accept': 'System.Users.ContentController.acceptProposal',
    'POST /v1/user/content/proposal/reject': 'System.Users.ContentController.rejectProposal',
    'POST /v1/user/media/upload': 'System.Users.MediaController.upload',
    // Cong duc + thong ke ca nhan.
    'POST /v1/user/checkin': 'System.Users.MeritController.checkin',
    'GET  /v1/user/stats': 'System.Users.MeritController.getStats',
    // Noi dung binh luan da xoa (kiem duyet vien).
    'GET  /v1/user/comments/deleted': 'System.Users.CommentController.getDeleted',
    'POST /v1/user/comments/report': 'System.Users.CommentController.reportComment',
    'GET  /v1/user/merit/days': 'System.Users.MeritController.getDays',
    'POST /v1/user/prayers': 'System.Users.PrayerController.addPrayer',
    'POST /v1/user/prayers/delete': 'System.Users.PrayerController.deletePrayer',

    //==== Admin =====
    'GET  /v1/admin/user/list': 'System.Admin.UsersController.getListUser',
    'GET  /v1/admin/user/detail': 'System.Admin.UsersController.getUserDetail',
    'POST /v1/admin/user/update': 'System.Admin.UsersController.updateUser',
    'POST /v1/admin/user/changepass': 'System.Admin.UsersController.changePass',

    //==== Am thanh tu tap =====
    'GET  /v1/admin/sounds': 'System.Admin.SoundController.listAll',
    'POST /v1/admin/sounds/add': 'System.Admin.SoundController.addSound',
    'POST /v1/admin/sounds/update': 'System.Admin.SoundController.updateSound',
    'POST /v1/admin/sounds/delete': 'System.Admin.SoundController.deleteSound',
    'POST /v1/admin/sounds/reorder': 'System.Admin.SoundController.reorderSounds',

    //==== Tu cam mac dinh (chi tai khoan chu - xem BannedWordsController) =====
    'GET  /v1/admin/banned-words/default': 'System.Admin.BannedWordsController.getDefault',
    'POST /v1/admin/banned-words/default': 'System.Admin.BannedWordsController.saveDefault',

    //==== Cong duc: bang diem, ung ho =====
    'GET  /v1/admin/merit': 'System.Admin.MeritController.getMerit',
    'POST /v1/admin/merit/rules': 'System.Admin.MeritController.saveRules',
    'POST /v1/admin/merit/donate': 'System.Admin.MeritController.saveDonate',
    'POST /v1/admin/merit/greetings': 'System.Admin.MeritController.saveGreetings',

    //==== Loi nguyen noi bat (slideshow trang chu) =====
    'POST /v1/admin/prayers/feature': 'System.Admin.PrayerController.setFeatured',

    //==== De xuat & gop y =====
    'GET  /v1/admin/feedback': 'System.Admin.FeedbackController.listFeedback',
    'POST /v1/admin/feedback/status': 'System.Admin.FeedbackController.setStatus',

    //==== Kiem duyet binh luan vi pham, canh cao / khoa tai khoan =====
    'GET  /v1/admin/moderation/comments': 'System.Admin.ModerationController.listFlagged',
    'POST /v1/admin/moderation/comments/delete': 'System.Admin.ModerationController.deleteComment',
    'GET  /v1/admin/moderation/user': 'System.Admin.ModerationController.userInfo',
    'POST /v1/admin/moderation/warn': 'System.Admin.ModerationController.warnUser',
    'POST /v1/admin/moderation/ban': 'System.Admin.ModerationController.banUser',
    'POST /v1/admin/moderation/unwarn': 'System.Admin.ModerationController.unwarnUser',

    //==== Phe duyet: binh luan / loi nguyen chua tu cam =====
    'GET  /v1/admin/approval': 'System.Admin.ApprovalController.listPending',
    // So viec dang cho tren thanh tab Khu quan tri.
    'GET  /v1/admin/badges': 'System.Admin.BadgeController.getBadges',
    // Toan bo hoat dong mot tai khoan (trang /admin/user/hoat-dong).
    'GET  /v1/admin/user/activity': 'System.Admin.UserActivityController.getActivity',
    'GET  /v1/admin/approval/reports': 'System.Admin.ApprovalController.listReports',
    'POST /v1/admin/approval/reports/handle': 'System.Admin.ApprovalController.handleReport',
    'POST /v1/admin/approval/approve': 'System.Admin.ApprovalController.approve',
    'POST /v1/admin/approval/reject': 'System.Admin.ApprovalController.reject',

    //==== Thong bao toan bo nguoi dung =====
    'GET  /v1/admin/broadcast': 'System.Admin.BroadcastController.list',
    'POST /v1/admin/broadcast/send': 'System.Admin.BroadcastController.send',

    //==== Su kien theo ngay tren lich =====
    'POST /v1/admin/day-events/save': 'System.Admin.DayEventController.saveEvent',
    'POST /v1/admin/day-events/delete': 'System.Admin.DayEventController.deleteEvent',
    'POST /v1/admin/moderation/unban': 'System.Admin.ModerationController.unbanUser',

    //==== Anh xoay vong trang chu =====
    'POST /v1/admin/hero-images/add': 'System.Admin.HeroImageController.addImage',
    'POST /v1/admin/hero-images/delete': 'System.Admin.HeroImageController.deleteImage',
    'POST /v1/admin/hero-images/reorder': 'System.Admin.HeroImageController.reorderImages',

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
    'GET  /v1/admin/content/history': 'System.Admin.ContentController.getHistory',
    'GET  /v1/admin/content/people': 'System.Admin.ContentController.searchPeople',
    'GET  /v1/admin/content/revision': 'System.Admin.ContentController.getRevision',
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
