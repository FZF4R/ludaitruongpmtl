/**
 * Tạo bộ âm thanh MẪU cho các công cụ tu tập, tổng hợp bằng code (không cần
 * tệp ghi âm): chuông đồng, bát chuông, chuông nhỏ, mõ gỗ, mõ trầm, âm nền
 * mưa / suối / tĩnh lặng. Đủ để mọi công cụ ở /tu-tap/* chạy được ngay; admin
 * thay bằng âm thanh thật ở /admin/practice khi có.
 *
 *   node tools/seed-sounds.js          xem sẽ tạo gì, KHÔNG ghi
 *   node tools/seed-sounds.js --ghi    ghi thật
 *
 * Bài tụng mẫu, thiền có hướng dẫn là giọng người - không tổng hợp được; admin
 * thêm bằng tệp hoặc link ngoài.
 *
 * Chạy nhiều lần vô hại: âm thanh trùng tên trong cùng mục thì bỏ qua.
 */
const path = require('path')
const sails = require(path.resolve(__dirname, '..', 'node_modules', 'sails'))

const GHI = process.argv.includes('--ghi')
const SR = 22050

/* ---------- Tổng hợp ---------- */

/** Mảng mẫu [-1..1] -> tệp WAV PCM 16-bit mono. */
function sangWav(mau) {
    let buf = Buffer.alloc(44 + mau.length * 2)
    buf.write('RIFF', 0); buf.writeUInt32LE(36 + mau.length * 2, 4); buf.write('WAVE', 8)
    buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22)
    buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34)
    buf.write('data', 36); buf.writeUInt32LE(mau.length * 2, 40)
    let dinh = mau.reduce((m, x) => Math.max(m, Math.abs(x)), 1e-9)
    let heSo = 0.89 / dinh
    for (let i = 0; i < mau.length; i++) buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, mau[i] * heSo)) * 32767), 44 + i * 2)
    return buf
}

/**
 * Chuông: tổng các hoạ âm kiểu chuông (tỉ lệ không nguyên), mỗi hoạ âm tắt
 * dần với tốc độ riêng - hoạ âm cao tắt nhanh, âm gốc ngân lâu. `lech` tạo
 * nhịp "ong ong" bằng hai sóng gần tần số.
 */
function chuong(goc, giay, { lech = 0.6, hoaAm = [[1, 1, 1], [2.0, 0.55, 1.6], [2.76, 0.42, 2.2], [5.4, 0.22, 3.4], [8.93, 0.12, 5]] } = {}) {
    let n = Math.round(SR * giay)
    let mau = new Float64Array(n)
    for (let i = 0; i < n; i++) {
        let t = i / SR
        let s = 0
        for (let [tiLe, bienDo, tat] of hoaAm) {
            let f = goc * tiLe
            let suyGiam = Math.exp(-t * tat * 1.2 / giay * 3)
            s += bienDo * suyGiam * (Math.sin(2 * Math.PI * f * t) + 0.5 * Math.sin(2 * Math.PI * (f + lech) * t))
        }
        mau[i] = s * Math.min(1, t / 0.004)
    }
    return mau
}

/** Mõ: tiếng gõ gỗ ngắn - hai tần số tắt rất nhanh cộng một tiếng "cốc" ồn ở đầu. */
function mo(goc, giay) {
    let n = Math.round(SR * giay)
    let mau = new Float64Array(n)
    let ngauNhien = 0
    for (let i = 0; i < n; i++) {
        let t = i / SR
        let than = Math.exp(-t / 0.045) * (Math.sin(2 * Math.PI * goc * t) + 0.45 * Math.sin(2 * Math.PI * goc * 2.3 * t))
        ngauNhien = 0.6 * ngauNhien + 0.4 * (Math.random() * 2 - 1)
        let coc = Math.exp(-t / 0.004) * ngauNhien * 0.8
        mau[i] = than + coc
    }
    return mau
}

/**
 * Âm nền: tiếng ồn lọc thông thấp (mưa sáng hơn, suối trầm hơn), biên độ
 * dao động chậm. Ghép mềm đầu - cuối để phát lặp không nghe chỗ nối.
 */
function amNen(giay, { loc = 0.08, daoDong = 0.25, tocDo = 0.17, giot = 0 } = {}) {
    let n = Math.round(SR * giay)
    let mau = new Float64Array(n)
    let a = 0, b = 0
    for (let i = 0; i < n; i++) {
        let t = i / SR
        a += loc * ((Math.random() * 2 - 1) - a)
        b += loc * (a - b)
        let s = b * (1 - daoDong + daoDong * Math.sin(2 * Math.PI * tocDo * t))
        if (giot && Math.random() < giot / SR) {
            // giọt mưa rơi: một tiếng "tách" ngắn
            for (let k = 0; k < 300 && i + k < n; k++) mau[i + k] += Math.exp(-k / 60) * (Math.random() * 2 - 1) * 0.6
        }
        mau[i] += s * 3
    }
    let mem = Math.round(SR * 1.5)
    for (let k = 0; k < mem; k++) {
        let w = k / mem
        mau[k] = mau[k] * w + mau[n - mem + k] * (1 - w)
    }
    return mau.subarray(0, n - mem)
}

/** Âm nền tĩnh lặng: một âm trầm êm (drone) có vài hoạ âm, lên xuống rất chậm. */
function tinhLang(giay) {
    let n = Math.round(SR * giay)
    let mau = new Float64Array(n)
    for (let i = 0; i < n; i++) {
        let t = i / SR
        let nhip = 0.75 + 0.25 * Math.sin(2 * Math.PI * t / giay)
        mau[i] = nhip * (Math.sin(2 * Math.PI * 110 * t) + 0.5 * Math.sin(2 * Math.PI * 165 * t) + 0.25 * Math.sin(2 * Math.PI * 220.5 * t))
    }
    return mau
}

/** Tiếng hạt chuỗi: hai hạt gỗ chạm nhau - tiếng "tách" cao, rất ngắn. */
function hat(giay) {
    let n = Math.round(SR * giay)
    let mau = new Float64Array(n)
    for (let i = 0; i < n; i++) {
        let t = i / SR
        mau[i] = Math.exp(-t / 0.012) * (Math.sin(2 * Math.PI * 2300 * t) + 0.6 * Math.sin(2 * Math.PI * 3700 * t)) +
            Math.exp(-t / 0.002) * (Math.random() * 2 - 1) * 0.5
    }
    return mau
}

/* ---------- Danh sách mẫu ---------- */

const MAU = [
    { category: 'go-mo', kind: 'mo', title: 'Mõ gỗ (mẫu)', tao: () => mo(720, 0.35) },
    { category: 'go-mo', kind: 'mo', title: 'Mõ trầm (mẫu)', tao: () => mo(430, 0.45) },
    { category: 'go-mo', kind: 'chuong', title: 'Chuông hết vòng (mẫu)', tao: () => chuong(880, 3) },
    { category: 'go-mo', kind: 'hat', title: 'Hạt gỗ (mẫu)', tao: () => hat(0.12) },
    { category: 'tung-kinh', kind: 'mo', title: 'Mõ giữ nhịp (mẫu)', tao: () => mo(600, 0.35) },
    { category: 'tung-kinh', kind: 'chuong', title: 'Chuông mở đầu (mẫu)', tao: () => chuong(220, 6) },
    { category: 'thien-dinh', kind: 'chuong', title: 'Chuông đồng (mẫu)', tao: () => chuong(174, 7) },
    {
        category: 'thien-dinh', kind: 'chuong', title: 'Bát chuông (mẫu)',
        tao: () => chuong(262, 8, { lech: 1.3, hoaAm: [[1, 1, 0.7], [2.71, 0.5, 1.4], [5.12, 0.25, 2.6]] })
    },
    { category: 'thien-dinh', kind: 'am-nen', title: 'Mưa rơi (mẫu)', loop: true, tao: () => amNen(22, { loc: 0.18, daoDong: 0.15, tocDo: 0.11, giot: 6 }) },
    { category: 'thien-dinh', kind: 'am-nen', title: 'Suối chảy (mẫu)', loop: true, tao: () => amNen(22, { loc: 0.05, daoDong: 0.3, tocDo: 0.23 }) },
    { category: 'cau-an', kind: 'chuong', title: 'Chuông cầu nguyện (mẫu)', tao: () => chuong(196, 7) },
    { category: 'cau-an', kind: 'am-nen', title: 'Tĩnh lặng (mẫu)', loop: true, tao: () => tinhLang(20) }
]

sails.load({ hooks: { sockets: false, pubsub: false, grunt: false }, log: { level: 'error' } }, async err => {
    if (err) {
        console.error('Không nạp được Sails:', err.message || err)
        process.exit(1)
    }

    try {
        console.log(GHI ? 'Chế độ GHI THẬT.' : 'Chạy thử - thêm --ghi để ghi thật.')
        let them = 0
        let boQua = 0
        for (let m of MAU) {
            if (await PracticeSound.findOne({ category: m.category, title: m.title })) {
                boQua++
                continue
            }
            let wav = sangWav(m.tao())
            if (GHI) {
                let soMuc = await PracticeSound.count({ category: m.category })
                await PracticeSound.create({
                    category: m.category,
                    kind: m.kind,
                    title: m.title,
                    source: 'upload',
                    data: wav.toString('base64'),
                    mime: 'audio/wav',
                    sizeBytes: wav.length,
                    loop: !!m.loop,
                    order: soMuc,
                    uploadedBy: 'seed'
                })
            }
            console.log(`  THÊM    [${m.category}/${m.kind}] ${m.title} - ${(wav.length / 1024).toFixed(0)} KB`)
            them++
        }
        console.log(`Xong: thêm ${them} | bỏ qua ${boQua}`)
    } catch (e) {
        console.error('Lỗi:', e.message || e)
        process.exitCode = 1
    }

    sails.lower(() => process.exit())
})
