/**
 * Việc cần làm mỗi khi một bài lên trang - dùng chung cho khu quản trị (duyệt
 * bài) và trang Bài viết của tôi (tác giả đồng ý đề xuất sửa thì bài đăng).
 */
const { guiThongBaoBai } = require('./thongBao')
const { ghiCongDuc } = require('./congDuc')
const { duongDanBai } = require('./quyenNoiDung')

/**
 * Báo tác giả (MỖI lần bài lên trang) và cộng công đức cho lần duyệt đầu tiên
 * của bài (ghiCongDuc chống trùng theo refId nên đăng lại không cộng nữa).
 */
const baoDaDang = async (bai, nguoiDuyet) => {
    if (!bai.authorId) return
    await guiThongBaoBai({ userId: bai.authorId, type: 'published', actorId: nguoiDuyet.id, bai, link: duongDanBai(bai) })
    if (String(bai.authorId) !== String(nguoiDuyet.id)) {
        await ghiCongDuc(bai.authorId, 'content-approved', { refId: String(bai.id || bai._id) })
    }
}

module.exports = { baoDaDang }
