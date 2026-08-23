/**
 * Đơn vị hành chính cấp tỉnh của Việt Nam.
 *
 * Danh sách 34 tỉnh/thành sau đợt sáp nhập có hiệu lực 01/07/2025 — 6 thành
 * phố trực thuộc trung ương và 28 tỉnh.
 *
 * Form quê quán chỉ hỏi tới cấp này. Cấp phường/xã cố tình KHÔNG có: hơn ba
 * nghìn đơn vị, nặng hơn cả phần còn lại của bundle, và tên còn đang đổi sau
 * sáp nhập. Ai muốn ghi rõ hơn thì dùng ô "chi tiết thêm" ở dạng chữ tự do.
 *
 * Thứ tự cố định, KHÔNG sắp xếp lúc chạy: `localeCompare("vi")` cho kết quả
 * khác nhau giữa Node và trình duyệt tuỳ phiên bản ICU, mà lệch một chỗ thôi
 * là React báo lỗi hydrate.
 */

/** Sáu thành phố trực thuộc trung ương. */
export const thanhPhoTrungUong = [
  "Cần Thơ",
  "Đà Nẵng",
  "Hà Nội",
  "Hải Phòng",
  "Huế",
  "TP. Hồ Chí Minh",
] as const;

/** Hai mươi tám tỉnh, xếp theo bảng chữ cái tiếng Việt. */
export const tinh = [
  "An Giang",
  "Bắc Ninh",
  "Cà Mau",
  "Cao Bằng",
  "Đắk Lắk",
  "Điện Biên",
  "Đồng Nai",
  "Đồng Tháp",
  "Gia Lai",
  "Hà Tĩnh",
  "Hưng Yên",
  "Khánh Hòa",
  "Lai Châu",
  "Lạng Sơn",
  "Lào Cai",
  "Lâm Đồng",
  "Nghệ An",
  "Ninh Bình",
  "Phú Thọ",
  "Quảng Ngãi",
  "Quảng Ninh",
  "Quảng Trị",
  "Sơn La",
  "Tây Ninh",
  "Thái Nguyên",
  "Thanh Hóa",
  "Tuyên Quang",
  "Vĩnh Long",
] as const;

/**
 * Giá trị dành cho người sinh ở nước ngoài hoặc không muốn khai.
 * Lưu nguyên chuỗi này thay vì để trống, để phân biệt "chọn Khác" với "bỏ qua".
 */
export const QUE_QUAN_KHAC = "Khác";

/** Nhóm cho <optgroup>; nhãn nhóm tra trong từ điển, không viết cứng ở đây. */
export const nhomTinhThanh = [
  { key: "cityGroup", items: thanhPhoTrungUong },
  { key: "provinceGroup", items: tinh },
] as const;

/** Danh sách phẳng, dùng khi cần kiểm tra một giá trị có nằm trong bảng không. */
export const tatCaTinhThanh: readonly string[] = [
  ...thanhPhoTrungUong,
  ...tinh,
  QUE_QUAN_KHAC,
];
