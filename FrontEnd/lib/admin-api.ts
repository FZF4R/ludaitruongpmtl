/**
 * Tầng gọi API cho khu quản trị — CHẠY TRÊN TRÌNH DUYỆT.
 *
 * Dùng lại `goiApi` của lib/auth.ts nên token, header ngôn ngữ và cách nhận
 * biết lỗi giống hệt phần tài khoản.
 *
 * Backend chặn ở `config/permissions.js`; những gì viết ở đây chỉ để giao diện
 * đừng bày ra nút mà bấm vào sẽ nhận 403. Đừng coi các phép kiểm tra vai trò
 * phía trình duyệt là hàng rào bảo mật — chúng chạy trên máy người dùng.
 */
import { goiApi } from "@/lib/auth";
import type { Locale } from "@/lib/i18n";

/* ------------------------------------------------------------------ */
/* Vai trò                                                             */
/* ------------------------------------------------------------------ */

/** Khớp `ROLES` trong Backend/config/roles.js, xếp từ thấp lên cao. */
export const vaiTro = ["User", "Partner", "Moderator", "Manager", "Admin"] as const;
export type VaiTro = (typeof vaiTro)[number];

/** Nhãn tiếng Việt, khớp `LABELS` trong Backend/config/roles.js. */
export const nhanVaiTro: Record<string, string> = {
  User: "Người dùng",
  Partner: "Cộng tác viên",
  Moderator: "Kiểm duyệt viên",
  Manager: "Quản trị viên",
  Admin: "Quản lý",
};

/*
 * Ẩn/hiện theo QUYỀN chứ không theo tên vai trò: quyền của từng vai trò chỉnh
 * được ở /admin/roles, nên "Quản trị viên thấy tab Bài viết" không còn là điều
 * cố định. Hồ sơ (/v1/user/profile) trả sẵn danh sách quyền đang dùng.
 */

/** Các tab khu quản trị và quyền cần để thấy từng tab, theo thứ tự hiện. */
export const tabQuanTri = [
  { href: "/admin/dashboard", nhan: "Tổng quan", quyen: "system.settings" },
  { href: "/admin/user", nhan: "Người dùng", quyen: "user.list" },
  { href: "/admin/blog", nhan: "Bài viết", quyen: "content.editAny" },
  { href: "/admin/library", nhan: "Kinh sách", quyen: "content.editAny" },
  { href: "/admin/roles", nhan: "Phân quyền", quyen: "role.permissions.manage" },
] as const;

export function coQuyen(permissions: string[] | undefined, quyen: string): boolean {
  return !!permissions?.includes(quyen);
}

/** Tab đầu tiên người này mở được, hoặc null nếu không vào được khu quản trị. */
export function tabQuanTriDau(permissions: string[] | undefined): string | null {
  return tabQuanTri.find((tab) => coQuyen(permissions, tab.quyen))?.href ?? null;
}

/* ------------------------------------------------------------------ */
/* Phân quyền                                                          */
/* ------------------------------------------------------------------ */

export type VaiTroPhanQuyen = {
  key: string;
  label: string;
  rank: number;
  /** Vai trò luôn đủ quyền, không sửa được (Quản lý). */
  locked: boolean;
  /** Người đang xem có được sửa vai trò này không — backend tính theo bậc. */
  editable: boolean;
  /** Đã chỉnh khác mặc định. */
  custom: boolean;
  updatedAt: number;
  updatedBy: string;
};

export type MucQuyen = {
  key: string;
  group: string;
  label: string;
  /** Endpoint dùng quyền này; rỗng = quyền chưa gắn vào chức năng nào. */
  endpoints: string[];
};

export type NhatKyQuyen = {
  id: string;
  role: string;
  added: string[];
  removed: string[];
  reset: boolean;
  actorUsername: string;
  reason: string;
  createdAt: number;
};

export type BangPhanQuyen = {
  roles: VaiTroPhanQuyen[];
  catalog: MucQuyen[];
  grants: Record<string, string[]>;
  defaults: Record<string, string[]>;
  actorPermissions: string[];
  log: NhatKyQuyen[];
};

export function layPhanQuyen(locale: Locale) {
  return goiApi<BangPhanQuyen>("/v1/admin/roles/permissions", { locale });
}

export function luuPhanQuyen(
  than: { role: string; permissions: string[]; reason?: string },
  locale: Locale,
) {
  return goiApi<BangPhanQuyen>("/v1/admin/roles/permissions/update", {
    method: "POST",
    body: than,
    locale,
  });
}

export function khoiPhucPhanQuyen(than: { role: string; reason?: string }, locale: Locale) {
  return goiApi<BangPhanQuyen>("/v1/admin/roles/permissions/reset", {
    method: "POST",
    body: than,
    locale,
  });
}

/* ------------------------------------------------------------------ */
/* Cấu hình hiển thị (dashboard)                                       */
/* ------------------------------------------------------------------ */

export type CauHinh = {
  id: string;
  title: string | null;
  /** Dải thông báo đầu trang chủ. Backend luôn trả về dạng mảng cho trang này. */
  notify: string[];
  warning: string | null;
  note: string | null;
  supportphonenumber: string | null;
  pagefacebookinfo: string | null;
  supportfacebook: string | null;
  supporttelegram: string | null;
  isMaintaning: boolean | null;
  langLib: unknown;
  theme: Record<string, string> | null;
  themeDark: Record<string, string> | null;
};

export function layCauHinh(locale: Locale) {
  return goiApi<CauHinh>("/v1/admin/settings", { locale });
}

/** Sửa các trường chung. Gửi trường nào thì trường đó được ghi đè. */
export function luuCauHinh(phan: Record<string, unknown>, locale: Locale) {
  return goiApi<unknown>("/v1/admin/settings/update", {
    method: "POST",
    body: phan,
    locale,
  });
}

export function themThongBao(text: string, locale: Locale) {
  return goiApi<{ notify: string[] }>("/v1/admin/settings/notify/add", {
    method: "POST",
    body: { text },
    locale,
  });
}

export function suaThongBao(index: number, text: string, locale: Locale) {
  return goiApi<{ notify: string[] }>("/v1/admin/settings/notify/update", {
    method: "POST",
    body: { index, text },
    locale,
  });
}

export function xoaThongBao(index: number, locale: Locale) {
  return goiApi<{ notify: string[] }>("/v1/admin/settings/notify/delete", {
    method: "POST",
    body: { index },
    locale,
  });
}

/* ------------------------------------------------------------------ */
/* Người dùng                                                          */
/* ------------------------------------------------------------------ */

export type NguoiDungTomTat = {
  _id?: string;
  id?: string;
  username?: string;
  email?: string;
  fullName?: string;
  role?: string;
  status?: number;
  createdAt?: number;
};

/** `getListDataNative` trả về hình dạng này chứ không phải { data, total, page }. */
export type BangDuLieu<T> = {
  Page: number;
  total: number;
  TotalInList: number;
  data: T[];
};

export type HoSoNguoiDung = {
  fullName: string;
  dharmaName: string;
  nickname: string;
  hometown: { province?: string; detail?: string };
  survey: Record<string, unknown>;
  completedAt: number;
};

export type NguoiDungChiTiet = {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phone: string;
  address: string;
  gender: string;
  role: string;
  status: number;
  is2FAEnabled: boolean;
  profileCompleted: boolean;
  googleId: string;
  facebookId: string;
  createdAt: number;
  updatedAt: number;
  profile: HoSoNguoiDung | null;
  /** Những vai trò người đang thao tác được phép gán, do backend tính. */
  assignableRoles: string[];
};

export function layDanhSachNguoiDung(
  { search, page = 1, limit = 20 }: { search?: string; page?: number; limit?: number },
  locale: Locale,
) {
  return goiApi<BangDuLieu<NguoiDungTomTat>>("/v1/admin/user/list", {
    query: { search, page, limit },
    locale,
  });
}

export function layNguoiDung(id: string, locale: Locale) {
  return goiApi<NguoiDungChiTiet>("/v1/admin/user/detail", { query: { id }, locale });
}

export function luuNguoiDung(
  than: { id: string; email?: string; fullName?: string; role?: string; reason?: string },
  locale: Locale,
) {
  return goiApi<{ id: string; changed: string[] }>("/v1/admin/user/update", {
    method: "POST",
    body: than,
    locale,
  });
}

/* ------------------------------------------------------------------ */
/* Nội dung (bài viết + kinh sách, chung một bảng)                     */
/* ------------------------------------------------------------------ */

export const loaiNoiDung = ["article", "blog", "sutra", "audio", "video"] as const;
export type LoaiNoiDung = (typeof loaiNoiDung)[number];

export const nhanLoai: Record<string, string> = {
  article: "Bài viết",
  blog: "Tuỳ bút",
  sutra: "Kinh sách",
  audio: "Bài giảng audio",
  video: "Bài giảng video",
};

export const trangThai = ["draft", "pending", "published", "archived"] as const;
export type TrangThai = (typeof trangThai)[number];

export const nhanTrangThai: Record<TrangThai, string> = {
  draft: "Nháp",
  pending: "Chờ duyệt",
  published: "Đã đăng",
  archived: "Lưu trữ",
};

export type Chuong = {
  order?: number;
  title: string;
  slug: string;
  bodyHtml?: string;
};

export type BaiTomTat = {
  id: string;
  type: LoaiNoiDung;
  slug: string;
  title: string;
  summary: string;
  coverUrl: string;
  status: TrangThai;
  authorId: string;
  author: { name?: string; title?: string };
  categories: { slug: string; name: string }[];
  tags: string[];
  publishedAt: string;
  chapterCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
};

export type BaiChiTiet = Omit<BaiTomTat, "chapterCount"> & {
  bodyHtml: string;
  chapters: Chuong[];
  media: Record<string, unknown>;
  source: { name?: string; url?: string };
  seo: Record<string, unknown>;
  readingMinutes: number;
};

export type DanhSachBai = {
  data: BaiTomTat[];
  total: number;
  page: number;
  limit: number;
  /** Số bài theo từng trạng thái, đã lọc theo `type` — để hiện số trên tab. */
  stats: Record<TrangThai, number>;
};

export function layDanhSachBai(
  {
    type,
    status,
    q,
    page = 1,
    limit = 20,
  }: { type?: string; status?: string; q?: string; page?: number; limit?: number },
  locale: Locale,
) {
  return goiApi<DanhSachBai>("/v1/admin/content/list", {
    query: { type, status, q, page, limit },
    locale,
  });
}

export function layBai(id: string, locale: Locale) {
  return goiApi<BaiChiTiet>("/v1/admin/content/detail", { query: { id }, locale });
}

export type BaiGui = {
  type: string;
  slug?: string;
  title: string;
  summary?: string;
  coverUrl?: string;
  bodyHtml?: string;
  chapters?: Chuong[];
  author?: { name?: string; title?: string };
  source?: { name?: string; url?: string };
  categories?: { slug: string; name: string }[];
  tags?: string[];
  publishedAt?: string;
};

export function taoBai(than: BaiGui, locale: Locale) {
  return goiApi<BaiChiTiet>("/v1/admin/content/create", {
    method: "POST",
    body: than,
    locale,
  });
}

export function luuBai(than: BaiGui & { id: string }, locale: Locale) {
  return goiApi<BaiChiTiet>("/v1/admin/content/update", {
    method: "POST",
    body: than,
    locale,
  });
}

export function doiTrangThai(id: string, status: TrangThai, locale: Locale) {
  return goiApi<BaiTomTat>("/v1/admin/content/status", {
    method: "POST",
    body: { id, status },
    locale,
  });
}

export function xoaBai(id: string, locale: Locale) {
  return goiApi<{ id: string; slug: string }>("/v1/admin/content/delete", {
    method: "POST",
    body: { id },
    locale,
  });
}

export type ChuyenMuc = { id: string; slug: string; name: string; kind: string };

export function layChuyenMuc(locale: Locale) {
  return goiApi<ChuyenMuc[]>("/v1/admin/content/categories", { locale });
}
