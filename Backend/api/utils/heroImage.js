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

module.exports = { dinhDangAnh }
