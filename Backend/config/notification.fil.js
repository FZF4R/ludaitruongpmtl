/**
 * notification.fil.js
 *
 * Bản dịch thông báo trả về cho client, cùng cấu trúc với config/notification.js.
 * responseToClient.js đọc file này theo ngôn ngữ của request (header x-language).
 */

module.exports.notificationFil = {
    FacebookServices: {
        loginError: {
            message: "Nabigo ang pag-log in"
        },
        serviceNotFound: {
            message: "Nabigong i-load ang mga serbisyo"
        },
        userNotValid: {
            message: "Hindi wastong user"
        },
        ServiceNotValid: {
            message: "Hindi wasto ang napiling serbisyo"
        },
        ServiceTokenNotValid: {
            message: "Hindi wasto ang token… Makipag-ugnayan sa Admin para sa update"
        }
    },
    GlobalNotifications: {
        success: {
            message: "Tagumpay"
        },
        error: {
            message: "May naganap na error"
        },
        emptyMessage: {
            message: ""
        },
        successSignUp: {
            message: "Matagumpay ang pagpaparehistro"
        },
        successRemove: {
            message: "Matagumpay na naalis"
        },
        invalidInputParam: {
            message: "Hindi wasto ang inilagay na impormasyon"
        },
        errorWhileProcess: {
            message: "May naganap na error, pakisubukan muli!"
        },
        CryptKeyInvalid: {
            message: "Mali ang encryption key, mag-log in muli!"
        },
        invalidSig: {
            message: "Hindi wastong signature!"
        },
        permisionDenined: {
            message: "Walang pahintulot sa pag-access"
        }
    },
    Users: {
        notHaveTransaction: {
            message: "Wala pang transaksyon"
        },
        downloadBackup: {
            message: "Matagumpay na na-download ang backup"
        },
        chargeSuccess: {
            message: "Matagumpay ang pag-top up"
        },
        usernameAlreadyInUse: {
            message: "Ginagamit na ang account na ito"
        },
        submitUrlSuccess: {
            message: "Matagumpay na na-verify ang Facebook link"
        },
        addRefFailed: {
            message: "Hindi mababago ang impormasyong ito"
        },
        addRefSuccess: {
            message: "Matagumpay na naidagdag ang ref"
        },
        cantDetectFacebook: {
            message: "Nabigo ang pag-verify ng Facebook link"
        },
        needUpdateUid: {
            message: "Kailangan mong i-verify ang Facebook link"
        },
        userBanned: {
            message: "Naka-block ang user"
        },
        fbIdAlreadyInUse: {
            message: "Ginagamit na ang FB ID na ito"
        },
        registerSucess: {
            message: "Matagumpay ang pagpaparehistro"
        },
        registerInvalid: {
            message: "Hindi wasto ang impormasyon ng account"
        },
        loginInvalid: {
            message: "Hindi wasto ang impormasyon ng account"
        },
        registerInvalidCharacter: {
            message: "Mga titik at numero lamang ang pwede sa pangalan ng account"
        },
        captchaRequired: {
            message: "Pakikumpirma na hindi ka robot"
        },
        captchaInvalid: {
            message: "Nabigo ang captcha, pakisubukan muli"
        },
        oauthNotConfigured: {
            message: "Hindi pa available ang social login"
        },
        oauthTokenInvalid: {
            message: "Nabigo ang social login, pakisubukan muli"
        },
        oauthUsernameConflict: {
            message: "Hindi makagawa ng pangalan ng account, mangyaring magrehistro nang manu-mano"
        },
        wrongPassword: {
            message: "Maling password"
        },
        userNotExits: {
            message: "Hindi pa nakarehistro ang account"
        },
        userNotExitsFilter: {
            message: "Hindi umiiral ang user"
        },
        loginSucess: {
            message: "Matagumpay ang pag-log in"
        },
        verifySucess: {
            message: "Matagumpay ang 2FA verification"
        },
        chargingProcessing: {
            message: "Natanggap ang request sa top up, pinoproseso na"
        },
        chargingError: {
            message: "Nabigo ang pag-top up"
        },
        UserNotValid: {
            message: "Hindi wasto ang tatanggap"
        },
        NotEnoughMoneyToTransfer: {
            message: "Kulang ang balanse ng account"
        },
        NotValidAmount: {
            message: "Hindi wasto ang halagang ililipat"
        },
        AuthPassChangeNotValid: {
            message: "Hindi wastong password"
        },
        NotValidPermission: {
            message: "Walang pahintulot para sa kahilingang ito"
        }
    },
    Category: {
        createSuccess: {
            message: "Matagumpay na nagawa ang folder"
        },
        deleteSuccess: {
            message: "Matagumpay na nabura ang folder"
        },
        updateSuccess: {
            message: "Matagumpay na na-update ang folder"
        },
        exitsCategory: {
            message: "Umiiral na ang folder na ito"
        },
        noDeleteCategory: {
            message: "Hindi mabubura ang folder na ito"
        },
        notFoundCategory: {
            message: "Hindi nakita ang folder na ito"
        }
    },
    Group: {
        createSuccess: {
            message: "Matagumpay na nagawa ang grupo"
        },
        tranferSuccess: {
            message: "Matagumpay ang paglipat ng grupo"
        },
        limitedUser: {
            message: "Puno na ang grupong ito, hindi ka makakasali"
        },
        updateSuccess: {
            message: "Matagumpay na na-update"
        },
        cantJoinDuplicate: {
            message: "Hindi ka makakasali sa grupong ito"
        },
        groupJoined: {
            message: "Kasali ka na sa grupong ito"
        },
        groupUnjoined: {
            message: "Hindi ka pa sumasali sa grupong ito"
        },
        userUnjoined: {
            message: "Hindi pa sumasali sa grupo ang user"
        },
        groupNotExits: {
            message: "Walang ganitong grupo o wala kang access"
        },
        notEnoughCoin: {
            message: "Kulang ang coin, mag-top up muna"
        },
        invalidCategory: {
            message: "Hindi wastong produkto"
        },
        renewSuccess: {
            message: "Matagumpay ang pag-renew"
        },
        notRoll: {
            message: "Hindi ka pa nag-check in"
        },
        Rolled: {
            message: "Naka-check in ka na"
        },
        rollSuccess: {
            message: "Matagumpay ang check in"
        },
        unRollSuccess: {
            message: "Matagumpay na nakansela ang check in"
        },
        removeSuccess: {
            message: "Matagumpay na nabura ang grupo"
        },
        addLinkSuccess: {
            message: "Matagumpay na naidagdag ang link"
        },
        uidDie: {
            message: "Patay na ang UID"
        },
        removeLinkSuccess: {
            message: "Matagumpay na nabura ang link"
        },
        resetRollSuccess: {
            message: "Matagumpay na na-reset ang check in"
        },
        deleteGroup: {
            message: "Matagumpay na nabura ang grupo"
        }
    },
    Posts: {
        createSuccess: {
            message: "Matagumpay na nagawa ang post"
        },
        notFoundPost: {
            message: "Hindi nakita ang post"
        },
        updateSuccess: {
            message: "Matagumpay na na-update"
        }
    },
    Comments: {
        createCommentSuccess: {
            message: "Matagumpay na naidagdag ang komento"
        }
    },
    News: {
        createSuccess: {
            message: "Matagumpay na naidagdag ang balita"
        }
    },
    Clone: {
        maitainingSystem: {
            message: "Ina-update ang server. Pakisubukan muli mamaya…"
        },
        notPermissionAccess: {
            message: "Walang pahintulot sa impormasyong ito"
        },
        notValidTimeout: {
            message: "Maghintay ng 5 minuto bago suriin"
        },
        errorAddress: {
            message: "Nabigong i-load ang wallet address… Makipag-ugnayan sa Admin para mag-deposit"
        },
        soldOutClone: {
            message: "Kulang ang stock ng Clone"
        },
        soldCloneSuccess: {
            message: "Matagumpay ang pagbili"
        },
        delCloneSuccess: {
            message: "Matagumpay na nabura ang file"
        },
        uploadSuccess: {
            message: "Matagumpay na naidagdag ang account"
        }
    },
    Product: {
        existedProduct: {
            message: "Umiiral na ang produkto na may ganitong UID"
        },
        AdditionSuccess: {
            message: "Matagumpay na naidagdag ang produkto"
        }
    }
}
