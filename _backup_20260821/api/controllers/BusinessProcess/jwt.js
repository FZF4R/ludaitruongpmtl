module.exports = class JwtProcess {
    constructor() {
        var encryptSetting = sails.config.env && sails.config.env.jwtEncryptSetting
        if (!encryptSetting || !encryptSetting.key) {
            // config/env.js nằm trong .gitignore nên rất dễ thiếu khi deploy lên server
            throw new Error('Thiếu cấu hình sails.config.env.jwtEncryptSetting.key - hãy tạo/copy file config/env.js trên server')
        }
        this.encryptSetting = encryptSetting
        this.jwtSetting = {
            accessToken: {
                secret: encryptSetting.key,
                expiresIn: '180d',
            }
        }
    }
    /**
     * Danh sách setting dùng để giải mã token: key hiện tại + các key cũ (nếu có).
     * Khai báo jwtEncryptSetting.fallbackKeys = ['key-cu-1', ...] trong config/env.js
     * để token đã phát hành bằng key cũ vẫn dùng được sau khi đổi key.
     */
    getDecryptSettings() {
        var setting = this.encryptSetting
        var keys = [setting.key].concat(setting.fallbackKeys || [])
        return keys.filter(key => !!key).map(key => Object.assign({}, setting, { key: key }))
    }
    verifyToken(accessToken) {
        return new Promise((resolve, reject) => {
            var userTokenDetails = {}
            // Decrypt Access Token
            var reason = 'accessTokenInvalid'
            this.decryptAccessToken(accessToken).then((result) => {
                if (!result || !result.exp) {
                    return Promise.reject()
                }
                userTokenDetails = result.data
                // Validate Token is Expired
                if (sails.moment().unix() > result.exp) {
                    reason = 'accessTokenExpired'
                    return Promise.reject()
                }
                if (!userTokenDetails || !userTokenDetails.userId) {
                    return Promise.reject()
                }
                // Validate password in token is match with User account
                return this.verifyPasswordFromDB(userTokenDetails)
            }).then((result) => {
                if (result.status !== 1) {
                    return Promise.reject()
                }
                resolve(result)
            }).catch((err) => {
                if (err && err.code === 'ERR_OSSL_BAD_DECRYPT') {
                    // Token được mã hoá bằng key khác với jwtEncryptSetting.key đang chạy
                    sails.log.warn('[jwtProcess] Không giải mã được access token (sai jwtEncryptSetting.key). Kiểm tra config/env.js trên server hoặc thêm key cũ vào fallbackKeys.')
                } else if (err) {
                    sails.log.verbose('[jwtProcess] verifyToken thất bại:', err.message || err)
                }
                reject(reason)
            });
        });
    }
    verifyPasswordFromDB(userTokenDetails) {
        return new Promise((resolve, reject) => {
            var filter = {
                id: userTokenDetails.userId
            }
            var UserDetail = {}
            sails.dataProcess.findOne(Users, { condition: filter }).then((result) => {
                if (!result) {
                    return Promise.reject()
                }
                UserDetail = result
                return result.password === userTokenDetails.password
            }).then((result) => {
                if (!result) {
                    reject()
                } else {
                    resolve(UserDetail)
                }
            }).catch((err) => {
                reject()
            });
        });
    }
    signAndEncryptJwt(userDetail) {
        return new Promise(async (resolve, reject) => {
            try {
                var reponseObject = {
                    accessToken: ''
                }
                var privateData = {
                    password: userDetail.password
                }
                var publicData = {
                    phone: userDetail.phone,
                    userId: userDetail.id
                };
                reponseObject.accessToken = await sails.jwtEcnrypter.generateJWT(
                    this.jwtSetting.accessToken,
                    publicData,
                    this.encryptSetting,
                    privateData,
                    'selfData'
                )
                resolve(reponseObject)
            } catch (error) {
                sails.log.error('[jwtProcess] Không tạo được access token:', error.message || error)
                reject(error)
            }
        });
    }
    decryptAccessToken(accessToken) {
        return new Promise((resolve, reject) => {
            // Thử lần lượt key hiện tại rồi tới các key cũ (fallbackKeys)
            var settings = this.getDecryptSettings()
            var lastError = null
            for (var i = 0; i < settings.length; i++) {
                try {
                    return resolve(sails.jwtEcnrypter.readJWT(accessToken, settings[i], 'selfData'))
                } catch (error) {
                    lastError = error
                }
            }
            reject(lastError || new Error('cannotDecryptAccessToken'))
        });
    }
}
