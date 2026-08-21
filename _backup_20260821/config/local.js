module.exports = {
    port: 1338,

    /***************************************************************************
    *                                                                          *
    * Disable session hook since app uses JWT token authentication             *
    * This prevents unwanted sails.sid cookie from being set                  *
    *                                                                          *
    ***************************************************************************/
    hooks: {
        session: false
    }
}
