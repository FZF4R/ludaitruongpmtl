/**
 * Tầng gọi API cho phần tài khoản — CHẠY TRÊN TRÌNH DUYỆT.
 *
 * Khác hẳn lib/api.ts: tệp đó chạy trên server, đọc nội dung công khai và
 * dùng cache của Next. Ở đây là dữ liệu riêng của từng người, gắn với access
 * token, nên không có gì được cache và mọi lời gọi đều xuất phát từ trình duyệt.
 *
 * Vì sao token nằm ở localStorage chứ không phải cookie: backend Sails đặt
 * cookie `accessToken` với `secure: true; sameSite: strict`, mà API lại ở khác
 * origin với trang (cổng 1337 so với 3000, và khác tên miền lúc chạy thật) —
 * cookie đó không bao giờ được gửi kèm. Policy `userPolices` của backend đọc
 * thẳng header `Authorization`, nên đằng nào cũng phải tự gắn.
 *
 * Đánh đổi: token ở localStorage thì một lỗ XSS là đọc được. Chấp nhận được ở
 * đây vì phần đăng nhập chỉ mở khoá hồ sơ cá nhân và tiến độ đọc; nếu sau này
 * có thao tác nhạy cảm hơn thì phải chuyển sang cookie HttpOnly do một route
 * handler của Next đặt.
 */
import { localeApiCodes, type Locale } from "@/lib/i18n";
import type { KhaoSat, QueQuan } from "@/lib/survey";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:1337";

const KHOA_TOKEN = "sv_access_token";

export type NhaCungCap = "google" | "facebook";

/** Hình dạng dinhDangHoSo() của Backend trả về. */
export type HoSo = {
  isNewUser: boolean;
  profileCompleted: boolean;
  username: string;
  email: string;
  role: string;
  fullName: string;
  dharmaName: string;
  nickname: string;
  hometown: QueQuan;
  survey: KhaoSat;
};

export type HoSoGui = {
  fullName: string;
  dharmaName: string;
  nickname: string;
  hometown: QueQuan;
  survey: KhaoSat;
};

/**
 * Lỗi có sẵn câu chữ đã dịch từ backend.
 *
 * `thongDiep` là chuỗi lấy từ `message.text` — backend đã chọn ngôn ngữ theo
 * header x-language. Rỗng nghĩa là lỗi mạng hoặc phản hồi lạ, lúc đó màn hình
 * gọi tự thay bằng câu chung của mình.
 */
export class LoiApi extends Error {
  constructor(
    public thongDiep: string,
    public status: number,
  ) {
    super(thongDiep || `API ${status}`);
    this.name = "LoiApi";
  }
}

/* ------------------------------------------------------------------ */
/* Token                                                               */
/* ------------------------------------------------------------------ */

/*
 * Bọc try/catch quanh localStorage: trình duyệt ở chế độ ẩn danh hoặc bị chặn
 * cookie sẽ NÉM khi truy cập, chứ không phải trả null. Không bọc thì cả trang
 * trắng chỉ vì người dùng bật một tuỳ chọn riêng tư.
 */

export function docToken(): string | null {
  try {
    return window.localStorage.getItem(KHOA_TOKEN);
  } catch {
    return null;
  }
}

export function luuToken(token: string): void {
  try {
    window.localStorage.setItem(KHOA_TOKEN, token);
  } catch {
    // Không lưu được thì phiên chỉ sống trong tab này — vẫn hơn là hỏng trang.
  }
}

export function dangXuat(): void {
  try {
    window.localStorage.removeItem(KHOA_TOKEN);
  } catch {
    // Không có gì để dọn.
  }
}

/* ------------------------------------------------------------------ */
/* Gọi API                                                             */
/* ------------------------------------------------------------------ */

type TuyChon = {
  method?: "GET" | "POST";
  body?: unknown;
  locale?: Locale;
};

async function goiApi<T>(endpoint: string, { method = "GET", body, locale }: TuyChon = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (locale) headers["x-language"] = localeApiCodes[locale];

  const token = docToken();
  // userPolices đọc nguyên chuỗi trong header, KHÔNG cắt tiền tố "Bearer ".
  if (token) headers.Authorization = token;

  let res: Response;
  try {
    res = await fetch(new URL(endpoint, API_URL), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new LoiApi("", 0);
  }

  const noiDung = (await res.json().catch(() => null)) as {
    message?: { text?: string };
    data?: unknown;
  } | null;

  /*
   * Backend báo lỗi theo hai kiểu: 4xx qua checkErrorOutput, và 200 kèm mỗi
   * message (ví dụ profileNameRequired). Cả hai đều KHÔNG có `data`, nên đó
   * mới là dấu hiệu thành công đáng tin, chứ không phải mã trạng thái.
   */
  if (!res.ok || !noiDung || noiDung.data === undefined) {
    throw new LoiApi(noiDung?.message?.text ?? "", res.status);
  }

  return noiDung.data as T;
}

/* ------------------------------------------------------------------ */
/* Đăng nhập                                                           */
/* ------------------------------------------------------------------ */

export type KetQuaDangNhap =
  | { trangThai: "xong"; isNewUser: boolean }
  /** Tài khoản bật 2FA: cần một bước nhập mã nữa, giao diện này chưa làm. */
  | { trangThai: "can2FA" };

/**
 * Đổi access token của Google/Facebook lấy token của site.
 *
 * Gửi ACCESS token chứ không phải ID token: backend xác minh bằng
 * `oauth2.googleapis.com/tokeninfo` + `userinfo`, và bằng `debug_token` của
 * Facebook Graph — cả hai đều cần access token.
 */
export async function dangNhapMangXaHoi(
  nhaCungCap: NhaCungCap,
  accessToken: string,
  locale: Locale,
): Promise<KetQuaDangNhap> {
  const data = await goiApi<{
    accessToken?: string;
    isNewUser?: boolean;
    is2FAEnabled?: boolean;
  }>(`/v1/user/login/${nhaCungCap}`, {
    method: "POST",
    body: { accessToken },
    locale,
  });

  if (!data.accessToken) {
    if (data.is2FAEnabled) return { trangThai: "can2FA" };
    throw new LoiApi("", 200);
  }

  luuToken(data.accessToken);

  return { trangThai: "xong", isNewUser: !!data.isNewUser };
}

/* ------------------------------------------------------------------ */
/* Hồ sơ                                                               */
/* ------------------------------------------------------------------ */

export function layHoSo(locale: Locale): Promise<HoSo> {
  return goiApi<HoSo>("/v1/user/profile", { locale });
}

export function luuHoSo(hoSo: HoSoGui, locale: Locale): Promise<HoSo> {
  return goiApi<HoSo>("/v1/user/profile", { method: "POST", body: hoSo, locale });
}
