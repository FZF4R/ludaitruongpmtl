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
    'System/Admin/UsersController': {
        '*': ['userPolices', 'adminPolices']
    },
    'System/Admin/SystemController': {
        '*': ['userPolices', 'adminPolices']
    },
};
