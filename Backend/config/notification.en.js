/**
 * notification.en.js
 *
 * Bản dịch thông báo trả về cho client, cùng cấu trúc với config/notification.js.
 * responseToClient.js đọc file này theo ngôn ngữ của request (header x-language).
 */

module.exports.notificationEn = {
    FacebookServices: {
        loginError: {
            message: "Login Page Error"
        },
        serviceNotFound: {
            message: "Services Error"
        },
        userNotValid: {
            message: "User Not Valid"
        },
        ServiceNotValid: {
            message: "Service Not Valid"
        },
        ServiceTokenNotValid: {
            message: "Service Token Not Valid"
        }
    },
    Content: {
        contentNotFound: {
            message: "Content not found"
        },
        contentTypeInvalid: {
            message: "Invalid content type"
        },
        contentTitleRequired: {
            message: "Title is required"
        },
        contentSlugInvalid: {
            message: "Invalid slug: use lowercase letters, digits and hyphens"
        },
        sutraForbidden: {
            message: "Only Managers and Admins can add or edit sutras"
        },
        sutraSourceRequired: {
            message: "A reference source is required for sutras"
        },
        contentSlugTaken: {
            message: "This slug is already in use"
        },
        contentStatusInvalid: {
            message: "Invalid status"
        },
        contentCreated: {
            message: "Content created"
        },
        contentUpdated: {
            message: "Content updated"
        },
        contentStatusChanged: {
            message: "Status updated"
        },
        contentDeleted: {
            message: "Content deleted"
        },
    },
    Settings: {
        notifyTextRequired: {
            message: "Text is required"
        },
        notifyIndexInvalid: {
            message: "That entry no longer exists, reload the page"
        },
    },
    GlobalNotifications: {
        success: {
            message: "Success"
        },
        error: {
            message: "An error occurred"
        },
        emptyMessage: {
            message: ""
        },
        successSignUp: {
            message: "Sign up success"
        },
        successRemove: {
            message: "Success to remove the record"
        },
        invalidInputParam: {
            message: "Invalid input param"
        },
        errorWhileProcess: {
            message: "Error counter when process the function"
        },
        CryptKeyInvalid: {
            message: "Invalid key crytion, Please relogin"
        },
        invalidSig: {
            message: "Invalid key crytion, Please relogin"
        },
        permisionDenined: {
            message: "Permision denined"
        }
    },
    Users: {
        notHaveTransaction: {
            message: "Not have transaction yet"
        },
        downloadBackup: {
            message: "Download Success"
        },
        chargeSuccess: {
            message: "Charge Balance Success"
        },
        usernameAlreadyInUse: {
            message: "Phone number has been used"
        },
        submitUrlSuccess: {
            message: "submitUrlSuccess"
        },
        addRefFailed: {
            message: "addRefFailed"
        },
        addRefSuccess: {
            message: "addRefSuccess"
        },
        cantDetectFacebook: {
            message: "cantDetectFacebook"
        },
        needUpdateUid: {
            message: "needUpdateUid"
        },
        userBanned: {
            message: "User banned"
        },
        fbIdAlreadyInUse: {
            message: "FB ID has been used"
        },
        registerSucess: {
            message: "Register Success"
        },
        registerInvalid: {
            message: "Register Invalid"
        },
        loginInvalid: {
            message: "Login Invalid"
        },
        registerInvalidCharacter: {
            message: "Register Invalid Character"
        },
        captchaRequired: {
            message: "Captcha Required"
        },
        captchaInvalid: {
            message: "Captcha Invalid"
        },
        oauthNotConfigured: {
            message: "Social login is not available"
        },
        oauthTokenInvalid: {
            message: "Social login failed, please try again"
        },
        oauthUsernameConflict: {
            message: "Cannot create an account name for you, please register manually"
        },
        profileNameRequired: {
            message: "Full name is required"
        },
        emailInvalid: {
            message: "Invalid email address"
        },
        emailTaken: {
            message: "This email is already used by another account"
        },
        roleSelfChange: {
            message: "You cannot change your own role"
        },
        roleNotAssignable: {
            message: "You are not allowed to assign this role"
        },
        roleLastAdmin: {
            message: "There must always be at least one Admin"
        },
        rolePermissionLocked: {
            message: "The Admin role always has every permission and cannot be edited"
        },
        rolePermissionForbidden: {
            message: "You can only edit permissions of roles below your own"
        },
        permissionNotGrantable: {
            message: "You cannot grant a permission you do not have"
        },
        prayerInvalid: {
            message: "Prayers must be 2 to 500 characters long"
        },
        prayerOncePerDay: {
            message: "You can write up to 3 prayers per day. See you tomorrow"
        },
        prayerNotFound: {
            message: "Prayer not found"
        },
        prayerForbidden: {
            message: "You can only delete your own prayers"
        },
        avatarInvalid: {
            message: "Invalid avatar (JPG, PNG or WebP under 1MB only)"
        },
        commentFlagged: {
            message: "Your comment contains inappropriate words and is not displayed"
        },
        moderationSelf: {
            message: "You cannot take action on your own account"
        },
        moderationRank: {
            message: "You can only act on accounts with a lower role than yours"
        },
        moderationWarnLimit: {
            message: "This account has already received 5 warnings"
        },
        feedbackThanks: {
            message: "Thank you for your feedback. The team will review it soon."
        },
        feedbackInvalid: {
            message: "Feedback must be 5 to 2000 characters long"
        },
        feedbackTooMany: {
            message: "You have sent several messages, please try again in a few minutes"
        },
        feedbackNotFound: {
            message: "Feedback not found"
        },
        commentInvalid: {
            message: "Comments must be 2 to 2000 characters long"
        },
        commentTooFast: {
            message: "You just commented, please wait a moment before posting again"
        },
        commentNotFound: {
            message: "Article or comment not found"
        },
        commentForbidden: {
            message: "You can only delete your own comments"
        },
        heroImageInvalid: {
            message: "Invalid image (JPG, PNG or WebP under 5MB only)"
        },
        heroImageTooMany: {
            message: "Maximum of 12 images reached, delete some first"
        },
        siteTextInvalid: {
            message: "Invalid or too long text (max 2000 characters)"
        },
        wrongPassword: {
            message: "Wrong Password"
        },
        userNotExits: {
            message: "User not exits"
        },
        userNotExitsFilter: {
            message: "User not exits"
        },
        loginSucess: {
            message: "Login sucess"
        },
        verifySucess: {
            message: "Verify sucess"
        },
        chargingProcessing: {
            message: "Charging success"
        },
        chargingError: {
            message: "Charging error"
        },
        UserNotValid: {
            message: "User Receive error"
        },
        NotEnoughMoneyToTransfer: {
            message: "Transfer error"
        },
        NotValidAmount: {
            message: "Amount error"
        },
        AuthPassChangeNotValid: {
            message: "Not Valid Password"
        },
        NotValidPermission: {
            message: "Not Valid Permission"
        }
    },
    Category: {
        createSuccess: {
            message: "Create category success"
        },
        deleteSuccess: {
            message: "Delete category success"
        },
        updateSuccess: {
            message: "Update category success"
        },
        exitsCategory: {
            message: "Exits category"
        },
        noDeleteCategory: {
            message: "Don't delete category"
        },
        notFoundCategory: {
            message: "Category not found"
        }
    },
    Group: {
        createSuccess: {
            message: "Create group success"
        },
        tranferSuccess: {
            message: "Tranfer Group Success"
        },
        limitedUser: {
            message: "limitedUser"
        },
        updateSuccess: {
            message: "Update success"
        },
        cantJoinDuplicate: {
            message: "You cant join this group"
        },
        groupJoined: {
            message: "Group has been joined"
        },
        groupUnjoined: {
            message: "Group not joined"
        },
        userUnjoined: {
            message: "Group not joined"
        },
        groupNotExits: {
            message: "Group not exits or you not have permision to access"
        },
        notEnoughCoin: {
            message: "Not enough coin"
        },
        invalidCategory: {
            message: "Invalid Category"
        },
        renewSuccess: {
            message: "Renew success"
        },
        notRoll: {
            message: "U never rolled UP"
        },
        Rolled: {
            message: "Rolled"
        },
        rollSuccess: {
            message: "Sucess"
        },
        unRollSuccess: {
            message: "Sucess"
        },
        removeSuccess: {
            message: "Remove success"
        },
        addLinkSuccess: {
            message: "Add link success"
        },
        uidDie: {
            message: "UID DIE"
        },
        removeLinkSuccess: {
            message: "Remove link success"
        },
        resetRollSuccess: {
            message: "Reset roll success"
        },
        deleteGroup: {
            message: "Delete Group success"
        }
    },
    Posts: {
        createSuccess: {
            message: "Create post success"
        },
        notFoundPost: {
            message: "notFoundPost"
        },
        updateSuccess: {
            message: "Update success"
        }
    },
    Comments: {
        createCommentSuccess: {
            message: "create comment success"
        }
    },
    News: {
        createSuccess: {
            message: "create news success"
        }
    },
    Clone: {
        maitainingSystem: {
            message: "Maintaining The System"
        },
        notPermissionAccess: {
            message: "Not Permission Access"
        },
        notValidTimeout: {
            message: "Pending Check"
        },
        errorAddress: {
            message: "Load Wallet Address fail... Contact Admin to deposit"
        },
        soldOutClone: {
            message: "Sold Out Clone"
        },
        soldCloneSuccess: {
            message: "Sold Clone Success"
        },
        delCloneSuccess: {
            message: "Delete Success"
        },
        uploadSuccess: {
            message: "Upload Success"
        }
    },
    Product: {
        existedProduct: {
            message: "Existed UID"
        },
        AdditionSuccess: {
            message: "Addition Success"
        }
    }
}
