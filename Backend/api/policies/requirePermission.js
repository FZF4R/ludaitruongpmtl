/**
 * Chặn request theo quyền của vai trò.
 *
 * Chạy SAU `userPolices` - policy đó đã xác thực token và gán bản ghi Users
 * vừa đọc từ DB vào `req.body.User`, nên vai trò ở đây luôn là vai trò mới
 * nhất, không phải vai trò lúc phát token. Đổi vai trò vì thế có hiệu lực
 * ngay ở request kế tiếp mà không cần thu hồi token.
 *
 * Quyền cần có tra trong config/permissions.js theo `METHOD /đường-dẫn`.
 */
module.exports = async function (req, res, proceed) {
    var responseObject = {
        message: {
            messageEN: "Permision denined",
            messageVNI: "Không có quyền truy cập"
        }
    }

    var canQuyen = sails.config.permissions.requiredFor(req.method, req.path)

    // Đóng mặc định: endpoint chưa khai báo là lỗi cấu hình, không phải quyền mở.
    if (!canQuyen) {
        sails.log.error('[requirePermission] Chưa khai quyền cho', req.method, req.path, '- hãy thêm vào config/permissions.js')
        return res.status(403).json(responseObject);
    }

    var User = req.body && req.body.User
    if (!User) {
        // Thiếu User nghĩa là userPolices chưa chạy trước -> sai thứ tự trong config/policies.js
        sails.log.error('[requirePermission] Thiếu req.body.User - policy này phải đứng sau userPolices')
        return res.status(403).json(responseObject);
    }

    // Mảng quyền = có một trong số đó là đủ (config/permissions.js).
    var danhSach = Array.isArray(canQuyen) ? canQuyen : [canQuyen]
    if (!danhSach.some(function (q) { return sails.config.roles.can(User.role, q) })) {
        sails.log.verbose('[requirePermission] Từ chối', User.username, `(${User.role})`, '- thiếu quyền', canQuyen)
        return res.status(403).json(responseObject);
    }

    return proceed()
};
