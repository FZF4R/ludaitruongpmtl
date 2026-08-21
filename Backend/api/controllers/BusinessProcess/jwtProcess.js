module.exports = class JwtProcess {
    constructor() {
        var encryptSetting = sails.config.env && sails.config.env.jwtEncryptSetting
        if (!encryptSetting || !encryptSetting.key) {
            // config/env.js nam trong .gitignore nen rat de thieu khi deploy len server
            throw new Error('Thieu cau hinh sails.config.env.jwtEncryptSetting.key - hay tao/copy file config/env.js tren server')
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
     * Cac setting dung de giai ma token: key hien tai + cac key cu (neu co).
     * Khai bao jwtEncryptSetting.fallbackKeys = ['key-cu-1', ...] trong config/env.js
     * de token da phat hanh bang key cu van dung duoc sau khi doi key.
     * Token moi luon duoc ky bang .key hien tai.
     */
    getDecryptSettings() {
        var setting = this.encryptSetting
        var keys = [setting.key].concat(setting.fallbackKeys || [])
        return keys.filter((key) => !!key).map((key) => Object.assign({}, setting, { key: key }))
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
                    // Token duoc ma hoa bang key khac voi jwtEncryptSetting.key dang chay
                    sails.log.warn('[jwtProcess] Sai jwtEncryptSetting.key - khong giai ma duoc access token. Them key cu vao fallbackKeys trong config/env.js.')
                } else if (err) {
                    sails.log.verbose('[jwtProcess] verifyToken that bai:', err.message || err)
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
                sails.log.error('[jwtProcess] Khong tao duoc access token:', error.message || error)
                reject(error)
            }
        });
    }
    decryptAccessToken(accessToken) {
        return new Promise((resolve, reject) => {
            // Thu lan luot key hien tai roi toi cac key cu (fallbackKeys)
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
