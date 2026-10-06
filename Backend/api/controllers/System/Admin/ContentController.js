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
const { ngayVN } = require('../../../utils/loiNguyen')
const { dungBoPhanLoai } = require('../../../utils/phanLoai')

const MOT_NGAY = 24 * 3600 * 1000
/** Thứ tự sắp xếp danh sách quản trị. */
const SAP_XEP = {
    updated: { updatedAt: -1, createdAt: -1 },
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    views: { viewCount: -1, createdAt: -1 },
    title: { title: 1 }
}
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

    // Tiêu đề / tóm tắt / thẻ (searchText bỏ dấu) HOẶC tên tác giả, người đăng (so như gõ).
    if (q) {
        let coDau = { $regex: thoatRegex(String(q).trim()), $options: 'i' }
        dieuKien.$or = [
            { searchText: { $regex: thoatRegex(boDau(q)), $options: 'i' } },
            { 'author.name': coDau },
            { 'author.dharmaName': coDau },
            { createdByName: coDau }
        ]
    }

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

/* ---------------------------- Xuất / nhập bài ---------------------------- */

/**
 * Nhập / xuất / tự phân loại: bài viết + tuỳ bút (tab Bài viết) và kinh sách
 * (tab Kinh sách). Hai nhóm tách nhau: tự phân loại kinh chỉ học từ kinh.
 */
const NHOM_BAI_VIET = ['article', 'blog']
const LOAI_NHAP = [...NHOM_BAI_VIET, 'sutra']
const nhomCua = loai => (loai === 'sutra' ? ['sutra'] : NHOM_BAI_VIET)
/** Kinh sách: tối đa chừng này chương một bộ. */
const CHUONG_TOI_DA = 500
const TRANG_THAI_NHAP = ['pending', 'draft', 'published']
const NHAP_TOI_DA = 50
const XUAT_TOI_DA = 5000
const DAI_THAN_BAI_TOI_DA = 500000

/** Thẻ: mảng hoặc chuỗi phân tách bằng dấu phẩy / chấm phẩy. */
const chuanHoaThe = the => (Array.isArray(the) ? the : String(the || '').split(/[,;]/))
    .map(t => String(t).trim().slice(0, 40)).filter(Boolean).slice(0, 10)

/** Chuỗi ngày bất kỳ -> ISO, sai thì ''. */
const ngayISO = giaTri => {
    if (!giaTri) return ''
    let d = new Date(giaTri)

    return isNaN(d.getTime()) ? '' : d.toISOString()
}

/** Slug không trùng trong CSDL lẫn trong cùng lượt nhập: thêm -2, -3... */
const slugKhongTrung = async (goc, daDung) => {
    let co = goc.slice(0, 90) || `bai-${Date.now().toString(36)}`
    for (let i = 1; i < 200; i++) {
        let thu = i === 1 ? co : `${co.slice(0, 85)}-${i}`
        if (daDung.has(thu)) continue
        if (!(await sails.dataProcess.findOne(Content, { condition: { slug: thu } }))) {
            daDung.add(thu)
            return thu
        }
    }

    return `${co.slice(0, 80)}-${Date.now().toString(36)}`
}

/**
 * Danh mục dùng được = bảng ContentCategory GỘP các danh mục đang gắn trên bài
 * viết (bài seed / bài cũ có thể mang danh mục chưa có trong bảng). Dùng chung
 * cho ô chọn danh mục, kiểm tra lúc nhập và bộ tự phân loại.
 * -> [{ slug, name, kind, order }]
 */
const danhMucTongHop = async (loai = LOAI_NHAP) => {
    let bang = await ContentCategory.find({}).sort([{ order: 'ASC' }, { name: 'ASC' }])
    let kq = bang.map(d => ({ id: String(d.id), slug: d.slug, name: d.name, kind: d.kind || 'all' }))
    let co = new Set(kq.map(d => d.slug))
    let tuBai = await bangNoiDung().aggregate([
        { $match: { type: { $in: loai }, 'categories.0': { $exists: true } } },
        { $unwind: '$categories' },
        { $group: { _id: '$categories.slug', name: { $first: '$categories.name' }, types: { $addToSet: '$type' } } },
        { $sort: { name: 1 } }
    ]).toArray()
    tuBai.forEach(d => {
        if (d._id && !co.has(d._id)) kq.push({ id: '', slug: d._id, name: d.name || d._id, kind: (d.types || []).every(t => t === 'sutra') ? 'sutra' : 'article' })
    })

    return kq
}

/**
 * Chương kinh từ tệp: [{ title, bodyHtml }] -> [{ order, title, slug, bodyHtml }].
 * Slug chương tự sinh từ tên, không trùng trong cùng bộ. Trả null nếu quá dài.
 */
const chuanHoaChuong = ds => {
    let daDung = new Set()
    let kq = []
    for (let [i, c] of (Array.isArray(ds) ? ds : []).slice(0, CHUONG_TOI_DA).entries()) {
        let ten = String((c && c.title) || '').trim().slice(0, 200) || `Chương ${i + 1}`
        let than = String((c && c.bodyHtml) || '')
        if (than.length > DAI_THAN_BAI_TOI_DA) return null
        let goc = dungSlug(ten).slice(0, 80) || `chuong-${i + 1}`
        let slug = goc
        for (let n = 2; daDung.has(slug); n++) slug = `${goc}-${n}`
        daDung.add(slug)
        kq.push({ order: i + 1, title: ten, slug, bodyHtml: than })
    }

    return kq
}

/** Một bài của lượt nhập -> { ok, id, slug } hoặc { ok: false, error }. */
const nhapMotBai = async (vao, { User, danhMuc, luot, tenTep, bayGio, slugDaDung, req }) => {
    let loai = LOAI_NHAP.includes(vao.type) ? vao.type : 'article'
    if (!duocSuaTrucTiep(User, loai)) return { ok: false, error: 'contentForbidden' }

    let tieuDe = String(vao.title || '').trim().slice(0, 200)
    if (!tieuDe) return { ok: false, error: 'contentTitleRequired' }

    let trangThai = TRANG_THAI_NHAP.includes(vao.status) ? vao.status : 'pending'
    if (trangThai === 'published' && !duocDoiTrangThai(User, loai, 'pending', 'published')) {
        return { ok: false, error: 'importPublishForbidden' }
    }

    let thanBai = String(vao.bodyHtml || '')
    if (thanBai.length > DAI_THAN_BAI_TOI_DA) return { ok: false, error: 'importBodyTooLong' }

    // Kinh sách: bắt buộc nguồn (cùng luật với trình soạn - loiKinhSach), có chương, dịch giả.
    let nguon = chuanHoaNguon({ name: vao.sourceName, url: vao.sourceUrl })
    let chuong = []
    if (loai === 'sutra') {
        let loiKinh = loiKinhSach(User, '', 'sutra', nguon)
        if (loiKinh) return { ok: false, error: loiKinh }
        chuong = chuanHoaChuong(vao.chapters)
        if (!chuong) return { ok: false, error: 'importBodyTooLong' }
    }

    let slugVao = String(vao.slug || '').trim().toLowerCase()
    let slug = await slugKhongTrung(SLUG.test(slugVao) ? slugVao : dungSlug(tieuDe), slugDaDung)

    let maDm = String(vao.category || '').trim()
    let anhBia = String(vao.coverUrl || '').trim()
    let ngayDang = ngayISO(vao.publishedAt)

    let ban = {
        type: loai,
        slug,
        title: tieuDe,
        summary: String(vao.summary || '').trim().slice(0, 600),
        bodyHtml: thanBai,
        coverUrl: /^https?:\/\//i.test(anhBia) ? anhBia.slice(0, 500) : '',
        categories: danhMuc.has(maDm) ? [{ slug: maDm, name: danhMuc.get(maDm) }] : [],
        tags: chuanHoaThe(vao.tags),
        author: await chuanHoaTacGia(vao.author ? { name: vao.author, title: vao.authorTitle } : null, User.id),
        source: nguon,
        publishedAt: ngayDang || (trangThai === 'published' ? new Date(bayGio).toISOString() : ''),
        status: trangThai,
        authorId: String(User.id),
        importedById: String(User.id),
        importedByName: User.fullName || User.username || '',
        importedAt: bayGio,
        importBatch: luot,
        importSource: tenTep
    }
    if (loai === 'sutra') {
        ban.chapters = chuong
        ban.translator = await chuanHoaDichGia(vao.translator ? { name: vao.translator } : null)
    }
    Object.assign(ban, dauVet('created', User), dauVet('updated', User))
    if (trangThai === 'published') Object.assign(ban, dauVet('approved', User), { approvedAt: bayGio })

    let moi = await sails.dataProcess.createDocument(Content, ban)
    await ghiNhatKy({ req, user: User, bai: moi, action: 'import', toStatus: trangThai, changes: chupNoiDung(moi, 'after') })

    return { ok: true, id: String(moi.id), slug }
}

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
                    .sort(SAP_XEP[inputs.sort] || SAP_XEP.updated)
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

                // Số liệu từng bài: bình luận (đang hiện / bị giữ), lượt xem hôm nay và 7 ngày.
                let ids = rows.map(r => String(r._id))
                let homNay = ngayVN()
                let tu7 = ngayVN(Date.now() - 6 * MOT_NGAY)
                let bangXem = ContentViewDaily.getDatastore().manager.collection(ContentViewDaily.tableName)
                let bangBl = Comment.getDatastore().manager.collection(Comment.tableName)
                let [xem, bl, tongQuan] = await Promise.all([
                    ids.length ? bangXem.aggregate([
                        { $match: { contentId: { $in: ids }, dayKey: { $gte: tu7 } } },
                        { $group: { _id: '$contentId', week: { $sum: '$n' }, today: { $sum: { $cond: [{ $eq: ['$dayKey', homNay] }, '$n', 0] } } } }
                    ]).toArray() : [],
                    ids.length ? bangBl.aggregate([
                        { $match: { contentId: { $in: ids } } },
                        { $group: { _id: { c: '$contentId', s: '$status' }, n: { $sum: 1 } } }
                    ]).toArray() : [],
                    // Tổng quan cho cả loại đang xem: tổng lượt xem, lượt xem hôm nay, bình luận hôm nay.
                    (async () => {
                        let tatCa = await bang.aggregate([
                            { $match: { type: { $in: loaiLoc.split(',') } } },
                            { $group: { _id: null, views: { $sum: '$viewCount' } } }
                        ]).toArray()
                        let idsLoai = (await bang.find({ type: { $in: loaiLoc.split(',') } }, { projection: { _id: 1 } }).toArray()).map(r => String(r._id))
                        let tuDauNgay = new Date(`${homNay}T00:00:00+07:00`).getTime()
                        let [xemHomNay, blHomNay] = await Promise.all([
                            bangXem.aggregate([
                                { $match: { contentId: { $in: idsLoai }, dayKey: homNay } },
                                { $group: { _id: null, n: { $sum: '$n' } } }
                            ]).toArray(),
                            bangBl.countDocuments({ contentId: { $in: idsLoai }, createdAt: { $gte: tuDauNgay } })
                        ])
                        return {
                            views: tatCa[0] ? tatCa[0].views : 0,
                            viewsToday: xemHomNay[0] ? xemHomNay[0].n : 0,
                            commentsToday: blHomNay
                        }
                    })()
                ])
                let xemTheoBai = {}
                xem.forEach(x => { xemTheoBai[x._id] = x })
                let blTheoBai = {}
                bl.forEach(x => {
                    let m = blTheoBai[x._id.c] = blTheoBai[x._id.c] || { visible: 0, flagged: 0, hidden: 0 }
                    if (m[x._id.s] !== undefined) m[x._id.s] = x.n
                })

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: {
                        data: rows.map(row => {
                            let id = String(row._id)
                            return Object.assign(dinhDangQuanTri(row, { rutGon: true }), {
                                metrics: {
                                    viewsToday: (xemTheoBai[id] || {}).today || 0,
                                    viewsWeek: (xemTheoBai[id] || {}).week || 0,
                                    comments: (blTheoBai[id] || {}).visible || 0,
                                    commentsFlagged: (blTheoBai[id] || {}).flagged || 0
                                }
                            })
                        }),
                        total: total,
                        page: page,
                        limit: limit,
                        stats: thongKe,
                        overview: tongQuan
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

    /**
     * Xuất bài (đủ thân bài) theo đúng bộ lọc đang xem, để FrontEnd ghi ra
     * JSON / Excel. Các cột trùng tên với lúc nhập nên xuất ra sửa rồi nhập
     * lại được. Tối đa XUAT_TOI_DA bài một lần.
     */
    exportContent: ({
        inputs: sails.config.inputs.Admin.Content.exportContent,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let duocPhep = loaiQuanTri(inputs.User).filter(t => LOAI_NHAP.includes(t))
                let hoi = String(inputs.type || '').split(',').map(t => t.trim()).filter(t => duocPhep.includes(t))
                let loaiLoc = hoi.length ? hoi : duocPhep
                if (!loaiLoc.length) return loi(exits, 'contentForbidden')

                let dieuKien = Object.assign(dungDieuKien(inputs), { type: { $in: loaiLoc } })
                let rows = await bangNoiDung().find(dieuKien, { projection: { searchText: 0, pendingEdit: 0 } })
                    .sort(SAP_XEP.newest)
                    .limit(XUAT_TOI_DA)
                    .toArray()

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: {
                        exportedAt: new Date().toISOString(),
                        exportedBy: inputs.User.fullName || inputs.User.username || '',
                        limit: XUAT_TOI_DA,
                        items: rows.map(row => ({
                            id: String(row._id),
                            type: row.type,
                            slug: row.slug,
                            title: row.title,
                            summary: row.summary || '',
                            bodyHtml: row.bodyHtml || '',
                            coverUrl: row.coverUrl || '',
                            category: ((row.categories || [])[0] || {}).slug || '',
                            categoryName: ((row.categories || [])[0] || {}).name || '',
                            tags: row.tags || [],
                            author: (row.author && row.author.name) || '',
                            authorTitle: (row.author && row.author.title) || '',
                            sourceName: (row.source && row.source.name) || '',
                            sourceUrl: (row.source && row.source.url) || '',
                            status: row.status || 'draft',
                            publishedAt: row.publishedAt || '',
                            viewCount: row.viewCount || 0,
                            createdAt: sangISO(row.createdAt),
                            createdByName: row.createdByName || '',
                            importedByName: row.importedByName || '',
                            importedAt: sangISO(row.importedAt),
                            translator: (row.translator && row.translator.name) || '',
                            chapters: (row.chapters || []).map(c => ({ title: c.title || '', bodyHtml: c.bodyHtml || '' }))
                        }))
                    }
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    /**
     * Gợi ý danh mục cho các bài sắp nhập, học từ bài đã có danh mục
     * (api/utils/phanLoai.js). Chỉ đọc, không ghi gì.
     */
    classifyContent: ({
        inputs: sails.config.inputs.Admin.Content.classifyContent,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let ds = Array.isArray(inputs.items) ? inputs.items.slice(0, NHAP_TOI_DA) : []
                let nhom = nhomCua(inputs.type)
                let kieuDm = inputs.type === 'sutra' ? ['sutra', 'all'] : ['article', 'all']
                let [danhMuc, baiMau] = await Promise.all([
                    danhMucTongHop(nhom).then(ds => ds.filter(d => kieuDm.includes(d.kind))),
                    bangNoiDung().find(
                        { type: { $in: nhom }, 'categories.0': { $exists: true } },
                        { projection: { title: 1, summary: 1, tags: 1, categories: 1, bodyHtml: 1, 'chapters.title': 1 } }
                    ).sort(SAP_XEP.newest).limit(3000).toArray()
                ])
                // Kinh thường để nội dung trong chương: tên chương cũng là căn cứ phân loại.
                baiMau.forEach(b => { b.bodyHtml = `${b.bodyHtml || ''} ${(b.chapters || []).map(c => c.title).join(' ')}` })
                let phanLoai = dungBoPhanLoai(danhMuc.map(d => ({ slug: d.slug, name: d.name })), baiMau)

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: {
                        sampleSize: baiMau.length,
                        results: ds.map(bai => phanLoai({
                            title: String((bai && bai.title) || ''),
                            summary: String((bai && bai.summary) || ''),
                            tags: Array.isArray(bai && bai.tags) ? bai.tags.map(String) : [],
                            bodyHtml: String((bai && bai.bodyHtml) || '')
                        }))
                    }
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    /**
     * Nhập nhiều bài một lượt (FrontEnd chia nhỏ, mỗi lần tối đa NHAP_TOI_DA).
     *
     * Từng bài kiểm riêng, bài lỗi không làm hỏng cả lượt: trả về kết quả theo
     * đúng thứ tự gửi lên ({ ok, id, slug } hoặc { ok: false, error }).
     * Mặc định trạng thái "pending" (chưa duyệt). "published" cần quyền đăng bài.
     * Mỗi bài ghi người nhập + thời điểm + mã lượt + tên tệp, và một dòng nhật
     * ký 'import'. Không gửi thông báo / cộng công đức: bài do ban quản trị nhập.
     */
    importContent: ({
        inputs: sails.config.inputs.Admin.Content.importContent,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let { User } = inputs
                let ds = Array.isArray(inputs.items) ? inputs.items : []
                if (!ds.length) return loi(exits, 'contentImportEmpty')
                if (ds.length > NHAP_TOI_DA) return loi(exits, 'contentImportTooMany')

                let danhMuc = new Map((await danhMucTongHop()).map(d => [d.slug, d.name]))
                let luot = /^[a-z0-9-]{6,40}$/i.test(String(inputs.batch || '')) ? String(inputs.batch) : `nhap-${Date.now().toString(36)}`
                let tenTep = String(inputs.source || '').trim().slice(0, 200)
                let bayGio = Date.now()
                let slugDaDung = new Set()
                let ketQua = []

                for (let vao of ds) {
                    try {
                        ketQua.push(await nhapMotBai(vao || {}, { User, danhMuc, luot, tenTep, bayGio, slugDaDung, req: this.req }))
                    } catch (err) {
                        sails.log.error('[importContent]', err && err.message)
                        ketQua.push({ ok: false, error: 'errorWhileProcess' })
                    }
                }

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: { batch: luot, results: ketQua }
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
                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: await danhMucTongHop()
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

};
