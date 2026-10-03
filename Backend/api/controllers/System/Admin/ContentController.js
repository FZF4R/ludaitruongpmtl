/**
 * ContentController (Admin)
 *
 * @description :: Quản trị nội dung: xem mọi bài kể cả bản nháp, phê duyệt,
 *                 sửa, lưu trữ, xoá.
 *
 * Vì sao MỘT controller lo cả bài viết lẫn kinh sách: hai thứ đó là cùng một
 * bảng `Content`, chỉ khác trường `type`. Tách thành hai bộ CRUD nghĩa là hai
 * bản sao của cùng một đoạn kiểm tra slug, cùng một cách tính searchText, cùng
 * một luồng trạng thái - và chúng sẽ lệch nhau ngay lần sửa thứ hai. Trang
 * /admin/blog gọi với `type=article,blog`, trang /admin/library gọi với
 * `type=sutra`.
 *
 * Khác `System/Public/ContentController` ở ba điểm:
 *   - trả về CẢ bản nháp, chờ duyệt và đã lưu trữ, không chỉ `published`
 *   - trả kèm `status`, `authorId`, `bodyHtml`, `chapters`
 *   - có đường ghi
 *
 * Quyền: config/permissions.js chỉ mở cửa; quyền theo từng loại (bài viết /
 * kinh sách / thư viện) quyết ở api/utils/quyenNoiDung.js. Xoá cần
 * `content.delete`.
 *
 * Bài do NGƯỜI DÙNG viết (User / Cộng tác viên): ban biên tập sửa thì không
 * ghi đè mà thành đề xuất sửa (`pendingEdit`), tác giả đồng ý ở trang Bài viết
 * của tôi thì mới áp vào và đăng. Mỗi lần bài lên trang, tác giả nhận thông báo.
 */
const { boDau, thoatRegex } = require('../../../utils/vietnamese')
const { tacGiaTheoHoSo, chuanHoaDichGia, timNguoi } = require('../../../utils/tacGia')
const { ghiNhatKy, dauVet, truongDaDoi, chupNoiDung } = require('../../../utils/nhatKyBai')
const {
    LOAI_HOP_LE, LOAI_THU_VIEN, co, loaiQuanTri, duocXem, duocSuaTrucTiep, duocDoiTrangThai, laBaiNguoiDung, duongDanBai
} = require('../../../utils/quyenNoiDung')
const { guiThongBaoBai } = require('../../../utils/thongBao')
const { baoDaDang } = require('../../../utils/dangBai')
const TRANG_THAI_HOP_LE = ['draft', 'pending', 'published', 'archived']

/** Truy cập thẳng collection để dùng $or, $in và đếm trong một lượt. */
const bangNoiDung = () => Content.getDatastore().manager.collection(Content.tableName)

/** Số ms của Waterline -> chuỗi ISO cho FrontEnd. */
const sangISO = giaTri => {
    if (!giaTri) return ''
    let d = new Date(giaTri)

    return isNaN(d.getTime()) ? '' : d.toISOString()
}

/**
 * Một bản ghi -> hình dạng FrontEnd quản trị chờ đợi.
 * `rutGon` bỏ phần thân bài: danh sách hai mươi bài kèm bodyHtml là vài trăm
 * kilobyte cho một màn hình chỉ hiện tiêu đề.
 */
const dinhDangQuanTri = (row, { rutGon = false } = {}) => {
    let kq = {
        id: String(row.id || row._id),
        type: row.type,
        slug: row.slug,
        title: row.title,
        summary: row.summary || '',
        coverUrl: row.coverUrl || '',
        status: row.status || 'draft',
        authorId: row.authorId || '',
        author: row.author || {},
        source: row.source || {},
        translator: row.translator || {},
        categories: row.categories || [],
        tags: row.tags || [],
        publishedAt: row.publishedAt || '',
        readingMinutes: row.readingMinutes || 0,
        viewCount: row.viewCount || 0,
        seo: row.seo || {},
        libraryKind: row.libraryKind || '',
        gallery: Array.isArray(row.gallery) ? row.gallery : [],
        reviewNote: row.reviewNote || '',
        // Đề xuất sửa đang chờ tác giả: chỉ tóm tắt ở danh sách.
        pendingEdit: row.pendingEdit && row.pendingEdit.at
            ? {
                byName: row.pendingEdit.byName || '',
                at: sangISO(row.pendingEdit.at),
                note: row.pendingEdit.note || '',
                changedFields: (row.pendingEdit.changes || []).map(c => c.field)
            }
            : null,
        createdAt: sangISO(row.createdAt),
        updatedAt: sangISO(row.updatedAt),
        // Dấu vết nhanh (api/utils/nhatKyBai.js). Bài tạo trước khi có tính
        // năng này thì các trường để trống; diễn biến đầy đủ ở /content/history.
        audit: {
            createdById: row.createdById || '',
            createdByName: row.createdByName || '',
            updatedById: row.updatedById || '',
            updatedByName: row.updatedByName || '',
            approvedById: row.approvedById || '',
            approvedByName: row.approvedByName || '',
            approvedAt: sangISO(row.approvedAt)
        }
    }

    if (!rutGon) {
        kq.bodyHtml = row.bodyHtml || ''
        kq.chapters = row.chapters || []
        kq.media = row.media || {}
    } else {
        kq.chapterCount = Array.isArray(row.chapters) ? row.chapters.length : 0
    }

    return kq
}

/** Điều kiện lọc cho danh sách quản trị. */
const dungDieuKien = ({ type, status, category, authorId, q }) => {
    let dieuKien = {}

    if (type) {
        let loai = String(type).split(',').map(t => t.trim()).filter(t => LOAI_HOP_LE.includes(t))
        if (loai.length) dieuKien.type = { $in: loai }
    }

    if (status) {
        let tt = String(status).split(',').map(t => t.trim()).filter(t => TRANG_THAI_HOP_LE.includes(t))
        if (tt.length) dieuKien.status = { $in: tt }
    }

    if (category) dieuKien['categories.slug'] = category
    if (authorId) dieuKien.authorId = String(authorId)

    // searchText đã bỏ dấu lúc ghi, nên bỏ dấu từ khoá rồi mới so.
    if (q) dieuKien.searchText = { $regex: thoatRegex(boDau(q)), $options: 'i' }

    return dieuKien
}

/** Chỉ nhận đúng dạng slug: chữ thường, số, gạch ngang. */
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Tự sinh slug từ tiêu đề khi người nhập để trống. */
const dungSlug = tieuDe => boDau(String(tieuDe || ''))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90)

/**
 * Gom các trường được phép ghi. Client gửi thừa gì cũng bị bỏ - `status` chẳng
 * hạn KHÔNG nằm ở đây, vì đổi trạng thái đi qua action riêng có quyền riêng;
 * cho phép sửa nó kèm theo lúc sửa nội dung là mở một cửa hậu để người chỉ có
 * `content.editAny` tự đăng bài của mình.
 */
const gomTruong = inputs => {
    let ban = {}
    const gan = (ten, giaTri) => { if (giaTri !== undefined) ban[ten] = giaTri }

    gan('type', inputs.type)
    gan('title', inputs.title)
    gan('summary', inputs.summary)
    gan('coverUrl', inputs.coverUrl)
    gan('bodyHtml', inputs.bodyHtml)
    gan('chapters', inputs.chapters)
    gan('media', inputs.media)
    gan('author', inputs.author)
    gan('source', inputs.source)
    gan('translator', inputs.translator)
    gan('categories', inputs.categories)
    gan('tags', inputs.tags)
    gan('publishedAt', inputs.publishedAt)
    gan('readingMinutes', inputs.readingMinutes)
    gan('seo', inputs.seo)
    if (inputs.libraryKind !== undefined) ban.libraryKind = LOAI_THU_VIEN.includes(inputs.libraryKind) ? inputs.libraryKind : ''
    if (inputs.gallery !== undefined) ban.gallery = chuanHoaAnhKem(inputs.gallery)

    return ban
}

/** Ảnh kèm: tối đa 60 ảnh, mỗi ảnh { url, caption } - url là link http(s) hoặc /v1/public/media/... */
const chuanHoaAnhKem = ds => (Array.isArray(ds) ? ds : [])
    .map(a => (typeof a === 'string' ? { url: a } : a || {}))
    .map(a => ({ url: String(a.url || '').trim().slice(0, 500), caption: String(a.caption || '').trim().slice(0, 300) }))
    .filter(a => /^(https?:\/\/|\/v1\/public\/media\/)/i.test(a.url))
    .slice(0, 60)

/**
 * Chuẩn hoá `author` client gửi lên.
 *   - `fromProfile: true`: bỏ qua tên client gửi, lấy họ tên + pháp danh từ
 *     hồ sơ của `chuSoHuu` (xem api/utils/tacGia.js). Client không tự đặt tên
 *     được, nên không mạo danh người khác bằng cờ này.
 *   - còn lại: tác giả gõ tay (bài dịch, bài nhập), giữ đúng 3 trường chữ.
 */
const chuanHoaTacGia = async (author, chuSoHuu) => {
    if (author && author.fromProfile === true) return tacGiaTheoHoSo(chuSoHuu)
    if (!author || !String(author.name || '').trim()) return {}

    let ban = { name: String(author.name).trim().slice(0, 120) }
    if (author.title) ban.title = String(author.title).trim().slice(0, 60)
    if (author.dharmaName) ban.dharmaName = String(author.dharmaName).trim().slice(0, 80)

    return ban
}

/**
 * Luật riêng của kinh sách, dùng chung cho tạo và sửa. Trả mã lỗi hoặc ''.
 *   - chỉ người có `sutra.manage` (mặc định Quản trị viên, Quản lý) được
 *     thêm/sửa - kể cả đổi một bài viết thành kinh sách hay ngược lại;
 *   - bắt buộc có nguồn tham khảo (tên nguồn; đường dẫn tuỳ chọn).
 */
const loiKinhSach = (user, loaiCu, loaiMoi, nguon) => {
    let dungKinh = loaiCu === 'sutra' || loaiMoi === 'sutra'
    if (!dungKinh) return ''
    if (!sails.config.roles.can(user.role, 'sutra.manage')) return 'sutraForbidden'
    if (loaiMoi === 'sutra' && !(nguon && String(nguon.name || '').trim())) return 'sutraSourceRequired'

    return ''
}

/** Nguồn tham khảo: giữ đúng hai trường chữ, bỏ khoảng trắng thừa. */
const chuanHoaNguon = nguon => {
    if (!nguon || !String(nguon.name || '').trim()) return {}
    let ban = { name: String(nguon.name).trim().slice(0, 200) }
    let url = String(nguon.url || '').trim()
    if (url) ban.url = url.slice(0, 500)

    return ban
}

const loi = (exits, message, messageNode = 'Content') => {
    sails.checkErrorOutput({ messageNode, message }, exits)
}

/** Thư viện bắt buộc chọn danh mục. Trả mã lỗi hoặc ''. */
const loiThuVien = (loai, kind) => (loai === 'library' && !LOAI_THU_VIEN.includes(kind) ? 'libraryKindRequired' : '')

module.exports = {

    /**
     * Danh sách bài cho màn hình quản trị.
     *
     * Không dùng lại `/v1/public/content/list`: endpoint đó cố định
     * `status: 'published'`, mà cả việc của trang này là nhìn thấy những bài
     * CHƯA published.
     */
    listContent: ({
        inputs: sails.config.inputs.Admin.Content.listContent,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                // Chỉ những loại người này được mở: hỏi loại khác thì coi như hỏi tất cả loại được phép.
                let duocPhep = loaiQuanTri(inputs.User)
                let hoi = String(inputs.type || '').split(',').map(t => t.trim()).filter(t => duocPhep.includes(t))
                let loaiLoc = (hoi.length ? hoi : duocPhep).join(',') || '__khong__'
                let dieuKien = Object.assign(dungDieuKien(Object.assign({}, inputs, { type: loaiLoc })), { type: { $in: loaiLoc.split(',') } })
                if (inputs.pendingEdit) dieuKien['pendingEdit.at'] = { $gt: 0 }
                let bang = bangNoiDung()
                let { page, limit } = inputs

                let bts = bang.find(dieuKien, { projection: { bodyHtml: 0, searchText: 0 } })
                    .sort({ updatedAt: -1, createdAt: -1 })
                    .skip(limit * (page - 1))
                    .limit(limit)

                let [rows, total] = await Promise.all([bts.toArray(), bang.countDocuments(dieuKien)])

                // Đếm theo trạng thái để giao diện hiện số trên từng tab lọc mà
                // không phải gọi thêm bốn lượt.
                let demTheoTrangThai = await bang.aggregate([
                    { $match: { type: { $in: loaiLoc.split(',') } } },
                    { $group: { _id: '$status', n: { $sum: 1 } } }
                ]).toArray()

                let thongKe = {}
                TRANG_THAI_HOP_LE.forEach(tt => { thongKe[tt] = 0 })
                demTheoTrangThai.forEach(item => {
                    if (item._id && thongKe[item._id] !== undefined) thongKe[item._id] = item.n
                })

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: {
                        data: rows.map(row => dinhDangQuanTri(row, { rutGon: true })),
                        total: total,
                        page: page,
                        limit: limit,
                        stats: thongKe
                    }
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    /** Một bài đầy đủ, gồm cả thân bài và danh sách chương, để mở trong trình soạn. */
    getContent: ({
        inputs: sails.config.inputs.Admin.Content.getContent,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let row = await sails.dataProcess.findOne(Content, { condition: { id: inputs.id } })
                if (!row) return loi(exits, 'contentNotFound')
                if (!duocXem(inputs.User, row.type)) return loi(exits, 'contentForbidden')

                let kq = dinhDangQuanTri(row)
                // Trình soạn của người đề xuất cần cả nội dung đề xuất để sửa tiếp.
                if (row.pendingEdit && row.pendingEdit.at) kq.pendingEditFields = row.pendingEdit.fields || {}
                // Bài của người dùng: lưu sẽ thành đề xuất sửa (giao diện báo trước).
                kq.ownerIsUser = await laBaiNguoiDung(row, inputs.User.id)

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: kq
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    /**
     * Tạo bài mới. Luôn bắt đầu ở `draft` - muốn lên trang phải qua action
     * `setStatus`, tức là phải có quyền `content.publish`.
     */
    createContent: ({
        inputs: sails.config.inputs.Admin.Content.createContent,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let { User } = inputs

                if (!LOAI_HOP_LE.includes(inputs.type)) return loi(exits, 'contentTypeInvalid')
                if (!String(inputs.title || '').trim()) return loi(exits, 'contentTitleRequired')

                let slug = String(inputs.slug || '').trim() || dungSlug(inputs.title)
                if (!SLUG.test(slug)) return loi(exits, 'contentSlugInvalid')

                let trung = await sails.dataProcess.findOne(Content, { condition: { slug: slug } })
                if (trung) return loi(exits, 'contentSlugTaken')

                if (inputs.source !== undefined) inputs.source = chuanHoaNguon(inputs.source)
                let loiKinh = loiKinhSach(User, '', inputs.type, inputs.source)
                if (loiKinh) return loi(exits, loiKinh)
                if (!duocSuaTrucTiep(User, inputs.type)) return loi(exits, 'contentForbidden')
                let loiTV = loiThuVien(inputs.type, inputs.libraryKind)
                if (loiTV) return loi(exits, loiTV)

                let ban = Object.assign(gomTruong(inputs), {
                    slug: slug,
                    status: 'draft',
                    // Ghi lại ai tạo để trang quản trị lọc được "bài do người
                    // dùng gửi lên"; client không đặt được trường này.
                    authorId: String(User.id)
                })
                if (inputs.author !== undefined) ban.author = await chuanHoaTacGia(inputs.author, User.id)
                if (inputs.translator !== undefined) ban.translator = await chuanHoaDichGia(inputs.translator)
                Object.assign(ban, dauVet('created', User), dauVet('updated', User))

                let moi = await sails.dataProcess.createDocument(Content, ban)
                await ghiNhatKy({
                    req: this.req,
                    user: User,
                    bai: moi,
                    action: 'create',
                    toStatus: 'draft',
                    // Bản đầu tiên: lần sửa sau đối chiếu ngược về được tới đây.
                    changes: chupNoiDung(moi, 'after')
                })

                exits.successRequest({
                    messageNode: 'Content',
                    message: 'contentCreated',
                    data: dinhDangQuanTri(moi)
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    /**
     * Sửa bài.
     *
     * Luôn gửi lại đủ title + summary + tags xuống Waterline kể cả khi người
     * dùng chỉ đổi một trong ba: hook `beforeUpdate` của model chỉ tính lại
     * `searchText` khi có đủ cả ba, thiếu thì nó giữ giá trị cũ và bài sẽ
     * không tìm thấy được bằng tiêu đề mới.
     */
    updateContent: ({
        inputs: sails.config.inputs.Admin.Content.updateContent,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let hienCo = await sails.dataProcess.findOne(Content, { condition: { id: inputs.id } })
                if (!hienCo) return loi(exits, 'contentNotFound')

                if (inputs.source !== undefined) inputs.source = chuanHoaNguon(inputs.source)
                let loaiMoi = inputs.type === undefined ? hienCo.type : inputs.type
                let nguonMoi = inputs.source === undefined ? hienCo.source : inputs.source
                let loiKinh = loiKinhSach(inputs.User, hienCo.type, loaiMoi, nguonMoi)
                if (loiKinh) return loi(exits, loiKinh)
                if (!duocXem(inputs.User, hienCo.type) || !duocXem(inputs.User, loaiMoi)) return loi(exits, 'contentForbidden')
                let loiTV = loiThuVien(loaiMoi, inputs.libraryKind === undefined ? hienCo.libraryKind : inputs.libraryKind)
                if (loiTV) return loi(exits, loiTV)

                // Bài của người dùng: thành đề xuất sửa, không ghi đè.
                let deXuat = await laBaiNguoiDung(hienCo, inputs.User.id)
                if (!deXuat && !duocSuaTrucTiep(inputs.User, hienCo.type)) return loi(exits, 'contentForbidden')

                let ban = gomTruong(inputs)
                if (inputs.translator !== undefined) ban.translator = await chuanHoaDichGia(inputs.translator)

                if (inputs.author !== undefined) {
                    // Bài đã có chủ thì giữ chủ đó: người biên tập sửa bài của
                    // cộng tác viên không biến mình thành tác giả. Bài nhập tay
                    // chưa có chủ thì nhận người đang sửa.
                    let chuSoHuu = hienCo.authorId || String(inputs.User.id)
                    ban.author = await chuanHoaTacGia(inputs.author, chuSoHuu)
                    if (ban.author.fromProfile && !hienCo.authorId) ban.authorId = chuSoHuu
                }

                if (ban.type !== undefined && !LOAI_HOP_LE.includes(ban.type)) {
                    return loi(exits, 'contentTypeInvalid')
                }
                if (ban.title !== undefined && !String(ban.title).trim()) {
                    return loi(exits, 'contentTitleRequired')
                }

                if (inputs.slug !== undefined) {
                    let slug = String(inputs.slug).trim()
                    if (!SLUG.test(slug)) return loi(exits, 'contentSlugInvalid')

                    if (slug !== hienCo.slug) {
                        let trung = await sails.dataProcess.findOne(Content, { condition: { slug: slug } })
                        if (trung) return loi(exits, 'contentSlugTaken')
                    }
                    ban.slug = slug
                }

                ban.title = ban.title === undefined ? hienCo.title : ban.title
                ban.summary = ban.summary === undefined ? (hienCo.summary || '') : ban.summary
                ban.tags = ban.tags === undefined ? (hienCo.tags || []) : ban.tags

                // Tính TRƯỚC khi gắn dấu vết, để danh sách chỉ gồm trường nội dung.
                let daDoi = truongDaDoi(hienCo, ban)

                if (deXuat) {
                    if (!daDoi.length) return loi(exits, 'contentNoChanges')
                    // Đổi slug / loại bài của người khác qua đề xuất: không cho - chỉ sửa nội dung.
                    delete ban.slug
                    delete ban.type
                    let truong = daDoi.filter(t => t !== 'slug' && t !== 'type')
                    let deXuatMoi = {
                        fields: Object.assign({}, ...truong.map(t => ({ [t]: ban[t] }))),
                        changes: truong.map(ten => ({
                            field: ten,
                            before: hienCo[ten] === undefined ? null : hienCo[ten],
                            after: ban[ten] === undefined ? null : ban[ten]
                        })),
                        byId: String(inputs.User.id),
                        byName: inputs.User.fullName || inputs.User.username || '',
                        at: Date.now(),
                        note: String(inputs.editNote || '').trim().slice(0, 500)
                    }
                    await Content.updateOne({ id: hienCo.id }).set({ pendingEdit: deXuatMoi })
                    await guiThongBaoBai({
                        userId: hienCo.authorId,
                        type: 'edit-proposal',
                        actorId: inputs.User.id,
                        bai: hienCo,
                        excerpt: deXuatMoi.note,
                        link: `/tai-khoan/bai-viet?id=${hienCo.id}`
                    })
                    let sauDeXuat = await sails.dataProcess.findOne(Content, { condition: { id: hienCo.id } })
                    return exits.successRequest({
                        messageNode: 'Content',
                        message: 'contentEditProposed',
                        data: dinhDangQuanTri(sauDeXuat)
                    });
                }

                Object.assign(ban, dauVet('updated', inputs.User))

                await sails.dataProcess.updateDocument(Content, {
                    condition: { id: hienCo.id },
                    updateObject: ban
                })

                let sau = await sails.dataProcess.findOne(Content, { condition: { id: hienCo.id } })

                // Bấm lưu mà không đổi gì thì không có gì để ghi.
                if (daDoi.length) {
                    await ghiNhatKy({
                        req: this.req,
                        user: inputs.User,
                        bai: sau,
                        action: 'update',
                        fromStatus: hienCo.status,
                        toStatus: sau.status,
                        changedFields: daDoi,
                        // Giá trị trước và sau của đúng những trường đã đổi.
                        changes: daDoi.map(ten => ({
                            field: ten,
                            before: hienCo[ten] === undefined ? null : hienCo[ten],
                            after: ban[ten] === undefined ? null : ban[ten]
                        }))
                    })
                }

                exits.successRequest({
                    messageNode: 'Content',
                    message: 'contentUpdated',
                    data: dinhDangQuanTri(sau)
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    /**
     * Phê duyệt / trả về nháp / lưu trữ.
     *
     * Gộp bốn thao tác vào một action vì chúng chỉ khác nhau đúng một chuỗi,
     * và gộp thì luật "publish thì phải có ngày đăng" chỉ nằm ở một chỗ.
     *
     * Lưu trữ KHÔNG xoá bài: `archived` gỡ bài khỏi trang công khai nhưng giữ
     * nguyên bản ghi, nên đăng lại chỉ là một cú bấm.
     */
    setStatus: ({
        inputs: sails.config.inputs.Admin.Content.setStatus,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                if (!TRANG_THAI_HOP_LE.includes(inputs.status)) return loi(exits, 'contentStatusInvalid')

                let hienCo = await sails.dataProcess.findOne(Content, { condition: { id: inputs.id } })
                if (!hienCo) return loi(exits, 'contentNotFound')
                if (!duocDoiTrangThai(inputs.User, hienCo.type, hienCo.status || 'draft', inputs.status)) {
                    return loi(exits, 'contentForbidden')
                }

                let ban = { status: inputs.status }
                let traLai = hienCo.status === 'pending' && inputs.status === 'draft'
                if (traLai) ban.reviewNote = String(inputs.note || '').trim().slice(0, 500)
                if (inputs.status === 'published') ban.reviewNote = ''

                // Bài lên trang mà thiếu ngày đăng thì sitemap và phần sắp xếp
                // theo thời gian đều không có mốc nào để bám.
                if (inputs.status === 'published' && !hienCo.publishedAt) {
                    ban.publishedAt = new Date().toISOString()
                }

                // Duyệt đăng: ghi người duyệt và thời điểm duyệt lên bản ghi. Mỗi
                // lần đăng lại (sau khi trả về nháp / lưu trữ) ghi đè thành lần
                // gần nhất; các lần trước vẫn nằm trong nhật ký.
                if (inputs.status === 'published' && hienCo.status !== 'published') {
                    Object.assign(ban, dauVet('approved', inputs.User), { approvedAt: Date.now() })
                }
                Object.assign(ban, dauVet('updated', inputs.User))

                await sails.dataProcess.updateDocument(Content, {
                    condition: { id: hienCo.id },
                    updateObject: ban
                })

                if (hienCo.status !== inputs.status) {
                    await ghiNhatKy({
                        req: this.req,
                        user: inputs.User,
                        bai: hienCo,
                        action: 'status',
                        fromStatus: hienCo.status || 'draft',
                        toStatus: inputs.status
                    })
                    if (inputs.status === 'published') await baoDaDang(hienCo, inputs.User)
                    if (traLai && hienCo.authorId) {
                        await guiThongBaoBai({
                            userId: hienCo.authorId,
                            type: 'rejected',
                            actorId: inputs.User.id,
                            bai: hienCo,
                            excerpt: ban.reviewNote,
                            link: `/tai-khoan/bai-viet?id=${hienCo.id}`
                        })
                    }
                }

                exits.successRequest({
                    messageNode: 'Content',
                    message: 'contentStatusChanged',
                    data: dinhDangQuanTri(Object.assign({}, hienCo, ban), { rutGon: true })
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    /**
     * Xoá hẳn.
     *
     * Giao diện nên mời `archived` trước; đây là đường một chiều, không có
     * thùng rác nào phía sau.
     */
    deleteContent: ({
        inputs: sails.config.inputs.Admin.Content.deleteContent,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let hienCo = await sails.dataProcess.findOne(Content, { condition: { id: inputs.id } })
                if (!hienCo) return loi(exits, 'contentNotFound')

                await sails.dataProcess.removeDocument(Content, { id: hienCo.id })
                // Nhật ký giữ tiêu đề + slug lúc xoá: bài không còn để tra ngược nữa.
                await ghiNhatKy({
                    req: this.req,
                    user: inputs.User,
                    bai: hienCo,
                    action: 'delete',
                    fromStatus: hienCo.status || '',
                    // Bài không còn: chụp toàn bộ nội dung để đọc lại được.
                    changes: chupNoiDung(hienCo, 'before')
                })

                exits.successRequest({
                    messageNode: 'Content',
                    message: 'contentDeleted',
                    data: { id: String(hienCo.id), slug: hienCo.slug }
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    /**
     * Toàn bộ nhật ký thao tác của một bài, mới nhất trước. Vẫn trả được sau
     * khi bài đã bị xoá (nhật ký không xoá theo bài).
     */
    getHistory: ({
        inputs: sails.config.inputs.Admin.Content.getHistory,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let ds = await ContentAuditLog.find({
                    where: { contentId: String(inputs.id) },
                    sort: 'createdAt DESC',
                    limit: 200
                })

                // Lần nào có lưu nội dung để đối chiếu. Truy vấn Mongo trực tiếp
                // với projection: app để schema:false nên Waterline không cho
                // `select`, mà lấy cả `changes` là kéo về toàn bộ thân bài.
                let coBanSua = new Set((await ContentRevision.getDatastore().manager
                    .collection(ContentRevision.tableName)
                    .find({ contentId: String(inputs.id) }, { projection: { logId: 1 } })
                    .toArray()).map(row => row.logId))

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: ds.map(row => ({
                        id: String(row.id),
                        action: row.action,
                        fromStatus: row.fromStatus || '',
                        toStatus: row.toStatus || '',
                        changedFields: row.changedFields || [],
                        actorId: row.actorId,
                        actorName: row.actorName || row.actorUsername || '',
                        actorUsername: row.actorUsername || '',
                        ip: row.ip || '',
                        contentTitle: row.contentTitle || '',
                        hasRevision: coBanSua.has(String(row.id)),
                        createdAt: sangISO(row.createdAt)
                    }))
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    /**
     * Nội dung trước/sau của MỘT lần thao tác, để đối chiếu. Tách khỏi
     * getHistory vì có thể mang cả thân bài - chỉ tải khi người xem mở ra.
     */
    getRevision: ({
        inputs: sails.config.inputs.Admin.Content.getRevision,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let banSua = await ContentRevision.findOne({ logId: String(inputs.logId) })
                if (!banSua) return loi(exits, 'contentNotFound')

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: {
                        logId: banSua.logId,
                        contentId: banSua.contentId,
                        action: banSua.action,
                        changes: banSua.changes || []
                    }
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    /**
     * Tìm người dùng để chọn làm dịch giả kinh sách. Chỉ trả id + họ tên +
     * pháp danh (không email), quyền `sutra.manage` - không cần `user.list`.
     */
    searchPeople: ({
        inputs: sails.config.inputs.Admin.Content.searchPeople,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: await timNguoi(inputs.q)
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    /** Danh sách chuyên mục, để trình soạn dựng ô chọn. */
    listCategories: ({
        inputs: sails.config.inputs.Admin.Content.listCategories,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let danhMuc = await ContentCategory.find({}).sort([{ order: 'ASC' }, { name: 'ASC' }])

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: danhMuc.map(row => ({
                        id: String(row.id),
                        slug: row.slug,
                        name: row.name,
                        kind: row.kind || 'all'
                    }))
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

};
