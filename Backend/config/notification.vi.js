/**
 * notification.vi.js
 *
 * Bản dịch thông báo trả về cho client, cùng cấu trúc với config/notification.js.
 * responseToClient.js đọc file này theo ngôn ngữ của request (header x-language).
 */

module.exports.notificationVi = {
    FacebookServices: {
        loginError: {
            message: "Lỗi đăng nhập"
        },
        serviceNotFound: {
            message: "Lỗi load services"
        },
        userNotValid: {
            message: "Người dùng không hợp lệ"
        },
        ServiceNotValid: {
            message: "Dịch vụ chọn không hợp lệ"
        },
        ServiceTokenNotValid: {
            message: "Token lỗi... Vui lòng liên hệ Admin để cập nhật"
        }
    },
    GlobalNotifications: {
        success: {
            message: "Thành công"
        },
        error: {
            message: "Xảy ra lỗi"
        },
        emptyMessage: {
            message: ""
        },
        successSignUp: {
            message: "Đăng kí thành công"
        },
        successRemove: {
            message: "Xóa thành công"
        },
        invalidInputParam: {
            message: "Thông tin nhập vào không hợp lệ"
        },
        errorWhileProcess: {
            message: "Có lỗi xảy ra, vui lòng thử lại!"
        },
        CryptKeyInvalid: {
            message: "Key mã hóa không đúng, vui lòng đăng nhập lại!"
        },
        invalidSig: {
            message: "Invalid Sig!"
        },
        permisionDenined: {
            message: "Không có quyền truy cập"
        }
    },
    Users: {
        notHaveTransaction: {
            message: "Chưa có giao dịch"
        },
        downloadBackup: {
            message: "Tải backup thành công"
        },
        chargeSuccess: {
            message: "Nạp tiền thành công"
        },
        usernameAlreadyInUse: {
            message: "Tài khoản đã có người sử dụng"
        },
        submitUrlSuccess: {
            message: "Xác thực link Facebook thành công"
        },
        addRefFailed: {
            message: "Không thể thay đổi thông tin này"
        },
        addRefSuccess: {
            message: "Thêm ref thành công"
        },
        cantDetectFacebook: {
            message: "Xác thực link Facebook thất bại"
        },
        needUpdateUid: {
            message: "Bạn cần xác thực link Facebook"
        },
        userBanned: {
            message: "Người dùng đã bị khóa"
        },
        fbIdAlreadyInUse: {
            message: "FB ID có người sử dụng"
        },
        registerSucess: {
            message: "Đăng ký thành công"
        },
        registerInvalid: {
            message: "Thông tin tài khoản không hợp lệ"
        },
        loginInvalid: {
            message: "Thông tin tài khoản không hợp lệ"
        },
        registerInvalidCharacter: {
            message: "Tên tài khoản chỉ chứa chữ cái và số"
        },
        captchaRequired: {
            message: "Vui lòng xác nhận bạn không phải là robot"
        },
        captchaInvalid: {
            message: "Xác thực captcha thất bại, vui lòng thử lại"
        },
        oauthNotConfigured: {
            message: "Đăng nhập mạng xã hội chưa được kích hoạt"
        },
        oauthTokenInvalid: {
            message: "Đăng nhập mạng xã hội thất bại, vui lòng thử lại"
        },
        oauthUsernameConflict: {
            message: "Không tạo được tên tài khoản, vui lòng đăng ký thủ công"
        },
        profileNameRequired: {
            message: "Vui lòng nhập họ tên"
        },
        wrongPassword: {
            message: "Sai mật khẩu"
        },
        userNotExits: {
            message: "Tài khoản chưa đăng ký"
        },
        userNotExitsFilter: {
            message: "Người dùng không tồn tại"
        },
        loginSucess: {
            message: "Đăng nhập thành công"
        },
        verifySucess: {
            message: "Xác nhận 2FA thành công"
        },
        chargingProcessing: {
            message: "Đã nhận được yêu cầu nạp, đang được xử lý"
        },
        chargingError: {
            message: "Nạp tiền thất bại"
        },
        UserNotValid: {
            message: "Người nhận không hợp lệ"
        },
        NotEnoughMoneyToTransfer: {
            message: "Tài khoản không đủ"
        },
        NotValidAmount: {
            message: "Số tiền chuyển không hợp lệ"
        },
        AuthPassChangeNotValid: {
            message: "Mật khẩu không hợp lệ"
        },
        NotValidPermission: {
            message: "Không có quyền thực hiện yêu cầu"
        }
    },
    Category: {
        createSuccess: {
            message: "Tạo thư mục thành công"
        },
        deleteSuccess: {
            message: "Xoá thư mục thành công"
        },
        updateSuccess: {
            message: "Chỉnh sửa thư mục thành công"
        },
        exitsCategory: {
            message: "Đã tồn tại thư mục"
        },
        noDeleteCategory: {
            message: "Không thể xoá thư mục này"
        },
        notFoundCategory: {
            message: "Không tìm thấy thư mục này"
        }
    },
    Group: {
        createSuccess: {
            message: "Tạo nhóm thành công"
        },
        tranferSuccess: {
            message: "Chuyển nhóm thành công"
        },
        limitedUser: {
            message: "Group này đã đủ người, không thể tham gia"
        },
        updateSuccess: {
            message: "Cập nhật thành công"
        },
        cantJoinDuplicate: {
            message: "Bạn không thể tham gia nhóm này"
        },
        groupJoined: {
            message: "Bạn đã tham gia nhóm này"
        },
        groupUnjoined: {
            message: "Bạn chưa tham gia nhóm này"
        },
        userUnjoined: {
            message: "Người dùng chưa tham gia nhóm"
        },
        groupNotExits: {
            message: "Nhóm không tồn tại hoặc bạn không có quyền truy cập"
        },
        notEnoughCoin: {
            message: "Không đủ coin, vui lòng nạp coin"
        },
        invalidCategory: {
            message: "Sản phẩm không hợp lệ"
        },
        renewSuccess: {
            message: "Gia hạn thành công"
        },
        notRoll: {
            message: "Bạn chưa điểm danh"
        },
        Rolled: {
            message: "Bạn đã điểm danh"
        },
        rollSuccess: {
            message: "Điểm danh thành công"
        },
        unRollSuccess: {
            message: "Hủy Điểm danh thành công"
        },
        removeSuccess: {
            message: "Xóa nhóm thành công"
        },
        addLinkSuccess: {
            message: "Thêm link thành công"
        },
        uidDie: {
            message: "UID DIE"
        },
        removeLinkSuccess: {
            message: "Xóa link thành công"
        },
        resetRollSuccess: {
            message: "Reset điểm danh thành công"
        },
        deleteGroup: {
            message: "Xóa nhóm thành công"
        }
    },
    Posts: {
        createSuccess: {
            message: "Tạo bài viết thành công"
        },
        notFoundPost: {
            message: "Không tìm thấy bài viết"
        },
        updateSuccess: {
            message: "Cập nhật thành công"
        }
    },
    Comments: {
        createCommentSuccess: {
            message: "Thêm bình luận thành công"
        }
    },
    News: {
        createSuccess: {
            message: "Thêm tin tức thành công"
        }
    },
    Clone: {
        maitainingSystem: {
            message: "Server đang được cập nhật. Vui lòng thử lại sau..."
        },
        notPermissionAccess: {
            message: "Không được cấp quyền truy cập thông tin này"
        },
        notValidTimeout: {
            message: "Pending 5 minutes to checking"
        },
        errorAddress: {
            message: "Lỗi load địa chỉ ví... Vui lòng liên hệ Admin để nạp tiền"
        },
        soldOutClone: {
            message: "Không đủ số Clone để bán cho bạn"
        },
        soldCloneSuccess: {
            message: "Mua thành công"
        },
        delCloneSuccess: {
            message: "Xóa File thành công"
        },
        uploadSuccess: {
            message: "Thêm account thành công"
        }
    },
    Product: {
        existedProduct: {
            message: "Sản phẩm đã tồn tại với UID"
        },
        AdditionSuccess: {
            message: "Thêm sản phẩm thành công"
        }
    }
}
