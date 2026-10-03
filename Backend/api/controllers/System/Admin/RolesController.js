/**
 * RolesController
 *
 * @description :: Màn hình Phân quyền: xem và chỉnh quyền của từng vai trò.
 *
 * Ba luật chống leo thang, kiểm tra ở đây chứ không tin giao diện:
 *   1. vai trò bị khoá (config/roles.js `lockedRole`) không sửa được
 *   2. chỉ chỉnh được vai trò BẬC THẤP HƠN mình - không ai tự nới quyền cho
 *      vai trò của chính mình hay của bậc ngang mình
 *   3. chỉ CẤP THÊM được quyền mà chính mình đang có; bỏ bớt thì tuỳ ý
 * Mọi lần lưu đều ghi PermissionAuditLog.
 */

/** IP client cho nhật ký. Ưu tiên X-Forwarded-For vì API chạy sau nginx. */
function layIpClient(req) {
    if (!req) return ''

    const chuyenTiep = req.headers && req.headers['x-forwarded-for']
    if (chuyenTiep) return String(chuyenTiep).split(',')[0].trim()

    return req.ip || ''
}

/** Lỗi nếu `actor` không được chỉnh quyền của `role`, rỗng nếu được. */
function loiKhiSua(actor, role) {
    const cauHinh = sails.config.roles
    if (!cauHinh.list.includes(role)) return 'rolePermissionForbidden'
    if (role === cauHinh.lockedRole) return 'rolePermissionLocked'

    const bacActor = cauHinh.rank[actor.role]
    if (bacActor === undefined || bacActor <= cauHinh.rank[role]) return 'rolePermissionForbidden'

    return ''
}

/** Quyền -> các endpoint dùng nó, để màn hình chỉ ra quyền nào chưa gắn vào đâu. */
function endpointTheoQuyen() {
    const ketQua = {}
    const bang = sails.config.permissions.actionPermissions
    Object.keys(bang).forEach(endpoint => {
        // Endpoint nhận nhiều quyền (mảng) thì tính là đang dùng cho từng quyền.
        ;[].concat(bang[endpoint]).forEach(quyen => {
            if (!ketQua[quyen]) ketQua[quyen] = []
            ketQua[quyen].push(endpoint)
        })
    })

    return ketQua
}

/** Toàn bộ trạng thái cho màn hình, dựng lại sau mỗi lần lưu. */
async function dungTrangThai(actor) {
    const cauHinh = sails.config.roles
    const daLuu = await RolePermission.find()
    const banGhiTheoVaiTro = {}
    daLuu.forEach(muc => { banGhiTheoVaiTro[muc.role] = muc })

    const nhatKy = await PermissionAuditLog.find().sort('createdAt DESC').limit(30)
    const endpoint = endpointTheoQuyen()

    const grants = {}
    cauHinh.list.forEach(role => { grants[role] = cauHinh.permissionsOf(role) })

    return {
        roles: cauHinh.list.map(role => {
            const banGhi = banGhiTheoVaiTro[role]
            return {
                key: role,
                label: cauHinh.labels[role] || role,
                rank: cauHinh.rank[role],
                locked: role === cauHinh.lockedRole,
                editable: !loiKhiSua(actor, role),
                custom: !!banGhi,
                updatedAt: banGhi ? banGhi.updatedAt : 0,
                updatedBy: banGhi ? banGhi.updatedByUsername : ''
            }
        }),
        catalog: cauHinh.catalog.map(muc => Object.assign({}, muc, {
            endpoints: endpoint[muc.key] || []
        })),
        grants: grants,
        defaults: cauHinh.defaults,
        actorPermissions: cauHinh.permissionsOf(actor.role),
        log: nhatKy.map(muc => ({
            id: String(muc.id),
            role: muc.role,
            added: muc.added || [],
            removed: muc.removed || [],
            reset: !!muc.reset,
            actorUsername: muc.actorUsername,
            reason: muc.reason,
            createdAt: muc.createdAt
        }))
    }
}

/**
 * Lưu tập quyền mới (hoặc null = khôi phục mặc định) cho một vai trò, ghi
 * nhật ký, rồi nạp lại bảng tra cứu để có hiệu lực ngay request kế tiếp.
 */
async function luu(req, actor, role, danhSachMoi, lyDo) {
    const cauHinh = sails.config.roles
    const cu = cauHinh.permissionsOf(role)
    const moi = danhSachMoi === null ? cauHinh.defaults[role] : danhSachMoi

    const them = moi.filter(quyen => !cu.includes(quyen))
    const bot = cu.filter(quyen => !moi.includes(quyen))

    // Luật 3, áp cho cả khôi phục mặc định: bản mặc định có thể chứa quyền
    // người thao tác không có (khi quyền của chính họ đã bị chỉnh bớt).
    const coQuyen = new Set(cauHinh.permissionsOf(actor.role))
    if (them.some(quyen => !coQuyen.has(quyen))) return 'permissionNotGrantable'

    const banGhi = await RolePermission.findOne({ role: role })
    if (danhSachMoi === null) {
        if (banGhi) await RolePermission.destroyOne({ id: banGhi.id })
    } else {
        const giaTri = {
            permissions: moi,
            updatedById: String(actor.id),
            updatedByUsername: actor.username || ''
        }
        if (banGhi) await RolePermission.updateOne({ id: banGhi.id }).set(giaTri)
        else await RolePermission.create(Object.assign({ role: role }, giaTri))
    }

    await cauHinh.napTuCSDL()

    // Lưu lại bản giống hệt thì không có gì để ghi; khôi phục mặc định thì
    // vẫn ghi, vì nó xoá dấu "đã chỉnh" dù quyền có thể không đổi.
    if (them.length || bot.length || danhSachMoi === null) {
        await PermissionAuditLog.create({
            role: role,
            added: them,
            removed: bot,
            reset: danhSachMoi === null,
            actorId: String(actor.id),
            actorUsername: actor.username || '',
            reason: sails.config.survey.chuoiNgan(lyDo, 200),
            ip: layIpClient(req)
        })
    }

    return ''
}

module.exports = {

    getPermissions: ({
        inputs: sails.config.inputs.Admin.Roles.getPermissions,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: await dungTrangThai(inputs.User)
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    updatePermissions: ({
        inputs: sails.config.inputs.Admin.Roles.updatePermissions,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let { User, role, permissions } = inputs
                let baoLoi = message => sails.checkErrorOutput({ messageNode: 'Users', message: message }, exits)

                let loi = loiKhiSua(User, role)
                if (loi) return baoLoi(loi)

                if (!Array.isArray(permissions)) return baoLoi('permissionNotGrantable')
                let danhSach = Array.from(new Set(permissions.map(String)))
                if (danhSach.some(quyen => !sails.config.roles.catalogKeys.has(quyen))) return baoLoi('permissionNotGrantable')

                loi = await luu(this.req, User, role, danhSach, inputs.reason)
                if (loi) return baoLoi(loi)

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: await dungTrangThai(User)
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    resetPermissions: ({
        inputs: sails.config.inputs.Admin.Roles.resetPermissions,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let { User, role } = inputs
                let baoLoi = message => sails.checkErrorOutput({ messageNode: 'Users', message: message }, exits)

                let loi = loiKhiSua(User, role) || await luu(this.req, User, role, null, inputs.reason)
                if (loi) return baoLoi(loi)

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: await dungTrangThai(User)
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

};
