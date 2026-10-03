/**
 * Nhập bài viết từ tệp văn bản vào bảng Content, ở trạng thái NHÁP.
 *
 *   node tools/import-articles.js          xem sẽ nhập gì, KHÔNG ghi
 *   node tools/import-articles.js --ghi    ghi thật
 *
 * Mỗi bài là một tệp .md trong tools/import-articles/ (tệp bắt đầu bằng "_"
 * bị bỏ qua - dùng cho mẫu). Định dạng xem tools/import-articles/_mau.md.
 *
 * Vì sao luôn là nháp: bài lấy từ trang khác, thường là bản dịch. Người biên
 * tập phải đọc lại bản dịch và chắc chắn được phép đăng lại rồi mới tự bấm
 * đăng ở /admin/blog. Nguồn và link gốc được ghi vào trường `source`, trang
 * bài viết hiện nó ở cuối bài.
 *
 * Chạy nhiều lần vô hại: bài trùng slug hoặc trùng link nguồn bị bỏ qua.
 */
const fs = require('fs')
const path = require('path')
const sails = require(path.resolve(__dirname, '..', 'node_modules', 'sails'))
const { boDau } = require('../api/utils/vietnamese')

const GHI = process.argv.includes('--ghi')
const THU_MUC = path.join(__dirname, 'import-articles')

/** Tách phần đầu `---` (khoá: giá trị mỗi dòng) khỏi thân bài. */
const tachDauBai = noiDung => {
    let vanBan = noiDung.replace(/^﻿/, '').replace(/\r\n/g, '\n')
    let khop = vanBan.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
    if (!khop) return { dau: {}, than: vanBan }

    let dau = {}
    khop[1].split('\n').forEach(dong => {
        let i = dong.indexOf(':')
        if (i > 0) dau[dong.slice(0, i).trim()] = dong.slice(i + 1).trim()
    })

    return { dau: dau, than: khop[2] }
}

const thoatHtml = s => String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/** **đậm** và *nghiêng* trong một dòng, sau khi đã thoát HTML. */
const dinhDangDong = s => thoatHtml(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')

/**
 * Markdown tối giản -> HTML: đoạn văn, ## / ### tiêu đề, > trích dẫn,
 * - danh sách. Đủ cho bài pháp thoại; không kéo thêm thư viện markdown.
 */
const sangHtml = than => than.split(/\n{2,}/).map(khoi => {
    let dong = khoi.split('\n').map(x => x.trim()).filter(Boolean)
    if (!dong.length) return ''

    if (/^###\s/.test(dong[0])) return `<h3>${dinhDangDong(dong[0].slice(4))}</h3>`
    if (/^##\s/.test(dong[0])) return `<h2>${dinhDangDong(dong[0].slice(3))}</h2>`
    if (dong.every(d => /^[-*]\s/.test(d))) {
        return `<ul>${dong.map(d => `<li>${dinhDangDong(d.slice(2))}</li>`).join('')}</ul>`
    }
    if (dong.every(d => d.startsWith('>'))) {
        return `<blockquote><p>${dong.map(d => dinhDangDong(d.replace(/^>\s?/, ''))).join('<br>')}</p></blockquote>`
    }

    return `<p>${dong.map(dinhDangDong).join('<br>')}</p>`
}).filter(Boolean).join('\n')

const dungSlug = tieuDe => boDau(tieuDe)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)

const docBai = tenTep => {
    let { dau, than } = tachDauBai(fs.readFileSync(path.join(THU_MUC, tenTep), 'utf8'))
    let loi = []
    if (!dau.title) loi.push('thiếu title')
    if (!dau.sourceUrl) loi.push('thiếu sourceUrl')
    if (!than.trim()) loi.push('thân bài rỗng')

    let soChu = than.split(/\s+/).filter(Boolean).length
    let tomTat = dau.summary || than.replace(/[#>*\-]/g, '').trim().split(/\n{2,}/)[0].slice(0, 220)

    return {
        tenTep: tenTep,
        loi: loi,
        ban: {
            type: 'article',
            slug: dau.slug || dungSlug(dau.title || tenTep),
            title: dau.title || '',
            summary: tomTat,
            bodyHtml: sangHtml(than),
            author: dau.author ? { name: dau.author } : {},
            source: { name: dau.source || '', url: dau.sourceUrl || '' },
            categories: dau.category ? [{ slug: dau.category, name: dau.categoryName || dau.category }] : [],
            tags: (dau.tags || '').split(',').map(x => x.trim()).filter(Boolean),
            publishedAt: new Date().toISOString(),
            readingMinutes: Math.max(1, Math.round(soChu / 200)),
            status: 'draft'
        }
    }
}

sails.load({ hooks: { sockets: false, pubsub: false, grunt: false }, log: { level: 'error' } }, async err => {
    if (err) {
        console.error('Không nạp được Sails:', err.message || err)
        process.exit(1)
    }

    let ketQua = { them: 0, boQua: 0, loi: 0 }
    try {
        let danhSach = fs.existsSync(THU_MUC)
            ? fs.readdirSync(THU_MUC).filter(t => t.endsWith('.md') && !t.startsWith('_')).sort()
            : []

        console.log(GHI ? 'Chế độ GHI THẬT (nháp).' : 'Chạy thử - thêm --ghi để ghi thật.')
        if (!danhSach.length) console.log('  Không có tệp .md nào trong', THU_MUC)

        for (let tenTep of danhSach) {
            let bai = docBai(tenTep)
            if (bai.loi.length) {
                console.log(`  LỖI     ${tenTep}: ${bai.loi.join(', ')}`)
                ketQua.loi++
                continue
            }

            let trung = await Content.findOne({ slug: bai.ban.slug })
                || await Content.findOne({ 'source.url': bai.ban.source.url })
                    .meta({ enableExperimentalDeepTargets: true })
            if (trung) {
                console.log(`  BỎ QUA  ${tenTep}: đã có (slug ${trung.slug})`)
                ketQua.boQua++
                continue
            }

            if (GHI) await Content.create(bai.ban)
            console.log(`  THÊM    ${tenTep} -> /bai-viet/${bai.ban.slug} (${bai.ban.readingMinutes} phút đọc)`)
            ketQua.them++
        }

        console.log(`Xong: thêm ${ketQua.them} | bỏ qua ${ketQua.boQua} | lỗi ${ketQua.loi}`)
    } catch (e) {
        console.error('Lỗi:', e.message || e)
        process.exitCode = 1
    }

    sails.lower(() => process.exit())
})
