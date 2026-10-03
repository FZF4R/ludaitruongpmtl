/**
 * FeedbackController (công khai)
 *
 * Nhận đề xuất / góp ý từ trang chủ. Không cần đăng nhập, nên chặn spam:
 *   - ô bẫy `website`: ẩn với người thật, bot tự điền thì giả vờ nhận rồi bỏ;
 *   - mỗi IP tối đa 3 lần trong 10 phút.
 * Có token hợp lệ thì gắn userId (không bắt buộc, token hỏng cũng không chặn).
 */

const DAI_TOI_THIEU = 5
const DAI_TOI_DA = 2000
const TOI_DA_MOI_IP = 3
const CUA_SO_MS = 10 * 60 * 1000

const layIp = req => {
    let chuyenTiep = req && req.headers && req.headers['x-forwarded-for']
    return chuyenTiep ? String(chuyenTiep).split(',')[0].trim() : ((req && req.ip) || '')
}

const baoLoi = (exits, message) => sails.checkErrorOutput({ messageNode: 'Users', message: message }, exits)
const thanhCong = exits => exits.successRequest({ messageNode: 'Users', message: 'feedbackThanks', data: { ok: true } })

module.exports = {

    sendFeedback: ({
        inputs: sails.config.inputs.Public.Feedback.sendFeedback,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                // Bot điền ô bẫy: báo thành công để nó không thử cách khác, nhưng không lưu.
                if (String(inputs.website || '').trim()) return thanhCong(exits)

                let body = String(inputs.body || '').replace(/\r/g, '').trim()
                if (body.length < DAI_TOI_THIEU || body.length > DAI_TOI_DA) return baoLoi(exits, 'feedbackInvalid')

                let ip = layIp(this.req)
                let ganDay = await Feedback.count({ ip: ip, createdAt: { '>': Date.now() - CUA_SO_MS } })
                if (ip && ganDay >= TOI_DA_MOI_IP) return baoLoi(exits, 'feedbackTooMany')

                // Đang đăng nhập: tên và cách liên hệ lấy từ tài khoản (form ở footer
                // chỉ có ô nội dung), client gửi kèm gì cũng không đè được.
                let nguoiGui = null
                let token = this.req.headers && this.req.headers.authorization
                if (token) {
                    try { nguoiGui = await sails.jwtProcess.verifyToken(token) } catch (e) { nguoiGui = null }
                }
                let userId = nguoiGui ? String(nguoiGui.id) : ''
                let ten = String(inputs.name || '').trim()
                let lienHe = String(inputs.contact || '').trim()
                if (nguoiGui) {
                    let hoSo = await UserProfile.findOne({ userId: userId })
                    ten = (hoSo && hoSo.fullName) || nguoiGui.fullName || nguoiGui.username || ten
                    lienHe = nguoiGui.email || nguoiGui.phone || lienHe
                }

                await Feedback.create({
                    kind: inputs.kind === 'de-xuat' ? 'de-xuat' : 'gop-y',
                    anonymous: !!inputs.anonymous,
                    name: ten.slice(0, 120),
                    contact: lienHe.slice(0, 160),
                    body: body,
                    userId: userId,
                    ip: ip
                })

                return thanhCong(exits)
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

};
