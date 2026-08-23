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
 * Tông: vàng nâu (hổ phách, gỗ mít, tượng thếp vàng) trên nền trắng.
 * Neutral lệch nhẹ về vàng để không bị "xám máy tính".
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

/** Nền trắng, chữ nâu đậm, nhấn vàng nâu. */
export const lightPalette: Palette = {
  paper: "#ffffff",
  surface: "#ffffff",
  "surface-2": "#f6f1e6",
  ink: "#1f1810",
  body: "#3f3527",
  muted: "#7b6e59",
  line: "#e7dec9",
  "line-strong": "#d2c3a3",
  accent: "#8a6414",
  "accent-hover": "#6f4f0e",
  "accent-soft": "#f7efd9",
  lacquer: "#a6402f",
  brass: "#8a6414",
  "brass-soft": "#f7efd9",
  ring: "#8a6414",
};

/**
 * Bản tối: nền nâu đen ám vàng chứ không phải xám trung tính, để hai chế độ
 * cùng một gia đình màu. Nhấn sáng lên vì vàng nâu đậm không đọc được trên nền tối.
 */
export const darkPalette: Palette = {
  paper: "#16120b",
  surface: "#1d1810",
  "surface-2": "#251e14",
  ink: "#f2ead9",
  body: "#cfc3ab",
  muted: "#998c74",
  line: "#332a1c",
  "line-strong": "#4a3d29",
  accent: "#d9ab53",
  "accent-hover": "#e8c078",
  "accent-soft": "#2b2214",
  lacquer: "#e4907e",
  brass: "#d9ab53",
  "brass-soft": "#2b2214",
  ring: "#d9ab53",
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
