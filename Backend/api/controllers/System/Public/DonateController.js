/**
 * DonateController (công khai): thông tin ủng hộ admin đặt ở /admin/merit -
 * tên quỹ, số tài khoản, mã QR - hiện ở trang thống kê người dùng.
 */
const ok = (exits, data) => exits.successRequest({ messageNode: 'GlobalNotifications', message: 'success', data })

const layUngHo = async () => {
    let cauHinh = await MeritConfig.findOne({ key: 'default' })
    return { donate: (cauHinh && cauHinh.donate) || {}, updatedAt: cauHinh ? cauHinh.updatedAt : 0 }
}

module.exports = {

    getDonate: ({
        inputs: {},
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let { donate, updatedAt } = await layUngHo()
                ok(exits, {
                    title: donate.title || '',
                    description: donate.description || '',
                    accountName: donate.accountName || '',
                    accountNumber: donate.accountNumber || '',
                    bank: donate.bank || '',
                    link: donate.link || '',
                    qrUrl: donate.qrData ? `/v1/public/donate/qr?v=${updatedAt || 0}` : ''
                })
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    getQr: async function (req, res) {
        try {
            let { donate } = await layUngHo()
            if (!donate.qrData) return res.status(404).send('Not found')
            res.set('Content-Type', donate.qrMime || 'image/png')
            // Đường dẫn kèm ?v= đổi theo lần lưu, nên cache dài được.
            res.set('Cache-Control', 'public, max-age=86400')
            return res.send(Buffer.from(donate.qrData, 'base64'))
        } catch (err) {
            return res.status(404).send('Not found')
        }
    },

};
