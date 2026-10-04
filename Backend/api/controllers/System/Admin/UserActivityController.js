/**
 * UserActivityController (quản trị, quyền `user.list`): TOÀN BỘ hoạt động của
 * một tài khoản cho trang /admin/user/hoat-dong - hồ sơ, công đức, quá trình tu
 * tập, bài viết / nội dung thư viện đã đóng góp, bình luận (mới đến cũ, mọi
 * trạng thái), lời nguyện. Email chỉ trả khi người xem có `user.manage`.
 */
const { tongCongDuc } = require('../../../utils/congDuc')
const { layAvatarUrls } = require('../../../utils/avatar')
const { layTenTacGia } = require('../../../utils/tacGia')

const col = model => model.getDatastore().manager.collection(model.tableName)
const ok = (exits, data) => exits.successRequest({ messageNode: 'GlobalNotifications', message: 'success', data })
const iso = v => (v ? new Date(v).toISOString() : '')
const MOI_TRANG_BL = 20

module.exports = {

    getActivity: ({
        inputs: sails.config.inputs.Admin.UserActivity.getActivity,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let u = await Users.findOne({ id: String(inputs.id) }).catch(() => null)
                if (!u) return sails.checkErrorOutput({ messageNode: 'Users', message: 'userNotExits' }, exits)
                let id = String(u.id)
                let xemEmail = sails.config.roles.can(inputs.User.role, 'user.manage')
                let trangBl = Math.max(1, inputs.commentPage || 1)

                let [ten, avatar, hoSo, congDuc, tuTapTong, tuTapGanDay, baiViet, binhLuan, tongBl, demBl, loiNguyen, diemDanh] = await Promise.all([
                    layTenTacGia(id),
                    layAvatarUrls([id]),
                    UserProfile.findOne({ userId: id }),
                    tongCongDuc(id),
                    col(PracticeLog).aggregate([
                        { $match: { userId: id } },
                        { $group: { _id: '$type', amount: { $sum: '$amount' }, sessions: { $sum: 1 }, last: { $max: '$createdAt' } } }
                    ]).toArray(),
                    PracticeLog.find({ where: { userId: id }, sort: 'createdAt DESC', limit: 50 }),
                    col(Content).find({ authorId: id }, { projection: { bodyHtml: 0, searchText: 0, chapters: 0, gallery: 0, pendingEdit: 0 } })
                        .sort({ createdAt: -1 }).limit(200).toArray(),
                    Comment.find({ where: { userId: id }, sort: 'createdAt DESC', skip: (trangBl - 1) * MOI_TRANG_BL, limit: MOI_TRANG_BL }),
                    Comment.count({ userId: id }),
                    col(Comment).aggregate([{ $match: { userId: id } }, { $group: { _id: '$status', n: { $sum: 1 } } }]).toArray(),
                    Prayer.find({ where: { userId: id }, sort: 'createdAt DESC', limit: 30 }),
                    col(MeritLog).distinct('dayKey', { userId: id, action: 'checkin' })
                ])

                // Tiêu đề bài của các bình luận đang hiện ở trang này.
                let idsBai = Array.from(new Set(binhLuan.map(b => b.contentId)))
                let baiCuaBl = idsBai.length ? await Content.find({ id: { in: idsBai } }) : []
                let baiTheoId = {}
                baiCuaBl.forEach(b => { baiTheoId[String(b.id)] = { slug: b.slug, title: b.title, type: b.type } })
                let demTheoTT = { visible: 0, hidden: 0, flagged: 0 }
                demBl.forEach(x => { if (demTheoTT[x._id] !== undefined) demTheoTT[x._id] = x.n })

                ok(exits, {
                    user: {
                        id,
                        username: u.username,
                        email: xemEmail ? (u.email || '') : '',
                        name: ten.name || u.fullName || u.username,
                        dharmaName: ten.dharmaName || '',
                        role: u.role || 'User',
                        status: u.status,
                        banned: u.status === 2,
                        warningCount: u.warningCount || 0,
                        avatarUrl: avatar[id] || '',
                        createdAt: iso(u.createdAt),
                        lastLogin: iso(u.lastLogin || u.lastLoginAt),
                        profile: hoSo ? {
                            nickname: hoSo.nickname || '',
                            hometown: hoSo.hometown || {},
                            survey: hoSo.survey || {}
                        } : null
                    },
                    merit: congDuc,
                    checkinDays: diemDanh.length,
                    practice: {
                        totals: tuTapTong.map(t => ({ type: t._id, amount: t.amount, sessions: t.sessions, last: iso(t.last) })),
                        recent: tuTapGanDay.map(l => ({ id: String(l.id), type: l.type, amount: l.amount, note: l.note || '', createdAt: iso(l.createdAt) }))
                    },
                    contents: baiViet.map(b => ({
                        id: String(b._id),
                        type: b.type,
                        libraryKind: b.libraryKind || '',
                        slug: b.slug,
                        title: b.title,
                        status: b.status || 'draft',
                        viewCount: b.viewCount || 0,
                        createdAt: iso(b.createdAt),
                        approvedAt: iso(b.approvedAt),
                        approvedByName: b.approvedByName || ''
                    })),
                    comments: {
                        total: tongBl,
                        page: trangBl,
                        limit: MOI_TRANG_BL,
                        byStatus: demTheoTT,
                        data: binhLuan.map(b => ({
                            id: String(b.id),
                            body: b.body,
                            status: b.status,
                            flaggedWords: b.flaggedWords || [],
                            parentId: b.parentId || '',
                            createdAt: iso(b.createdAt),
                            content: baiTheoId[b.contentId] || { slug: '', title: '', type: '' }
                        }))
                    },
                    prayers: loiNguyen.map(p => ({
                        id: String(p.id),
                        body: p.body,
                        forName: p.forName || '',
                        status: p.status || 'visible',
                        anonymous: !!p.anonymous,
                        createdAt: iso(p.createdAt)
                    }))
                })
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

};
