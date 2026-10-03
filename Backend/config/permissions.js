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

  //==== Cầu an / cầu siêu =====
  // Xoá lời của người khác cần thêm `comment.moderate` (kiểm tra trong action).
  'GET /v1/user/prayers/list': 'prayer.write',
  'POST /v1/user/prayers': 'prayer.write',
  'POST /v1/user/prayers/delete': 'prayer.write',

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
  // Đổi trạng thái và xoá tách khỏi việc sửa: một người được giao soạn bài
  // không nghiễm nhiên được tự đẩy bài mình lên trang, hay xoá bài người khác.
  'GET /v1/admin/content/list': 'content.editAny',
  'GET /v1/admin/content/detail': 'content.editAny',
  'GET /v1/admin/content/categories': 'content.editAny',
  // Ai đã mở được bài để sửa thì xem được lịch sử của bài đó.
  'GET /v1/admin/content/history': 'content.editAny',
  // Chọn dịch giả kinh sách: chỉ trả id + tên + pháp danh, không cần user.list.
  'GET /v1/admin/content/people': 'sutra.manage',
  'GET /v1/admin/content/revision': 'content.editAny',
  'POST /v1/admin/content/create': 'content.editAny',
  'POST /v1/admin/content/update': 'content.editAny',
  'POST /v1/admin/content/status': 'content.publish',
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
