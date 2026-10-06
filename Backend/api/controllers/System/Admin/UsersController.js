/**
 * UsersController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const { dongBoBaiCuaTacGia } = require('../../../utils/tacGia')
const { lamSachDanhSach, xoaCache } = require('../../../utils/tuCam')

/**
 * IP client để ghi vào nhật ký đổi vai trò.
 * Ưu tiên X-Forwarded-For vì API chạy sau nginx.
 */
function layIpClient(req) {
    if (!req) return ''

    const chuyenTiep = req.headers && req.headers['x-forwarded-for']
    if (chuyenTiep) return String(chuyenTiep).split(',')[0].trim()

    return req.ip || ''
}

module.exports = {
    // API load websiteConfigs


    getListUser: ({
        inputs: sails.config.inputs.Admin.Users.getListUser,
        exits: sails.config.responseType,
        fn: async function(inputs, exits) {
            let { filter, limit, page, search } = inputs
            let filterObject = {
                condition: {

                },
                // Không có projection thì Mongo trả về ĐỦ MỌI TRƯỜNG, gồm cả hash
                // mật khẩu - mà hash đó chính là thứ được nhúng vào JWT
                // (jwtProcess.signAndEncryptJwt) và là thứ verifyPasswordFromDB
                // đối chiếu ở mọi request. Bắt buộc phải loại trước khi mở
                // endpoint này cho vai trò thấp hơn Admin.
                selectCols: { projection: { password: 0 } },
                sort: { createdAt: -1 },
                limit: limit,
                page: page
            }
            if (search) {
              let key = search
              filterObject.condition['$or'] = [
                { username: { '$regex': key , '$options': 'i'} },
                { email: { '$regex': key, '$options': 'i' } },
                { fullName: { '$regex': key, '$options': 'i' } },
              ]
              delete filterObject.search
            }
            sails.dataProcess.getListDataNative(Users, filterObject).then((result) => {
                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: result
                });
            }).catch((err) => {
                sails.checkErrorOutput(err, exits);
            });
        }
    }),
    changePass: ({
        inputs: sails.config.inputs.Admin.Users.changePass,
        exits: sails.config.responseType,
        fn: async function(inputs, exits) {
            let { newPass, username, userId } = inputs
            sails.dataProcess.findOne(Users, { condition: { username, id: userId } }).then(async(result) => {
                if (!result) {
                    return Promise.reject({
                        message: 'userNotExits',
                        messageNode: 'Users'
                    })
                }
                let passChange = await sails.helpers.passwords.hashPassword(newPass)
                let filterUpdate = {
                    condition: {
                        username
                    },
                    updateObject: {
                        password: passChange
                    }
                }
                sails.dataProcess.updateDocument(Users, filterUpdate).then((result) => {
                    exits.successRequest({
                        messageNode: 'GlobalNotifications',
                        message: 'success'
                    });
                }).catch((err) => {
                    sails.checkErrorOutput(err, exits);
                });
            }).catch(error => {
                sails.checkErrorOutput(error, exits);
            })

        }
    }),


    /**
     * Toàn bộ thông tin một tài khoản: phần đăng nhập (Users) và phần khai báo
     * (UserProfile) gộp lại, KHÔNG kèm hash mật khẩu.
     *
     * Quyền `user.manage` nằm ở bậc Quản lý chứ không phải `user.list` của bậc
     * Quản trị viên: danh sách chỉ để điều hành, còn màn hình này mở ra email
     * và toàn bộ khảo sát cá nhân của một người.
     */
    getUserDetail: ({
        inputs: sails.config.inputs.Admin.Users.getUserDetail,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let taiKhoan = await sails.dataProcess.findOne(Users, { condition: { id: inputs.id } })
                if (!taiKhoan) {
                    sails.checkErrorOutput({ messageNode: 'Users', message: 'userNotExits' }, exits)
                    return
                }

                delete taiKhoan.password

                let hoSo = await sails.dataProcess.findOne(UserProfile, {
                    condition: { userId: String(taiKhoan.id) }
                })

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: {
                        id: String(taiKhoan.id),
                        username: taiKhoan.username || '',
                        email: taiKhoan.email || '',
                        fullName: taiKhoan.fullName || '',
                        phone: taiKhoan.phone || '',
                        address: taiKhoan.address || '',
                        gender: taiKhoan.gender || '',
                        role: taiKhoan.role || 'User',
                        status: taiKhoan.status,
                        is2FAEnabled: !!taiKhoan.is2FAEnabled,
                        profileCompleted: !!taiKhoan.profileCompleted,
                        isNotVerified: !!taiKhoan.isNotVerified,
                        googleId: taiKhoan.googleId || '',
                        facebookId: taiKhoan.facebookId || '',
                        createdAt: taiKhoan.createdAt || 0,
                        updatedAt: taiKhoan.updatedAt || 0,
                        profile: hoSo ? {
                            fullName: hoSo.fullName || '',
                            dharmaName: hoSo.dharmaName || '',
                            nickname: hoSo.nickname || '',
                            hometown: hoSo.hometown || {},
                            survey: hoSo.survey || {},
                            completedAt: hoSo.completedAt || 0
                        } : null,
                        // Để giao diện dựng ô chọn vai trò đúng bằng những gì
                        // người đang thao tác được phép gán - không bày ra rồi
                        // mới báo lỗi sau khi bấm lưu.
                        assignableRoles: sails.config.roles.can(inputs.User.role, 'user.role.assign')
                            ? sails.config.roles.assignableBy(inputs.User.role)
                            : []
                    }
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    /**
     * Sửa email, họ tên và vai trò của một tài khoản.
     *
     * Đổi vai trò là thao tác đặc quyền cao nhất trong hệ, nên có bốn luật -
     * hai luật đầu ở config/roles.js, hai luật cuối cần truy vấn nên nằm đây:
     *   1. bậc người thao tác phải CAO HƠN cả vai trò cũ lẫn vai trò mới
     *   2. không ai tự đổi vai trò của chính mình
     *   3. hệ luôn còn ít nhất một Quản lý
     *   4. mọi lần đổi đều ghi vào RoleAuditLog
     *
     * Hệ quả của luật 1 (có chủ ý, xem chú thích canAssign): KHÔNG ai phong
     * được người khác lên Quản lý qua API này, kể cả Quản lý. Việc đó phải làm
     * thẳng trong CSDL - một hàng rào cố tình dựng lên.
     */
    updateUser: ({
        inputs: sails.config.inputs.Admin.Users.updateUser,
        exits: sails.config.responseType,
        fn: async function (inputs, exits) {
            try {
                let { User } = inputs
                let muc = await sails.dataProcess.findOne(Users, { condition: { id: inputs.id } })
                if (!muc) {
                    sails.checkErrorOutput({ messageNode: 'Users', message: 'userNotExits' }, exits)
                    return
                }

                let ban = {}
                let baoLoi = message => {
                    sails.checkErrorOutput({ messageNode: 'Users', message: message }, exits)
                }

                if (inputs.email !== undefined) {
                    let email = String(inputs.email).trim().toLowerCase()
                    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return baoLoi('emailInvalid')

                    if (email) {
                        let trung = await sails.dataProcess.findOne(Users, { condition: { email: email } })
                        if (trung && String(trung.id) !== String(muc.id)) return baoLoi('emailTaken')
                    }
                    ban.email = email
                }

                if (inputs.fullName !== undefined) {
                    ban.fullName = sails.config.survey.chuoiNgan(inputs.fullName, 80)
                }

                let vaiTroMoi = inputs.role === undefined ? muc.role : String(inputs.role)
                let doiVaiTro = vaiTroMoi !== muc.role

                if (doiVaiTro) {
                    // Luật 2: tự đổi vai trò của mình là đường thoát khỏi mọi
                    // hàng rào còn lại, chặn trước tiên.
                    if (String(User.id) === String(muc.id)) return baoLoi('roleSelfChange')
                    // Endpoint này chỉ đòi `user.manage`; đổi vai trò là quyền tách riêng
                    // để màn hình Phân quyền cho phép sửa hồ sơ mà không cho phong chức.
                    if (!sails.config.roles.can(User.role, 'user.role.assign')) return baoLoi('roleNotAssignable')
                    if (!sails.config.roles.canAssign(User.role, muc.role, vaiTroMoi)) return baoLoi('roleNotAssignable')

                    // Luật 3: hạ bậc người Quản lý cuối cùng là tự khoá cửa hệ thống.
                    if (muc.role === 'Admin') {
                        let soAdmin = await Users.count({ role: 'Admin' })
                        if (soAdmin <= 1) return baoLoi('roleLastAdmin')
                    }

                    ban.role = vaiTroMoi
                }

                if (!Object.keys(ban).length) {
                    exits.successRequest({
                        messageNode: 'GlobalNotifications',
                        message: 'success',
                        data: { id: String(muc.id), changed: [] }
                    });
                    return
                }

                await sails.dataProcess.updateDocument(Users, {
                    condition: { id: muc.id },
                    updateObject: ban
                })

                // Admin sửa họ tên: ghi cả vào hồ sơ Phật tử (nơi tên được ưu tiên
                // đọc - saveProfile cũng giữ hai chỗ này trùng nhau), rồi cho các
                // bài lấy tác giả theo hồ sơ đổi theo.
                if (ban.fullName !== undefined) {
                    await UserProfile.updateOne({ userId: String(muc.id) }).set({ fullName: ban.fullName })
                    await dongBoBaiCuaTacGia(muc.id)
                }

                // Luật 4. Ghi SAU khi ghi thành công: nhật ký nói "đã đổi", nên
                // một dòng nhật ký cho lần đổi bị lỗi còn tệ hơn là không có.
                if (doiVaiTro) {
                    await sails.dataProcess.createDocument(RoleAuditLog, {
                        targetUserId: String(muc.id),
                        targetUsername: muc.username || '',
                        oldRole: muc.role || '',
                        newRole: vaiTroMoi,
                        actorId: String(User.id),
                        actorUsername: User.username || '',
                        reason: sails.config.survey.chuoiNgan(inputs.reason, 200),
                        ip: layIpClient(this.req)
                    })
                }

                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: { id: String(muc.id), changed: Object.keys(ban) }
                });
            } catch (err) {
                sails.checkErrorOutput(err, exits);
            }
        }
    }),

    updateServiceMaintain: ({
        inputs: sails.config.inputs.Admin.Users.updateServiceMaintain,
        exits: sails.config.responseType,
        fn: async function(inputs, exits) {
            let { isMaintaning } = inputs
            // docHoacTao thay cho findOne: trên một cài đặt mới chưa ai mở trang
            // chủ thì bản ghi cấu hình chưa tồn tại, và updateOne không khớp gì
            // sẽ im lặng không làm gì - bật bảo trì mà không có tác dụng.
            sails.config.siteSettings.docHoacTao().then((result) => {
                let condition = {
                    id: result.id
                }
                let updateObject = { isMaintaning }
                return sails.dataProcess.updateDocument(SystemSettings, { condition, updateObject })
            }).then((result) => {
                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success',
                    data: result
                });
            }).catch((err) => {
                console.log(err);
                sails.checkErrorOutput(err, exits);
            });
        }
    }),

    updateSettings: ({
        inputs: sails.config.inputs.Admin.Users.updateSettings,
        exits: sails.config.responseType,
        fn: async function(inputs, exits) {
            sails.config.siteSettings.docHoacTao().then((result) => {
                let condition = {
                    id: result.id
                }
                let updateObject = inputs
                if (inputs.bannedWords !== undefined) {
                    updateObject.bannedWords = lamSachDanhSach(inputs.bannedWords)
                    xoaCache()
                }
                if (inputs.langLib !== undefined) {
                    updateObject.langLib = sails.Ultils.normalizeLangLib(inputs.langLib, sails.Ultils.langLibFields('systemSettings'))
                }
                // Ảnh các mục Tu tập: chỉ 4 khoá, mỗi giá trị là link http(s) hoặc rỗng.
                if (inputs.practiceImages !== undefined) {
                    let vao = inputs.practiceImages && typeof inputs.practiceImages === 'object' ? inputs.practiceImages : {}
                    let ra = {}
                    for (let k of ['chantingRecitation', 'meditation', 'woodenFishMala', 'prayers']) {
                        let u = String(vao[k] || '').trim().slice(0, 500)
                        if (u && /^https?:\/\//i.test(u)) ra[k] = u
                    }
                    updateObject.practiceImages = ra
                }
                // Ảnh đại diện từng danh mục Thư viện: 5 khoá, link http(s) hoặc bỏ.
                if (inputs.libraryImages !== undefined) {
                    let vao = inputs.libraryImages && typeof inputs.libraryImages === 'object' ? inputs.libraryImages : {}
                    let ra = {}
                    for (let k of ['anh', 'review', 'bo-tat', 'nhac-thien', 'audio-kinh']) {
                        let u = String(vao[k] || '').trim().slice(0, 500)
                        if (u && /^https?:\/\//i.test(u)) ra[k] = u
                    }
                    updateObject.libraryImages = ra
                }
                // Thứ tự danh mục Thư viện: chỉ nhận các khoá hợp lệ, bỏ trùng; khoá thiếu nối vào cuối.
                if (inputs.libraryOrder !== undefined) {
                    const DM = ['anh', 'review', 'bo-tat', 'nhac-thien', 'audio-kinh']
                    let vao = Array.isArray(inputs.libraryOrder) ? inputs.libraryOrder.map(String) : []
                    let ra = Array.from(new Set(vao.filter(k => DM.includes(k))))
                    DM.forEach(k => { if (!ra.includes(k)) ra.push(k) })
                    updateObject.libraryOrder = ra
                }
                // Trang Về chúng tôi: HTML theo ngôn ngữ, mỗi bản tối đa 200.000 ký tự.
                // Lọc thẻ / thuộc tính nguy hiểm làm ở FrontEnd lúc hiển thị (lib/sanitize.ts).
                if (inputs.aboutHtml !== undefined) {
                    let vao = inputs.aboutHtml && typeof inputs.aboutHtml === 'object' ? inputs.aboutHtml : {}
                    let ra = {}
                    for (let k of ['vi', 'en', 'zh', 'ko']) {
                        if (typeof vao[k] === 'string' && vao[k].trim()) ra[k] = vao[k].slice(0, 200000)
                    }
                    updateObject.aboutHtml = ra
                }
                return sails.dataProcess.updateDocument(SystemSettings, { condition, updateObject })
            }).then((result) => {
                exits.successRequest({
                    messageNode: 'GlobalNotifications',
                    message: 'success'
                });
            }).catch((err) => {
                console.log(err);
                sails.checkErrorOutput(err, exits);
            });
        }
    }),



};
