/**
 * Vai trò và quyền
 * (sails.config.roles)
 *
 * Nguồn sự thật duy nhất cho việc phân quyền. Policy `requirePermission` đọc
 * tệp này để chặn request; API `/v1/admin/roles` (giai đoạn 3) trả nội dung
 * tệp này cho FrontEnd dựng giao diện, nên hai bên không thể lệch nhau.
 *
 * Mỗi tài khoản mang ĐÚNG MỘT vai trò, và các vai trò xếp thành một đường
 * thẳng. Bậc quyết định ai gán vai trò cho ai, ai chỉnh quyền của vai trò nào.
 *
 * Quyền của từng vai trò sửa được ở màn hình /admin/roles và lưu vào CSDL
 * (model RolePermission). GRANTS dưới đây chỉ còn là BẢN MẶC ĐỊNH - dùng khi
 * vai trò chưa từng được chỉnh, và khi bấm "Khôi phục mặc định".
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
    // Xem đầy đủ hồ sơ một tài khoản và sửa email/họ tên/vai trò. Để ở bậc
    // Admin vì nó đọc được email của mọi người dùng - dữ liệu cá nhân, khác
    // hẳn 'user.list' vốn chỉ để dựng danh sách.
    'user.manage',
    'system.settings',
    'audit.read',
    'role.permissions.manage',
    'site.text.edit'
  ]
}

/**
 * Danh mục mọi quyền, kèm nhãn cho màn hình Phân quyền.
 *
 * Đây cũng là DANH SÁCH TRẮNG khi lưu: quyền không có ở đây bị từ chối, nên
 * thêm quyền mới phải thêm cả vào GRANTS (bậc mặc định) lẫn vào đây (nhãn).
 */
const CATALOG = [
  { key: 'content.read', group: 'Nội dung', label: 'Đọc nội dung dành cho thành viên' },
  { key: 'content.bookmark', group: 'Nội dung', label: 'Lưu và đánh dấu bài' },
  { key: 'content.draft', group: 'Nội dung', label: 'Soạn bài nháp' },
  { key: 'content.submit', group: 'Nội dung', label: 'Gửi bài chờ duyệt' },
  { key: 'content.editOwn', group: 'Nội dung', label: 'Sửa bài của chính mình' },
  { key: 'content.review', group: 'Nội dung', label: 'Duyệt bài người khác gửi' },
  { key: 'content.editAny', group: 'Nội dung', label: 'Soạn và sửa mọi bài viết, kinh sách' },
  { key: 'content.publish', group: 'Nội dung', label: 'Đăng, ẩn, lưu trữ bài' },
  { key: 'content.delete', group: 'Nội dung', label: 'Xoá bài' },
  { key: 'category.manage', group: 'Nội dung', label: 'Quản lý chuyên mục' },
  { key: 'calendar.manage', group: 'Nội dung', label: 'Quản lý Phật lịch' },
  { key: 'comment.write', group: 'Bình luận', label: 'Viết bình luận' },
  { key: 'comment.moderate', group: 'Bình luận', label: 'Kiểm duyệt bình luận' },
  { key: 'user.list', group: 'Người dùng', label: 'Xem danh sách tài khoản' },
  { key: 'user.manage', group: 'Người dùng', label: 'Xem chi tiết và sửa email, họ tên tài khoản' },
  { key: 'user.role.assign', group: 'Người dùng', label: 'Đổi vai trò tài khoản (bậc thấp hơn mình)' },
  { key: 'user.status.set', group: 'Người dùng', label: 'Khoá, mở tài khoản' },
  { key: 'user.password.reset', group: 'Người dùng', label: 'Đặt lại mật khẩu' },
  { key: 'notify.manage', group: 'Hệ thống', label: 'Quản lý thông báo' },
  { key: 'system.settings', group: 'Hệ thống', label: 'Cấu hình site (tiêu đề, màu, bảo trì...)' },
  { key: 'site.text.edit', group: 'Hệ thống', label: 'Sửa chữ giao diện ngay trên trang' },
  { key: 'audit.read', group: 'Hệ thống', label: 'Xem nhật ký thao tác' },
  { key: 'role.permissions.manage', group: 'Hệ thống', label: 'Chỉnh quyền cho các vai trò' }
]

const CATALOG_KEYS = new Set(CATALOG.map(muc => muc.key))

/**
 * Vai trò không sửa được quyền: luôn có ĐỦ mọi quyền trong danh mục.
 * Nếu Quản lý cũng sửa được thì một cú bỏ tick nhầm `role.permissions.manage`
 * là không còn ai mở lại được màn hình Phân quyền, trừ khi vào thẳng CSDL.
 */
const LOCKED_ROLE = 'Admin'

// Bản mặc định: cộng dồn GRANTS theo bậc. Đây là thứ "Khôi phục mặc định" trả về.
const DEFAULTS = {}
ROLES.reduce((tichLuy, role) => {
  const gop = tichLuy.concat(GRANTS[role] || [])
  DEFAULTS[role] = role === LOCKED_ROLE ? Array.from(CATALOG_KEYS) : Array.from(new Set(gop))
  return gop
}, [])

/*
 * Bảng tra cứu đang dùng. Khởi đầu bằng mặc định; `apDung` thay từng vai trò
 * bằng bản đã lưu trong CSDL (model RolePermission). Bản đã lưu KHÔNG cộng
 * dồn - mỗi vai trò mang đúng tập quyền đã tick cho nó, để chỉnh tuỳ ý được.
 */
const FLAT = {}
ROLES.forEach(role => { FLAT[role] = new Set(DEFAULTS[role]) })

/**
 * Thay quyền đang dùng của một vai trò. `danhSach` = null -> về mặc định.
 * Quyền lạ (đã xoá khỏi danh mục nhưng còn trong CSDL) bị bỏ qua lặng lẽ.
 */
const apDung = (role, danhSach) => {
  if (!FLAT[role] || role === LOCKED_ROLE) return
  FLAT[role] = new Set(Array.isArray(danhSach)
    ? danhSach.filter(quyen => CATALOG_KEYS.has(quyen))
    : DEFAULTS[role])
}

/**
 * Nạp lại toàn bộ từ CSDL. Gọi lúc khởi động, sau mỗi lần lưu, và định kỳ
 * (config/bootstrap.js) để các tiến trình khác của cùng một app cũng thấy
 * thay đổi. Lỗi CSDL thì giữ nguyên bảng cũ, không rơi về "không ai có quyền".
 */
const napTuCSDL = async () => {
  if (typeof RolePermission === 'undefined') return
  try {
    const banGhi = await RolePermission.find()
    const daLuu = {}
    banGhi.forEach(muc => { daLuu[muc.role] = muc.permissions })
    ROLES.forEach(role => apDung(role, daLuu[role] || null))
  } catch (err) {
    sails.log.error('[roles] Không nạp được quyền từ CSDL, giữ bảng cũ:', err.message)
  }
}

/**
 * Vai trò có quyền này không?
 * Vai trò lạ (dữ liệu cũ, gõ sai) coi như không có quyền gì - đóng mặc định.
 */
const can = (role, permission) => !!(FLAT[role] && FLAT[role].has(permission))

/** Toàn bộ quyền đang dùng của một vai trò. Dùng để trả về cho FrontEnd. */
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
  catalog: CATALOG,
  catalogKeys: CATALOG_KEYS,
  lockedRole: LOCKED_ROLE,
  defaults: DEFAULTS,
  apDung,
  napTuCSDL,
  can,
  permissionsOf,
  canAssign,
  assignableBy
}
