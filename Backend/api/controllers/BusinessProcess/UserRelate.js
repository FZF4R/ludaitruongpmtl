module.exports = class UserRelate {
    Auth(inputUser) {
        return new Promise((resolve, reject) => {
            let userDetail;
            let { username, password } = inputUser
            sails.dataProcess.findOne(Users, { condition: { username } }).then((objectUser) => {
                if (!objectUser) {
                    return Promise.reject({
                        message: 'loginInvalid',
                        messageNode: 'Users',
                    })
                }
                userDetail = objectUser
                if (objectUser.status !== 1) {
                    return Promise.reject({
                        message: 'userBanned',
                        messageNode: 'Users',
                    })
                }
                return sails.helpers.passwords.checkPassword(password, userDetail.password);
            }).then((result) => {
                resolve(userDetail)
            }).catch((err) => {
                if (err && err.code && err.code == 'incorrect') {
                    reject({
                        messageNode: 'Users',
                        message: 'loginInvalid'
                    })
                    return
                }
                reject(err)
            });
        });
    }

    AuthWithProvider(profile) {
        let providerField = profile.provider === 'facebook' ? 'facebookId' : 'googleId'
        let email = String(profile.email || '').trim().toLowerCase()

        return sails.dataProcess.findOne(Users, { condition: { [providerField]: profile.providerId } }).then((linkedUser) => {
            if (linkedUser) return linkedUser
            if (!email || !profile.emailVerified) return null

            return sails.dataProcess.findOne(Users, { condition: { email: email } })
        }).then((existingUser) => {
            if (!existingUser) return this.createProviderUser(providerField, profile, email)

            if (existingUser.status !== 1) {
                return Promise.reject({
                    messageNode: 'Users',
                    message: 'userBanned'
                })
            }

            if (existingUser[providerField] === profile.providerId) return existingUser

            return sails.dataProcess.updateDocument(Users, {
                condition: { id: existingUser.id },
                updateObject: { [providerField]: profile.providerId }
            }).then(() => Object.assign({}, existingUser, { [providerField]: profile.providerId }))
        });
    }

    createProviderUser(providerField, profile, email) {
        return this.generateProviderUsername(profile, email).then((username) => {
            let newUser = {
                username: username,
                password: sails.crypto.randomBytes(24).toString('hex'),
                email: email || '',
                fullName: profile.fullName || ''
            }
            newUser[providerField] = profile.providerId

            return sails.dataProcess.createDocument(Users, newUser)
        });
    }

    async generateProviderUsername(profile, email) {
        let base = String(email || '').split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
        if (base.length < 4) {
            base = `${profile.provider}${profile.providerId}`.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
        }
        base = base.slice(0, 16)
        while (base.length < 6) base = `${base}0`

        for (let attempt = 0; attempt < 12; attempt++) {
            let candidate = attempt === 0 ? base : `${base}${Math.floor(1000 + Math.random() * 9000)}`
            let existed = await sails.dataProcess.findOne(Users, { condition: { username: candidate } })
            if (!existed) return candidate
        }

        return Promise.reject({
            messageNode: 'Users',
            message: 'oauthUsernameConflict'
        })
    }
}
