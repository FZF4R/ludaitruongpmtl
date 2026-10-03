/**
 * ContentRevision.js
 *
 * @description :: Nội dung đã thay đổi của bài ở từng lần thao tác - để đối chiếu.
 *
 * Tách khỏi ContentAuditLog vì kích thước: một dòng nhật ký chỉ vài trăm byte,
 * còn một bản sửa có thể mang cả thân bài trước và sau (vài chục KB). Danh
 * sách lịch sử chỉ đọc nhật ký; nội dung ở đây chỉ tải khi người xem bấm mở
 * đúng lần sửa đó.
 *
 *   create: mỗi trường có `before: null`, `after` = giá trị lúc tạo
 *   update: chỉ các trường đã đổi, đủ cả `before` lẫn `after`
 *   delete: toàn bộ nội dung lúc xoá ở `before`, `after: null` - bài xoá rồi
 *           vẫn đọc lại được
 *
 * Chỉ ghi thêm, không sửa, không xoá.
 */

module.exports = {

    tableName: 'ContentRevision',
    attributes: {
        contentId: {
            type: 'string',
            required: true,
        },
        logId: {
            type: 'string',
            required: true,
            description: 'ContentAuditLog.id của lần thao tác này'
        },
        action: {
            type: 'string',
            isIn: ['create', 'update', 'delete'],
            required: true,
        },
        changes: {
            type: 'json',
            defaultsTo: [],
            description: '[{ field, before, after }]'
        }
    },

};
