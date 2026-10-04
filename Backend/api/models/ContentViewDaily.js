/**
 * ContentViewDaily.js
 *
 * @description :: Lượt xem từng bài theo ngày (giờ Việt Nam) - để trang quản
 *                 trị hiện "lượt xem hôm nay", "7 ngày". Mỗi (contentId, dayKey)
 *                 một bản ghi, tăng nguyên tử bằng $inc (Public/ContentController.addView).
 *                 Tổng lượt xem vẫn ở Content.viewCount.
 */

module.exports = {

    tableName: 'ContentViewDaily',
    attributes: {
        contentId: { type: 'string', required: true },
        dayKey: { type: 'string', required: true, description: 'YYYY-MM-DD' },
        n: { type: 'number', defaultsTo: 0 }
    },

};
