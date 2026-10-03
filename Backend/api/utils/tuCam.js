/**
 * Lọc từ cấm trong bình luận.
 *
 * Danh sách nằm ở SystemSettings.bannedWords (admin sửa ở /admin/dashboard),
 * đọc qua cache 60 giây để không truy vấn CSDL mỗi lần có bình luận; lưu cấu
 * hình xong thì `xoaCache()` để có hiệu lực ngay.
 *
 * Khớp NGUYÊN TỪ / NGUYÊN CỤM, không khớp một mẩu nằm giữa từ khác. Cách so
 * theo đúng cách admin gõ từ cấm:
 *   - từ cấm CÓ DẤU ("đần"): so với bình luận giữ nguyên dấu - nếu bỏ dấu thì
 *     "đần" sẽ bắt nhầm cả "dần", "dân";
 *   - từ cấm KHÔNG DẤU ("ngu"): chỉ so với những chữ người viết cũng gõ không
 *     dấu - bắt được kiểu lách bỏ dấu mà không bắt nhầm "ngủ", "ngư".
 * Muốn chặn cả hai cách viết thì thêm cả hai: "đần" và "dan".
 */
const { boDau } = require('./vietnamese')

const SONG_CACHE_MS = 60 * 1000
let cache = { luc: 0, ds: [] }

/** Thường hoá: chữ thường, dạng NFC, mọi thứ không phải chữ/số thành một dấu cách. */
const chuanHoa = s => ' ' + String(s || '')
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim() + ' '

/** Danh sách từ cấm sạch: chuỗi, bỏ trùng, bỏ rỗng, tối đa 1000 từ, mỗi từ ≤ 80 ký tự. */
const lamSachDanhSach = ds => Array.from(new Set(
    (Array.isArray(ds) ? ds : String(ds || '').split(/[\n,]/))
        .map(w => String(w || '').normalize('NFC').trim().replace(/\s+/g, ' ').slice(0, 80))
        .filter(Boolean)
)).slice(0, 1000)

const layDanhSach = async () => {
    if (Date.now() - cache.luc < SONG_CACHE_MS) return cache.ds
    try {
        let cauHinh = await sails.config.siteSettings.docHoacTao()
        cache = { luc: Date.now(), ds: lamSachDanhSach(cauHinh && cauHinh.bannedWords) }
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

module.exports = { timTuCam, lamSachDanhSach, xoaCache }
