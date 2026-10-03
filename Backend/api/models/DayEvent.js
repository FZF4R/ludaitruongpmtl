/**
 * DayEvent.js
 *
 * @description :: Sự kiện admin gắn vào một ngày dương cụ thể trên lịch
 *                 (tiêu đề ngắn, ảnh, nội dung chính hiện ở tooltip và khi bấm
 *                 vào ngày). Khác LunarEvent (ngày vía âm lịch lặp hằng năm).
 */

module.exports = {

    tableName: 'DayEvent',
    attributes: {
        date: {
            type: 'string',
            required: true,
            description: 'YYYY-MM-DD (dương lịch)'
        },
        title: {
            type: 'string',
            required: true,
            description: 'Tối đa 80 ký tự'
        },
        imageUrl: {
            type: 'string',
            defaultsTo: '',
        },
        body: {
            type: 'string',
            defaultsTo: '',
            description: 'Nội dung chính, chữ thuần, tối đa 3000 ký tự'
        },
        createdById: { type: 'string', defaultsTo: '' },
        updatedById: { type: 'string', defaultsTo: '' },
        updatedByName: { type: 'string', defaultsTo: '' }
    },

};
