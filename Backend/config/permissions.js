/**
 * Bản đồ endpoint sang quyền
 * (sails.config.permissions)
 *
 * Khoá theo `METHOD /đường-dẫn`, khớp một-đối-một với config/routes.js nên mở
 * hai tệp cạnh nhau là soát được. Cách này an toàn ở đây vì config/blueprints.js
 * đã tắt sạch actions/rest/shortcuts/index - không có route nào tồn tại ngoài
 * danh sách khai báo tay trong routes.js.
 *
 * ĐÓNG MẶC ĐỊNH: endpoint chạy qua policy `requirePermission` mà không có mặt
 * ở đây sẽ bị từ chối 403 kèm một dòng log lỗi. Quên khai một endpoint mới thì
 * phát hiện ngay lúc thử, thay vì để hở một cửa quản trị không ai biết.
 */

/** Mở được khu soạn nội dung: biên tập bài viết, duyệt bài, kinh sách hoặc thư viện. */
const CUA_NOI_DUNG = ['content.editAny', 'content.review', 'sutra.manage', 'library.manage']
/** Viết bài / gửi nội dung thư viện ở trang Bài viết của tôi. */
const VIET_BAI = ['content.draft', 'library.write', 'library.manage']

const actionPermissions = {
  //==== Người dùng =====
  'GET /v1/admin/user/list': 'user.list',
  // Chi tiết và sửa nằm ở bậc cao hơn danh sách: hai endpoint này mở ra email
  // và hồ sơ cá nhân, còn danh sách thì không.
  'GET /v1/admin/user/detail': 'user.manage',
  'POST /v1/admin/user/update': 'user.manage',
  'POST /v1/admin/user/changepass': 'user.password.reset',

  //==== Bình luận =====
  // Xoá bình luận của người khác cần thêm `comment.moderate`, kiểm tra trong
  // action (System/Users/CommentController) vì phụ thuộc ai là chủ bình luận.
  'POST /v1/user/comments': 'comment.write',
  'POST /v1/user/comments/delete': 'comment.write',
  'GET /v1/user/comments/deleted': 'comment.moderate',

  //==== Bài viết của tôi + tải tệp (quyền theo loại kiểm tiếp trong action) =====
  'GET /v1/user/content/mine': VIET_BAI,
  'GET /v1/user/content/detail': VIET_BAI,
  'POST /v1/user/content/save': VIET_BAI,
  'POST /v1/user/content/delete': VIET_BAI,
  'POST /v1/user/content/proposal/accept': VIET_BAI,
  'POST /v1/user/content/proposal/reject': VIET_BAI,
  'POST /v1/user/media/upload': [...VIET_BAI, 'content.editAny', 'sutra.manage', 'calendar.manage'],

  //==== Công đức =====
  'GET /v1/admin/merit': 'merit.manage',
  'POST /v1/admin/merit/rules': 'merit.manage',
  'POST /v1/admin/merit/donate': 'merit.manage',

  //==== Cầu an / cầu siêu =====
  // Xoá lời của người khác cần thêm `comment.moderate` (kiểm tra trong action).
  'GET /v1/user/prayers/list': 'prayer.write',
  'POST /v1/user/prayers': 'prayer.write',
  'POST /v1/user/prayers/delete': 'prayer.write',

  //==== Âm thanh cho các công cụ tu tập =====
  'GET /v1/admin/sounds': 'practice.manage',
  'POST /v1/admin/sounds/add': 'practice.manage',
  'POST /v1/admin/sounds/update': 'practice.manage',
  'POST /v1/admin/sounds/delete': 'practice.manage',
  'POST /v1/admin/sounds/reorder': 'practice.manage',

  //==== Lời nguyện nổi bật: người kiểm duyệt chọn hiện trong slideshow trang chủ =====
  'POST /v1/admin/prayers/feature': 'comment.moderate',

  //==== Đề xuất & góp ý (danh sách nằm ở trang Tổng quan) =====
  'GET /v1/admin/feedback': 'system.settings',
  'POST /v1/admin/feedback/status': 'system.settings',

  //==== Kiểm duyệt: bình luận vi phạm, cảnh cáo, khoá tài khoản =====
  'GET /v1/admin/moderation/comments': 'moderation.manage',
  'POST /v1/admin/moderation/comments/delete': 'moderation.manage',
  'GET /v1/admin/moderation/user': 'moderation.manage',
  'POST /v1/admin/moderation/warn': 'moderation.manage',
  'POST /v1/admin/moderation/ban': 'moderation.manage',
  'POST /v1/admin/moderation/unwarn': 'moderation.manage',

  //==== Phê duyệt bình luận / lời nguyện chứa từ cấm (Kiểm duyệt viên trở lên) =====
  'GET /v1/admin/approval': 'comment.moderate',
  'POST /v1/admin/approval/approve': 'comment.moderate',
  'POST /v1/admin/approval/reject': 'comment.moderate',

  //==== Thông báo tới toàn bộ người dùng =====
  'GET /v1/admin/broadcast': 'notify.manage',
  'POST /v1/admin/broadcast/send': 'notify.manage',

  //==== Sự kiện theo ngày trên lịch =====
  'POST /v1/admin/day-events/save': 'calendar.manage',
  'POST /v1/admin/day-events/delete': 'calendar.manage',
  'POST /v1/admin/moderation/unban': 'moderation.manage',

  //==== Ảnh xoay vòng trang chủ =====
  'POST /v1/admin/hero-images/add': 'system.settings',
  'POST /v1/admin/hero-images/delete': 'system.settings',
  'POST /v1/admin/hero-images/reorder': 'system.settings',

  //==== Sửa chữ giao diện trực tiếp =====
  'POST /v1/admin/texts/update': 'site.text.edit',

  //==== Phân quyền =====
  'GET /v1/admin/roles/permissions': 'role.permissions.manage',
  'POST /v1/admin/roles/permissions/update': 'role.permissions.manage',
  'POST /v1/admin/roles/permissions/reset': 'role.permissions.manage',

  //==== Cấu hình hệ thống =====
  'GET /v1/admin/settings': 'system.settings',
  'POST /v1/admin/settings/update': 'system.settings',
  'POST /v1/admin/settings/updateServiceMaintain': 'system.settings',
  'POST /v1/admin/settings/notify/add': 'system.settings',
  'POST /v1/admin/settings/notify/update': 'system.settings',
  'POST /v1/admin/settings/notify/delete': 'system.settings',
  'GET /v1/admin/systemsetting/supportInfo': 'system.settings',
  'POST /v1/admin/systemsetting/supportinfo/update': 'system.settings',

  //==== Nội dung =====
  // Mảng = có MỘT trong các quyền là qua cửa; quyền theo từng loại nội dung
  // (bài viết / kinh sách / thư viện) kiểm tiếp trong action - xem
  // `quyenTheoLoai` ở System/Admin/ContentController.
  // Đổi trạng thái và xoá tách khỏi việc sửa: một người được giao soạn bài
  // không nghiễm nhiên được tự đẩy bài mình lên trang, hay xoá bài người khác.
  'GET /v1/admin/content/list': CUA_NOI_DUNG,
  'GET /v1/admin/content/detail': CUA_NOI_DUNG,
  'GET /v1/admin/content/categories': CUA_NOI_DUNG,
  // Ai đã mở được bài để sửa thì xem được lịch sử của bài đó.
  'GET /v1/admin/content/history': CUA_NOI_DUNG,
  // Chọn dịch giả kinh sách: chỉ trả id + tên + pháp danh, không cần user.list.
  'GET /v1/admin/content/people': 'sutra.manage',
  'GET /v1/admin/content/revision': CUA_NOI_DUNG,
  'POST /v1/admin/content/create': ['content.editAny', 'sutra.manage', 'library.manage'],
  'POST /v1/admin/content/update': CUA_NOI_DUNG,
  'POST /v1/admin/content/status': ['content.publish', 'content.review', 'sutra.manage', 'library.manage'],
  'POST /v1/admin/content/delete': 'content.delete',

  //==== Thông báo =====
  'GET /v1/admin/notify': 'notify.manage',
  'POST /v1/admin/notify/add': 'notify.manage',
  'POST /v1/admin/notify/edit': 'notify.manage',
  'POST /v1/admin/notify/delete': 'notify.manage'
}

/**
 * Chuẩn hoá khoá tra cứu.
 *
 * Express định tuyến không phân biệt hoa thường và bỏ qua dấu / cuối, nên
 * `/v1/admin/systemsetting/supportInfo` và `/v1/admin/systemsetting/supportinfo/`
 * cùng vào một action. Nếu tra cứu theo đúng chuỗi client gửi lên thì hai biến
 * thể đó trượt khỏi bản đồ và bị 403 oan.
 */
const chuanHoa = (method, path) => {
  const duongDan = String(path || '').replace(/\/+$/, '') || '/'

  return `${String(method || '').toUpperCase()} ${duongDan}`.toLowerCase()
}

// Bảng tra cứu đã chuẩn hoá, dựng một lần lúc nạp config.
const LOOKUP = {}
Object.keys(actionPermissions).forEach(khoa => {
  const [method, ...phanConLai] = khoa.split(' ')
  LOOKUP[chuanHoa(method, phanConLai.join(' '))] = actionPermissions[khoa]
})

module.exports.permissions = {
  // Bản đọc được, giữ nguyên chữ hoa thường như trong routes.js.
  actionPermissions,

  /** Quyền cần có để gọi endpoint này, hoặc undefined nếu chưa khai báo. */
  requiredFor(method, path) {
    return LOOKUP[chuanHoa(method, path)]
  }
}
