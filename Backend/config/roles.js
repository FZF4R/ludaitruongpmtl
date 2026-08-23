/**
 * Vai trò và quyền
 * (sails.config.roles)
 *
 * Nguồn sự thật duy nhất cho việc phân quyền. Policy `requirePermission` đọc
 * tệp này để chặn request; API `/v1/admin/roles` (giai đoạn 3) trả nội dung
 * tệp này cho FrontEnd dựng giao diện, nên hai bên không thể lệch nhau.
 *
 * Mỗi tài khoản mang ĐÚNG MỘT vai trò, và các vai trò xếp thành một đường
 * thẳng: quyền của bậc trên bao trọn quyền của bậc dưới.
 */

const ROLES = ['User', 'Partner', 'Moderator', 'Manager', 'Admin']

// Bậc để cách nhau 10 để sau này chèn thêm vai trò ở giữa mà không đánh số lại.
// Đây không phải số trang trí: nó quyết định ai được gán vai trò cho ai (canAssign).
const RANK = {
  User: 0,
  Partner: 10,
  Moderator: 20,
  Manager: 30,
  Admin: 40
}

const LABELS = {
  User: 'Người dùng',
  Partner: 'Cộng tác viên',
  Moderator: 'Kiểm duyệt viên',
  Manager: 'Quản trị viên',
  Admin: 'Quản lý'
}

/**
 * Quyền khai theo lối CỘNG DỒN: mỗi bậc chỉ liệt kê phần MỚI so với bậc dưới.
 * Thêm một quyền chỉ phải sửa đúng một dòng, ở bậc thấp nhất được phép dùng nó.
 */
const GRANTS = {
  User: [
    'content.read',
    'content.bookmark',
    'comment.write'
  ],
  Partner: [
    'content.draft',
    'content.submit',
    'content.editOwn'
  ],
  Moderator: [
    'content.review',
    'comment.moderate'
  ],
  Manager: [
    'content.editAny',
    'content.publish',
    'content.delete',
    'category.manage',
    'calendar.manage',
    'notify.manage',
    'user.list',
    'user.role.assign'
  ],
  Admin: [
    'user.status.set',
    'user.password.reset',
    'system.settings',
    'audit.read'
  ]
}

// Làm phẳng một lần lúc nạp config -> tra cứu sau đó là O(1).
const FLAT = {}
ROLES.reduce((tichLuy, role) => {
  const gop = tichLuy.concat(GRANTS[role] || [])
  FLAT[role] = new Set(gop)
  return gop
}, [])

/**
 * Vai trò có quyền này không?
 * Vai trò lạ (dữ liệu cũ, gõ sai) coi như không có quyền gì - đóng mặc định.
 */
const can = (role, permission) => !!(FLAT[role] && FLAT[role].has(permission))

/** Toàn bộ quyền của một vai trò, đã cộng dồn. Dùng để trả về cho FrontEnd. */
const permissionsOf = role => (FLAT[role] ? Array.from(FLAT[role]) : [])

/**
 * Người bậc `actorRole` có được đổi vai trò của người đang ở `targetRole`
 * thành `newRole` không?
 *
 * Dùng `>` chứ không `>=` là có chủ ý: với `>=` thì hai Quản trị viên có thể
 * hạ bậc lẫn nhau, và tệ hơn, một Quản trị viên tự nhân bản quyền của mình
 * cho người khác - biến một vai trò được phong thành một vai trò tự lan.
 * Với `>`, mỗi bậc chỉ sinh ra được bậc dưới mình.
 *
 * Đây mới là luật 2 trong 4 luật gán vai trò; ba luật còn lại (không tự đổi
 * vai trò của mình, luôn còn ít nhất một Admin, luôn ghi nhật ký) cần truy
 * vấn DB nên nằm ở action `updateRole`.
 */
const canAssign = (actorRole, targetRole, newRole) => {
  const bacActor = RANK[actorRole]
  if (bacActor === undefined) return false
  if (RANK[targetRole] === undefined || RANK[newRole] === undefined) return false

  return bacActor > RANK[targetRole] && bacActor > RANK[newRole]
}

/** Danh sách vai trò mà người bậc `actorRole` được phép gán cho người khác. */
const assignableBy = actorRole => {
  const bacActor = RANK[actorRole]
  if (bacActor === undefined) return []

  return ROLES.filter(role => bacActor > RANK[role])
}

module.exports.roles = {
  list: ROLES,
  rank: RANK,
  labels: LABELS,
  grants: GRANTS,
  can,
  permissionsOf,
  canAssign,
  assignableBy
}
