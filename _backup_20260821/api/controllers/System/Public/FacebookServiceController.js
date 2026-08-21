/**
 * UsersController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
module.exports = {
    getPageFollowOptions: ({
        inputs: sails.config.inputs.FacebookService.PageFollow.getPageFollowOptions,
        exits: sails.config.responseType,
        fn: async function(inputs, exits) {
            sails.FacebookService.getPageFollowOptions(inputs).then((result) => {
                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: result
                });
            }).catch((err) => {
                sails.checkErrorOutput(err, exits);
            });
        }
    }),

    getPageFollowServices: ({
        inputs: sails.config.inputs.FacebookService.PageFollow.getPageFollowOptions,
        exits: sails.config.responseType,
        fn: async function(inputs, exits) {
            sails.FacebookService.getPageFollowServices(inputs).then((result) => {
                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: result
                });
            }).catch((err) => {
                sails.checkErrorOutput(err, exits);
            });
        }
    }),

};