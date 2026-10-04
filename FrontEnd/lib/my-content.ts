/**
 * Bài viết của tôi, tải tệp, công đức, thống kê cá nhân — CHẠY TRÊN TRÌNH DUYỆT.
 */
import { goiApi, urlApi } from "@/lib/auth";
import type { Locale } from "@/lib/i18n";

export type TrangThaiBai = "draft" | "pending" | "published" | "archived";
export type LoaiBaiCuaToi = "article" | "library";

export type BaiCuaToi = {
  id: string;
  type: LoaiBaiCuaToi;
  slug: string;
  title: string;
  summary: string;
  coverUrl: string;
  status: TrangThaiBai;
  libraryKind: string;
  tags: string[];
  categories: { slug: string; name: string }[];
  viewCount: number;
  /** Lý do lần trả bài gần nhất. */
  reviewNote: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  hasProposal: boolean;
  /** Lần duyệt đăng gần nhất (ISO, rỗng nếu chưa) và người duyệt. */
  approvedAt: string;
  approvedByName: string;
};

export type ThayDoi = { field: string; before: unknown; after: unknown };

export type BaiCuaToiChiTiet = BaiCuaToi & {
  bodyHtml: string;
  gallery: { url: string; caption: string }[];
  media: { url?: string };
  proposal: { byName: string; at: string; note: string; changes: ThayDoi[] } | null;
};

export type DanhSachCuaToi = {
  data: BaiCuaToi[];
  total: number;
  page: number;
  limit: number;
  stats: Record<TrangThaiBai, number>;
  can: { article: boolean; library: boolean; publishArticle: boolean; publishLibrary: boolean };
};

export function layBaiCuaToi(q: { status?: string; page?: number }, locale: Locale) {
  return goiApi<DanhSachCuaToi>("/v1/user/content/mine", { query: { status: q.status, page: q.page ?? 1, limit: 20 }, locale });
}

export function layChiTietBaiCuaToi(id: string, locale: Locale) {
  return goiApi<BaiCuaToiChiTiet>("/v1/user/content/detail", { query: { id }, locale });
}

export type BaiCuaToiGui = {
  id?: string;
  type?: LoaiBaiCuaToi;
  title?: string;
  summary?: string;
  coverUrl?: string;
  bodyHtml?: string;
  tags?: string[];
  category?: string;
  libraryKind?: string;
  gallery?: { url: string; caption: string }[];
  media?: { url: string };
  /** Lưu xong gửi duyệt (hoặc đăng thẳng nếu có quyền). */
  submit?: boolean;
};

export function luuBaiCuaToi(than: BaiCuaToiGui, locale: Locale) {
  return goiApi<BaiCuaToiChiTiet>("/v1/user/content/save", { method: "POST", body: than, locale });
}

export function xoaBaiCuaToi(id: string, locale: Locale) {
  return goiApi<{ id: string }>("/v1/user/content/delete", { method: "POST", body: { id }, locale });
}

export function dongYDeXuat(id: string, locale: Locale) {
  return goiApi<BaiCuaToiChiTiet>("/v1/user/content/proposal/accept", { method: "POST", body: { id }, locale });
}

export function tuChoiDeXuat(id: string, reason: string, locale: Locale) {
  return goiApi<BaiCuaToiChiTiet>("/v1/user/content/proposal/reject", { method: "POST", body: { id, reason }, locale });
}

/**
 * Tải một tệp (ảnh ≤ 4 MB, âm thanh ≤ 10 MB). Trả URL ĐẦY ĐỦ (kèm host API) để
 * lưu thẳng vào bài: ảnh bìa, album, thẻ <img> trong thân bài đều hiện được ở
 * mọi trang mà không phải ghép host lúc hiển thị.
 */
export async function taiTep(tep: File, locale: Locale) {
  const file = await new Promise<string>((ok, hong) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result));
    r.onerror = () => hong(r.error);
    r.readAsDataURL(tep);
  });
  const kq = await goiApi<{ id: string; kind: "image" | "audio"; url: string; sizeBytes: number }>("/v1/user/media/upload", {
    method: "POST",
    body: { file, name: tep.name },
    locale,
  });
  return { ...kq, url: urlApi(kq.url) };
}

/* ------------------------------------------------------------------ */
/* Công đức + thống kê                                                 */
/* ------------------------------------------------------------------ */

export type QuyTacCongDuc = { label: string; points: number; dailyCap: number; enabled: boolean };

export type ThongKeCaNhan = {
  merit: {
    total: number;
    today: number;
    byAction: Record<string, { points: number; times: number }>;
    rules: Record<string, QuyTacCongDuc>;
    recent: { action: string; points: number; createdAt: string }[];
  };
  checkin: { streak: number; today: boolean; days: number };
  practice: Record<string, { amount: number; sessions: number }>;
  content: {
    article: Record<TrangThaiBai, number>;
    library: Record<TrangThaiBai, number>;
    views: number;
  };
  comments: { total: number; deleted: number };
  prayers: number;
  joinedAt: string;
};

export function layThongKeCaNhan(locale: Locale) {
  return goiApi<ThongKeCaNhan>("/v1/user/stats", { locale });
}

export function diemDanh(locale: Locale) {
  return goiApi<{
    points: number;
    streak: number;
    today: boolean;
    days: number;
    /** Lời nhắn an lành (khi vừa được cộng điểm). */
    message: string;
    /** true = tài khoản Admin: luôn được cộng để kiểm thử. */
    test: boolean;
  }>("/v1/user/checkin", {
    method: "POST",
    locale,
  });
}

export type ThongTinUngHo = {
  title: string;
  description: string;
  accountName: string;
  accountNumber: string;
  bank: string;
  link: string;
  qrUrl: string;
};

export function layUngHo(locale: Locale) {
  return goiApi<ThongTinUngHo>("/v1/public/donate", { locale });
}

/** Công đức và tu tập theo ngày (lịch trang Quá trình tu tập). `from`, `to`: YYYY-MM-DD. */
export type NgayCongDuc = {
  day: string;
  points: number;
  merit: { action: string; points: number; times: number }[];
  practice: { type: string; amount: number; sessions: number }[];
};

export function layCongDucTheoNgay(from: string, to: string, locale: Locale) {
  return goiApi<NgayCongDuc[]>("/v1/user/merit/days", { query: { from, to }, locale });
}
