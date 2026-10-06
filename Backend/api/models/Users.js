/**
 * Users.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
    tableName: 'Users',
    attributes: {
        username: {
            type: 'string',
            required: true,
            minLength: 6,
            maxLength: 25,
        },
        password: {
            type: 'string',
            required: true,
            minLength: 6,
        },
        status: {
            // 1 = hoạt động; 2 = bị khoá do vi phạm (ModerationController.ban).
            // Khác 1 là không đăng nhập, không đăng ký lại được (API trả 423).
            type: "number",
            defaultsTo: 1
        },
        warningCount: {
            type: "number",
            defaultsTo: 0,
            description: 'Số lần bị cảnh cáo, tối đa 5'
        },
        bannedAt: {
            type: "number",
            defaultsTo: 0
        },
        bannedReason: {
            type: "string",
            defaultsTo: ""
        },
        bannedById: {
            type: "string",
            defaultsTo: ""
        },
        email: {
            type: "string",
            defaultsTo: ""
        },
        fullName: {
            type: "string",
            defaultsTo: ""
        },
        address: {
            type: "string",
            defaultsTo: ""
        },
        phone: {
            type: "string",
            defaultsTo: ""
        },
        gender: {
            type: "string",
            defaultsTo: ""
        },
        role: {
            type: "string",
            // Danh sách lấy từ config/roles.js - sửa ở một chỗ thì sửa cả hai.
            // Waterline chỉ kiểm isIn lúc ghi nên dữ liệu cũ không bị chặn;
            // cũng không cần chặn, vì roles.can() coi vai trò lạ là không có quyền gì.
            isIn: ['User', 'Partner', 'Moderator', 'Manager', 'Admin'],
            defaultsTo: "User"
        },
        is2FAEnabled: {
            type: "boolean",
            defaultsTo: false
        },
        googleId: {
            type: "string",
            defaultsTo: ""
        },
        facebookId: {
            type: "string",
            defaultsTo: ""
        },
        /**
         * Đã điền xong hồ sơ Phật tử (bảng UserProfile) hay chưa.
         *
         * Nằm ở đây chứ không suy ra từ việc "có bản ghi UserProfile không":
         * policy userPolices đã đọc sẵn bản ghi Users cho mọi request có token,
         * nên đọc cờ này không tốn thêm truy vấn nào. Tài khoản tạo bằng
         * Google/Facebook mặc định false -> FrontEnd đẩy thẳng vào form khảo sát.
         *
         * Bỏ dở form giữa chừng thì cờ vẫn false và lần đăng nhập sau lại hỏi
         * tiếp - đúng ý đồ, chứ không phải lỗi.
         */
        profileCompleted: {
            type: "boolean",
            defaultsTo: false
        },
        /**
         * Tài khoản tự đăng ký bằng tên đăng nhập + mật khẩu + số điện thoại
         * (POST /v1/user/register): chưa có gì xác minh người này là ai - số
         * điện thoại chỉ được kiểm đúng định dạng, chưa gửi OTP. Google /
         * Facebook thì nhà cung cấp đã xác minh nên luôn false.
         */
        isNotVerified: {
            type: "boolean",
            defaultsTo: false
        }
    },
    beforeCreate: async function(userAccount, proceed) {
        let { password, username } = userAccount
        Users.findOne({ username }).then((result) => {
            if (result) {
                return Promise.reject({
                    messageNode: 'Users',
                    message: 'usernameAlreadyInUse'
                })
            }
            return sails.helpers.passwords.hashPassword(password)
        }).then((result) => {
            userAccount.password = result
            return proceed()
        }).catch((err) => {
            return proceed(err)
        });
    },

};
