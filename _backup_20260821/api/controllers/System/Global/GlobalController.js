/**
 * GlobalController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
    getConfig: ({
        inputs: sails.config.inputs.Global.config,
        exits: sails.config.responseType,
        fn: async function(inputs, exits) {
            let filterData = {
                condition: {},
                limit: 500,
                page: 1
            }
            if (inputs.filter) {
                filterGroup.condition = inputs.filter
            }
            let response = {}
            sails.dataProcess.getListDataFromModel(Category, filterCategory).then(({ data }) => {

            }).catch((err) => {
                sails.checkErrorOutput(err, exits);
            });
        }
    }),

};