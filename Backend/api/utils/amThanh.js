/**
 * Âm thanh tu tập (PracticeSound): hằng số, định dạng trả về, đọc tệp tải lên.
 */

const DANH_MUC = ['tung-kinh', 'thien-dinh', 'go-mo', 'cau-an']
/** hat = tiếng hạt chuỗi khi lần (mỗi hạt một tiếng). */
const LOAI = ['chuong', 'mo', 'am-nen', 'tung-mau', 'huong-dan', 'hat']
const MIME_HOP_LE = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/wave', 'audio/ogg', 'audio/webm', 'audio/mp4', 'audio/aac', 'audio/x-m4a']
/** Trần tệp tải lên sau khi giải base64 (body JSON tối đa 8mb ở config/http.js). */
const TOI_DA_BYTE = 5.5 * 1024 * 1024

/** Mongo trực tiếp có projection: app để schema:false, không `select` được; kéo cả `data` là vài MB mỗi dòng. */
const bangAmThanh = () => PracticeSound.getDatastore().manager.collection(PracticeSound.tableName)

/** Bản ghi -> hình dạng FrontEnd. `src` là link phát được (tệp nội bộ hoặc link ngoài). */
const dinhDangAmThanh = (row, { quanTri = false } = {}) => {
    let id = String(row.id || row._id)
    let kq = {
        id: id,
        category: row.category,
        kind: row.kind,
        title: row.title,
        src: row.source === 'url' ? row.url : `/v1/public/sounds/${id}/file?v=${row.updatedAt || 0}`,
        loop: !!row.loop
    }
    if (quanTri) {
        Object.assign(kq, {
            source: row.source,
            url: row.url || '',
            mime: row.mime || '',
            sizeBytes: row.sizeBytes || 0,
            active: row.active !== false,
            order: row.order || 0
        })
    }

    return kq
}

/** `data:audio/...;base64,...` -> { mime, base64, size } hoặc null nếu không phải âm thanh hợp lệ / quá lớn. */
const docTepAmThanh = dataUrl => {
    let khop = String(dataUrl || '').match(/^data:(audio\/[a-z0-9.+-]+);base64,(.+)$/i)
    if (!khop || !MIME_HOP_LE.includes(khop[1].toLowerCase())) return null

    let size = Buffer.byteLength(khop[2], 'base64')
    if (!size || size > TOI_DA_BYTE) return null

    return { mime: khop[1].toLowerCase(), base64: khop[2], size: size }
}

/** Link ngoài chỉ nhận http(s). */
const linkHopLe = url => /^https?:\/\/\S+$/i.test(String(url || '').trim())

module.exports = { DANH_MUC, LOAI, TOI_DA_BYTE, bangAmThanh, dinhDangAmThanh, docTepAmThanh, linkHopLe }
