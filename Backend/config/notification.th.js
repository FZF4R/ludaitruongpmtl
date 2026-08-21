/**
 * notification.th.js
 *
 * Bản dịch thông báo trả về cho client, cùng cấu trúc với config/notification.js.
 * responseToClient.js đọc file này theo ngôn ngữ của request (header x-language).
 */

module.exports.notificationTh = {
    FacebookServices: {
        loginError: {
            message: "เข้าสู่ระบบล้มเหลว"
        },
        serviceNotFound: {
            message: "โหลดบริการไม่สำเร็จ"
        },
        userNotValid: {
            message: "ผู้ใช้ไม่ถูกต้อง"
        },
        ServiceNotValid: {
            message: "บริการที่เลือกไม่ถูกต้อง"
        },
        ServiceTokenNotValid: {
            message: "โทเค็นไม่ถูกต้อง… กรุณาติดต่อผู้ดูแลระบบเพื่ออัปเดต"
        }
    },
    GlobalNotifications: {
        success: {
            message: "สำเร็จ"
        },
        error: {
            message: "เกิดข้อผิดพลาด"
        },
        emptyMessage: {
            message: ""
        },
        successSignUp: {
            message: "สมัครสมาชิกสำเร็จ"
        },
        successRemove: {
            message: "ลบสำเร็จ"
        },
        invalidInputParam: {
            message: "ข้อมูลที่กรอกไม่ถูกต้อง"
        },
        errorWhileProcess: {
            message: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง!"
        },
        CryptKeyInvalid: {
            message: "คีย์เข้ารหัสไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่!"
        },
        invalidSig: {
            message: "ลายเซ็นไม่ถูกต้อง!"
        },
        permisionDenined: {
            message: "ไม่มีสิทธิ์เข้าถึง"
        }
    },
    Users: {
        notHaveTransaction: {
            message: "ยังไม่มีรายการธุรกรรม"
        },
        downloadBackup: {
            message: "ดาวน์โหลดข้อมูลสำรองสำเร็จ"
        },
        chargeSuccess: {
            message: "เติมเงินสำเร็จ"
        },
        usernameAlreadyInUse: {
            message: "บัญชีนี้ถูกใช้งานแล้ว"
        },
        submitUrlSuccess: {
            message: "ยืนยันลิงก์ Facebook สำเร็จ"
        },
        addRefFailed: {
            message: "ไม่สามารถแก้ไขข้อมูลนี้ได้"
        },
        addRefSuccess: {
            message: "เพิ่มผู้แนะนำสำเร็จ"
        },
        cantDetectFacebook: {
            message: "ยืนยันลิงก์ Facebook ไม่สำเร็จ"
        },
        needUpdateUid: {
            message: "คุณต้องยืนยันลิงก์ Facebook"
        },
        userBanned: {
            message: "ผู้ใช้ถูกระงับการใช้งาน"
        },
        fbIdAlreadyInUse: {
            message: "FB ID นี้ถูกใช้งานแล้ว"
        },
        registerSucess: {
            message: "สมัครสมาชิกสำเร็จ"
        },
        registerInvalid: {
            message: "ข้อมูลบัญชีไม่ถูกต้อง"
        },
        loginInvalid: {
            message: "ข้อมูลบัญชีไม่ถูกต้อง"
        },
        registerInvalidCharacter: {
            message: "ชื่อบัญชีต้องเป็นตัวอักษรและตัวเลขเท่านั้น"
        },
        captchaRequired: {
            message: "กรุณายืนยันว่าคุณไม่ใช่โปรแกรมอัตโนมัติ"
        },
        captchaInvalid: {
            message: "ยืนยัน captcha ไม่สำเร็จ กรุณาลองใหม่"
        },
        oauthNotConfigured: {
            message: "ยังไม่เปิดใช้งานการเข้าสู่ระบบด้วยโซเชียล"
        },
        oauthTokenInvalid: {
            message: "เข้าสู่ระบบด้วยโซเชียลไม่สำเร็จ กรุณาลองใหม่"
        },
        oauthUsernameConflict: {
            message: "สร้างชื่อบัญชีไม่สำเร็จ กรุณาสมัครด้วยตนเอง"
        },
        wrongPassword: {
            message: "รหัสผ่านไม่ถูกต้อง"
        },
        userNotExits: {
            message: "บัญชีนี้ยังไม่ได้ลงทะเบียน"
        },
        userNotExitsFilter: {
            message: "ไม่พบผู้ใช้นี้"
        },
        loginSucess: {
            message: "เข้าสู่ระบบสำเร็จ"
        },
        verifySucess: {
            message: "ยืนยัน 2FA สำเร็จ"
        },
        chargingProcessing: {
            message: "ได้รับคำขอเติมเงินแล้ว กำลังดำเนินการ"
        },
        chargingError: {
            message: "เติมเงินไม่สำเร็จ"
        },
        UserNotValid: {
            message: "ผู้รับไม่ถูกต้อง"
        },
        NotEnoughMoneyToTransfer: {
            message: "ยอดเงินในบัญชีไม่เพียงพอ"
        },
        NotValidAmount: {
            message: "จำนวนเงินที่โอนไม่ถูกต้อง"
        },
        AuthPassChangeNotValid: {
            message: "รหัสผ่านไม่ถูกต้อง"
        },
        NotValidPermission: {
            message: "ไม่มีสิทธิ์ดำเนินการคำขอนี้"
        }
    },
    Category: {
        createSuccess: {
            message: "สร้างโฟลเดอร์สำเร็จ"
        },
        deleteSuccess: {
            message: "ลบโฟลเดอร์สำเร็จ"
        },
        updateSuccess: {
            message: "แก้ไขโฟลเดอร์สำเร็จ"
        },
        exitsCategory: {
            message: "มีโฟลเดอร์นี้อยู่แล้ว"
        },
        noDeleteCategory: {
            message: "ไม่สามารถลบโฟลเดอร์นี้ได้"
        },
        notFoundCategory: {
            message: "ไม่พบโฟลเดอร์นี้"
        }
    },
    Group: {
        createSuccess: {
            message: "สร้างกลุ่มสำเร็จ"
        },
        tranferSuccess: {
            message: "ย้ายกลุ่มสำเร็จ"
        },
        limitedUser: {
            message: "กลุ่มนี้เต็มแล้ว ไม่สามารถเข้าร่วมได้"
        },
        updateSuccess: {
            message: "อัปเดตสำเร็จ"
        },
        cantJoinDuplicate: {
            message: "คุณไม่สามารถเข้าร่วมกลุ่มนี้ได้"
        },
        groupJoined: {
            message: "คุณเข้าร่วมกลุ่มนี้แล้ว"
        },
        groupUnjoined: {
            message: "คุณยังไม่ได้เข้าร่วมกลุ่มนี้"
        },
        userUnjoined: {
            message: "ผู้ใช้ยังไม่ได้เข้าร่วมกลุ่ม"
        },
        groupNotExits: {
            message: "ไม่พบกลุ่มนี้ หรือคุณไม่มีสิทธิ์เข้าถึง"
        },
        notEnoughCoin: {
            message: "ยอดเงินไม่พอ กรุณาเติมเงิน"
        },
        invalidCategory: {
            message: "สินค้าไม่ถูกต้อง"
        },
        renewSuccess: {
            message: "ต่ออายุสำเร็จ"
        },
        notRoll: {
            message: "คุณยังไม่ได้เช็คอิน"
        },
        Rolled: {
            message: "คุณเช็คอินแล้ว"
        },
        rollSuccess: {
            message: "เช็คอินสำเร็จ"
        },
        unRollSuccess: {
            message: "ยกเลิกเช็คอินสำเร็จ"
        },
        removeSuccess: {
            message: "ลบกลุ่มสำเร็จ"
        },
        addLinkSuccess: {
            message: "เพิ่มลิงก์สำเร็จ"
        },
        uidDie: {
            message: "UID ใช้งานไม่ได้"
        },
        removeLinkSuccess: {
            message: "ลบลิงก์สำเร็จ"
        },
        resetRollSuccess: {
            message: "รีเซ็ตเช็คอินสำเร็จ"
        },
        deleteGroup: {
            message: "ลบกลุ่มสำเร็จ"
        }
    },
    Posts: {
        createSuccess: {
            message: "สร้างบทความสำเร็จ"
        },
        notFoundPost: {
            message: "ไม่พบบทความนี้"
        },
        updateSuccess: {
            message: "อัปเดตสำเร็จ"
        }
    },
    Comments: {
        createCommentSuccess: {
            message: "เพิ่มความคิดเห็นสำเร็จ"
        }
    },
    News: {
        createSuccess: {
            message: "เพิ่มข่าวสารสำเร็จ"
        }
    },
    Clone: {
        maitainingSystem: {
            message: "เซิร์ฟเวอร์กำลังอัปเดต กรุณาลองใหม่ภายหลัง…"
        },
        notPermissionAccess: {
            message: "ไม่มีสิทธิ์เข้าถึงข้อมูลนี้"
        },
        notValidTimeout: {
            message: "กรุณารอ 5 นาทีก่อนตรวจสอบ"
        },
        errorAddress: {
            message: "โหลดที่อยู่กระเป๋าเงินไม่สำเร็จ… กรุณาติดต่อผู้ดูแลระบบเพื่อเติมเงิน"
        },
        soldOutClone: {
            message: "จำนวน Clone ไม่เพียงพอ"
        },
        soldCloneSuccess: {
            message: "ซื้อสำเร็จ"
        },
        delCloneSuccess: {
            message: "ลบไฟล์สำเร็จ"
        },
        uploadSuccess: {
            message: "เพิ่มบัญชีสำเร็จ"
        }
    },
    Product: {
        existedProduct: {
            message: "มีสินค้าที่ใช้ UID นี้อยู่แล้ว"
        },
        AdditionSuccess: {
            message: "เพิ่มสินค้าสำเร็จ"
        }
    }
}
