/**
 * HeroImageController (công khai)
 *
 * Danh sách ảnh xoay vòng trang chủ và nội dung từng ảnh.
 */

const { dinhDangAnh: dinhDang } = require('../../../utils/heroImage')

module.exports = {

    listImages: ({
        inputs: {},
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                // Không lấy `data`: danh sách chỉ cần kích thước, ảnh tải qua getFile.
                // Truy vấn Mongo trực tiếp vì app để schema:false, Waterline không
                // cho `select`/`omit` - mà lấy cả `data` thì mỗi lượt là vài MB.
                let ds = await HeroImage.getDatastore().manager.collection(HeroImage.tableName)
                    .find({}, { projection: { data: 0 } })
                    .sort({ order: 1, createdAt: 1 })
                    .toArray()
                ds = ds.map(row => Object.assign({}, row, { id: String(row._id) }))

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: ds.map(dinhDang)
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    /**
     * Trả nguyên tệp ảnh. id đổi khi ảnh đổi (sửa ảnh = xoá rồi thêm mới), nên
     * cache vĩnh viễn được: trình duyệt và bộ tối ưu ảnh của Next không phải
     * hỏi lại.
     */
    getFile: async function (req, res) {
        try {
            let anh = await HeroImage.findOne({ id: req.param('id') })
            if (!anh) return res.status(404).send('Not found')

            res.set('Content-Type', anh.mime)
            res.set('Cache-Control', 'public, max-age=31536000, immutable')
            return res.send(Buffer.from(anh.data, 'base64'))
        } catch (err) {
            // id sai định dạng ObjectId cũng rơi vào đây.
            return res.status(404).send('Not found')
        }
    },

};
