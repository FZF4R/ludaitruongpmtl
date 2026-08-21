class ErrorOutput {
    checkErrorOutput(errorOject, objectExit) {
        if (!errorOject) errorOject = {};

        var errorExit = objectExit.invalidInputParam
        if ( errorOject.reponseType) {
            errorExit = objectExit[errorOject.reponseType]
        }
        var responseToClient = {}
        if (errorOject.messageNode && errorOject.message) {
            responseToClient.messageNode = errorOject.messageNode
            responseToClient.message = errorOject.message
        } else {
            responseToClient.messageNode = 'GlobalNotifications'
            responseToClient.message = 'errorWhileProcess'
        }
        if (errorOject.code) {
            var errorCode = errorOject.code
                /* Define Error Code */
            if (objectExit.messageNode) {
                responseToClient.messageNode = objectExit.messageNode
            }
            if (errorCode == 'E_UNIQUE') {
                errorExit = objectExit.notUnique
                console.log(responseToClient)
                responseToClient.message = errorOject.message
            }
            if (errorCode == 'E_NON_ERROR' && errorOject.raw && errorOject.raw.message) {
                errorExit = objectExit.notUnique
                if (errorOject.raw && errorOject.raw.messageNode) {
                    responseToClient.messageNode = errorOject.raw.messageNode
                }
                responseToClient.message = errorOject.raw.message
            }
            if (errorCode == 'E_INVALID_CRITERIA') {
                responseToClient.message = 'invalidAttrs'
            }
        }
        errorExit(responseToClient)
    }
}

module.exports = ErrorOutput
