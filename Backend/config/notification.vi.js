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
    Content: {
        contentForbidden: {
            message: "Bạn không có quyền thao tác với nội dung này"
        },
        libraryKindRequired: {
            message: "Chọn danh mục thư viện"
        },
        contentImportEmpty: {
            message: "Không có bài nào để nhập"
        },
        contentImportTooMany: {
            message: "Mỗi lần gửi tối đa 50 bài"
        },
        libraryKindAdminOnly: {
            message: "Danh mục này chỉ ban quản trị đăng được"
        },
        contentNoChanges: {
            message: "Không có gì thay đổi"
        },
        contentEditProposed: {
            message: "Đã gửi đề xuất sửa cho tác giả, chờ tác giả đồng ý"
        },
        contentHasProposal: {
            message: "Bài đang có đề xuất sửa của ban biên tập - hãy đồng ý hoặc từ chối trước khi sửa tiếp"
        },
        contentTooMany: {
            message: "Bạn đã tạo quá nhiều bài hôm nay, vui lòng quay lại ngày mai"
        },
        contentInvalid: {
            message: "Nội dung không hợp lệ"
        },
        contentSubmitted: {
            message: "Đã gửi bài, chờ ban kiểm duyệt duyệt"
        },
        contentSaved: {
            message: "Đã lưu"
        },
        contentProposalAccepted: {
            message: "Đã đồng ý bản sửa"
        },
        contentProposalRejected: {
            message: "Đã từ chối bản sửa"
        },
        mediaInvalid: {
            message: "Tệp không hợp lệ (ảnh JPG, PNG, WEBP, GIF hoặc âm thanh MP3, WAV, OGG, M4A)"
        },
        mediaTooLarge: {
            message: "Tệp quá lớn (ảnh tối đa 4 MB, âm thanh tối đa 10 MB)"
        },
        mediaTooMany: {
            message: "Bạn đã tải lên quá nhiều tệp hôm nay"
        },
        contentNotFound: {
            message: "Không tìm thấy bài"
        },
        contentTypeInvalid: {
            message: "Loại nội dung không hợp lệ"
        },
        contentTitleRequired: {
            message: "Vui lòng nhập tiêu đề"
        },
        contentSlugInvalid: {
            message: "Đường dẫn chỉ gồm chữ thường, số và dấu gạch ngang"
        },
        contentSlugTaken: {
            message: "Đường dẫn này đã có bài khác dùng"
        },
        sutraForbidden: {
            message: "Chỉ Quản trị viên và Quản lý được thêm, sửa kinh sách"
        },
        sutraSourceRequired: {
            message: "Kinh sách bắt buộc ghi nguồn tham khảo"
        },
        contentStatusInvalid: {
            message: "Trạng thái không hợp lệ"
        },
        contentCreated: {
            message: "Đã tạo bài"
        },
        contentUpdated: {
            message: "Đã lưu bài"
        },
        contentStatusChanged: {
            message: "Đã đổi trạng thái"
        },
        contentDeleted: {
            message: "Đã xoá bài"
        },
    },
    Settings: {
        notifyTextRequired: {
            message: "Vui lòng nhập nội dung câu"
        },
        notifyIndexInvalid: {
            message: "Câu này không còn nữa, hãy tải lại trang"
        },
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
        usernameLength: {
            message: "Tên đăng nhập dài từ 6 đến 25 ký tự"
        },
        passwordLength: {
            message: "Mật khẩu dài từ 6 đến 100 ký tự"
        },
        phoneInvalid: {
            message: "Số điện thoại không hợp lệ"
        },
        phoneTaken: {
            message: "Số điện thoại này đã có tài khoản khác dùng"
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
        emailInvalid: {
            message: "Địa chỉ email không hợp lệ"
        },
        emailTaken: {
            message: "Email này đã có tài khoản khác dùng"
        },
        roleSelfChange: {
            message: "Không thể tự đổi vai trò của chính mình"
        },
        roleNotAssignable: {
            message: "Bạn không được phép gán vai trò này"
        },
        roleLastAdmin: {
            message: "Hệ thống phải luôn còn ít nhất một Quản lý"
        },
        rolePermissionLocked: {
            message: "Quyền của vai trò Quản lý luôn đầy đủ, không chỉnh được"
        },
        rolePermissionForbidden: {
            message: "Bạn chỉ chỉnh được quyền của vai trò thấp hơn mình"
        },
        permissionNotGrantable: {
            message: "Không thể cấp quyền mà chính bạn không có"
        },
        prayerInvalid: {
            message: "Lời cầu nguyện phải dài từ 2 đến 500 ký tự"
        },
        prayerOncePerDay: {
            message: "Mỗi ngày bạn viết được tối đa 3 lời cầu nguyện. Hẹn bạn ngày mai"
        },
        prayerNotFound: {
            message: "Không tìm thấy lời cầu nguyện"
        },
        prayerForbidden: {
            message: "Bạn chỉ xoá được lời cầu nguyện của chính mình"
        },
        avatarInvalid: {
            message: "Ảnh đại diện không hợp lệ (chỉ nhận JPG, PNG, WebP dưới 1MB)"
        },
        commentFlagged: {
            message: "Bình luận của bạn chứa từ ngữ không phù hợp nên chưa được hiển thị"
        },
        moderationSelf: {
            message: "Không thể tự xử lý tài khoản của chính mình"
        },
        moderationRank: {
            message: "Bạn chỉ xử lý được tài khoản có vai trò thấp hơn mình"
        },
        moderationWarnLimit: {
            message: "Tài khoản này đã nhận đủ 5 lần cảnh cáo"
        },
        feedbackThanks: {
            message: "Cảm ơn bạn đã gửi góp ý. Ban quản trị sẽ xem xét sớm."
        },
        feedbackInvalid: {
            message: "Nội dung góp ý phải dài từ 5 đến 2000 ký tự"
        },
        feedbackTooMany: {
            message: "Bạn đã gửi khá nhiều góp ý, vui lòng thử lại sau ít phút"
        },
        feedbackNotFound: {
            message: "Không tìm thấy góp ý"
        },
        soundInvalid: {
            message: "Thông tin âm thanh không hợp lệ"
        },
        soundFileInvalid: {
            message: "Tệp âm thanh không hợp lệ (MP3, WAV, OGG, M4A dưới 5,5MB) hoặc link không đúng"
        },
        soundTooMany: {
            message: "Mục này đã có quá nhiều âm thanh (tối đa 50)"
        },
        soundNotFound: {
            message: "Không tìm thấy âm thanh"
        },
        practiceSessionInvalid: {
            message: "Phiên tu tập không hợp lệ hoặc đã lưu, hãy bắt đầu lại"
        },
        practicePresetTooMany: {
            message: "Bạn đã lưu quá nhiều bộ cấu hình (tối đa 30)"
        },
        practiceAudioInvalid: {
            message: "Tệp âm thanh không hợp lệ (MP3, M4A, WAV, OGG dưới 10 MB)"
        },
        practiceAudioTooMany: {
            message: "Bạn đã tải tối đa 10 tệp nhạc, hãy xoá bớt trước khi tải thêm"
        },
        practiceLogInvalid: {
            message: "Số liệu tu tập không hợp lệ"
        },
        commentLimitPost: {
            message: "Bạn đã bình luận tối đa 5 lần ở bài này"
        },
        commentLimitDay: {
            message: "Bạn đã đạt giới hạn bình luận trong ngày, vui lòng quay lại ngày mai"
        },
        meritInvalid: {
            message: "Thông tin không hợp lệ"
        },
        broadcastInvalid: {
            message: "Thông báo cần tiêu đề; đường dẫn phải bắt đầu bằng / hoặc http(s)://"
        },
        dayEventInvalid: {
            message: "Sự kiện không hợp lệ (cần ngày, tiêu đề tối đa 80 ký tự; tối đa 10 sự kiện mỗi ngày)"
        },
        moderationNoWarning: {
            message: "Tài khoản này không còn cảnh cáo nào"
        },
        prayerFlagged: {
            message: "Lời nguyện chứa từ ngữ chưa phù hợp, đang chờ ban quản trị duyệt"
        },
        reportSelf: {
            message: "Không thể báo cáo bình luận của chính bạn"
        },
        reportDuplicate: {
            message: "Bạn đã báo cáo bình luận này rồi"
        },
        reportLimit: {
            message: "Bạn đã báo cáo tối đa 20 bình luận hôm nay"
        },
        reportSent: {
            message: "Đã gửi báo cáo, ban kiểm duyệt sẽ xem xét"
        },
        commentInvalid: {
            message: "Bình luận phải dài từ 2 đến 2000 ký tự"
        },
        commentTooFast: {
            message: "Bạn vừa bình luận, vui lòng đợi giây lát rồi gửi tiếp"
        },
        commentNotFound: {
            message: "Không tìm thấy bài viết hoặc bình luận"
        },
        commentForbidden: {
            message: "Bạn chỉ xoá được bình luận của chính mình"
        },
        heroImageInvalid: {
            message: "Ảnh không hợp lệ (chỉ nhận JPG, PNG, WebP dưới 5MB)"
        },
        heroImageTooMany: {
            message: "Đã đủ 12 ảnh, hãy xoá bớt trước khi thêm"
        },
        siteTextInvalid: {
            message: "Nội dung không hợp lệ hoặc quá dài (tối đa 2000 ký tự)"
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
