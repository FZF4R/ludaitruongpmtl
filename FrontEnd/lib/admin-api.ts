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
  { href: "/admin/library", nhan: "Kinh sách", quyen: "sutra.manage" },
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
  /** Khung liên hệ trang chủ: kênh Zalo, Zalo admin, TikTok (Facebook dùng supportfacebook). */
  zalosupportinfo: string | null;
  zaloadminsupportinfo: string | null;
  supporttiktok: string | null;
  isMaintaning: boolean | null;
  articleLayout: "card" | "list" | null;
  /** Từ khoá bị cấm trong bình luận (backend lọc, không lộ ra công khai). */
  bannedWords: string[] | null;
  langLib: unknown;
  theme: Record<string, string> | null;
  themeDark: Record<string, string> | null;
};

/* ------------------------------------------------------------------ */
/* Ảnh xoay vòng trang chủ                                             */
/* ------------------------------------------------------------------ */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:1337";

export type AnhTrangChu = {
  id: string;
  /** Đường dẫn tương đối trên API; ghép với API_URL qua `urlAnh`. */
  url: string;
  width: number;
  height: number;
  alt: string;
};

export const urlAnh = (anh: AnhTrangChu) => new URL(anh.url, API_URL).toString();

/** Nhóm ảnh: `hero` = ảnh bìa xoay vòng trang chủ, `prayer` = ảnh thẻ lời nguyện. */
export type NhomAnh = "hero" | "prayer";

export function layAnhTrangChu(locale: Locale, group: NhomAnh = "hero") {
  return goiApi<AnhTrangChu[]>("/v1/public/hero-images", { query: { group }, locale });
}

export function themAnhTrangChu(
  than: { image: string; width: number; height: number; alt?: string; group?: NhomAnh },
  locale: Locale,
) {
  return goiApi<AnhTrangChu>("/v1/admin/hero-images/add", { method: "POST", body: than, locale });
}

export function xoaAnhTrangChu(id: string, locale: Locale) {
  return goiApi<{ id: string }>("/v1/admin/hero-images/delete", {
    method: "POST",
    body: { id },
    locale,
  });
}

export function sapXepAnhTrangChu(ids: string[], locale: Locale) {
  return goiApi<{ ids: string[] }>("/v1/admin/hero-images/reorder", {
    method: "POST",
    body: { ids },
    locale,
  });
}

/* ------------------------------------------------------------------ */
/* Kiểm duyệt: bình luận vi phạm, cảnh cáo, khoá tài khoản             */
/* ------------------------------------------------------------------ */

export type BinhLuanViPham = {
  id: string;
  userId: string;
  parentId: string;
  body: string;
  createdAt: string;
  author: { name: string; dharmaName: string; avatarUrl?: string };
  /** Các từ cấm đã khớp. */
  flaggedWords: string[];
  content: { slug: string; title: string };
};

export type KyLuatNguoiDung = {
  id: string;
  username: string;
  name: string;
  dharmaName: string;
  role: string;
  banned: boolean;
  bannedAt: string;
  bannedReason: string;
  warningCount: number;
  maxWarnings: number;
  /** Người đang xem có được cảnh cáo / khoá người này không (bậc cao hơn, không phải chính mình). */
  canAct: boolean;
  flaggedComments: BinhLuanViPham[];
  log: { id: string; action: "warn" | "ban" | "unban" | "delete-comment"; reason: string; commentBody: string; actorName: string; createdAt: string }[];
};

export function layBinhLuanViPham(slug: string, locale: Locale) {
  return goiApi<BinhLuanViPham[]>("/v1/admin/moderation/comments", { query: { slug }, locale });
}

export function xoaHanBinhLuan(id: string, locale: Locale) {
  return goiApi<{ id: string }>("/v1/admin/moderation/comments/delete", { method: "POST", body: { id }, locale });
}

export function layKyLuat(id: string, locale: Locale) {
  return goiApi<KyLuatNguoiDung>("/v1/admin/moderation/user", { query: { id }, locale });
}

export function canhCao(id: string, reason: string, locale: Locale) {
  return goiApi<{ warningCount: number }>("/v1/admin/moderation/warn", { method: "POST", body: { id, reason }, locale });
}

export function khoaTaiKhoan(id: string, reason: string, locale: Locale) {
  return goiApi<{ banned: boolean }>("/v1/admin/moderation/ban", { method: "POST", body: { id, reason }, locale });
}

export function moKhoaTaiKhoan(id: string, reason: string, locale: Locale) {
  return goiApi<{ banned: boolean }>("/v1/admin/moderation/unban", { method: "POST", body: { id, reason }, locale });
}

/* ------------------------------------------------------------------ */
/* Đề xuất & góp ý                                                     */
/* ------------------------------------------------------------------ */

export type GopY = {
  id: string;
  kind: "de-xuat" | "gop-y";
  name: string;
  contact: string;
  body: string;
  /** Người gửi đang đăng nhập lúc gửi. */
  loggedIn: boolean;
  userId: string;
  /** Người gửi chọn ẩn danh: chỉ quản trị thấy tên thật. */
  anonymous: boolean;
  status: "new" | "done";
  handledByName: string;
  handledAt: string;
  createdAt: string;
};

export function layGopY(
  { status, page }: { status: "" | "new" | "done"; page: number },
  locale: Locale,
) {
  return goiApi<{ data: GopY[]; total: number; unhandled: number; page: number; limit: number }>(
    "/v1/admin/feedback",
    { query: { status, page, limit: 10 }, locale },
  );
}

export function doiTrangThaiGopY(id: string, status: "new" | "done", locale: Locale) {
  return goiApi<{ id: string; status: string }>("/v1/admin/feedback/status", {
    method: "POST",
    body: { id, status },
    locale,
  });
}

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

/**
 * Tác giả của bài. `fromProfile: true` = lấy họ tên + pháp danh theo hồ sơ của
 * người đăng (authorId) và tự cập nhật khi hồ sơ đổi; backend bỏ qua tên client
 * gửi kèm. Không có cờ = tác giả gõ tay (bài dịch, bài nhập từ nguồn ngoài).
 */
export type TacGiaBai = {
  name?: string;
  title?: string;
  dharmaName?: string;
  fromProfile?: boolean;
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
  author: TacGiaBai;
  categories: { slug: string; name: string }[];
  tags: string[];
  publishedAt: string;
  chapterCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  /** Dấu vết nhanh trên bản ghi; bài tạo trước khi có tính năng này để trống. */
  audit: DauVetBai;
};

export type DauVetBai = {
  createdById: string;
  createdByName: string;
  updatedById: string;
  updatedByName: string;
  approvedById: string;
  approvedByName: string;
  /** ISO, rỗng nếu chưa từng được duyệt. */
  approvedAt: string;
};

/** Một dòng nhật ký thao tác trên bài (ContentAuditLog). */
export type NhatKyBai = {
  id: string;
  action: "create" | "update" | "status" | "delete";
  fromStatus: string;
  toStatus: string;
  changedFields: string[];
  actorId: string;
  actorName: string;
  actorUsername: string;
  ip: string;
  contentTitle: string;
  /** Lần này có lưu nội dung trước/sau để đối chiếu (tạo, sửa, xoá). */
  hasRevision: boolean;
  createdAt: string;
};

/**
 * Dịch giả kinh sách. Có `userId` = người dùng trong hệ thống (tên + pháp danh
 * backend đọc từ hồ sơ, tự đổi theo); không có = nhập tay.
 */
export type DichGia = { userId?: string; name?: string; dharmaName?: string };

/** Người dùng tìm được để chọn làm dịch giả (chỉ id, tên, pháp danh). */
export type NguoiChon = { id: string; name: string; dharmaName: string };

export function timNguoi(q: string, locale: Locale) {
  return goiApi<NguoiChon[]>("/v1/admin/content/people", { query: { q }, locale });
}

export function layLichSuBai(id: string, locale: Locale) {
  return goiApi<NhatKyBai[]>("/v1/admin/content/history", { query: { id }, locale });
}

/** Giá trị trước/sau của từng trường ở một lần thao tác (ContentRevision). */
export type ThayDoiTruong = { field: string; before: unknown; after: unknown };

export type BanSuaBai = {
  logId: string;
  contentId: string;
  action: "create" | "update" | "delete";
  changes: ThayDoiTruong[];
};

export function layBanSua(logId: string, locale: Locale) {
  return goiApi<BanSuaBai>("/v1/admin/content/revision", { query: { logId }, locale });
}

export type BaiChiTiet = Omit<BaiTomTat, "chapterCount"> & {
  bodyHtml: string;
  chapters: Chuong[];
  media: Record<string, unknown>;
  source: { name?: string; url?: string };
  translator: DichGia;
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
  author?: TacGiaBai;
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
