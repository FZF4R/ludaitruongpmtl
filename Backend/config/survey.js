/**
 * Bộ khảo sát tu tập
 * (sails.config.survey)
 *
 * Người dùng đăng nhập lần đầu bằng Google/Facebook chỉ cho ta cái tên và
 * email; phần còn lại của hồ sơ Phật tử lấy qua form ở FrontEnd
 * (/hoan-thien-ho-so). Tệp này là bản MÃ của bộ câu hỏi đó - chỉ id, không có
 * chữ hiển thị, vì chữ nằm ở FrontEnd/lib/dictionaries/*.json cho bốn ngôn ngữ.
 *
 * HỢP ĐỒNG DỮ LIỆU: danh sách id dưới đây phải khớp FrontEnd/lib/survey.ts.
 * Thêm một lựa chọn ở FrontEnd mà quên thêm ở đây thì nó bị lọc lặng lẽ lúc
 * lưu - người dùng chọn xong, bấm lưu, và lựa chọn đó biến mất.
 *
 * Vì sao lọc theo danh sách trắng chứ không lưu thẳng: `survey` là cột json,
 * client gửi gì cũng vào được. Chỉ nhận đúng các id đã biết thì cột này không
 * bao giờ thành bãi rác, và trang thống kê sau này đếm được mà không phải
 * chuẩn hoá lại dữ liệu cũ.
 */

/** Câu hỏi chọn MỘT - lưu một chuỗi id. */
const MOT_LUA = {
    ageGroup: ['under18', '18-30', '31-45', '46-60', 'over60'],
    gender: ['male', 'female', 'other'],
    // Đã quy y Tam bảo chưa: rồi / chưa / đang có ý định
    refuge: ['yes', 'no', 'planning'],
    // Tần suất: hằng ngày / hằng tuần / các ngày rằm, mùng một, 30 / thỉnh thoảng
    frequency: ['daily', 'weekly', 'lunarDays', 'occasional'],
    // Thời lượng mỗi thời khoá: 15 phút / 30 phút / 1 tiếng / trên 1 tiếng rưỡi
    duration: ['m15', 'm30', 'm60', 'm90'],
    // Ăn chay: chưa ăn chay / chay kỳ / chay trường
    diet: ['none', 'periodic', 'full']
}

/** Câu hỏi chọn NHIỀU - lưu mảng id. */
const NHIEU_LUA = {
    // Pháp môn chính: toạ thiền / niệm Phật / trì chú / tụng kinh / lạy Phật
    practices: ['meditation', 'recitation', 'mantra', 'sutra', 'prostration'],
    // Mục tiêu tu tập
    goals: ['peace', 'stress', 'family', 'liberation'],
    // Trở ngại hiện tại
    obstacles: ['time', 'community', 'teacher', 'family', 'doctrine']
}

/** Số ngày chay trong tháng, chỉ hỏi khi chọn chay kỳ. */
const NGAY_CHAY = [2, 4, 6, 8, 10, 15]

/**
 * Ký tự điều khiển. Viết bằng new RegExp thay vì literal để mã nguồn tệp này
 * không chứa chính những ký tự đó - dán qua lại giữa các công cụ là mất.
 */
const KY_TU_DIEU_KHIEN = new RegExp('[\u0000-\u001F\u007F]', 'g')

/**
 * Cắt chuỗi tự do về độ dài an toàn và bỏ ký tự điều khiển.
 * Không đụng tới dấu tiếng Việt - tên và địa danh cần nguyên vẹn.
 */
const chuoiNgan = (giaTri, toiDa) => String(giaTri === null || giaTri === undefined ? '' : giaTri)
    .replace(KY_TU_DIEU_KHIEN, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, toiDa)

/**
 * Quê quán: tỉnh/thành cộng một dòng chữ tự do.
 *
 * Chỉ hai trường, KHÔNG có phường/xã: tên cấp đó còn đang đổi sau sáp nhập
 * 2025, bắt khai chính xác chỉ làm form dài ra mà dữ liệu vẫn không tin được.
 * Bản ghi cũ có `ward` sẽ mất trường đó ở lần lưu kế tiếp - chấp nhận, vì
 * không có gì đọc trường ấy.
 *
 * Cố tình KHÔNG đối chiếu tỉnh/thành với một danh sách cứng ở backend: danh
 * sách đó vừa đổi một lần và sẽ còn đổi. Giữ nó ở FrontEnd - nơi dựng ô chọn -
 * là đủ; backend chỉ cần chắc chuỗi ngắn và sạch, vì đây là dữ liệu khai báo
 * chứ không phải thứ dùng để phân quyền.
 */
const locQueQuan = raw => {
    const nguon = raw && typeof raw === 'object' ? raw : {}
    const kq = {
        province: chuoiNgan(nguon.province, 80),
        detail: chuoiNgan(nguon.detail, 160)
    }

    return kq.province || kq.detail ? kq : {}
}

/** Dữ liệu khảo sát thô từ client -> chỉ còn các id hợp lệ. */
const locKhaoSat = raw => {
    const nguon = raw && typeof raw === 'object' ? raw : {}
    const kq = {}

    Object.keys(MOT_LUA).forEach(khoa => {
        const chon = String(nguon[khoa] === null || nguon[khoa] === undefined ? '' : nguon[khoa])
        if (MOT_LUA[khoa].indexOf(chon) !== -1) kq[khoa] = chon
    })

    Object.keys(NHIEU_LUA).forEach(khoa => {
        const chon = Array.isArray(nguon[khoa]) ? nguon[khoa].map(String) : []
        const loc = chon.filter((id, i) => NHIEU_LUA[khoa].indexOf(id) !== -1 && chon.indexOf(id) === i)
        if (loc.length) kq[khoa] = loc
    })

    // Số ngày chay chỉ có nghĩa khi chọn chay kỳ; chay trường mà kèm "4 ngày"
    // là dữ liệu tự mâu thuẫn, thà bỏ đi.
    if (kq.diet === 'periodic' && NGAY_CHAY.indexOf(Number(nguon.vegDaysPerMonth)) !== -1) {
        kq.vegDaysPerMonth = Number(nguon.vegDaysPerMonth)
    }

    return kq
}

module.exports.survey = {
    MOT_LUA,
    NHIEU_LUA,
    NGAY_CHAY,
    chuoiNgan,
    locQueQuan,
    locKhaoSat
}
