/**
 * Bộ khảo sát tu tập — cấu trúc, không có chữ hiển thị.
 *
 * Nhãn nằm ở lib/dictionaries/*.json (`onboarding.questions[key]` cho câu hỏi,
 * `onboarding.options[key][id]` cho từng lựa chọn), nên thêm một ngôn ngữ
 * không phải đụng tệp này, và thêm một lựa chọn thì TypeScript không nhắc —
 * bốn tệp JSON phải sửa tay, và bản tiếng Việt là khuôn kiểu nên thiếu khoá ở
 * en/zh/ko là lỗi biên dịch.
 *
 * HỢP ĐỒNG DỮ LIỆU: mọi id dưới đây phải có trong Backend/config/survey.js.
 * Backend lọc theo danh sách trắng, nên một id chỉ có ở đây sẽ bị bỏ lặng lẽ
 * lúc lưu — người dùng chọn, bấm lưu, rồi thấy lựa chọn biến mất.
 *
 * Thứ tự mảng chính là thứ tự hiện trên form.
 */

export const cauHoi = [
  { key: "ageGroup", nhieu: false, options: ["under18", "18-30", "31-45", "46-60", "over60"] },
  { key: "gender", nhieu: false, options: ["male", "female", "other"] },
  { key: "refuge", nhieu: false, options: ["yes", "no", "planning"] },
  {
    key: "practices",
    nhieu: true,
    options: ["meditation", "recitation", "mantra", "sutra", "prostration"],
  },
  { key: "frequency", nhieu: false, options: ["daily", "weekly", "lunarDays", "occasional"] },
  { key: "duration", nhieu: false, options: ["m15", "m30", "m60", "m90"] },
  { key: "diet", nhieu: false, options: ["none", "periodic", "full"] },
  { key: "goals", nhieu: true, options: ["peace", "stress", "family", "liberation"] },
  {
    key: "obstacles",
    nhieu: true,
    options: ["time", "community", "teacher", "family", "doctrine"],
  },
] as const;

export type KhoaCauHoi = (typeof cauHoi)[number]["key"];

/**
 * Số ngày chay trong tháng. Chỉ hỏi khi chọn `diet: "periodic"` — chay trường
 * mà kèm "4 ngày" là dữ liệu tự mâu thuẫn, backend cũng bỏ đi.
 */
export const ngayChay = [2, 4, 6, 8, 10, 15] as const;

/** Đáp án đã chọn. Tất cả đều tuỳ chọn: người dùng bỏ qua câu nào cũng được. */
export type KhaoSat = {
  ageGroup?: string;
  gender?: string;
  refuge?: string;
  frequency?: string;
  duration?: string;
  diet?: string;
  practices?: string[];
  goals?: string[];
  obstacles?: string[];
  vegDaysPerMonth?: number;
};

/**
 * Quê quán: chỉ hỏi tới cấp tỉnh/thành, phần còn lại để người dùng tự ghi.
 *
 * Không có ô phường/xã riêng — sau sáp nhập 2025 tên phường/xã còn đang đổi,
 * bắt khai đúng một cấp mà chính người khai cũng chưa chắc chỉ tổ làm form dài
 * ra mà dữ liệu vẫn không tin được.
 */
export type QueQuan = {
  province?: string;
  detail?: string;
};
