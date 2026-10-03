/**
 * RolePermission.js
 *
 * @description :: Quyền đã chỉnh tay của một vai trò, mỗi vai trò tối đa một bản ghi.
 *
 * Vai trò chưa có bản ghi thì dùng bản mặc định trong config/roles.js. Xoá bản
 * ghi = khôi phục mặc định. `permissions` là tập ĐẦY ĐỦ (không cộng dồn với
 * bậc dưới) nên đọc một bản ghi là biết ngay vai trò đó làm được gì.
 */

module.exports = {

    tableName: 'RolePermission',
    attributes: {
        role: {
            type: 'string',
            required: true,
        },
        permissions: {
            type: 'json',
            defaultsTo: [],
        },
        updatedById: {
            type: 'string',
            defaultsTo: '',
        },
        updatedByUsername: {
            type: 'string',
            defaultsTo: '',
        }
    },

};
