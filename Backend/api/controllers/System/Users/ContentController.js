/**
 * ContentController (người dùng đã đăng nhập) - trang "Bài viết của tôi"
 *
 * Người dùng (User, Cộng tác viên...) tự viết bài và gửi nội dung thư viện:
 *   draft -> (gửi) pending -> ban kiểm duyệt duyệt -> published
 *                          \-> trả lại (draft + lý do)
 *
 * - Bài viết (`article`): cần `content.draft`; gửi duyệt cần `content.submit`.
 * - Thư viện (`library`): cần `library.write` (chờ duyệt) hoặc
 *   `library.manage` (gửi là hiện ngay - Kiểm duyệt viên trở lên).
 * - Sửa bài đã đăng của mình (`content.editOwn`): bài quay về chờ duyệt lại,
 *   trừ người có quyền đăng thẳng loại đó.
 *
 * Đề xuất sửa: ban biên tập sửa bài của người dùng thì thành `pendingEdit`
 * (System/Admin/ContentController). Tác giả xem đối chiếu, đồng ý -> áp vào
 * và đăng; từ chối -> bỏ đề xuất. Cả hai đều báo lại người đề xuất.
 *
 * Mọi truy vấn khoá theo `authorId` = người đang gọi.
 */
const { boDau } = require('../../../utils/vietnamese')
const { tacGiaTheoHoSo } = require('../../../utils/tacGia')
const { ghiNhatKy, dauVet, truongDaDoi, chupNoiDung } = require('../../../utils/nhatKyBai')
const { LOAI_THU_VIEN, co, duongDanBai } = require('../../../utils/quyenNoiDung')
const { guiThongBaoBai } = require('../../../utils/thongBao')
const { baoDaDang } = require('../../../utils/dangBai')
const { ngayVN } = require('../../../utils/loiNguyen')

const LOAI_NGUOI_DUNG = ['article', 'library']
/** Mỗi người tạo tối đa chừng này bài mới mỗi ngày - chặn spam. */
const TAO_TOI_DA_NGAY = 10
const DAI_THAN_BAI = 200000

const bangNoiDung = () => Content.getDatastore().manager.collection(Content.tableName)
const loi = (exits, message) => sails.checkErrorOutput({ messageNode: 'Content', message }, exits)
const thanhCong = (exits, data, message = 'success', messageNode = 'GlobalNotifications') =>
    exits.successRequest({ messageNode, message, data })

const sangISO = v => {
    if (!v) return ''
    let d = new Date(v)
    return isNaN(d.getTime()) ? '' : d.toISOString()
}

/** Được viết loại này không. */
const duocViet = (user, loai) => (loai === 'library'
    ? co(user, 'library.write') || co(user, 'library.manage')
    : co(user, 'content.draft'))

/** Đăng thẳng không qua duyệt (Kiểm duyệt viên trở lên với thư viện, Quản trị viên với bài viết). */
const dangThang = (user, loai) => (loai === 'library' ? co(user, 'library.manage') : co(user, 'content.publish'))

const dinhDang = (row, { day = false } = {}) => {
    let kq = {
        id: String(row.id || row._id),
        type: row.type,
        slug: row.slug,
        title: row.title,
        summary: row.summary || '',
        coverUrl: row.coverUrl || '',
        status: row.status || 'draft',
        libraryKind: row.libraryKind || '',
        tags: row.tags || [],
        categories: row.categories || [],
        viewCount: row.viewCount || 0,
        reviewNote: row.reviewNote || '',
        createdAt: sangISO(row.createdAt),
        updatedAt: sangISO(row.updatedAt),
        publishedAt: row.publishedAt || '',
        hasProposal: !!(row.pendingEdit && row.pendingEdit.at),
        approvedAt: sangISO(row.approvedAt),
        approvedByName: row.approvedByName || ''
    }
    if (day) {
        kq.bodyHtml = row.bodyHtml || ''
        kq.gallery = Array.isArray(row.gallery) ? row.gallery : []
        kq.media = row.media || {}
        kq.proposal = kq.hasProposal
            ? {
                byName: row.pendingEdit.byName || '',
                at: sangISO(row.pendingEdit.at),
                note: row.pendingEdit.note || '',
                changes: row.pendingEdit.changes || []
            }
            : null
    }

    return kq
}

/** Ảnh kèm: [{ url, caption }], chỉ link http(s) hoặc tệp đã tải lên site. */
const chuanHoaAnhKem = ds => (Array.isArray(ds) ? ds : [])
    .map(a => (typeof a === 'string' ? { url: a } : a || {}))
    .map(a => ({ url: String(a.url || '').trim().slice(0, 500), caption: String(a.caption || '').trim().slice(0, 300) }))
    .filter(a => /^(https?:\/\/|\/v1\/public\/media\/)/i.test(a.url))
    .slice(0, 60)

const linkHopLe = u => !u || /^(https?:\/\/|\/v1\/public\/media\/)/i.test(String(u).trim())

/** Gom trường người dùng được ghi. Trả { ban } hoặc { loi }. */
const gomTruong = async (inputs, loai) => {
    let ban = {}
    if (inputs.title !== undefined) ban.title = String(inputs.title).trim().slice(0, 200)
    if (inputs.summary !== undefined) ban.summary = String(inputs.summary).trim().slice(0, 600)
    if (inputs.coverUrl !== undefined) {
        if (!linkHopLe(inputs.coverUrl)) return { loi: 'contentInvalid' }
        ban.coverUrl = String(inputs.coverUrl).trim().slice(0, 500)
    }
    if (inputs.bodyHtml !== undefined) {
        if (String(inputs.bodyHtml).length > DAI_THAN_BAI) return { loi: 'contentInvalid' }
        ban.bodyHtml = String(inputs.bodyHtml)
    }
    if (inputs.tags !== undefined) {
        ban.tags = (Array.isArray(inputs.tags) ? inputs.tags : []).map(t => String(t).trim().slice(0, 40)).filter(Boolean).slice(0, 10)
    }
    if (inputs.category !== undefined) {
        let dm = inputs.category ? await ContentCategory.findOne({ slug: String(inputs.category) }) : null
        ban.categories = dm ? [{ slug: dm.slug, name: dm.name }] : []
    }
    if (loai === 'library') {
        if (inputs.libraryKind !== undefined) {
            if (!LOAI_THU_VIEN.includes(inputs.libraryKind)) return { loi: 'libraryKindRequired' }
            ban.libraryKind = inputs.libraryKind
        }
        if (inputs.gallery !== undefined) ban.gallery = chuanHoaAnhKem(inputs.gallery)
        if (inputs.media !== undefined) {
            let url = String((inputs.media && inputs.media.url) || '').trim()
            if (!linkHopLe(url)) return { loi: 'contentInvalid' }
            ban.media = url ? { provider: 'self', url: url.slice(0, 500) } : {}
        }
    }

    return { ban }
}

const slugMoi = tieuDe => {
    let goc = boDau(String(tieuDe || '')).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'bai'
    return `${goc}-${Date.now().toString(36).slice(-5)}`
}

/** Bài của chính mình, hoặc null. */
const baiCuaToi = async (id, user) => {
    if (!id) return null
    let bai = await sails.dataProcess.findOne(Content, { condition: { id: String(id) } }).catch(() => null)
    if (!bai || String(bai.authorId) !== String(user.id) || !LOAI_NGUOI_DUNG.includes(bai.type)) return null
    return bai
}

const dayDuTimKiem = (bai, ban) => {
    ban.title = ban.title === undefined ? bai.title : ban.title
    ban.summary = ban.summary === undefined ? (bai.summary || '') : ban.summary
    ban.tags = ban.tags === undefined ? (bai.tags || []) : ban.tags
}

module.exports = {

    listMine: ({
        inputs: sails.config.inputs.Users.Content.listMine,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let dieuKien = { authorId: String(inputs.User.id), type: { $in: LOAI_NGUOI_DUNG } }
                if (inputs.status) dieuKien.status = String(inputs.status)
                let [rows, total, dem] = await Promise.all([
                    bangNoiDung().find(dieuKien, { projection: { bodyHtml: 0, searchText: 0, chapters: 0 } })
                        .sort({ updatedAt: -1 })
                        .skip(inputs.limit * (inputs.page - 1))
                        .limit(inputs.limit)
                        .toArray(),
                    bangNoiDung().countDocuments(dieuKien),
                    bangNoiDung().aggregate([
                        { $match: { authorId: String(inputs.User.id), type: { $in: LOAI_NGUOI_DUNG } } },
                        { $group: { _id: '$status', n: { $sum: 1 } } }
                    ]).toArray()
                ])
                let stats = { draft: 0, pending: 0, published: 0, archived: 0 }
                dem.forEach(d => { if (stats[d._id] !== undefined) stats[d._id] = d.n })

                thanhCong(exits, {
                    data: rows.map(r => dinhDang(r)),
                    total, page: inputs.page, limit: inputs.limit, stats,
                    // Giao diện cần biết được viết loại nào, có đăng thẳng không.
                    can: {
                        article: duocViet(inputs.User, 'article'),
                        library: duocViet(inputs.User, 'library'),
                        publishArticle: dangThang(inputs.User, 'article'),
                        publishLibrary: dangThang(inputs.User, 'library')
                    }
                })
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    getMine: ({
        inputs: sails.config.inputs.Users.Content.getMine,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let bai = await baiCuaToi(inputs.id, inputs.User)
                if (!bai) return loi(exits, 'contentNotFound')
                thanhCong(exits, dinhDang(bai, { day: true }))
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    /**
     * Tạo (không có id) hoặc sửa bài của mình. `submit: true` = lưu xong gửi
     * duyệt luôn (hoặc đăng thẳng nếu có quyền).
     */
    saveMine: ({
        inputs: sails.config.inputs.Users.Content.saveMine,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let { User } = inputs
                let hienCo = null
                let loai = inputs.type
                if (inputs.id) {
                    hienCo = await baiCuaToi(inputs.id, User)
                    if (!hienCo) return loi(exits, 'contentNotFound')
                    loai = hienCo.type
                    // Đang có đề xuất sửa: trả lời đề xuất trước, tránh hai bản sửa đè nhau.
                    if (hienCo.pendingEdit && hienCo.pendingEdit.at) return loi(exits, 'contentHasProposal')
                    if (hienCo.status === 'published' && !co(User, 'content.editOwn')) return loi(exits, 'contentForbidden')
                }
                if (!LOAI_NGUOI_DUNG.includes(loai)) return loi(exits, 'contentTypeInvalid')
                if (!duocViet(User, loai)) return loi(exits, 'contentForbidden')
                if (inputs.submit && !dangThang(User, loai) && loai === 'article' && !co(User, 'content.submit')) {
                    return loi(exits, 'contentForbidden')
                }

                let { ban, loi: maLoi } = await gomTruong(inputs, loai)
                if (maLoi) return loi(exits, maLoi)

                if (!hienCo) {
                    if (!ban.title) return loi(exits, 'contentTitleRequired')
                    if (loai === 'library' && !ban.libraryKind) return loi(exits, 'libraryKindRequired')
                    let tuDauNgay = new Date(`${ngayVN()}T00:00:00+07:00`).getTime()
                    let daTao = await Content.count({ authorId: String(User.id), createdAt: { '>=': tuDauNgay } })
                    if (daTao >= TAO_TOI_DA_NGAY) return loi(exits, 'contentTooMany')

                    let trangThai = !inputs.submit ? 'draft' : dangThang(User, loai) ? 'published' : 'pending'
                    let moi = await sails.dataProcess.createDocument(Content, Object.assign({
                        type: loai,
                        slug: slugMoi(ban.title),
                        summary: '', tags: [], categories: [], bodyHtml: '',
                        status: trangThai,
                        authorId: String(User.id),
                        author: await tacGiaTheoHoSo(User.id)
                    }, ban, trangThai === 'published'
                        ? Object.assign({ publishedAt: new Date().toISOString(), approvedAt: Date.now() }, dauVet('approved', User))
                        : {}, dauVet('created', User), dauVet('updated', User)))
                    await ghiNhatKy({ req: this.req, user: User, bai: moi, action: 'create', toStatus: trangThai, changes: chupNoiDung(moi, 'after') })

                    return thanhCong(exits, dinhDang(moi, { day: true }), trangThai === 'pending' ? 'contentSubmitted' : 'contentSaved', 'Content')
                }

                // Sửa
                if (hienCo.type === 'library' && ban.libraryKind === '') return loi(exits, 'libraryKindRequired')
                dayDuTimKiem(hienCo, ban)
                if (ban.title !== undefined && !ban.title) return loi(exits, 'contentTitleRequired')
                let daDoi = truongDaDoi(hienCo, ban)

                // Bài đã đăng / đã gửi mà sửa: phải duyệt lại (trừ người đăng thẳng được).
                let trangThai = hienCo.status
                if (inputs.submit || (daDoi.length && ['published', 'pending', 'archived'].includes(hienCo.status))) {
                    trangThai = dangThang(User, loai) ? 'published' : 'pending'
                }
                if (hienCo.status === 'draft' && !inputs.submit) trangThai = 'draft'
                Object.assign(ban, { status: trangThai, reviewNote: trangThai === 'pending' ? '' : hienCo.reviewNote || '' }, dauVet('updated', User))
                if (trangThai === 'published' && !hienCo.publishedAt) ban.publishedAt = new Date().toISOString()

                await sails.dataProcess.updateDocument(Content, { condition: { id: hienCo.id }, updateObject: ban })
                let sau = await sails.dataProcess.findOne(Content, { condition: { id: hienCo.id } })
                if (daDoi.length || trangThai !== hienCo.status) {
                    await ghiNhatKy({
                        req: this.req, user: User, bai: sau,
                        action: daDoi.length ? 'update' : 'status',
                        fromStatus: hienCo.status, toStatus: trangThai,
                        changedFields: daDoi,
                        changes: daDoi.map(ten => ({
                            field: ten,
                            before: hienCo[ten] === undefined ? null : hienCo[ten],
                            after: ban[ten] === undefined ? null : ban[ten]
                        }))
                    })
                }

                thanhCong(exits, dinhDang(sau, { day: true }), trangThai === 'pending' && hienCo.status !== 'pending' ? 'contentSubmitted' : 'contentSaved', 'Content')
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    /** Xoá bài của mình: chỉ bản nháp hoặc đang chờ duyệt. Bài đã đăng thì nhờ ban quản trị gỡ. */
    deleteMine: ({
        inputs: sails.config.inputs.Users.Content.deleteMine,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let bai = await baiCuaToi(inputs.id, inputs.User)
                if (!bai) return loi(exits, 'contentNotFound')
                if (!['draft', 'pending'].includes(bai.status)) return loi(exits, 'contentForbidden')
                await ghiNhatKy({ req: this.req, user: inputs.User, bai, action: 'delete', fromStatus: bai.status, changes: chupNoiDung(bai, 'before') })
                await Content.destroyOne({ id: bai.id })
                thanhCong(exits, { id: String(bai.id) })
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    /** Đồng ý đề xuất sửa: áp vào bài; bài đã gửi / đã đăng thì đăng (bản mới). */
    acceptProposal: ({
        inputs: sails.config.inputs.Users.Content.acceptProposal,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let { User } = inputs
                let bai = await baiCuaToi(inputs.id, User)
                if (!bai || !(bai.pendingEdit && bai.pendingEdit.at)) return loi(exits, 'contentNotFound')
                let de = bai.pendingEdit
                let nguoiDeXuat = { id: de.byId, fullName: de.byName, username: de.byName }

                let ban = Object.assign({}, de.fields || {})
                dayDuTimKiem(bai, ban)
                let daDoi = truongDaDoi(bai, ban)
                let dang = ['pending', 'published'].includes(bai.status)
                Object.assign(ban, { pendingEdit: {}, reviewNote: '' }, dauVet('updated', nguoiDeXuat))
                if (dang) {
                    ban.status = 'published'
                    if (!bai.publishedAt) ban.publishedAt = new Date().toISOString()
                    Object.assign(ban, dauVet('approved', nguoiDeXuat), { approvedAt: Date.now() })
                }

                await sails.dataProcess.updateDocument(Content, { condition: { id: bai.id }, updateObject: ban })
                let sau = await sails.dataProcess.findOne(Content, { condition: { id: bai.id } })
                await ghiNhatKy({
                    req: this.req, user: User, bai: sau, action: 'update',
                    fromStatus: bai.status, toStatus: sau.status, changedFields: daDoi,
                    changes: daDoi.map(ten => ({ field: ten, before: bai[ten] === undefined ? null : bai[ten], after: ban[ten] === undefined ? null : ban[ten] }))
                })
                await guiThongBaoBai({ userId: de.byId, type: 'edit-accepted', actorId: User.id, bai: sau, link: sau.status === 'published' ? duongDanBai(sau) : '' })
                if (dang) await baoDaDang(sau, nguoiDeXuat)

                thanhCong(exits, dinhDang(sau, { day: true }), 'contentProposalAccepted', 'Content')
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    rejectProposal: ({
        inputs: sails.config.inputs.Users.Content.rejectProposal,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let { User } = inputs
                let bai = await baiCuaToi(inputs.id, User)
                if (!bai || !(bai.pendingEdit && bai.pendingEdit.at)) return loi(exits, 'contentNotFound')
                let de = bai.pendingEdit
                await Content.updateOne({ id: bai.id }).set({ pendingEdit: {} })
                await guiThongBaoBai({
                    userId: de.byId, type: 'edit-rejected', actorId: User.id, bai,
                    excerpt: String(inputs.reason || '').trim().slice(0, 300), link: ''
                })
                let sau = await sails.dataProcess.findOne(Content, { condition: { id: bai.id } })
                thanhCong(exits, dinhDang(sau, { day: true }), 'contentProposalRejected', 'Content')
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

};
