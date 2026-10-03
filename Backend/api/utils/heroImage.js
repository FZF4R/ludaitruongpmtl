/**
 * Hình dạng ảnh trang chủ trả cho FrontEnd: không kèm dữ liệu ảnh, chỉ đường
 * dẫn tới endpoint trả tệp. Dùng chung cho controller công khai và quản trị.
 */
const dinhDangAnh = row => ({
    id: String(row.id),
    url: `/v1/public/hero-images/${row.id}/file`,
    width: row.width || 0,
    height: row.height || 0,
    alt: row.alt || ''
})

/** Nhóm hợp lệ; giá trị lạ coi như `hero`. */
const NHOM_ANH = ['hero', 'prayer']
const chuanNhom = nhom => (NHOM_ANH.includes(nhom) ? nhom : 'hero')

/**
 * Điều kiện Mongo lọc theo nhóm. Ảnh tải lên trước khi có trường `group`
 * thuộc nhóm `hero`, nên nhóm này phải nhận cả bản ghi thiếu trường.
 */
const dieuKienNhom = nhom => (chuanNhom(nhom) === 'hero'
    ? { $or: [{ group: 'hero' }, { group: { $exists: false } }] }
    : { group: chuanNhom(nhom) })

module.exports = { dinhDangAnh, chuanNhom, dieuKienNhom }
