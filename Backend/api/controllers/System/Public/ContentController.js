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

const LOAI_HOP_LE = ['article', 'blog', 'sutra', 'audio', 'video']

/** Truy cập thẳng collection để dùng $or, khớp trường lồng và đếm trong một vòng. */
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
    if (row.media && row.media.url) kq.media = row.media

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
const dungDieuKien = ({ type, category, q }) => {
    let dieuKien = { status: 'published' }

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
const layDanhSach = async (dieuKien, page, limit) => {
    let bang = bangNoiDung()
    let bts = bang.find(dieuKien, { projection: { bodyHtml: 0, chapters: 0, searchText: 0 } })
        .sort({ publishedAt: -1 })
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

    listContent: ({
        inputs: sails.config.inputs.Public.Content.listContent,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let dieuKien = dungDieuKien(inputs)
                let data = await layDanhSach(dieuKien, inputs.page, inputs.limit)

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

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: dinhDangNoiDung(row)
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
