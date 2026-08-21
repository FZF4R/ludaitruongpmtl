/**
 * Policy Mappings
 * (sails.config.policies)
 *
 * Policies are simple functions which run **before** your actions.
 *
 * For more information on configuring policies, check out:
 * https://sailsjs.com/docs/concepts/policies
 */
const { rateLimiterMiddleware } = require("../api/utils/rateLimiterRedis");
module.exports.policies = {
    'System/Users/UsersController': {
        '*': ['userPolices'],
        login: true,
        loginGoogle: true,
        loginFacebook: true,
        register: true,
        downloadUserFile: ['userPolices'],
        downloadUserBackupFile: true,
        generateApiKey: ['userPolices'],
        downloadLiveAccounts: ['userPolices'],
        verify2FA: true,
        buyClone: ['userPolices'],
        // buyClone: [rateLimiterMiddleware, 'userPolices']
    },
    'System/Admin/CategoryController': {
        '*': ['userPolices', 'adminPolices']
    },
    'System/Admin/ProductController': {
        '*': ['userPolices', 'adminPolices']
    },
    'System/Admin/UsersController': {
      '*': ['userPolices', 'adminPolices']
    },
    'System/Admin/SystemController': {
      '*': ['userPolices', 'adminPolices']
    },
    'System/Admin/BankController': {
      '*': ['userPolices', 'adminPolices'],
    },

    'System/Users/UserPartnerController': {
      '*': ['userPartnerPolicies'],
    },
};
