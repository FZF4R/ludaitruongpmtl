module.exports = async function (req, res, proceed) {
    var responseObject = {
        message: {
            messageEN: "Permision denined",
            messageVNI: "Không có quyền truy cập"
        }
    }
    let { User } = req.body
    if (!User) {
        return res.status(403).json(responseObject);
    } else if (User.role == 'Admin') {
        return proceed()
    } else {
        return res.status(403).json(responseObject);
    }
};

