/**
 * MediaFile.js
 *
 * @description :: Ảnh / âm thanh người dùng tải lên khi soạn bài và nội dung
 *                 thư viện (ảnh bìa, album ảnh, nhạc thiền, audio kinh). Lưu
 *                 base64 như HeroImage / PracticeSound; phát qua
 *                 GET /v1/public/media/:id/file (cache vĩnh viễn, hỗ trợ Range).
 */

module.exports = {

    tableName: 'MediaFile',
    attributes: {
        userId: {
            type: 'string',
            required: true,
        },
        kind: {
            type: 'string',
            isIn: ['image', 'audio'],
            required: true,
        },
        mime: {
            type: 'string',
            required: true,
        },
        data: {
            type: 'string',
            required: true,
            description: 'base64'
        },
        sizeBytes: {
            type: 'number',
            defaultsTo: 0,
        },
        name: {
            type: 'string',
            defaultsTo: '',
        }
    },

};
