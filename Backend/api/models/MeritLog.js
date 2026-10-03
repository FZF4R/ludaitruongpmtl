/**
 * MeritLog.js
 *
 * @description :: Sổ công đức: mỗi dòng là một lần được cộng điểm (điểm danh,
 *                 bình luận, bài được duyệt, bài đạt mốc lượt xem, tu tập...).
 *                 Tổng công đức = tổng `points`. Ghi qua api/utils/congDuc.js -
 *                 nơi áp bảng điểm, giới hạn mỗi ngày và chống cộng trùng.
 */

module.exports = {

    tableName: 'MeritLog',
    attributes: {
        userId: {
            type: 'string',
            required: true,
        },
        action: {
            type: 'string',
            required: true,
            description: 'Khoá trong bảng điểm (api/utils/congDuc.js QUY_TAC_MAC_DINH)'
        },
        points: {
            type: 'number',
            required: true,
        },
        refId: {
            type: 'string',
            defaultsTo: '',
            description: 'Thứ được cộng điểm (id bài, id bình luận, "contentId:mốc"...). Có refId thì mỗi (userId, action, refId) chỉ cộng một lần.'
        },
        dayKey: {
            type: 'string',
            required: true,
            description: 'Ngày theo giờ Việt Nam (YYYY-MM-DD) - để tính giới hạn mỗi ngày'
        }
    },

};
