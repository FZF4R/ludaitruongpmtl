/**
 * UsersController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const fs = require('fs')
const path = require('path');
const { dongBoBaiCuaTacGia } = require('../../../utils/tacGia');

/**
 * Lấy IP client để gửi kèm khi verify captcha (tuỳ chọn với Google, không có cũng không sao).
 * Ưu tiên X-Forwarded-For vì API chạy sau nginx.
 */
function getClientIp(req) {
    if (!req) return undefined;

    const forwardedFor = req.headers && req.headers['x-forwarded-for'];
    if (forwardedFor) {
        return String(forwardedFor).split(',')[0].trim();
    }

    return req.ip;
}

/**
 * Hồ sơ trả về cho FrontEnd: gộp phần đăng nhập (Users) với phần khai báo
 * (UserProfile) để màn hình tài khoản chỉ phải gọi một endpoint.
 *
 * `isNewUser` là thứ FrontEnd dựa vào để đẩy người mới sang /hoan-thien-ho-so.
 * Nó suy ra từ cờ profileCompleted chứ không phải từ "tài khoản vừa được tạo":
 * người bỏ dở form giữa chừng vẫn phải được hỏi lại ở lần đăng nhập sau.
 */
function dinhDangHoSo(user, profile) {
    return {
        // Để FrontEnd nhận ra nội dung của chính mình (bình luận có nút xoá).
        id: String(user.id || ''),
        isNewUser: !user.profileCompleted,
        profileCompleted: !!user.profileCompleted,
        username: user.username || '',
        email: user.email || '',
        role: user.role || 'User',
        // Giao diện quản trị ẩn/hiện theo đúng quyền đang dùng, không đoán từ
        // tên vai trò - quyền của vai trò chỉnh được ở /admin/roles.
        permissions: sails.config.roles.permissionsOf(user.role || 'User'),
        fullName: (profile && profile.fullName) || user.fullName || '',
        dharmaName: (profile && profile.dharmaName) || '',
        nickname: (profile && profile.nickname) || '',
        hometown: (profile && profile.hometown) || {},
        survey: (profile && profile.survey) || {}
    }
}

async function completeSocialLogin(verifyResult, exits) {
    if (!verifyResult.success) {
        sails.checkErrorOutput({
            messageNode: 'Users',
            message: verifyResult.errorCode || 'oauthTokenInvalid'
        }, exits);
        return;
    }

    try {
        let response = { userDetail: '' };
        let userDetail = await sails.UserRelate.AuthWithProvider(verifyResult.profile);

        response.userDetail = userDetail;

        let tokenResult = await sails.jwtProcess.signAndEncryptJwt(userDetail);

        delete response.userDetail.password;
        response = Object.assign(tokenResult, response);
        // Tài khoản Google/Facebook mới tạo chưa có hồ sơ -> FrontEnd chuyển
        // thẳng sang form khai báo thay vì thả người dùng về trang chủ.
        response.isNewUser = !userDetail.profileCompleted;

        if (response.userDetail.is2FAEnabled) {
            exits.successRequest({
                message: 'loginSucess',
                messageNode: 'Users',
                data: {
                    is2FAEnabled: true,
                    isLoggedIn: false,
                    Data: {
                        id: response.userDetail.id
                    }
                }
            });
        } else {
            exits.successRequest({
                message: 'loginSucess',
                messageNode: 'Users',
                data: response
            });
        }
    } catch (err) {
        sails.checkErrorOutput(err, exits);
    }
}

/**
 * Đọc nội dung file clone đã giao cho khách (thư mục myClone nằm cạnh BackEnd).
 * Luôn resolve chứ không throw, để một file hỏng không làm chết cả danh sách giao dịch.
 */
async function readCloneFileContent(fileName) {
    const cloneDir = path.resolve(sails.config.appPath, '..', 'myClone');
    const filePath = path.resolve(cloneDir, fileName);

    // Chặn path traversal phòng khi field file trong DB bị sửa
    if (filePath !== cloneDir && !filePath.startsWith(`${cloneDir}${path.sep}`)) {
        return `Invalid file path: ${fileName}`;
    }

    try {
        return await fs.promises.readFile(filePath, 'utf8');
    } catch (fileErr) {
        return fileErr.code === 'ENOENT'
            ? `File not found at path: ${fileName}`
            : `Cannot read file: ${fileName}`;
    }
}

module.exports = {
    update2FA: ({
        inputs: sails.config.inputs.Users.update2FA,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            let { is2FAEnabled, User } = inputs
            let updateUser = {
                condition: { id: User.id },
                updateObject: { is2FAEnabled: is2FAEnabled }
            }
            await sails.dataProcess.updateDocument(Users, updateUser).then((result) => {
                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                });
            }).catch((err) => {
                sails.checkErrorOutput(err, exits);
            });
        }
    }),
    generateQRCode: ({
        inputs: sails.config.inputs.Users.generateQRCode,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            let { User } = inputs;
            let filterUser = {
                condition: { id: User.id }
            }

            let userInfo = await sails.dataProcess.findOne(Users, filterUser);
            const secretKey = await sails.config.TwoFA.generateUniqueSecret();
            const otpAuth = sails.config.TwoFA.generateOTPToken(userInfo.id, `ShopClone ${userInfo.username}`, secretKey);
            const QRCodeImage = await sails.config.TwoFA.generateQRCode(otpAuth);
            let updateUser = {
                condition: { userID: User.id },
                updateObject: { secretKey2FA: secretKey }
            }
            let filterUser2FA = {
                condition: { userID: User.id }
            };
            let user2fa = await sails.dataProcess.findOne(Users2FA, filterUser2FA);
            if (!user2fa) {
                await sails.dataProcess.createDocument(Users2FA, {
                    userID: User.id,
                    secretKey2FA: secretKey
                }).then((result) => {
                    exits.successRequest({
                        messageNode: 'GlobalNotifications',
                        message: 'success',
                        data: {
                            QRCodeImage: QRCodeImage
                        }
                    });
                }).catch((err) => {
                    sails.checkErrorOutput(err, exits);
                });
            } else {
                await sails.dataProcess.updateDocument(Users2FA, updateUser).then((result) => {
                    exits.successRequest({
                        messageNode: 'GlobalNotifications',
                        message: 'success',
                        data: {
                            QRCodeImage: QRCodeImage
                        }
                    });
                }).catch((err) => {
                    sails.checkErrorOutput(err, exits);
                });
            }
        }
    }),
    login: ({
        inputs: sails.config.inputs.Users.login,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            // Xác thực Google reCAPTCHA trước khi kiểm tra tài khoản/mật khẩu
            let captchaResult = await sails.config.ReCaptcha.verifyToken(inputs.recaptchaToken, getClientIp(this.req));
            if (!captchaResult.success) {
                sails.checkErrorOutput({
                    messageNode: 'Users',
                    message: sails.config.ReCaptcha.getErrorMessageName(captchaResult)
                }, exits);
                return;
            }

            let response = {
                userDetail: ''
            }
            sails.UserRelate.Auth(inputs).then((result) => {
                response.userDetail = result
                return sails.jwtProcess.signAndEncryptJwt(result)
            }).then(async (result) => {
                delete response.userDetail.password
                response = Object.assign(result, response);
                response.isNewUser = !response.userDetail.profileCompleted;
                if (response.userDetail.is2FAEnabled) {
                  exits.successRequest({
                    message: 'loginSucess',
                    messageNode: 'Users',
                    data: {
                      is2FAEnabled: true,
                      isLoggedIn: false,
                      Data: {
                        id: response.userDetail.id
                      }
                    }
                  });
                } else {
                  exits.successRequest({
                      message: 'loginSucess',
                      messageNode: 'Users',
                      data: response
                  });
                }
            }).catch((err) => {
                sails.checkErrorOutput(err, exits)
            });
        }
    }),
    loginGoogle: ({
        inputs: sails.config.inputs.Users.loginSocial,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            let verifyResult = await sails.config.OAuth.verifyGoogleToken(inputs.accessToken);
            await completeSocialLogin(verifyResult, exits);
        }
    }),

    loginFacebook: ({
        inputs: sails.config.inputs.Users.loginSocial,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            let verifyResult = await sails.config.OAuth.verifyFacebookToken(inputs.accessToken);
            await completeSocialLogin(verifyResult, exits);
        }
    }),

    register: ({
        inputs: sails.config.inputs.Users.register,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            // Xác thực Google reCAPTCHA trước khi tạo tài khoản
            let captchaResult = await sails.config.ReCaptcha.verifyToken(inputs.recaptchaToken, getClientIp(this.req));
            if (!captchaResult.success) {
                sails.checkErrorOutput({
                    messageNode: 'Users',
                    message: sails.config.ReCaptcha.getErrorMessageName(captchaResult)
                }, exits);
                return;
            }

            let { username } = inputs;
            if (!username) {
                exits.successRequest({
                    messageNode: 'Users',
                    message: 'registerInvalid'
                });
                return;
            }
            let regex = /^[a-zA-Z0-9]+$/i;
            if (!regex.test(username)) {
                exits.successRequest({
                    messageNode: 'Users',
                    message: 'registerInvalidCharacter'
                });
                return;
            }
            var newUser = {
              email: inputs.email,
              username: inputs.username,
              password: inputs.password
            }

            sails.dataProcess.createDocument(Users, newUser).then((result) => {
                exits.successRequest({
                    messageNode: 'Users',
                    message: 'registerSucess'
                });
            }).catch((err) => {
                sails.checkErrorOutput(err, exits)
            });
        }
    }),

    verify2FA: ({
        inputs: sails.config.inputs.Users.verify2FA,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            let { id, authCode } = inputs
            let filterUser2FA = {
                condition: { userID: id }
            }
            let user2fa = await sails.dataProcess.findOne(Users2FA, filterUser2FA);
            const isValid = sails.config.TwoFA.verifyOTPToken(authCode, user2fa.secretKey2FA);
            if (!isValid) {
                sails.checkErrorOutput({
                    messageNode: 'Users',
                    message: 'FalseAuthentication'
                }, exits);
                return;
            }
            let response = {
                userDetail: ''
            }
            let filterUser = {
                condition: { id: id }
            }
            let userInfo = await sails.dataProcess.findOne(Users, filterUser);
            response.userDetail = userInfo;

            sails.jwtProcess.signAndEncryptJwt(userInfo)
                .then(async (result) => {
                    delete response.userDetail.password;
                    response.userDetail.is2FAEnabled = true;
                    response.isNewUser = !userInfo.profileCompleted;
                    await sails.dataProcess.updateDocument(Users,{ condition: { id: userInfo.id }, updateObject: { is2FAEnabled: true } });
                    response = Object.assign(result, response)
                    exits.successRequest({
                        message: 'verifySucess',
                        messageNode: 'Users',
                        data: {
                            Data: response,
                            is2FAEnabled: true,
                            isLoggedIn: true,
                        }
                    });
                }).catch((err) => {
                    sails.checkErrorOutput(err, exits)
                })
        }
    }),
    /**
     * Hồ sơ Phật tử của người đang đăng nhập.
     * Chưa điền thì trả về khung rỗng kèm isNewUser = true, KHÔNG trả 404:
     * FrontEnd luôn cần biết phải hiện form hay hiện thông tin.
     */
    getProfile: ({
        inputs: sails.config.inputs.Users.getProfile,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            let { User } = inputs;
            try {
                let profile = await sails.dataProcess.findOne(UserProfile, {
                    condition: { userId: String(User.id) }
                });

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: dinhDangHoSo(User, profile)
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    /**
     * Lưu hồ sơ + khảo sát, và bật cờ Users.profileCompleted.
     *
     * Dùng cho cả lần khai đầu tiên lẫn các lần sửa sau này, nên phải ghi đè
     * chứ không cộng dồn: bỏ chọn một mục ở form thì mục đó phải mất khỏi CSDL.
     */
    saveProfile: ({
        inputs: sails.config.inputs.Users.saveProfile,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            let { User } = inputs;
            let { chuoiNgan, locQueQuan, locKhaoSat } = sails.config.survey;

            let hoTen = chuoiNgan(inputs.fullName, 80);
            if (!hoTen) {
                exits.successRequest({
                    messageNode: 'Users',
                    message: 'profileNameRequired'
                });
                return;
            }

            let banGhi = {
                fullName: hoTen,
                dharmaName: chuoiNgan(inputs.dharmaName, 80),
                nickname: chuoiNgan(inputs.nickname, 40),
                hometown: locQueQuan(inputs.hometown),
                survey: locKhaoSat(inputs.survey)
            };

            try {
                let userId = String(User.id);
                let hienCo = await sails.dataProcess.findOne(UserProfile, { condition: { userId } });
                let hoSo;

                if (hienCo) {
                    hoSo = await sails.dataProcess.updateDocument(UserProfile, {
                        condition: { id: hienCo.id },
                        updateObject: banGhi
                    });
                } else {
                    hoSo = await sails.dataProcess.createDocument(
                        UserProfile,
                        Object.assign({ userId, completedAt: Date.now() }, banGhi)
                    );
                }

                // Chép hai trường sang Users để trang quản trị và các màn hình
                // cũ không phải biết tới bảng UserProfile mới.
                let capNhatUser = { fullName: hoTen, profileCompleted: true };
                if (banGhi.survey.gender) capNhatUser.gender = banGhi.survey.gender;

                await sails.dataProcess.updateDocument(Users, {
                    condition: { id: userId },
                    updateObject: capNhatUser
                });

                // Bài viết lấy tác giả theo hồ sơ phải đổi theo họ tên / pháp danh mới.
                await dongBoBaiCuaTacGia(userId);

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: dinhDangHoSo(Object.assign({}, User, capNhatUser), hoSo)
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    getUserInfo: ({
        inputs: sails.config.inputs.Users.getUserInfo,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            let { User } = inputs
            let avatar = await sails.dataProcess.findOne(UserAvatar,{condition: {userId: User.id}});
            delete User.password
            sails.dataProcess.findOne(Users, {condition: {id: User.id}}).then((userInfo)=> {
              delete userInfo.password;
              userInfo.avatar = avatar ? avatar.avatar : "";
              exits.successRequest({
                  messageNode: 'GlobalNotifications',
                  message: 'success',
                  data: userInfo
              });
            }).catch((err)=> {
              sails.checkErrorOutput({}, exits)
            })
        }
    }),





    updatepassword: ({
        inputs: sails.config.inputs.Admin.Users.updatepassword,
        exits: sails.config.responseType,
        fn: async function(inputs, exits) {
            let { id, newPass, username, oldPass } = inputs;
            let passChange = await sails.helpers.passwords.hashPassword(newPass)
            sails.dataProcess.findOne(Users, { condition: { username } }).then(async(result) => {
                if (!result) {
                    return Promise.reject({
                        message: 'userNotExits',
                        messageNode: 'Users'
                    })
                }
                return sails.helpers.passwords.checkPassword(oldPass, result.password);
            }).then((result) => {
                let filterUpdate = {
                    condition: {
                        id,
                        username
                    },
                    updateObject: {
                        password: passChange
                    }
                };
                sails.dataProcess.updateDocument(Users, filterUpdate).then((result) => {
                    exits.successRequest({
                        messageNode: 'GlobalNotifications',
                        message: 'success'
                    });
                }).catch((err) => {
                    sails.checkErrorOutput(err, exits);
                });
            }).catch((err) => {
                if (err && err.code && err.code == 'incorrect') {
                    exits.successRequest({
                        messageNode: 'Users',
                        message: 'AuthPassChangeNotValid'
                    });
                    return;
                }
                sails.checkErrorOutput(err, exits);
            })
        }
    }),





    updateinfo: ({
        inputs: sails.config.inputs.Users.updateinfo,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            let { id, phonenumber, email, fullName, address, gender } = inputs
            let filter = {
                condition: {
                    id: id
                }
            }
            sails.dataProcess.findOne(Users, filter).then((result) => {
                let condition = {
                    id: result.id
                }
                let updateObject = { phonenumber, email, fullName, address, gender  }
                return sails.dataProcess.updateDocument(Users, { condition, updateObject })
            }).then((result) => {
                delete result.password;
                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: result
                });
            }).catch((err) => {
                console.log(err);
                sails.checkErrorOutput(err, exits);
            });
        }
    }),






    uploadAvatar: ({
        inputs: sails.config.inputs.Users.uploadAvatar,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            let { User, avatar } = inputs;
            try {
                if (!User || !User.id) {
                    return exits.successRequest({
                        messageNode: 'Users',
                        message: 'userNotExits'
                    });
                }

                // Normalize base64 (strip data URI prefix if present)
                const base64Data = avatar.includes(',') ? avatar.split(',').pop() : avatar;

                // Upsert logic: find existing avatar record for user
                let existing = await sails.dataProcess.findOne(UserAvatar, { condition: { userId: User.id } });
                let avatarDoc;
                if (existing) {
                    avatarDoc = await sails.dataProcess.updateDocument(UserAvatar, {
                        condition: { id: existing.id },
                        updateObject: { avatar: base64Data, username: User.username }
                    });
                    avatarDoc = Array.isArray(avatarDoc) ? avatarDoc[0] : avatarDoc;
                } else {
                    avatarDoc = await sails.dataProcess.createDocument(UserAvatar, {
                        userId: User.id,
                        username: User.username,
                        avatar: base64Data
                    });
                }

                // Construct a data URI to return for immediate display (PNG assumed). Frontend can cache.
                // In future, switch to file storage & return URL path.
                const avatarUrl = 'data:image/png;base64,' + avatarDoc.avatar;

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: { avatarUrl }
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),





};
