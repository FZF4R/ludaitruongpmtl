/**
 * Tiện ích xử lý tiếng Việt.
 */

/**
 * Bỏ dấu và hạ chữ thường, để tìm kiếm không phân biệt dấu.
 * "Kinh Pháp Cú" -> "kinh phap cu", nên gõ "phap cu" vẫn ra kết quả.
 *
 * Dùng ở hai chỗ và phải giống hệt nhau: lúc ghi (Content.searchText) và
 * lúc tìm (ContentController.search). Lệch một bên là tìm không ra.
 */
const boDau = text => String(text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()

/** Thoát ký tự đặc biệt trước khi nhét chuỗi người dùng gõ vào regex Mongo. */
const thoatRegex = text => String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

module.exports = { boDau, thoatRegex }
