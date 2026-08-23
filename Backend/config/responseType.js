module.exports.responseType = {
    successRequest: {
        statusCode: 200,
        description: 'Success to process',
        responseType: 'responseToClient',
    },
    successCreate: {
        statusCode: 201,
        description: 'Success to create',
        responseType: 'responseToClient',
    },
    invalidInputParam: {
        statusCode: 400,
        description: 'Bad param input',
        responseType: 'responseToClient',
    },
    notAuthorize: {
        statusCode: 401,
        description: 'Not authorize to access',
        responseType: 'responseToClient',
    },
    notFound: {
        statusCode: 404,
        description: 'Resource not found',
        responseType: 'responseToClient',
    },
    notUnique: {
        statusCode: 409,
        description: 'Not unique',
        responseType: 'responseToClient',
    },
    apiFailure: {
        statusCode: 202,
        description: 'Error calling third party API',
        responseType: 'responseToClient',
    }
}