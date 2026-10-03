/**
 * PermissionAuditLog.js
 *
 * @description :: Nhật ký chỉnh quyền của vai trò.
 *
 * Tách khỏi RoleAuditLog vì đối tượng khác hẳn: bên kia là một tài khoản đổi
 * vai trò, bên này là cả một vai trò đổi quyền - ảnh hưởng tới mọi người đang
 * mang vai trò đó cùng lúc. Ghi phần THÊM và BỚT chứ không chỉ bản mới, để
 * đọc nhật ký là thấy ngay ai đã mở thêm cửa nào.
 */

module.exports = {

    tableName: 'PermissionAuditLog',
    attributes: {
        role: {
            type: 'string',
            required: true,
        },
        added: {
            type: 'json',
            defaultsTo: [],
        },
        removed: {
            type: 'json',
            defaultsTo: [],
        },
        reset: {
            type: 'boolean',
            defaultsTo: false,
            description: 'true = lần này là "Khôi phục mặc định"'
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
        },
        ip: {
            type: 'string',
            defaultsTo: '',
        }
    },

};
