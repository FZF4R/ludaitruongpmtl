/**
 * Bảng màu mặc định của site — NGUỒN DUY NHẤT.
 *
 * app/globals.css cố tình KHÔNG khai giá trị màu nữa: layout dựng khối
 * `:root { ... }` từ tệp này rồi chèn vào <head> lúc render trên server. Nhờ
 * vậy không có hai bản màu để lệch nhau, và quản trị viên đổi màu qua
 * `/v1/public/settings` thì trang đổi theo mà không phải build lại.
 *
 * Vì chèn ở server nên màu có sẵn ngay trong HTML đầu tiên — không nháy màu
 * mặc định rồi mới đổi như cách nhét bằng JavaScript.
 *
 * Tông lấy từ những gì hay thấy trong ảnh đức Phật: tượng thếp vàng, y ca-sa
 * màu nghệ, sơn son thếp vàng ở chùa, gỗ mít và trầm hương.
 *
 *   accent   vàng nâu sẫm  - bóng đổ của lớp thếp vàng, đủ đậm để làm chữ
 *   brass    vàng kim sáng - chính lớp thếp, chỉ dùng trang trí vì quá sáng
 *            để đọc trên nền trắng
 *   lacquer  đỏ son        - sơn son ở hoành phi, câu đối
 *   surface-2 ngà ấm       - màu giấy điệp, gỗ mít
 *
 * Neutral lệch về vàng chứ không xám trung tính, để nền sáng không bị lạnh.
 */

export const themeTokens = [
  "paper",
  "surface",
  "surface-2",
  "ink",
  "body",
  "muted",
  "line",
  "line-strong",
  "accent",
  "accent-hover",
  "accent-soft",
  "lacquer",
  "brass",
  "brass-soft",
  "ring",
] as const;

export type ThemeToken = (typeof themeTokens)[number];
export type Palette = Record<ThemeToken, string>;

/**
 * Nền xám vàng, chữ nâu đậm, nhấn vàng nâu.
 *
 * `paper` (nền trang) cố tình KHÔNG trắng: tông xám ngả vàng của giấy dó dịu
 * mắt hơn và — quan trọng hơn — tạo chênh lệch với `surface`, nhờ vậy các thẻ
 * nội dung nổi hẳn lên thay vì chìm vào nền như hồi cả hai cùng trắng. Bóng đổ
 * (`--card-shadow` trong app/globals.css) làm nốt phần còn lại.
 */
export const lightPalette: Palette = {
  paper: "#eeeade",
  surface: "#fffdf8",
  "surface-2": "#f6f0e0",
  ink: "#241a0e",
  body: "#453620",
  // Đậm hơn mã cũ #7a6746 một bậc: trên nền xám vàng #eeeade mã đó chỉ còn
  // tương phản 4.48:1, trượt dưới ngưỡng 4.5:1 của WCAG AA cho chữ nhỏ.
  muted: "#6f5c3d",
  line: "#e2d8c0",
  "line-strong": "#cdbb92",
  accent: "#8a5a14",
  "accent-hover": "#6d460d",
  "accent-soft": "#fbf1d9",
  lacquer: "#a6402f",
  brass: "#a17b12",
  "brass-soft": "#fdf5de",
  ring: "#8a5a14",
};

/**
 * Bản tối: nền nâu đen ám vàng chứ không phải xám trung tính, để hai chế độ
 * cùng một gia đình màu. Nhấn sáng lên vì vàng nâu đậm không đọc được trên nền tối.
 */
export const darkPalette: Palette = {
  paper: "#15110a",
  surface: "#1c1710",
  "surface-2": "#251e14",
  ink: "#f4ecd9",
  body: "#d3c6a9",
  muted: "#9d8f73",
  line: "#332a1b",
  "line-strong": "#4c3e28",
  accent: "#e0b45c",
  "accent-hover": "#eec983",
  "accent-soft": "#2c2314",
  lacquer: "#e59480",
  brass: "#e0b45c",
  "brass-soft": "#2c2314",
  ring: "#e0b45c",
};

/**
 * Chỉ nhận mã hex 3/6/8 ký tự.
 *
 * Giá trị này đi thẳng vào một khối <style>, nên một chuỗi tuỳ ý từ CSDL là
 * đường tiêm CSS: `red; } body { display: none` sẽ phá cả trang. Cấm từ gốc
 * bằng cách chỉ chấp nhận đúng dạng hex.
 */
const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX.test(value.trim());
}

/**
 * Trộn màu quản trị viên đặt vào bảng mặc định.
 * Bỏ qua khoá lạ và giá trị không phải hex — không bao giờ ném lỗi, vì một ô
 * màu gõ sai trong trang quản trị không đáng để cả site trắng xoá.
 */
export function mergePalette(
  base: Palette,
  overrides: Record<string, unknown> | null | undefined,
): Palette {
  if (!overrides) return base;

  const ketQua = { ...base };
  for (const token of themeTokens) {
    const value = overrides[token];
    if (isHexColor(value)) ketQua[token] = value.trim();
  }

  return ketQua;
}

/** Bảng màu -> danh sách khai báo CSS custom property. */
function toCssVars(palette: Palette): string {
  return themeTokens.map((token) => `--${token}:${palette[token]}`).join(";");
}

/**
 * Dựng khối CSS đầy đủ cho cả ba trạng thái giao diện của người xem:
 * chọn sáng, chọn tối, và "theo hệ thống" (không có class nào trên <html>).
 *
 * next-themes gắn class .light / .dark sau khi script chạy; khối @media lo
 * khoảng thời gian trước đó và trường hợp người dùng chặn JavaScript.
 */
export function buildThemeCss(light: Palette, dark: Palette): string {
  return [
    `:root{${toCssVars(light)}}`,
    `@media (prefers-color-scheme:dark){:root:not(.light){${toCssVars(dark)}}}`,
    `.dark{${toCssVars(dark)}}`,
  ].join("");
}
