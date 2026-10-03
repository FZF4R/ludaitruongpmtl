/**
 * Policy Mappings
 * (sails.config.policies)
 *
 * Policies are simple functions which run **before** your actions.
 *
 * For more information on configuring policies, check out:
 * https://sailsjs.com/docs/concepts/policies
 */

module.exports.policies = {
    'System/Users/UsersController': {
        '*': ['userPolices'],
        login: true,
        loginGoogle: true,
        loginFacebook: true,
        register: true,
        verify2FA: true,
    },
    // Nội dung công khai: ai cũng đọc được, không cần token.
    // Khai rõ ra đây thay vì dựa vào mặc định của Sails, để đọc tệp này là
    // thấy ngay controller nào cố ý mở.
    'System/Public/ContentController': {
        '*': true
    },
    // requirePermission tra quyền trong config/permissions.js theo METHOD /đường-dẫn.
    // Phải đứng SAU userPolices - nó đọc vai trò từ req.body.User mà userPolices gán vào.
    'System/Admin/UsersController': {
        '*': ['userPolices', 'requirePermission']
    },
    'System/Admin/SystemController': {
        '*': ['userPolices', 'requirePermission']
    },
    'System/Admin/ContentController': {
        '*': ['userPolices', 'requirePermission']
    },
    'System/Public/SiteTextController': {
        '*': true
    },
    'System/Public/HeroImageController': {
        '*': true
    },
    'System/Public/CommentController': {
        '*': true
    },
    'System/Users/CommentController': {
        '*': ['userPolices', 'requirePermission']
    },
    'System/Public/PrayerController': {
        '*': true
    },
    // Chỉ cần đăng nhập: ai cũng đọc được thông báo của chính mình.
    'System/Users/NotificationController': {
        '*': ['userPolices']
    },
    'System/Users/PrayerController': {
        '*': ['userPolices', 'requirePermission']
    },
    'System/Public/SoundController': {
        '*': true
    },
    'System/Admin/SoundController': {
        '*': ['userPolices', 'requirePermission']
    },
    // Nhật ký tu tập: chỉ cần đăng nhập, ai cũng ghi / xem được nhật ký của mình.
    'System/Users/PracticeController': {
        '*': ['userPolices']
    },
    'System/Users/ContentController': {
        '*': ['userPolices', 'requirePermission']
    },
    'System/Users/MediaController': {
        '*': ['userPolices', 'requirePermission']
    },
    // Điểm danh, thống kê cá nhân: chỉ cần đăng nhập.
    'System/Users/MeritController': {
        '*': ['userPolices']
    },
    // Không qua requirePermission: controller tự chỉ cho đúng một tài khoản (email chủ).
    'System/Admin/BannedWordsController': {
        '*': ['userPolices']
    },
    'System/Admin/MeritController': {
        '*': ['userPolices', 'requirePermission']
    },
    'System/Public/MediaController': {
        '*': true
    },
    'System/Public/DonateController': {
        '*': true
    },
    'System/Public/DayEventController': {
        '*': true
    },
    'System/Admin/ApprovalController': {
        '*': ['userPolices', 'requirePermission']
    },
    'System/Admin/BroadcastController': {
        '*': ['userPolices', 'requirePermission']
    },
    'System/Admin/DayEventController': {
        '*': ['userPolices', 'requirePermission']
    },
    'System/Admin/PrayerController': {
        '*': ['userPolices', 'requirePermission']
    },
    'System/Public/FeedbackController': {
        '*': true
    },
    'System/Admin/FeedbackController': {
        '*': ['userPolices', 'requirePermission']
    },
    'System/Public/AvatarController': {
        '*': true
    },
    'System/Admin/ModerationController': {
        '*': ['userPolices', 'requirePermission']
    },
    'System/Admin/HeroImageController': {
        '*': ['userPolices', 'requirePermission']
    },
    'System/Admin/SiteTextController': {
        '*': ['userPolices', 'requirePermission']
    },
    'System/Admin/RolesController': {
        '*': ['userPolices', 'requirePermission']
    },
};
