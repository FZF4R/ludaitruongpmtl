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
import { localeApiCodes, localePath, splitLocale, type Locale } from "@/lib/i18n";
import type { KhaoSat, QueQuan } from "@/lib/survey";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:1337";

/** Xuất ra để InlineEditProvider nghe sự kiện "storage" (đăng nhập / xuất ở tab khác). */
export const KHOA_TOKEN = "sv_access_token";

/**
 * Đường dẫn tương đối backend trả về (avatar, ảnh...) -> URL tuyệt đối trên
 * API. Chuỗi rỗng giữ nguyên rỗng để nơi gọi biết là "không có".
 */
export function urlApi(duongDan: string | undefined | null): string {
  return duongDan ? new URL(duongDan, API_URL).toString() : "";
}

export type NhaCungCap = "google" | "facebook";

/** Hình dạng dinhDangHoSo() của Backend trả về. */
export type HoSo = {
  id: string;
  /** Đường dẫn avatar trên API (rỗng nếu chưa tải). */
  avatarUrl: string;
  isNewUser: boolean;
  profileCompleted: boolean;
  /** Tài khoản tự đăng ký bằng mật khẩu + số điện thoại, chưa được xác minh. */
  isNotVerified?: boolean;
  username: string;
  email: string;
  role: string;
  /** Quyền đang dùng của vai trò — chỉnh được ở /admin/roles. */
  permissions: string[];
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

export type TuyChonGoi = {
  method?: "GET" | "POST";
  body?: unknown;
  locale?: Locale;
  /** Tham số querystring; khoá có giá trị undefined hoặc rỗng bị bỏ qua. */
  query?: Record<string, string | number | undefined>;
};

/**
 * Gọi một endpoint của Sails kèm access token.
 *
 * Xuất ra ngoài để lib/admin-api.ts dùng lại: nếu tệp đó tự viết fetch riêng
 * thì cách nhận biết lỗi (xem `data` có hay không, chứ không xem mã trạng
 * thái) sẽ tồn tại ở hai nơi, và chỉ một trong hai được sửa khi backend đổi.
 */
export async function goiApi<T>(
  endpoint: string,
  { method = "GET", body, locale, query }: TuyChonGoi = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (locale) headers["x-language"] = localeApiCodes[locale];

  const token = docToken();
  // userPolices đọc nguyên chuỗi trong header, KHÔNG cắt tiền tố "Bearer ".
  if (token) headers.Authorization = token;

  const url = new URL(endpoint, API_URL);
  for (const [khoa, giaTri] of Object.entries(query ?? {})) {
    if (giaTri !== undefined && giaTri !== "") url.searchParams.set(khoa, String(giaTri));
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      // Dữ liệu riêng của từng người: trình duyệt cache theo URL chứ không theo
      // header Authorization, nên hồ sơ cũ có thể bị dùng lại sau khi đổi tài khoản.
      cache: "no-store",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new LoiApi("", 0);
  }

  // 423 = tài khoản bị khoá do vi phạm (backend: responseType.accountBanned,
  // userPolices). Xử lý ở MỘT chỗ này: mọi lời gọi - đăng nhập, gọi bằng token
  // cũ của phiên đang mở - đều đăng xuất rồi chuyển sang trang thông báo khoá.
  if (res.status === 423 && typeof window !== "undefined") {
    dangXuat();
    const dangO = splitLocale(window.location.pathname).locale;
    window.location.assign(localePath(dangO, "/tai-khoan-bi-khoa"));
    throw new LoiApi("", 423);
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
  // 401 chỉ do policy userPolices trả khi token thiếu / sai / hết hạn (thiếu
  // quyền là 403), nên token này đã chết: xoá để mọi nơi thấy "chưa đăng nhập"
  // ngay, thay vì giữ một token hỏng tới khi người dùng tự đăng xuất.
  if (res.status === 401 && token) dangXuat();

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

type PhanHoiDangNhap = { accessToken?: string; isNewUser?: boolean; is2FAEnabled?: boolean };

/** Lưu token từ phản hồi login / register; dùng chung cho hai luồng mật khẩu. */
function nhanPhien(data: PhanHoiDangNhap): KetQuaDangNhap {
  if (!data.accessToken) {
    if (data.is2FAEnabled) return { trangThai: "can2FA" };
    throw new LoiApi("", 200);
  }
  luuToken(data.accessToken);
  return { trangThai: "xong", isNewUser: !!data.isNewUser };
}

/** Đăng nhập bằng tên đăng nhập + mật khẩu. */
export async function dangNhapMatKhau(username: string, password: string, locale: Locale): Promise<KetQuaDangNhap> {
  const data = await goiApi<PhanHoiDangNhap>("/v1/user/login", {
    method: "POST",
    body: { username: username.trim(), password },
    locale,
  });
  return nhanPhien(data);
}

/**
 * Đăng ký tài khoản (tên đăng nhập + mật khẩu + số điện thoại). Backend đánh
 * dấu `isNotVerified` và đăng nhập luôn, trả `isNewUser` để chuyển sang form hồ sơ.
 */
export async function dangKy(
  { username, password, phone }: { username: string; password: string; phone: string },
  locale: Locale,
): Promise<KetQuaDangNhap> {
  const data = await goiApi<PhanHoiDangNhap>("/v1/user/register", {
    method: "POST",
    body: { username: username.trim(), password, phone: phone.trim() },
    locale,
  });
  return nhanPhien(data);
}

/**
 * Kiểm số điện thoại ngay trên form, cùng luật với Backend/api/utils/soDienThoai.js:
 * di động Việt Nam (0/84/+84 + đầu 3/5/7/8/9) hoặc số quốc tế +mã nước, 8-15 chữ số.
 * Backend vẫn kiểm lại - đây chỉ để báo lỗi sớm.
 */
export function soDienThoaiHopLe(vao: string): boolean {
  let so = vao.trim().replace(/[\s.\-()]/g, "");
  if (so.startsWith("+84")) so = `0${so.slice(3)}`;
  else if (/^84[35789]\d{8}$/.test(so)) so = `0${so.slice(2)}`;
  return /^0[35789]\d{8}$/.test(so) || /^\+[1-9]\d{7,14}$/.test(so);
}

/* ------------------------------------------------------------------ */
/* Hồ sơ                                                               */
/* ------------------------------------------------------------------ */

/** Tải avatar mới (data URL ảnh đã thu nhỏ). Trả về đường dẫn avatar mới, có phiên bản. */
export function taiAvatar(dataUrl: string, locale: Locale) {
  return goiApi<{ avatarUrl: string }>("/v1/user/avatar", {
    method: "POST",
    body: { avatar: dataUrl },
    locale,
  });
}

/** Chờ giữa các lần thử lại khi không gọi được máy chủ (giây) - tổng khoảng 30 giây. */
const THU_LAI_HO_SO = [1, 2, 3, 5, 8, 10];

/**
 * Hồ sơ người đang đăng nhập.
 *
 * Lỗi mạng (máy chủ đang khởi động lại, mất mạng thoáng qua) hoặc 5xx thì THỬ
 * LẠI chứ không coi là chưa đăng nhập: token vẫn còn hạn, chỉ là chưa hỏi
 * được. Trước đây mỗi lần Backend reload là header, trang Tu tập... đều tưởng
 * người dùng đã đăng xuất. 401 (token chết) thì dừng ngay - goiApi đã xoá token.
 */
export async function layHoSo(locale: Locale): Promise<HoSo> {
  for (let lan = 0; ; lan++) {
    try {
      return await goiApi<HoSo>("/v1/user/profile", { locale });
    } catch (err) {
      const tamThoi = err instanceof LoiApi && (err.status === 0 || err.status >= 500);
      if (!tamThoi || lan >= THU_LAI_HO_SO.length || !docToken()) throw err;
      await new Promise((xong) => setTimeout(xong, THU_LAI_HO_SO[lan] * 1000));
    }
  }
}

export function luuHoSo(hoSo: HoSoGui, locale: Locale): Promise<HoSo> {
  return goiApi<HoSo>("/v1/user/profile", { method: "POST", body: hoSo, locale });
}
