/**
 * ModerationController (quản trị)
 *
 * Xử lý bình luận chứa từ cấm và người viết chúng. Mọi action cần quyền
 * `moderation.manage` (config/permissions.js), mặc định chỉ Quản lý (Admin).
 *
 *   - xem bình luận vi phạm (status = flagged) của một bài, xoá hẳn;
 *   - xem tình trạng kỷ luật một người: số lần cảnh cáo, đã khoá chưa, các
 *     bình luận vi phạm, nhật ký;
 *   - cảnh cáo (tối đa 5 lần, mỗi lần gửi thông báo cho người đó);
 *   - khoá tài khoản (status = 2: không đăng nhập, không đăng ký lại được -
 *     xem UserRelate, jwtProcess, UsersController.register), mở khoá.
 *
 * Không khoá / cảnh cáo được người cùng bậc hoặc bậc cao hơn mình, và không
 * tự khoá mình - cùng luật với đổi vai trò (config/roles.js canAssign).
 * Mọi thao tác ghi ModerationLog.
 */
const { ganTacGia } = require('../../../utils/binhLuan')
const { layTenTacGia } = require('../../../utils/tacGia')

const CANH_CAO_TOI_DA = 5
const TRANG_THAI_KHOA = 2

const baoLoi = (exits, message) => sails.checkErrorOutput({ messageNode: 'Users', message: message }, exits)

const layIp = req => {
    let chuyenTiep = req && req.headers && req.headers['x-forwarded-for']
    return chuyenTiep ? String(chuyenTiep).split(',')[0].trim() : ((req && req.ip) || '')
}

const ghiLog = async (req, actor, ban) => {
    try {
        await ModerationLog.create(Object.assign({
            actorId: String(actor.id),
            actorName: actor.fullName || actor.username || '',
            ip: layIp(req)
        }, ban))
    } catch (err) {
        sails.log.error('[Moderation] Không ghi được nhật ký:', err.message)
    }
}

/** Người thao tác có được xử lý người này không (bậc cao hơn, không phải chính mình). */
const loiXuLy = (actor, muc) => {
    if (!muc) return 'userNotExits'
    if (String(actor.id) === String(muc.id)) return 'moderationSelf'
    let bac = sails.config.roles.rank
    if ((bac[actor.role] ?? -1) <= (bac[muc.role || 'User'] ?? 0)) return 'moderationRank'

    return ''
}

/** Bình luận vi phạm, kèm tên người viết, tiêu đề bài, từ đã khớp. */
const dinhDangViPham = async ds => {
    let daDinhDang = await ganTacGia(ds)
    let ids = Array.from(new Set(ds.map(b => b.contentId)))
    let bai = ids.length ? await Content.find({ id: { in: ids } }) : []
    let theoId = {}
    bai.forEach(b => { theoId[String(b.id)] = { slug: b.slug, title: b.title } })

    return daDinhDang.map((b, i) => Object.assign(b, {
        flaggedWords: ds[i].flaggedWords || [],
        content: theoId[ds[i].contentId] || { slug: '', title: '' }
    }))
}

module.exports = {

    /** Bình luận vi phạm của một bài (theo slug) - để hiện riêng cho quản trị ngay trên trang bài. */
    listFlagged: ({
        inputs: sails.config.inputs.Admin.Moderation.listFlagged,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let bai = await Content.findOne({ slug: inputs.slug })
                let ds = bai
                    ? await Comment.find({ where: { contentId: String(bai.id), status: 'flagged' }, sort: 'createdAt DESC', limit: 100 })
                    : []

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: await dinhDangViPham(ds)
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    /** Xoá HẲN một bình luận (khỏi CSDL). Nội dung được chép vào nhật ký trước khi xoá. */
    deleteComment: ({
        inputs: sails.config.inputs.Admin.Moderation.deleteComment,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let bl = await Comment.findOne({ id: String(inputs.id) })
                if (!bl) return baoLoi(exits, 'commentNotFound')

                await Comment.destroyOne({ id: bl.id })
                // Câu trả lời của bình luận gốc bị xoá không còn chỗ bám -> ẩn theo.
                if (!bl.parentId) {
                    await Comment.update({ parentId: String(bl.id), status: 'visible' })
                        .set({ status: 'hidden', hiddenBy: String(inputs.User.id) })
                }
                await ghiLog(this.req, inputs.User, {
                    targetUserId: String(bl.userId),
                    action: 'delete-comment',
                    commentId: String(bl.id),
                    commentBody: bl.body
                })

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: { id: String(bl.id) }
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    /** Tình trạng kỷ luật của một người. */
    userInfo: ({
        inputs: sails.config.inputs.Admin.Moderation.userInfo,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let muc = await Users.findOne({ id: String(inputs.id) })
                if (!muc) return baoLoi(exits, 'userNotExits')

                let [viPham, nhatKy, ten] = await Promise.all([
                    Comment.find({ where: { userId: String(muc.id), status: 'flagged' }, sort: 'createdAt DESC', limit: 50 }),
                    ModerationLog.find({ where: { targetUserId: String(muc.id) }, sort: 'createdAt DESC', limit: 50 }),
                    layTenTacGia(muc.id)
                ])

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: {
                        id: String(muc.id),
                        username: muc.username,
                        name: ten.name,
                        dharmaName: ten.dharmaName,
                        role: muc.role || 'User',
                        status: muc.status,
                        banned: muc.status === TRANG_THAI_KHOA,
                        bannedAt: muc.bannedAt ? new Date(muc.bannedAt).toISOString() : '',
                        bannedReason: muc.bannedReason || '',
                        warningCount: muc.warningCount || 0,
                        maxWarnings: CANH_CAO_TOI_DA,
                        canAct: !loiXuLy(inputs.User, muc),
                        flaggedComments: await dinhDangViPham(viPham),
                        log: nhatKy.map(l => ({
                            id: String(l.id),
                            action: l.action,
                            reason: l.reason,
                            commentBody: l.commentBody,
                            actorName: l.actorName,
                            createdAt: new Date(l.createdAt).toISOString()
                        }))
                    }
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    warnUser: ({
        inputs: sails.config.inputs.Admin.Moderation.warnUser,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let muc = await Users.findOne({ id: String(inputs.id) })
                let loi = loiXuLy(inputs.User, muc)
                if (loi) return baoLoi(exits, loi)

                let lan = (muc.warningCount || 0) + 1
                if (lan > CANH_CAO_TOI_DA) return baoLoi(exits, 'moderationWarnLimit')
                let lyDo = String(inputs.reason || '').trim().slice(0, 300)

                await Users.updateOne({ id: muc.id }).set({ warningCount: lan })
                // Thông báo vào chuông của người bị cảnh cáo: lý do + lần thứ mấy.
                await UserNotification.create({
                    userId: String(muc.id),
                    type: 'warning',
                    actorId: String(inputs.User.id),
                    contentTitle: `${lan}/${CANH_CAO_TOI_DA}`,
                    excerpt: lyDo
                })
                await ghiLog(this.req, inputs.User, { targetUserId: String(muc.id), action: 'warn', reason: lyDo })

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: { warningCount: lan }
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    banUser: ({
        inputs: sails.config.inputs.Admin.Moderation.banUser,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let muc = await Users.findOne({ id: String(inputs.id) })
                let loi = loiXuLy(inputs.User, muc)
                if (loi) return baoLoi(exits, loi)
                let lyDo = String(inputs.reason || '').trim().slice(0, 300)

                // Đổi status là đủ chặn mọi phiên đang mở: token được kiểm lại
                // trạng thái ở mỗi request (jwtProcess.verifyToken).
                await Users.updateOne({ id: muc.id }).set({
                    status: TRANG_THAI_KHOA,
                    bannedAt: Date.now(),
                    bannedReason: lyDo,
                    bannedById: String(inputs.User.id)
                })
                await ghiLog(this.req, inputs.User, { targetUserId: String(muc.id), action: 'ban', reason: lyDo })

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: { banned: true }
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    unbanUser: ({
        inputs: sails.config.inputs.Admin.Moderation.unbanUser,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let muc = await Users.findOne({ id: String(inputs.id) })
                let loi = loiXuLy(inputs.User, muc)
                if (loi) return baoLoi(exits, loi)

                await Users.updateOne({ id: muc.id }).set({ status: 1, bannedAt: 0, bannedReason: '', bannedById: '' })
                await ghiLog(this.req, inputs.User, {
                    targetUserId: String(muc.id),
                    action: 'unban',
                    reason: String(inputs.reason || '').trim().slice(0, 300)
                })

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: { banned: false }
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

};
