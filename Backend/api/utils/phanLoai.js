/**
 * Tự phân loại bài viết theo danh mục, học từ chính các bài ĐÃ có danh mục.
 *
 * Cách làm (không cần thư viện, không cần mô hình ngoài):
 *   1. Mỗi danh mục = một "túi từ" gộp từ các bài đang thuộc danh mục đó
 *      (tiêu đề, tóm tắt, thẻ nặng hơn thân bài) + tên danh mục (rất nặng).
 *   2. Từ = âm tiết đã bỏ dấu + cặp âm tiết liền nhau (tiếng Việt nhiều từ
 *      hai âm tiết: "thien dinh", "phat phap"), bỏ hư từ.
 *   3. Cân bằng TF-IDF giữa các danh mục rồi so cosine với bài cần phân loại.
 *   4. Tên danh mục xuất hiện nguyên văn trong tiêu đề / thẻ thì cộng thêm.
 * Điểm cao nhất dưới NGUONG thì để trống - thà chưa phân loại còn hơn xếp sai.
 */
const { boDau } = require('./vietnamese')

const NGUONG = 0.12

/** Hư từ (đã bỏ dấu) - xuất hiện ở mọi bài nên không giúp phân biệt. */
const HU_TU = new Set(('va la cua co cac nhung mot trong cho de voi khong nguoi duoc nay khi thi da se ra vao tu theo nhu cung hay ma o den len '
    + 'nao gi ay do kia cai con rat lai nen vi neu tuy boi tai chi moi ve bang qua sau truoc tren duoi giua ngoai cho nhieu it hon nhat '
    + 'ta toi ban chung minh ho anh chi em ong ba no thay biet lam noi di den dang van con dieu viec su nhu vay the nhung').split(/\s+/))

/** HTML -> chữ thường không dấu, cắt bớt để bài dài không lấn át. */
const chuTho = (html, toiDa = 6000) => String(html || '')
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .slice(0, toiDa)

/** Chuỗi -> danh sách từ (âm tiết + cặp âm tiết). */
const tachTu = text => {
    let amTiet = boDau(text).toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length >= 2 && !HU_TU.has(t) && !/^\d+$/.test(t))
    let kq = amTiet.slice()
    for (let i = 0; i + 1 < amTiet.length; i++) kq.push(`${amTiet[i]}_${amTiet[i + 1]}`)

    return kq
}

/** Cộng từ của một đoạn chữ vào túi với trọng số. */
const cong = (tui, text, trongSo) => {
    for (let t of tachTu(text)) tui.set(t, (tui.get(t) || 0) + trongSo)
}

/** Túi từ của một bài (dùng chung cho bài mẫu và bài cần phân loại). */
const tuiBai = bai => {
    let tui = new Map()
    cong(tui, bai.title, 4)
    cong(tui, (Array.isArray(bai.tags) ? bai.tags : String(bai.tags || '').split(',')).join(' '), 4)
    cong(tui, bai.summary, 2)
    cong(tui, chuTho(bai.bodyHtml), 1)

    return tui
}

const doDai = vec => Math.sqrt(Array.from(vec.values()).reduce((s, v) => s + v * v, 0)) || 1

/**
 * Dựng bộ phân loại từ danh mục + bài mẫu.
 * @param danhMuc [{ slug, name }]
 * @param baiMau  [{ title, summary, tags, bodyHtml, categories: [{slug}] }]
 */
const dungBoPhanLoai = (danhMuc, baiMau) => {
    let tuiDm = new Map(danhMuc.map(dm => [dm.slug, new Map()]))

    for (let dm of danhMuc) cong(tuiDm.get(dm.slug), dm.name, 12)
    for (let bai of baiMau) {
        let tb = tuiBai(bai)
        for (let c of bai.categories || []) {
            let tui = tuiDm.get(c && c.slug)
            if (!tui) continue
            for (let [t, n] of tb) tui.set(t, (tui.get(t) || 0) + n)
        }
    }

    // IDF giữa các danh mục: từ có ở mọi danh mục thì gần như vô dụng.
    let soDm = Math.max(1, tuiDm.size)
    let df = new Map()
    for (let tui of tuiDm.values()) for (let t of tui.keys()) df.set(t, (df.get(t) || 0) + 1)
    const idf = t => Math.log(1 + soDm / (df.get(t) || soDm))

    let vecDm = new Map()
    for (let [slug, tui] of tuiDm) {
        let vec = new Map()
        for (let [t, n] of tui) vec.set(t, (1 + Math.log(n)) * idf(t))
        vecDm.set(slug, { vec, len: doDai(vec) })
    }

    let tenDm = danhMuc.map(dm => ({ slug: dm.slug, ten: ` ${boDau(dm.name).toLowerCase().trim()} ` })).filter(d => d.ten.trim().length >= 3)

    /** Một bài -> { category: slug | '', score }. */
    return bai => {
        let tb = tuiBai(bai)
        let vec = new Map()
        for (let [t, n] of tb) if (df.has(t)) vec.set(t, (1 + Math.log(n)) * idf(t))
        let len = doDai(vec)
        let dauDe = ` ${boDau(`${bai.title || ''} ${(Array.isArray(bai.tags) ? bai.tags : []).join(' ')}`).toLowerCase().replace(/[^a-z0-9]+/g, ' ')} `

        let tot = { category: '', score: 0 }
        for (let [slug, dm] of vecDm) {
            let tich = 0
            for (let [t, v] of vec) {
                let w = dm.vec.get(t)
                if (w) tich += v * w
            }
            let diem = tich / (len * dm.len)
            if (tenDm.some(d => d.slug === slug && dauDe.includes(d.ten))) diem += 0.25
            if (diem > tot.score) tot = { category: slug, score: diem }
        }

        return tot.score >= NGUONG
            ? { category: tot.category, score: Math.round(Math.min(1, tot.score) * 100) / 100 }
            : { category: '', score: Math.round(tot.score * 100) / 100 }
    }
}

module.exports = { dungBoPhanLoai, chuTho }
