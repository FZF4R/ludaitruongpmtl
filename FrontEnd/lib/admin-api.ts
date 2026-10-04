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
/** `quyen` là mảng = có một trong các quyền là thấy tab. */
export const tabQuanTri: { href: string; nhan: string; quyen: string | readonly string[] }[] = [
  { href: "/admin/dashboard", nhan: "Tổng quan", quyen: "system.settings" },
  { href: "/admin/user", nhan: "Người dùng", quyen: "user.list" },
  { href: "/admin/blog", nhan: "Bài viết", quyen: ["content.editAny", "content.review"] },
  { href: "/admin/phe-duyet", nhan: "Phê duyệt", quyen: "comment.moderate" },
  { href: "/admin/library", nhan: "Kinh sách", quyen: "sutra.manage" },
  { href: "/admin/thu-vien", nhan: "Thư viện", quyen: "library.manage" },
  { href: "/admin/merit", nhan: "Công đức", quyen: "merit.manage" },
  { href: "/admin/practice", nhan: "Âm thanh tu tập", quyen: "practice.manage" },
  { href: "/admin/roles", nhan: "Phân quyền", quyen: "role.permissions.manage" },
];

export function coQuyen(permissions: string[] | undefined, quyen: string | readonly string[]): boolean {
  return typeof quyen === "string" ? !!permissions?.includes(quyen) : quyen.some((q) => !!permissions?.includes(q));
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
  /** Ảnh từng mục Tu tập: { chantingRecitation, meditation, woodenFishMala, prayers } -> URL. */
  practiceImages: Record<string, string> | null;
  /** Trang Về chúng tôi: HTML theo ngôn ngữ. */
  aboutHtml: Record<string, string> | null;
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
  log: { id: string; action: "warn" | "unwarn" | "ban" | "unban" | "delete-comment" | "approve" | "reject"; reason: string; commentBody: string; actorName: string; createdAt: string }[];
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

export function xoaThongBao(index: number | number[], locale: Locale) {
  return goiApi<{ notify: string[] }>("/v1/admin/settings/notify/delete", {
    method: "POST",
    body: Array.isArray(index) ? { indexes: index } : { index },
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

export const loaiNoiDung = ["article", "blog", "sutra", "audio", "video", "library"] as const;
export type LoaiNoiDung = (typeof loaiNoiDung)[number];

export const nhanLoai: Record<string, string> = {
  article: "Bài viết",
  blog: "Tuỳ bút",
  sutra: "Kinh sách",
  audio: "Bài giảng audio",
  video: "Bài giảng video",
  library: "Thư viện",
};

/** Danh mục thư viện (Content.libraryKind). */
export const nhanDanhMucThuVien: Record<string, string> = {
  anh: "Ảnh",
  review: "Review chùa, đền",
  "bo-tat": "Phật - Bồ Tát",
  "nhac-thien": "Nhạc thiền",
  "audio-kinh": "Audio kinh",
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
  libraryKind: string;
  gallery: { url: string; caption: string }[];
  /** Lý do lần trả bài gần nhất. */
  reviewNote: string;
  /** Đề xuất sửa đang chờ tác giả (bài do người dùng viết). */
  pendingEdit: { byName: string; at: string; note: string; changedFields: string[] } | null;
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
  /** Bài do người dùng viết: lưu sẽ thành đề xuất sửa, chờ tác giả đồng ý. */
  ownerIsUser?: boolean;
  /** Nội dung đề xuất đang chờ (nếu có) - trình soạn nạp đè lên để sửa tiếp. */
  pendingEditFields?: Record<string, unknown>;
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
  libraryKind?: string;
  gallery?: { url: string; caption: string }[];
  media?: Record<string, unknown>;
  /** Lời nhắn kèm đề xuất sửa bài của người dùng. */
  editNote?: string;
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

/** `note`: lý do khi trả bài người dùng gửi về nháp (gửi kèm thông báo cho tác giả). */
export function doiTrangThai(id: string, status: TrangThai, locale: Locale, note = "") {
  return goiApi<BaiTomTat>("/v1/admin/content/status", {
    method: "POST",
    body: { id, status, note },
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

/* ------------------------------------------------------------------ */
/* Âm thanh tu tập (/admin/practice)                                   */
/* ------------------------------------------------------------------ */

export type AmThanhQuanTri = {
  id: string;
  category: "tung-kinh" | "thien-dinh" | "go-mo" | "cau-an";
  kind: "chuong" | "mo" | "am-nen" | "tung-mau" | "huong-dan" | "hat";
  title: string;
  /** Đường dẫn phát (tương đối trên API nếu là tệp tải lên). */
  src: string;
  loop: boolean;
  source: "upload" | "url";
  url: string;
  mime: string;
  sizeBytes: number;
  active: boolean;
  order: number;
};

export function layAmThanhQuanTri(locale: Locale) {
  return goiApi<AmThanhQuanTri[]>("/v1/admin/sounds", { locale });
}

export function themAmThanh(
  than: { category: string; kind: string; title: string; file?: string; url?: string; loop?: boolean },
  locale: Locale,
) {
  return goiApi<AmThanhQuanTri>("/v1/admin/sounds/add", { method: "POST", body: than, locale });
}

export function suaAmThanh(
  than: { id: string } & Partial<Pick<AmThanhQuanTri, "category" | "kind" | "title" | "url" | "active" | "loop">>,
  locale: Locale,
) {
  return goiApi<AmThanhQuanTri>("/v1/admin/sounds/update", { method: "POST", body: than, locale });
}

export function xoaAmThanh(id: string, locale: Locale) {
  return goiApi<{ id: string }>("/v1/admin/sounds/delete", { method: "POST", body: { id }, locale });
}

export function sapXepAmThanh(ids: string[], locale: Locale) {
  return goiApi<{ ids: string[] }>("/v1/admin/sounds/reorder", { method: "POST", body: { ids }, locale });
}

/* ------------------------------------------------------------------ */
/* Công đức + ủng hộ (/admin/merit)                                    */
/* ------------------------------------------------------------------ */

export type QuyTacCongDucQT = {
  action: string;
  label: string;
  points: number;
  dailyCap: number;
  enabled: boolean;
  defaultPoints: number;
  defaultDailyCap: number;
};

export type UngHoQT = {
  title: string;
  description: string;
  accountName: string;
  accountNumber: string;
  bank: string;
  link: string;
  qrUrl: string;
};

export type CongDucQT = {
  rules: QuyTacCongDucQT[];
  donate: UngHoQT;
  top: { userId: string; name: string; role: string; points: number; avatarUrl: string }[];
};

export function layCongDucQT(locale: Locale) {
  return goiApi<CongDucQT>("/v1/admin/merit", { locale });
}

export function luuQuyTacCongDuc(rules: Record<string, { points: number; dailyCap: number; enabled: boolean }>, locale: Locale) {
  return goiApi<{ rules: QuyTacCongDucQT[] }>("/v1/admin/merit/rules", { method: "POST", body: { rules }, locale });
}

/** `qr`: data URL ảnh mới, "" = giữ ảnh cũ, "remove" = bỏ ảnh. */
export function luuUngHo(than: Omit<UngHoQT, "qrUrl"> & { qr: string }, locale: Locale) {
  return goiApi<{ donate: UngHoQT }>("/v1/admin/merit/donate", { method: "POST", body: than, locale });
}

/* ------------------------------------------------------------------ */
/* Phê duyệt: bình luận / lời nguyện chứa từ cấm (/admin/phe-duyet)    */
/* ------------------------------------------------------------------ */

export type MucChoDuyet = {
  id: string;
  type: "comment" | "prayer";
  body: string;
  forName: string;
  flaggedWords: string[];
  parentId: string;
  createdAt: string;
  author: {
    userId: string;
    name: string;
    username: string;
    role: string;
    warningCount: number;
    banned: boolean;
    avatarUrl: string;
  };
  content: { slug: string; title: string; type: string } | null;
};

export type DanhSachChoDuyet = {
  type: "comment" | "prayer";
  counts: { comment: number; prayer: number; report?: number };
  total: number;
  page: number;
  data: MucChoDuyet[];
};

export function layChoDuyet(type: "comment" | "prayer", page: number, locale: Locale) {
  return goiApi<DanhSachChoDuyet>("/v1/admin/approval", { query: { type, page }, locale });
}

export function duyetMuc(type: "comment" | "prayer", id: string, locale: Locale) {
  return goiApi<{ id: string }>("/v1/admin/approval/approve", { method: "POST", body: { type, id }, locale });
}

export function tuChoiMuc(type: "comment" | "prayer", id: string, locale: Locale) {
  return goiApi<{ id: string }>("/v1/admin/approval/reject", { method: "POST", body: { type, id }, locale });
}

/** Giảm một mức cảnh cáo (quyền moderation.manage). */
export function giamCanhCao(id: string, reason: string, locale: Locale) {
  return goiApi<{ warningCount: number }>("/v1/admin/moderation/unwarn", { method: "POST", body: { id, reason }, locale });
}

/* ------------------------------------------------------------------ */
/* Thông báo tới toàn bộ người dùng                                    */
/* ------------------------------------------------------------------ */

export type ThongBaoChung = {
  id: string;
  title: string;
  body: string;
  link: string;
  recipients: number;
  createdByName: string;
  createdAt: string;
};

export function layThongBaoChung(locale: Locale) {
  return goiApi<ThongBaoChung[]>("/v1/admin/broadcast", { locale });
}

export function guiThongBaoChung(than: { title: string; body: string; link: string }, locale: Locale) {
  return goiApi<ThongBaoChung>("/v1/admin/broadcast/send", { method: "POST", body: than, locale });
}

/* ------------------------------------------------------------------ */
/* Sự kiện theo ngày trên lịch                                         */
/* ------------------------------------------------------------------ */

export type SuKienNgayGui = { id?: string; date: string; title: string; imageUrl: string; body: string };

export function luuSuKienNgay(than: SuKienNgayGui, locale: Locale) {
  return goiApi<{ id: string; date: string; title: string; imageUrl: string; body: string }>("/v1/admin/day-events/save", {
    method: "POST",
    body: than,
    locale,
  });
}

export function xoaSuKienNgay(id: string, locale: Locale) {
  return goiApi<{ id: string }>("/v1/admin/day-events/delete", { method: "POST", body: { id }, locale });
}

/* Báo cáo bình luận (tab Phê duyệt → Báo cáo) */
export type BinhLuanBiBaoCao = {
  id: string;
  body: string;
  status: string;
  parentId: string;
  createdAt: string;
  author: MucChoDuyet["author"];
  content: { slug: string; title: string; type: string };
  reports: { reporterName: string; reason: string; createdAt: string }[];
};

export function layBaoCao(page: number, locale: Locale) {
  return goiApi<{ total: number; page: number; data: BinhLuanBiBaoCao[] }>("/v1/admin/approval/reports", {
    query: { page },
    locale,
  });
}

/** hide = ẩn bình luận (báo cáo đúng); dismiss = bỏ qua. */
export function xuLyBaoCao(id: string, action: "hide" | "dismiss", locale: Locale) {
  return goiApi<{ id: string }>("/v1/admin/approval/reports/handle", { method: "POST", body: { id, action }, locale });
}
