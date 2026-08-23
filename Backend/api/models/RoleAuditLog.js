/**
 * RoleAuditLog.js
 *
 * @description :: Nhật ký đổi vai trò người dùng.
 *
 * Đổi vai trò là thao tác đặc quyền cao nhất trong hệ. Không ghi lại thì không
 * có cách nào trả lời "ai đã cho người này quyền xuất bản, và lúc nào".
 * Ghi cả tên tài khoản chứ không chỉ id để nhật ký còn đọc được sau khi tài
 * khoản bị xoá hoặc đổi tên.
 */

module.exports = {

    tableName: 'RoleAuditLog',
    attributes: {
        targetUserId: {
            type: 'string',
            required: true,
        },
        targetUsername: {
            type: 'string',
            defaultsTo: '',
        },
        oldRole: {
            type: 'string',
            defaultsTo: '',
        },
        newRole: {
            type: 'string',
            defaultsTo: '',
        },
        actorId: {
            type: 'string',
            required: true,
        },
        actorUsername: {
            type: 'string',
            defaultsTo: '',
        },
        reason: {
            type: 'string',
            defaultsTo: '',
            description: 'Lý do người thao tác ghi lại lúc đổi vai trò'
        },
        ip: {
            type: 'string',
            defaultsTo: '',
            description: 'IP client, ưu tiên X-Forwarded-For vì API chạy sau nginx'
        }
    },

};
