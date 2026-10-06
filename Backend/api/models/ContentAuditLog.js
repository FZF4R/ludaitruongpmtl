/**
 * ContentAuditLog.js
 *
 * @description :: Nhật ký mọi thao tác trên một bài (bài viết, kinh sách...).
 *
 * Chỉ ghi thêm, không bao giờ sửa hay xoá - kể cả khi bài bị xoá hẳn, nhật ký
 * vẫn còn (kèm tiêu đề, slug chụp lại lúc đó) để trả lời "ai đã xoá bài này,
 * lúc nào". Ghi cả tên người thao tác chứ không chỉ id, để nhật ký còn đọc
 * được sau khi tài khoản đổi tên hoặc bị xoá.
 */

module.exports = {

    tableName: 'ContentAuditLog',
    attributes: {
        contentId: {
            type: 'string',
            required: true,
        },
        contentTitle: {
            type: 'string',
            defaultsTo: '',
            description: 'Tiêu đề lúc thao tác'
        },
        contentSlug: {
            type: 'string',
            defaultsTo: '',
        },
        action: {
            type: 'string',
            isIn: ['create', 'update', 'status', 'delete', 'import'],
            required: true,
        },
        fromStatus: {
            type: 'string',
            defaultsTo: '',
        },
        toStatus: {
            type: 'string',
            defaultsTo: '',
        },
        changedFields: {
            type: 'json',
            defaultsTo: [],
            description: 'Các trường đã đổi khi action = update'
        },
        actorId: {
            type: 'string',
            required: true,
        },
        actorUsername: {
            type: 'string',
            defaultsTo: '',
        },
        actorName: {
            type: 'string',
            defaultsTo: '',
        },
        ip: {
            type: 'string',
            defaultsTo: '',
        }
    },

};
