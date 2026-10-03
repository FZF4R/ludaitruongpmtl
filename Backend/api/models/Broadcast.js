/**
 * Broadcast.js
 *
 * @description :: Lịch sử các lần gửi thông báo tới toàn bộ người dùng
 *                 (System/Admin/BroadcastController). Bản thông báo từng người
 *                 nằm ở UserNotification (type = broadcast).
 */

module.exports = {

    tableName: 'Broadcast',
    attributes: {
        title: { type: 'string', required: true },
        body: { type: 'string', defaultsTo: '' },
        link: { type: 'string', defaultsTo: '' },
        recipients: { type: 'number', defaultsTo: 0 },
        createdById: { type: 'string', defaultsTo: '' },
        createdByName: { type: 'string', defaultsTo: '' }
    },

};
