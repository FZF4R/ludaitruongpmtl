/**
 * Nạp dữ liệu nội dung mẫu vào MongoDB.
 *
 *   node tools/seed-content.js          xem sẽ thêm gì, KHÔNG ghi
 *   node tools/seed-content.js --ghi    ghi thật
 *   node tools/seed-content.js --ghi --de-len   ghi đè bản ghi đã có cùng slug
 *
 * Dữ liệu lấy từ tools/seed-content.json, vốn được xuất thẳng từ
 * FrontEnd/lib/mock.ts. Nhờ vậy khi bật CONTENT_SOURCE=api thì trang hiện ra
 * đúng bằng những gì đang thấy ở chế độ mock - nếu khác, tức là hợp đồng dữ
 * liệu giữa hai bên đã lệch.
 *
 * Chạy nhiều lần vô hại: mặc định bỏ qua slug đã tồn tại.
 */
const path = require('path')
const sails = require(path.resolve(__dirname, '..', 'node_modules', 'sails'))

const GHI = process.argv.includes('--ghi')
const DE_LEN = process.argv.includes('--de-len')
const DU_LIEU = require('./seed-content.json')

/** mock.ts để trống trường tuỳ chọn bằng undefined; Mongo không cần lưu chúng. */
const bo = (doc, ...ten) => {
    let kq = Object.assign({}, doc)
    ten.forEach(t => { if (kq[t] === undefined || kq[t] === null) delete kq[t] })

    return kq
}

const nap = async (Model, danhSach, khoa, chuyenDoi) => {
    let them = 0
    let capNhat = 0
    let boQua = 0

    for (let item of danhSach) {
        let dieuKien = {}
        dieuKien[khoa] = item[khoa]

        let daCo = await Model.findOne(dieuKien)
        let ban = chuyenDoi(item)

        if (daCo && !DE_LEN) {
            boQua++
            continue
        }

        if (!GHI) {
            (daCo ? capNhat++ : them++)
            continue
        }

        if (daCo) {
            await Model.updateOne(dieuKien).set(ban)
            capNhat++
        } else {
            await Model.create(ban)
            them++
        }
    }

    return { them, capNhat, boQua }
}

const inKetQua = (ten, kq) => {
    console.log(
        `  ${ten.padEnd(16)} thêm ${String(kq.them).padStart(3)}` +
        ` | cập nhật ${String(kq.capNhat).padStart(3)}` +
        ` | bỏ qua ${String(kq.boQua).padStart(3)}`
    )
}

sails.load({ hooks: { sockets: false, pubsub: false, grunt: false }, log: { level: 'error' } }, async err => {
    if (err) {
        console.error('Không nạp được Sails:', err.message || err)
        process.exit(1)
    }

    try {
        console.log(GHI
            ? (DE_LEN ? 'Chế độ GHI THẬT, có đè bản ghi cũ.' : 'Chế độ GHI THẬT, bỏ qua slug đã có.')
            : 'Chế độ THỬ - không ghi gì. Thêm --ghi để ghi thật.')
        console.log('')

        let kqDanhMuc = await nap(ContentCategory, DU_LIEU.categories, 'slug', item => bo({
            slug: item.slug,
            name: item.name,
            description: item.description || '',
            coverUrl: item.coverUrl || '',
            kind: item.kind || 'all',
            children: item.children || [],
            order: 0
        }))
        inKetQua('Chuyên mục', kqDanhMuc)

        let kqNoiDung = await nap(Content, DU_LIEU.contents, 'slug', item => bo({
            type: item.type,
            slug: item.slug,
            title: item.title,
            summary: item.summary || '',
            coverUrl: item.coverUrl || '',
            bodyHtml: item.bodyHtml || '',
            chapters: item.chapters || [],
            media: item.media || {},
            author: item.author || {},
            source: item.source || {},
            categories: item.categories || [],
            tags: item.tags || [],
            publishedAt: item.publishedAt,
            readingMinutes: item.readingMinutes || 0,
            viewCount: item.viewCount || 0,
            seo: item.seo || {},
            status: 'published'
        }))
        inKetQua('Nội dung', kqNoiDung)

        // Sự kiện âm lịch không có slug; nhận dạng bằng bộ ba ngày/tháng/tên.
        let kqSuKien = { them: 0, capNhat: 0, boQua: 0 }
        for (let item of DU_LIEU.lunarEvents) {
            let dieuKien = { lunarDay: item.lunarDay, lunarMonth: item.lunarMonth, title: item.title }
            let daCo = await LunarEvent.findOne(dieuKien)

            if (daCo && !DE_LEN) { kqSuKien.boQua++; continue }

            let ban = {
                lunarDay: item.lunarDay,
                lunarMonth: item.lunarMonth,
                isLeapMonth: !!item.isLeapMonth,
                solarYear: item.solarYear === undefined ? null : item.solarYear,
                kind: item.kind,
                title: item.title,
                description: item.description || '',
                contentSlug: item.contentSlug || ''
            }

            if (!GHI) { (daCo ? kqSuKien.capNhat++ : kqSuKien.them++); continue }

            if (daCo) {
                await LunarEvent.updateOne(dieuKien).set(ban)
                kqSuKien.capNhat++
            } else {
                await LunarEvent.create(ban)
                kqSuKien.them++
            }
        }
        inKetQua('Sự kiện âm lịch', kqSuKien)

        console.log('')
        console.log(GHI ? 'Xong.' : 'Chưa ghi gì. Chạy lại với --ghi để nạp thật.')
    } catch (loi) {
        console.error('Lỗi khi nạp dữ liệu:', loi.message || loi)
        sails.lower(() => process.exit(1))
        return
    }

    sails.lower(() => process.exit(0))
});
