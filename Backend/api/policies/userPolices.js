module.exports = async function (req, res, proceed) {
    var responseObject = {
        message: 'tokenRequired'
    }
    if (!req.headers['authorization']) {
        return res.status(401).json(responseObject);
    }
    var accessToken = req.headers['authorization']
    sails.jwtProcess.verifyToken(accessToken).then((result) => {
        if (!req.body) {
            req.body = new Object()
        }
        req.body = Object.assign(req.body, { User: result })
        return proceed()
    }).catch((err) => {
        responseObject.message = err
        // Tài khoản bị khoá: 423 để FrontEnd chuyển sang trang thông báo khoá.
        return res.status(err === 'accountBanned' ? 423 : 401).json(responseObject);
    });
};

