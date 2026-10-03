/**
 * Quyền theo LOẠI nội dung, dùng chung cho khu quản trị và trang "Bài viết
 * của tôi".
 *
 * config/permissions.js chỉ mở cửa (có một trong các quyền nội dung là vào
 * được); ai được làm gì với loại nào thì quyết ở đây:
 *   - bài viết / bài giảng: `content.editAny` (biên tập) hoặc `content.review`
 *     (kiểm duyệt - xem, duyệt, đề xuất sửa bài người dùng gửi);
 *   - kinh sách: `sutra.manage`;
 *   - thư viện: `library.manage`.
 */

const NHOM_BAI = ['article', 'blog', 'audio', 'video']
const LOAI_HOP_LE = ['article', 'blog', 'sutra', 'audio', 'video', 'library']
/** Danh mục thư viện: ảnh, review chùa / đền, Phật - Bồ Tát, nhạc thiền, audio kinh. */
const LOAI_THU_VIEN = ['anh', 'review', 'bo-tat', 'nhac-thien', 'audio-kinh']

const co = (user, quyen) => !!user && sails.config.roles.can(user.role, quyen)

/** Các loại nội dung người này mở được trong khu quản trị. */
const loaiQuanTri = user => {
    let ds = []
    if (co(user, 'content.editAny') || co(user, 'content.review')) ds.push(...NHOM_BAI)
    if (co(user, 'sutra.manage')) ds.push('sutra')
    if (co(user, 'library.manage')) ds.push('library')

    return ds
}

/** Xem / mở trình soạn được bài loại này không. */
const duocXem = (user, loai) => loaiQuanTri(user).includes(loai)

/**
 * Sửa trực tiếp (không qua đề xuất) bài của người KHÔNG phải người dùng thường.
 * Kiểm duyệt viên chỉ có `content.review` thì không sửa bài của ban biên tập.
 */
const duocSuaTrucTiep = (user, loai) => {
    if (loai === 'sutra') return co(user, 'sutra.manage')
    if (loai === 'library') return co(user, 'library.manage')

    return co(user, 'content.editAny')
}

/**
 * Đổi trạng thái được không. `content.review` chỉ được duyệt / trả lại bài
 * đang chờ (pending -> published | draft); lưu trữ, đăng lại bài cũ cần
 * `content.publish`.
 */
const duocDoiTrangThai = (user, loai, tu, den) => {
    if (loai === 'sutra') return co(user, 'sutra.manage')
    if (loai === 'library') return co(user, 'library.manage')
    if (co(user, 'content.publish')) return true

    return co(user, 'content.review') && tu === 'pending' && ['published', 'draft'].includes(den)
}

/**
 * Bài do NGƯỜI DÙNG (User / Cộng tác viên) viết: người có bậc dưới Kiểm duyệt
 * viên. Ban biên tập sửa bài loại này thì thành đề xuất sửa, chờ tác giả
 * đồng ý (Content.pendingEdit) - bài đang đăng giữ nguyên bản cũ.
 */
const laBaiNguoiDung = async (bai, nguoiSuaId) => {
    let chu = String(bai.authorId || '')
    if (!chu || chu === String(nguoiSuaId)) return false
    let tk = await Users.findOne({ id: chu })
    if (!tk) return false
    let bac = sails.config.roles.rank

    return (bac[tk.role] === undefined ? 0 : bac[tk.role]) < bac.Moderator
}

/** Đường dẫn công khai của một bài (để thông báo dẫn tới). */
const duongDanBai = bai => {
    if (bai.type === 'sutra') return `/kinh-sach/${bai.slug}`
    if (bai.type === 'library') return `/thu-vien/${bai.slug}`
    if (bai.type === 'audio' || bai.type === 'video') return `/bai-giang/${bai.slug}`

    return `/bai-viet/${bai.slug}`
}

module.exports = {
    NHOM_BAI,
    LOAI_HOP_LE,
    LOAI_THU_VIEN,
    co,
    loaiQuanTri,
    duocXem,
    duocSuaTrucTiep,
    duocDoiTrangThai,
    laBaiNguoiDung,
    duongDanBai
}
