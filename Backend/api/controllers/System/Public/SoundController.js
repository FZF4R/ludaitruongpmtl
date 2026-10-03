/**
 * SoundController (công khai)
 *
 * Danh sách âm thanh đang bật của một mục tu tập, và phát tệp âm thanh tải lên.
 */
const { DANH_MUC, bangAmThanh, dinhDangAmThanh } = require('../../../utils/amThanh')

module.exports = {

    listSounds: ({
        inputs: sails.config.inputs.Public.Sound.listSounds,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let dieuKien = { active: { $ne: false } }
                if (DANH_MUC.includes(inputs.category)) dieuKien.category = inputs.category

                let ds = await bangAmThanh()
                    .find(dieuKien, { projection: { data: 0 } })
                    .sort({ category: 1, order: 1, createdAt: 1 })
                    .toArray()

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: ds.map(r => dinhDangAmThanh(r))
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    /**
     * Trả tệp âm thanh. Hỗ trợ Range: trình duyệt cần nó để tua và để phát
     * tệp dài mà không tải hết trước. URL kèm ?v=<updatedAt> nên cache lâu được.
     */
    getFile: async function (req, res) {
        try {
            let { ObjectId } = require('mongodb')
            let id = String(req.param('id'))
            let row = ObjectId.isValid(id) ? await bangAmThanh().findOne({ _id: new ObjectId(id) }) : null
            if (!row || row.source !== 'upload' || !row.data || row.active === false) {
                return res.status(404).send('Not found')
            }

            let buf = Buffer.from(row.data, 'base64')
            let tong = buf.length
            res.set('Content-Type', row.mime || 'audio/mpeg')
            res.set('Accept-Ranges', 'bytes')
            res.set('Cache-Control', 'public, max-age=31536000, immutable')

            let range = req.headers.range
            let khop = range && String(range).match(/^bytes=(\d*)-(\d*)$/)
            if (khop) {
                let dau = khop[1] === '' ? Math.max(0, tong - Number(khop[2])) : Number(khop[1])
                let cuoi = khop[1] !== '' && khop[2] !== '' ? Math.min(Number(khop[2]), tong - 1) : tong - 1
                if (dau >= tong || dau > cuoi) {
                    res.set('Content-Range', `bytes */${tong}`)
                    return res.status(416).end()
                }
                res.status(206)
                res.set('Content-Range', `bytes ${dau}-${cuoi}/${tong}`)
                res.set('Content-Length', String(cuoi - dau + 1))
                return res.end(buf.subarray(dau, cuoi + 1))
            }

            res.set('Content-Length', String(tong))
            return res.end(buf)
        } catch (err) {
            return res.status(404).send('Not found')
        }
    },

};
