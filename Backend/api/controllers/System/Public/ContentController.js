/**
 * ContentController
 *
 * @description :: Các endpoint công khai cấp nội dung cho FrontEnd Next.js.
 *
 * HỢP ĐỒNG DỮ LIỆU - đọc trước khi sửa:
 *
 * FrontEnd parse mọi phản hồi bằng zod (FrontEnd/lib/schema.ts). Thiếu một
 * trường bắt buộc, hoặc gửi `null` vào chỗ khai `.optional()`, là hỏng nguyên
 * trang chứ không phải thiếu một dòng. Vì vậy các hàm dinhDang* dưới đây chỉ
 * gắn trường tuỳ chọn KHI CÓ GIÁ TRỊ THẬT, không bao giờ gắn null.
 *
 * Lưu ý về bọc dữ liệu: responseToClient trả { message, data }, còn
 * FrontEnd/lib/api.ts lấy `body.data`. Nên với danh sách phân trang, `data`
 * phải tự nó là { data, total, page, limit } - tức lồng data trong data.
 * Đây KHÔNG phải hình dạng của dataProcess.createTableObject
 * ({ Page, total, TotalInList, data }); đừng dùng nhầm.
 */
const { boDau, thoatRegex } = require('../../../utils/vietnamese')

const { LOAI_HOP_LE, LOAI_THU_VIEN } = require('../../../utils/quyenNoiDung')
const { congDucLuotXem } = require('../../../utils/congDuc')

/** Truy cập thẳng collection để dùng $or, khớp trường lồng và đếm trong một vòng. */
const { layAvatarUrls } = require('../../../utils/avatar')

const bangNoiDung = () => Content.getDatastore().manager.collection(Content.tableName)

/** Số ms của Waterline -> chuỗi ISO mà zod chờ đợi. */
const sangISO = giaTri => {
    if (!giaTri) return ''
    let d = new Date(giaTri)

    return isNaN(d.getTime()) ? '' : d.toISOString()
}

/**
 * Một bản ghi nội dung -> đúng hình dạng contentSchema.
 * rutGon = true thì bỏ bodyHtml và chapters (contentSummarySchema).
 */
const dinhDangNoiDung = (row, { rutGon = false } = {}) => {
    let kq = {
        id: String(row.id || row._id),
        type: row.type,
        slug: row.slug,
        title: row.title,
        summary: row.summary || '',
        categories: row.categories || [],
        tags: row.tags || [],
        publishedAt: row.publishedAt || sangISO(row.createdAt),
        seo: row.seo || {}
    }

    // Chỉ gắn khi có giá trị: zod khai .optional() nên nhận thiếu, không nhận null.
    if (row.coverUrl) kq.coverUrl = row.coverUrl
    if (row.updatedAt) kq.updatedAt = sangISO(row.updatedAt)
    if (row.readingMinutes) kq.readingMinutes = row.readingMinutes
    if (row.viewCount) kq.viewCount = row.viewCount
    if (row.author && row.author.name) kq.author = row.author
    if (row.source && row.source.name) kq.source = row.source
    // Dịch giả kinh sách: chỉ lộ tên + pháp danh, không lộ userId ra công khai.
    if (row.translator && row.translator.name) {
        kq.translator = { name: row.translator.name }
        if (row.translator.dharmaName) kq.translator.dharmaName = row.translator.dharmaName
    }
    // Người đăng (người tạo bài trong khu quản trị). Bài nhập từ trước khi có
    // dấu vết thì không có trường này.
    if (row.createdByName) kq.postedBy = { name: row.createdByName }
    if (row.media && row.media.url) kq.media = row.media
    if (row.libraryKind) kq.libraryKind = row.libraryKind
    if (!rutGon && Array.isArray(row.gallery) && row.gallery.length) kq.gallery = row.gallery
    // Tác giả là người dùng có tài khoản: để trang bài hiện avatar.
    if (row.authorId) kq.authorId = String(row.authorId)

    if (!rutGon) {
        if (row.bodyHtml) kq.bodyHtml = row.bodyHtml
        kq.chapters = row.chapters || []
    }

    return kq
}

const dinhDangDanhMuc = (row, soBai) => {
    let kq = {
        id: String(row.id || row._id),
        slug: row.slug,
        name: row.name,
        description: row.description || '',
        kind: row.kind || 'all',
        count: soBai || 0,
        children: row.children || []
    }
    if (row.coverUrl) kq.coverUrl = row.coverUrl

    return kq
}

const dinhDangSuKien = row => {
    let kq = {
        id: String(row.id || row._id),
        lunarDay: row.lunarDay,
        lunarMonth: row.lunarMonth,
        isLeapMonth: !!row.isLeapMonth,
        // Riêng trường này zod khai .nullable() nên null là giá trị hợp lệ.
        solarYear: row.solarYear === undefined ? null : row.solarYear,
        kind: row.kind,
        title: row.title,
        description: row.description || ''
    }
    if (row.contentSlug) kq.contentSlug = row.contentSlug

    return kq
}

/** Điều kiện lọc dùng chung cho danh sách và tìm kiếm. */
const dungDieuKien = ({ type, category, q, libraryKind }) => {
    let dieuKien = { status: 'published' }
    if (libraryKind && LOAI_THU_VIEN.includes(libraryKind)) dieuKien.libraryKind = libraryKind

    if (type) {
        let loai = String(type).split(',').map(t => t.trim()).filter(t => LOAI_HOP_LE.includes(t))
        if (loai.length) dieuKien.type = { $in: loai }
    }

    if (category) {
        dieuKien['categories.slug'] = category
    }

    if (q) {
        // searchText đã bỏ dấu lúc ghi, nên bỏ dấu từ khoá rồi mới so.
        dieuKien.searchText = { $regex: thoatRegex(boDau(q)), $options: 'i' }
    }

    return dieuKien
}

/** Chạy một truy vấn danh sách và trả về đúng hình dạng paginated() của zod. */
const layDanhSach = async (dieuKien, page, limit, sapXep) => {
    let bang = bangNoiDung()
    // "popular": nhiều lượt đọc trước; hoà nhau (vd: cùng 0) thì bài mới hơn đứng trước.
    let thuTu = sapXep === 'popular' ? { viewCount: -1, publishedAt: -1 } : { publishedAt: -1 }
    let bts = bang.find(dieuKien, { projection: { bodyHtml: 0, chapters: 0, searchText: 0 } })
        .sort(thuTu)
        .skip(limit * (page - 1))
        .limit(limit)

    let [rows, total] = await Promise.all([bts.toArray(), bang.countDocuments(dieuKien)])

    return {
        data: rows.map(row => dinhDangNoiDung(row, { rutGon: true })),
        total: total,
        page: page,
        limit: limit
    }
}

module.exports = {

    /**
     * Ghi nhận một lượt đọc. Trang chi tiết ở FrontEnd được cache (ISR), nên
     * backend không thấy lượt xem nào qua getContentBySlug - trình duyệt phải
     * tự báo về đây, mỗi bài một lần mỗi phiên.
     *
     * Đây chỉ là con số để xếp "đọc nhiều nhất", không phải số liệu tính tiền:
     * không chống gian lận gắt, chỉ nhận slug của bài đã đăng và tăng đúng 1.
     */
    addView: ({
        inputs: sails.config.inputs.Public.Content.addView,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                // $inc nguyên tử ở Mongo: hai người đọc cùng lúc không đè mất lượt của nhau.
                let kq = await bangNoiDung().findOneAndUpdate(
                    { slug: String(inputs.slug), status: 'published' },
                    { $inc: { viewCount: 1 } },
                    { returnOriginal: false, returnDocument: 'after', projection: { viewCount: 1, authorId: 1 } }
                )
                // Driver mới trả thẳng bản ghi, driver cũ bọc trong { value }.
                let sau = kq && kq.value !== undefined ? kq.value : kq
                // Bài của người dùng đạt mỗi mốc 100 lượt xem: tác giả được cộng công đức.
                if (sau) await congDucLuotXem(Object.assign({ id: String(sau._id) }, sau), sau.viewCount)

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: { counted: !!sau }
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    /**
     * Bài viết liên quan, để hiện cuối một bài.
     *
     * Chấm điểm một nhóm ứng viên (bài đã đăng cùng loại, mới nhất trước) theo
     * thứ tự ưu tiên: cùng chuyên mục > cùng tác giả > nhiều lượt đọc > mới.
     * Lượt đọc và độ mới được chuẩn hoá về 0..1 nên chỉ phân định thứ tự giữa
     * những bài cùng hạng, không lấn được tiêu chí chuyên mục / tác giả.
     */
    relatedContent: ({
        inputs: sails.config.inputs.Public.Content.relatedContent,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let bai = await Content.findOne({ slug: inputs.slug, status: 'published' })
                let rong = { data: [] }
                if (!bai) return exits.successRequest({ messageNode: 'GlobalNotifications', message: 'success', data: rong })

                let cungLoai = bai.type === 'sutra' ? ['sutra'] : ['article', 'blog']
                let ungVien = await bangNoiDung()
                    .find(
                        { status: 'published', type: { $in: cungLoai }, slug: { $ne: bai.slug } },
                        { projection: { bodyHtml: 0, chapters: 0, searchText: 0 } }
                    )
                    .sort({ publishedAt: -1 })
                    .limit(300)
                    .toArray()

                let chuyenMuc = new Set((bai.categories || []).map(c => c.slug))
                let tacGia = (bai.author && bai.author.name) || ''
                let luotXemMax = Math.max(1, ...ungVien.map(r => r.viewCount || 0))
                let thoiGian = ungVien.map(r => Date.parse(r.publishedAt) || 0)
                let moiNhat = Math.max(...thoiGian, 1)
                let cuNhat = Math.min(...thoiGian, moiNhat)

                let diem = ungVien.map((r, i) => {
                    let d = 0
                    if ((r.categories || []).some(c => chuyenMuc.has(c.slug))) d += 4
                    let cungTacGia = (bai.authorId && r.authorId === bai.authorId && r.author && r.author.fromProfile) ||
                        (tacGia && r.author && r.author.name === tacGia)
                    if (cungTacGia) d += 2
                    d += (r.viewCount || 0) / luotXemMax
                    d += moiNhat === cuNhat ? 0 : (thoiGian[i] - cuNhat) / (moiNhat - cuNhat)

                    return { r: r, d: d }
                })

                diem.sort((a, b) => b.d - a.d)

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: { data: diem.slice(0, inputs.limit).map(x => dinhDangNoiDung(x.r, { rutGon: true })) }
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    listContent: ({
        inputs: sails.config.inputs.Public.Content.listContent,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let dieuKien = dungDieuKien(inputs)
                let data = await layDanhSach(dieuKien, inputs.page, inputs.limit, inputs.sort)

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: data
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    search: ({
        inputs: sails.config.inputs.Public.Content.search,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                // Từ khoá rỗng thì trả danh sách rỗng chứ không trả toàn bộ bài.
                let data = inputs.q
                    ? await layDanhSach(dungDieuKien({ q: inputs.q }), inputs.page, inputs.limit)
                    : { data: [], total: 0, page: inputs.page, limit: inputs.limit }

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: data
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    getContentBySlug: ({
        inputs: sails.config.inputs.Public.Content.getContentBySlug,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let row = await sails.dataProcess.findOne(Content, {
                    condition: { slug: inputs.slug, status: 'published' }
                })

                // FrontEnd/lib/api.ts bắt đúng 404 để đổi thành trang không tìm thấy;
                // trả 200 kèm data rỗng thì zod ném lỗi parse thay vì hiện 404 tử tế.
                if (!row) {
                    exits.notFound({
                        messageNode: 'GlobalNotifications',
                        message: 'notFound'
                    });
                    return;
                }

                let data = dinhDangNoiDung(row)

                // Avatar tác giả (khi tác giả lấy theo hồ sơ) và người đăng. Chỉ
                // trang chi tiết cần, nên không gắn ở dinhDangNoiDung dùng chung.
                let avatar = await layAvatarUrls([
                    row.author && row.author.fromProfile ? row.authorId : '',
                    row.createdById
                ])
                if (data.author && row.author.fromProfile && avatar[row.authorId]) {
                    data.author = Object.assign({}, data.author, { avatarUrl: avatar[row.authorId] })
                }
                if (data.postedBy && avatar[row.createdById]) data.postedBy.avatarUrl = avatar[row.createdById]

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: data
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    categoryTree: ({
        inputs: sails.config.inputs.Public.Content.categoryTree,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let danhMuc = await ContentCategory.find({}).sort([{ order: 'ASC' }, { name: 'ASC' }])

                // Đếm số bài của mọi chuyên mục trong một lượt thay vì mỗi mục một truy vấn.
                let dem = await bangNoiDung().aggregate([
                    { $match: { status: 'published' } },
                    { $unwind: '$categories' },
                    { $group: { _id: '$categories.slug', n: { $sum: 1 } } }
                ]).toArray()

                let bangDem = {}
                dem.forEach(item => { bangDem[item._id] = item.n })

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: danhMuc.map(row => dinhDangDanhMuc(row, bangDem[row.slug]))
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    calendar: ({
        inputs: sails.config.inputs.Public.Content.calendar,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let dieuKien = {}
                if (inputs.month) dieuKien.lunarMonth = inputs.month

                let suKien = await LunarEvent.find(dieuKien)
                    .sort([{ lunarMonth: 'ASC' }, { lunarDay: 'ASC' }])

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: suKien.map(dinhDangSuKien)
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    slugs: ({
        inputs: sails.config.inputs.Public.Content.slugs,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                // Sitemap cần toàn bộ slug nên không phân trang, chỉ lấy trường cần.
                let rows = await bangNoiDung()
                    .find({ status: 'published' }, {
                        projection: { type: 1, slug: 1, updatedAt: 1, createdAt: 1, publishedAt: 1, 'chapters.slug': 1 }
                    })
                    .toArray()

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: rows.map(row => ({
                        type: row.type,
                        slug: row.slug,
                        updatedAt: sangISO(row.updatedAt) || row.publishedAt || sangISO(row.createdAt),
                        chapters: (row.chapters || []).map(ch => ch.slug).filter(Boolean)
                    }))
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

};
