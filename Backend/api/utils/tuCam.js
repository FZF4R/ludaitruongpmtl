/**
 * Lọc từ cấm trong bình luận.
 *
 * Hai nguồn, gộp lại:
 *   - danh sách MẶC ĐỊNH ở tệp data/tu-cam-mac-dinh.txt (mỗi dòng một từ / cụm):
 *     không hiện ở giao diện nào; chỉ tài khoản chủ đọc / ghi qua API
 *     /v1/admin/banned-words/default (System/Admin/BannedWordsController);
 *   - danh sách thêm ở SystemSettings.bannedWords (admin sửa ở /admin/dashboard).
 * Đọc qua cache 60 giây để không đọc tệp / CSDL mỗi lần có bình luận; ghi
 * xong thì `xoaCache()` để có hiệu lực ngay.
 *
 * Khớp NGUYÊN TỪ / NGUYÊN CỤM, không khớp một mẩu nằm giữa từ khác. Cách so
 * theo đúng cách admin gõ từ cấm:
 *   - từ cấm CÓ DẤU ("đần"): so với bình luận giữ nguyên dấu - nếu bỏ dấu thì
 *     "đần" sẽ bắt nhầm cả "dần", "dân";
 *   - từ cấm KHÔNG DẤU ("ngu"): chỉ so với những chữ người viết cũng gõ không
 *     dấu - bắt được kiểu lách bỏ dấu mà không bắt nhầm "ngủ", "ngư".
 * Muốn chặn cả hai cách viết thì thêm cả hai: "đần" và "dan".
 */
const fs = require('fs')
const path = require('path')
const { boDau } = require('./vietnamese')

/** Tệp danh sách mặc định. Nằm ngoài assets/ nên không phục vụ ra web. */
const TEP_MAC_DINH = path.resolve(__dirname, '..', '..', 'data', 'tu-cam-mac-dinh.txt')

/** Đọc tệp mặc định; chưa có tệp thì coi như rỗng. */
const docTepMacDinh = async () => {
    try {
        return await fs.promises.readFile(TEP_MAC_DINH, 'utf8')
    } catch (err) {
        if (err.code !== 'ENOENT') sails.log.error('[tuCam] Không đọc được tệp từ cấm mặc định:', err.message)
        return ''
    }
}

/**
 * Ghi tệp mặc định: ghi ra tệp tạm rồi đổi tên (không bao giờ để tệp dở dang),
 * giữ bản trước ở .bak để khôi phục khi ghi nhầm.
 */
const ghiTepMacDinh = async noiDung => {
    await fs.promises.mkdir(path.dirname(TEP_MAC_DINH), { recursive: true })
    try {
        await fs.promises.copyFile(TEP_MAC_DINH, TEP_MAC_DINH + '.bak')
    } catch (err) {
        if (err.code !== 'ENOENT') throw err
    }
    let tam = TEP_MAC_DINH + '.tmp'
    await fs.promises.writeFile(tam, noiDung, 'utf8')
    await fs.promises.rename(tam, TEP_MAC_DINH)
    xoaCache()
}

const SONG_CACHE_MS = 60 * 1000
let cache = { luc: 0, ds: [] }

/** Thường hoá: chữ thường, dạng NFC, mọi thứ không phải chữ/số thành một dấu cách. */
const chuanHoa = s => ' ' + String(s || '')
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim() + ' '

/** Danh sách từ cấm sạch: chuỗi, bỏ trùng, bỏ rỗng, tối đa `toiDa` từ (mặc định 1000), mỗi từ ≤ 80 ký tự. */
const lamSachDanhSach = (ds, toiDa = 1000) => Array.from(new Set(
    (Array.isArray(ds) ? ds : String(ds || '').split(/[\n,]/))
        .map(w => String(w || '').normalize('NFC').trim().replace(/\s+/g, ' ').slice(0, 80))
        .filter(Boolean)
)).slice(0, toiDa)

const layDanhSach = async () => {
    if (Date.now() - cache.luc < SONG_CACHE_MS) return cache.ds
    try {
        let [cauHinh, macDinh] = await Promise.all([sails.config.siteSettings.docHoacTao(), docTepMacDinh()])
        let them = lamSachDanhSach(cauHinh && cauHinh.bannedWords)
        // Mặc định trước, danh sách admin sau; lamSachDanhSach bỏ trùng giữa hai nguồn.
        cache = { luc: Date.now(), ds: lamSachDanhSach(lamSachDanhSach(macDinh, 5000).concat(them), 6000) }
    } catch (err) {
        sails.log.error('[tuCam] Không đọc được danh sách từ cấm:', err.message)
    }

    return cache.ds
}

const xoaCache = () => { cache = { luc: 0, ds: [] } }

/** Các từ cấm có trong `noiDung` (rỗng = sạch). */
const timTuCam = async noiDung => {
    let ds = await layDanhSach()
    if (!ds.length) return []

    let coDau = chuanHoa(noiDung)
    // Bản cho từ cấm KHÔNG dấu: chỉ giữ những chữ người viết cũng gõ không dấu,
    // chữ có dấu thay bằng '#'. Nhờ vậy "ngu" bắt được "ngu" viết trơn (kiểu lách
    // bỏ dấu) mà không bắt nhầm "ngủ", "ngư".
    let khongDau = coDau.split(' ').map(chu => (chu && boDau(chu) !== chu ? '#' : chu)).join(' ')

    return ds.filter(tu => {
        let mau = chuanHoa(tu)
        if (mau === '  ') return false
        let laKhongDau = boDau(tu) === tu.toLowerCase()

        return (laKhongDau ? khongDau : coDau).includes(mau)
    })
}

module.exports = { timTuCam, lamSachDanhSach, xoaCache, docTepMacDinh, ghiTepMacDinh }
