/**
 * AvatarController (công khai)
 *
 * Trả nguyên tệp avatar của một người dùng. URL luôn kèm `?v=<updatedAt>`
 * (xem api/utils/avatar.js) nên cache vĩnh viễn được.
 */
const { bangAvatar } = require('../../../utils/avatar')

module.exports = {

    getFile: async function (req, res) {
        try {
            let anh = await bangAvatar().findOne({ userId: String(req.param('userId')) })
            if (!anh || !anh.avatar) return res.status(404).send('Not found')

            res.set('Content-Type', anh.mime || 'image/jpeg')
            res.set('Cache-Control', 'public, max-age=31536000, immutable')
            return res.send(Buffer.from(anh.avatar, 'base64'))
        } catch (err) {
            return res.status(404).send('Not found')
        }
    },

};
