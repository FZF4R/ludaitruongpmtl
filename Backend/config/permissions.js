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
  'POST /v1/admin/user/changepass': 'user.password.reset',

  //==== Cấu hình hệ thống =====
  'POST /v1/admin/settings/update': 'system.settings',
  'POST /v1/admin/settings/updateServiceMaintain': 'system.settings',
  'GET /v1/admin/systemsetting/supportInfo': 'system.settings',
  'POST /v1/admin/systemsetting/supportinfo/update': 'system.settings',

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
