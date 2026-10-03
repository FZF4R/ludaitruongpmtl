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
 * Quyền: xem/sửa cần `content.editAny`, đổi trạng thái cần `content.publish`,
 * xoá cần `content.delete` - tra trong config/permissions.js. Cả ba đều thuộc
 * bậc Quản trị viên trở lên theo config/roles.js.
 */
const { boDau, thoatRegex } = require('../../../utils/vietnamese')

const LOAI_HOP_LE = ['article', 'blog', 'sutra', 'audio', 'video']
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
        categories: row.categories || [],
        tags: row.tags || [],
        publishedAt: row.publishedAt || '',
        readingMinutes: row.readingMinutes || 0,
        viewCount: row.viewCount || 0,
        seo: row.seo || {},
        createdAt: sangISO(row.createdAt),
        updatedAt: sangISO(row.updatedAt)
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
    gan('categories', inputs.categories)
    gan('tags', inputs.tags)
    gan('publishedAt', inputs.publishedAt)
    gan('readingMinutes', inputs.readingMinutes)
    gan('seo', inputs.seo)

    return ban
}

const loi = (exits, message, messageNode = 'Content') => {
    sails.checkErrorOutput({ messageNode, message }, exits)
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
                let dieuKien = dungDieuKien(inputs)
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
                    { $match: dungDieuKien({ type: inputs.type }) },
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

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: dinhDangQuanTri(row)
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

                let ban = Object.assign(gomTruong(inputs), {
                    slug: slug,
                    status: 'draft',
                    // Ghi lại ai tạo để trang quản trị lọc được "bài do người
                    // dùng gửi lên"; client không đặt được trường này.
                    authorId: String(User.id)
                })

                let moi = await sails.dataProcess.createDocument(Content, ban)

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

                let ban = gomTruong(inputs)

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

                await sails.dataProcess.updateDocument(Content, {
                    condition: { id: hienCo.id },
                    updateObject: ban
                })

                let sau = await sails.dataProcess.findOne(Content, { condition: { id: hienCo.id } })

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

                let ban = { status: inputs.status }

                // Bài lên trang mà thiếu ngày đăng thì sitemap và phần sắp xếp
                // theo thời gian đều không có mốc nào để bám.
                if (inputs.status === 'published' && !hienCo.publishedAt) {
                    ban.publishedAt = new Date().toISOString()
                }

                await sails.dataProcess.updateDocument(Content, {
                    condition: { id: hienCo.id },
                    updateObject: ban
                })

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
