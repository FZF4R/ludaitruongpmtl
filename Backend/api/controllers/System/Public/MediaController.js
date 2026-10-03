/**
 * MediaController (công khai): trả tệp người dùng đã tải lên. id không đổi
 * theo nội dung (tệp mới = id mới) nên cache vĩnh viễn. Hỗ trợ Range để tua audio.
 */
module.exports = {

    getFile: async function (req, res) {
        try {
            let { ObjectId } = require('mongodb')
            let id = String(req.param('id'))
            let row = ObjectId.isValid(id)
                ? await MediaFile.getDatastore().manager.collection(MediaFile.tableName).findOne({ _id: new ObjectId(id) })
                : null
            if (!row || !row.data) return res.status(404).send('Not found')

            let buf = Buffer.from(row.data, 'base64')
            let tong = buf.length
            res.set('Content-Type', row.mime)
            res.set('Accept-Ranges', 'bytes')
            res.set('Cache-Control', 'public, max-age=31536000, immutable')
            res.set('X-Content-Type-Options', 'nosniff')

            let khop = req.headers.range && String(req.headers.range).match(/^bytes=(\d*)-(\d*)$/)
            if (khop) {
                let dau = khop[1] === '' ? Math.max(0, tong - Number(khop[2])) : Number(khop[1])
                let cuoi = khop[1] !== '' && khop[2] !== '' ? Math.min(Number(khop[2]), tong - 1) : tong - 1
                if (dau >= tong || dau > cuoi) {
                    res.set('Content-Range', `bytes */${tong}`)
                    return res.status(416).end()
                }
                res.status(206)
                res.set('Content-Range', `bytes ${dau}-${cuoi}/${tong}`)
                return res.send(buf.subarray(dau, cuoi + 1))
            }

            return res.send(buf)
        } catch (err) {
            return res.status(404).send('Not found')
        }
    },

};
