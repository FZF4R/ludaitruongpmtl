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
    'System/Admin/SiteTextController': {
        '*': ['userPolices', 'requirePermission']
    },
    'System/Admin/RolesController': {
        '*': ['userPolices', 'requirePermission']
    },
};
