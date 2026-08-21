/**
 * notification.zh.js
 *
 * Bản dịch thông báo trả về cho client, cùng cấu trúc với config/notification.js.
 * responseToClient.js đọc file này theo ngôn ngữ của request (header x-language).
 */

module.exports.notificationZh = {
    FacebookServices: {
        loginError: {
            message: "登录失败"
        },
        serviceNotFound: {
            message: "服务加载失败"
        },
        userNotValid: {
            message: "用户无效"
        },
        ServiceNotValid: {
            message: "所选服务无效"
        },
        ServiceTokenNotValid: {
            message: "令牌无效…请联系管理员更新"
        }
    },
    GlobalNotifications: {
        success: {
            message: "成功"
        },
        error: {
            message: "发生错误"
        },
        emptyMessage: {
            message: ""
        },
        successSignUp: {
            message: "注册成功"
        },
        successRemove: {
            message: "删除成功"
        },
        invalidInputParam: {
            message: "输入信息无效"
        },
        errorWhileProcess: {
            message: "发生错误，请重试！"
        },
        CryptKeyInvalid: {
            message: "加密密钥不正确，请重新登录！"
        },
        invalidSig: {
            message: "签名无效！"
        },
        permisionDenined: {
            message: "无访问权限"
        }
    },
    Users: {
        notHaveTransaction: {
            message: "暂无交易"
        },
        downloadBackup: {
            message: "备份下载成功"
        },
        chargeSuccess: {
            message: "充值成功"
        },
        usernameAlreadyInUse: {
            message: "该账号已被使用"
        },
        submitUrlSuccess: {
            message: "Facebook 链接验证成功"
        },
        addRefFailed: {
            message: "无法修改此信息"
        },
        addRefSuccess: {
            message: "添加推荐人成功"
        },
        cantDetectFacebook: {
            message: "Facebook 链接验证失败"
        },
        needUpdateUid: {
            message: "您需要验证 Facebook 链接"
        },
        userBanned: {
            message: "该用户已被封禁"
        },
        fbIdAlreadyInUse: {
            message: "该 FB ID 已被使用"
        },
        registerSucess: {
            message: "注册成功"
        },
        registerInvalid: {
            message: "账号信息无效"
        },
        loginInvalid: {
            message: "账号信息无效"
        },
        registerInvalidCharacter: {
            message: "账号名只能包含字母和数字"
        },
        captchaRequired: {
            message: "请确认您不是机器人"
        },
        captchaInvalid: {
            message: "验证码校验失败，请重试"
        },
        oauthNotConfigured: {
            message: "社交账号登录尚未启用"
        },
        oauthTokenInvalid: {
            message: "社交账号登录失败，请重试"
        },
        oauthUsernameConflict: {
            message: "无法生成账号名，请手动注册"
        },
        wrongPassword: {
            message: "密码错误"
        },
        userNotExits: {
            message: "该账号尚未注册"
        },
        userNotExitsFilter: {
            message: "用户不存在"
        },
        loginSucess: {
            message: "登录成功"
        },
        verifySucess: {
            message: "2FA 验证成功"
        },
        chargingProcessing: {
            message: "已收到充值请求，正在处理"
        },
        chargingError: {
            message: "充值失败"
        },
        UserNotValid: {
            message: "收款人无效"
        },
        NotEnoughMoneyToTransfer: {
            message: "账户余额不足"
        },
        NotValidAmount: {
            message: "转账金额无效"
        },
        AuthPassChangeNotValid: {
            message: "密码无效"
        },
        NotValidPermission: {
            message: "无权执行此操作"
        }
    },
    Category: {
        createSuccess: {
            message: "创建目录成功"
        },
        deleteSuccess: {
            message: "删除目录成功"
        },
        updateSuccess: {
            message: "更新目录成功"
        },
        exitsCategory: {
            message: "该目录已存在"
        },
        noDeleteCategory: {
            message: "无法删除该目录"
        },
        notFoundCategory: {
            message: "未找到该目录"
        }
    },
    Group: {
        createSuccess: {
            message: "创建群组成功"
        },
        tranferSuccess: {
            message: "转移群组成功"
        },
        limitedUser: {
            message: "该群组人数已满，无法加入"
        },
        updateSuccess: {
            message: "更新成功"
        },
        cantJoinDuplicate: {
            message: "您无法加入该群组"
        },
        groupJoined: {
            message: "您已加入该群组"
        },
        groupUnjoined: {
            message: "您尚未加入该群组"
        },
        userUnjoined: {
            message: "该用户尚未加入群组"
        },
        groupNotExits: {
            message: "群组不存在或您无权访问"
        },
        notEnoughCoin: {
            message: "余额不足，请充值"
        },
        invalidCategory: {
            message: "商品无效"
        },
        renewSuccess: {
            message: "续期成功"
        },
        notRoll: {
            message: "您还未签到"
        },
        Rolled: {
            message: "您已签到"
        },
        rollSuccess: {
            message: "签到成功"
        },
        unRollSuccess: {
            message: "取消签到成功"
        },
        removeSuccess: {
            message: "删除群组成功"
        },
        addLinkSuccess: {
            message: "添加链接成功"
        },
        uidDie: {
            message: "UID 已失效"
        },
        removeLinkSuccess: {
            message: "删除链接成功"
        },
        resetRollSuccess: {
            message: "重置签到成功"
        },
        deleteGroup: {
            message: "删除群组成功"
        }
    },
    Posts: {
        createSuccess: {
            message: "发布文章成功"
        },
        notFoundPost: {
            message: "未找到该文章"
        },
        updateSuccess: {
            message: "更新成功"
        }
    },
    Comments: {
        createCommentSuccess: {
            message: "添加评论成功"
        }
    },
    News: {
        createSuccess: {
            message: "添加新闻成功"
        }
    },
    Clone: {
        maitainingSystem: {
            message: "服务器正在更新，请稍后再试…"
        },
        notPermissionAccess: {
            message: "无权访问此信息"
        },
        notValidTimeout: {
            message: "请等待 5 分钟后再检查"
        },
        errorAddress: {
            message: "钱包地址加载失败…请联系管理员充值"
        },
        soldOutClone: {
            message: "Clone 库存不足"
        },
        soldCloneSuccess: {
            message: "购买成功"
        },
        delCloneSuccess: {
            message: "删除文件成功"
        },
        uploadSuccess: {
            message: "添加账号成功"
        }
    },
    Product: {
        existedProduct: {
            message: "该 UID 的商品已存在"
        },
        AdditionSuccess: {
            message: "添加商品成功"
        }
    }
}
