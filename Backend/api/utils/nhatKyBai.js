/**
 * Ghi nhật ký thao tác trên bài (ContentAuditLog) và dấu vết nhanh trên bản ghi.
 *
 * Hai lớp thông tin, phục vụ hai câu hỏi khác nhau:
 *   - trên chính bản ghi Content (createdBy*, updatedBy*, approvedBy*, approvedAt):
 *     "bài này ai tạo, ai sửa cuối, ai duyệt" - đọc ngay không phải tra bảng khác;
 *   - ContentAuditLog: toàn bộ diễn biến, từng lần một, kể cả sau khi bài bị xoá.
 */

/** IP client, ưu tiên X-Forwarded-For vì API chạy sau nginx. */
const layIp = req => {
    if (!req) return ''
    let chuyenTiep = req.headers && req.headers['x-forwarded-for']
    if (chuyenTiep) return String(chuyenTiep).split(',')[0].trim()

    return req.ip || ''
}

/** Tên hiển thị của người thao tác: họ tên nếu có, không thì tên tài khoản. */
const tenNguoi = user => (user && (user.fullName || user.username)) || ''

/** Dấu vết "ai làm" gắn vào bản ghi Content, theo tiền tố: created / updated / approved. */
const dauVet = (tienTo, user) => ({
    [`${tienTo}ById`]: String(user.id),
    [`${tienTo}ByName`]: tenNguoi(user)
})

/**
 * Các trường thật sự đổi giữa bản cũ và phần được gửi lên. So bằng JSON vì
 * phần lớn là object/mảng (author, categories, chapters...).
 */
const truongDaDoi = (cu, ban) => Object.keys(ban).filter(ten =>
    JSON.stringify(cu[ten] === undefined ? null : cu[ten]) !== JSON.stringify(ban[ten] === undefined ? null : ban[ten])
)

/**
 * Các trường NỘI DUNG được chụp lại vào ContentRevision. Không gồm trường máy
 * tự quản (searchText, viewCount, dấu vết người sửa...) - đối chiếu chúng
 * không giúp gì cho người đọc lịch sử.
 */
const TRUONG_NOI_DUNG = [
    'type', 'title', 'slug', 'summary', 'coverUrl', 'bodyHtml', 'chapters', 'media',
    'author', 'translator', 'source', 'categories', 'tags', 'publishedAt', 'readingMinutes', 'seo',
    'libraryKind', 'gallery'
]

/** Giá trị "trống" không đáng chụp: '', 0, [], {} và chưa có. */
const rong = v => v === undefined || v === null || v === '' || v === 0 ||
    (Array.isArray(v) && !v.length) ||
    (typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length)

/** Ảnh chụp các trường nội dung của một bài, dạng [{ field, before, after }]. */
const chupNoiDung = (bai, chieu) => TRUONG_NOI_DUNG
    .filter(ten => !rong(bai[ten]))
    .map(ten => chieu === 'after'
        ? { field: ten, before: null, after: bai[ten] }
        : { field: ten, before: bai[ten], after: null })

/**
 * Ghi một dòng nhật ký, và nếu có `changes` thì ghi kèm nội dung đã đổi vào
 * ContentRevision. Không ném lỗi ra ngoài: thao tác chính đã thành công,
 * nhật ký hỏng thì ghi log máy chủ chứ không báo người dùng là lưu thất bại.
 */
const ghiNhatKy = async ({ req, user, bai, action, fromStatus = '', toStatus = '', changedFields = [], changes = [] }) => {
    try {
        let nhatKy = await ContentAuditLog.create({
            contentId: String(bai.id || bai._id),
            contentTitle: bai.title || '',
            contentSlug: bai.slug || '',
            action: action,
            fromStatus: fromStatus,
            toStatus: toStatus,
            changedFields: changedFields,
            actorId: String(user.id),
            actorUsername: user.username || '',
            actorName: tenNguoi(user),
            ip: layIp(req)
        }).fetch()

        if (changes.length) {
            await ContentRevision.create({
                contentId: String(bai.id || bai._id),
                logId: String(nhatKy.id),
                action: action,
                changes: changes
            })
        }
    } catch (err) {
        sails.log.error('[nhatKyBai] Không ghi được nhật ký', action, 'cho bài', bai && bai.id, '-', err.message)
    }
}

module.exports = { ghiNhatKy, dauVet, truongDaDoi, chupNoiDung, TRUONG_NOI_DUNG }
