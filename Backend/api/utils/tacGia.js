/**
 * Tác giả bài viết lấy theo hồ sơ người dùng.
 *
 * Bài có `author.fromProfile: true` không lưu tên do người soạn gõ tay mà lấy
 * họ tên + pháp danh từ hồ sơ của `authorId`. Khi người đó sửa hồ sơ (hoặc
 * admin sửa họ tên), `dongBoBaiCuaTacGia` chép tên mới sang mọi bài đó.
 *
 * Bài gõ tác giả tay (bài dịch, bài nhập từ nguồn ngoài) không có cờ này nên
 * không bao giờ bị ghi đè.
 */

/** Họ tên + pháp danh hiện tại của một người, ưu tiên hồ sơ Phật tử. */
const layTenTacGia = async userId => {
    let id = String(userId || '')
    if (!id) return { name: '', dharmaName: '' }

    let [taiKhoan, hoSo] = await Promise.all([
        Users.findOne({ id: id }),
        UserProfile.findOne({ userId: id })
    ])

    return {
        name: (hoSo && hoSo.fullName) || (taiKhoan && (taiKhoan.fullName || taiKhoan.username)) || '',
        dharmaName: (hoSo && hoSo.dharmaName) || ''
    }
}

/** Giá trị `author` cho một bài lấy tác giả theo hồ sơ của `userId`. */
const tacGiaTheoHoSo = async userId => {
    let ten = await layTenTacGia(userId)

    return { name: ten.name, dharmaName: ten.dharmaName, fromProfile: true }
}

/**
 * Chép tên mới sang mọi bài của người này đang lấy tác giả theo hồ sơ.
 * Không ném lỗi: hồ sơ đã lưu xong rồi, đồng bộ hỏng thì ghi log chứ không
 * làm người dùng tưởng lưu hồ sơ thất bại.
 */
const dongBoBaiCuaTacGia = async userId => {
    try {
        let ten = await layTenTacGia(userId)
        let bang = Content.getDatastore().manager.collection(Content.tableName)
        let kq = await bang.updateMany(
            { authorId: String(userId), 'author.fromProfile': true },
            { $set: { 'author.name': ten.name, 'author.dharmaName': ten.dharmaName } }
        )
        // Kinh sách chọn người này làm dịch giả cũng đổi theo.
        let kqDichGia = await bang.updateMany(
            { 'translator.userId': String(userId) },
            { $set: { 'translator.name': ten.name, 'translator.dharmaName': ten.dharmaName } }
        )

        return (kq.modifiedCount || 0) + (kqDichGia.modifiedCount || 0)
    } catch (err) {
        sails.log.error('[tacGia] Không đồng bộ được tên tác giả cho', userId, '-', err.message)
        return 0
    }
}

/**
 * Chuẩn hoá dịch giả kinh sách client gửi lên.
 *   - có `userId`: người dùng trong hệ thống - tên + pháp danh đọc từ hồ sơ
 *     (bỏ qua tên client gửi), về sau tự đổi theo hồ sơ. userId không tồn tại
 *     thì coi như không chọn.
 *   - không có: dịch giả nhập tay (người ngoài hệ thống, bản dịch cổ...).
 */
const chuanHoaDichGia = async dichGia => {
    if (!dichGia || typeof dichGia !== 'object') return {}

    if (dichGia.userId) {
        let co = await Users.findOne({ id: String(dichGia.userId) })
        if (!co) return {}
        let ten = await layTenTacGia(dichGia.userId)
        return { userId: String(dichGia.userId), name: ten.name, dharmaName: ten.dharmaName }
    }

    let name = String(dichGia.name || '').trim().slice(0, 120)
    if (!name) return {}
    let ban = { name: name }
    let dharmaName = String(dichGia.dharmaName || '').trim().slice(0, 80)
    if (dharmaName) ban.dharmaName = dharmaName

    return ban
}

/**
 * Tìm người dùng để chọn làm dịch giả, theo họ tên / pháp danh / tên tài khoản.
 * Chỉ trả id + tên + pháp danh - KHÔNG trả email hay thông tin khác, vì người
 * gọi chỉ cần chọn người chứ không cần quyền xem hồ sơ (user.manage).
 */
const timNguoi = async (tuKhoa, gioiHan = 20) => {
    let { thoatRegex } = require('./vietnamese')
    let q = String(tuKhoa || '').trim()
    let loc = q ? { $regex: thoatRegex(q), $options: 'i' } : null

    let bangUser = Users.getDatastore().manager.collection(Users.tableName)
    let bangHoSo = UserProfile.getDatastore().manager.collection(UserProfile.tableName)

    let [theoTaiKhoan, theoHoSo] = await Promise.all([
        bangUser.find(loc ? { $or: [{ fullName: loc }, { username: loc }] } : {}, { projection: { _id: 1 } })
            .limit(gioiHan).toArray(),
        bangHoSo.find(loc ? { $or: [{ fullName: loc }, { dharmaName: loc }] } : {}, { projection: { userId: 1 } })
            .limit(gioiHan).toArray()
    ])

    let ids = Array.from(new Set([
        ...theoTaiKhoan.map(u => String(u._id)),
        ...theoHoSo.map(h => String(h.userId))
    ])).slice(0, gioiHan)

    return Promise.all(ids.map(async id => Object.assign({ id: id }, await layTenTacGia(id))))
}

module.exports = { layTenTacGia, tacGiaTheoHoSo, dongBoBaiCuaTacGia, chuanHoaDichGia, timNguoi }
