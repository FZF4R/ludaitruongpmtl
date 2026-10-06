"use client";

import * as React from "react";
import { ChevronDown, ChevronRight, Download, FileUp, Plus, Sparkles, Trash2, Upload, X } from "lucide-react";
import { Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { chuLoi, useLocale, useQuyen } from "@/components/admin/admin-shell";
import {
  nhanTrangThai,
  layChuyenMuc,
  nhapBai,
  phanLoaiBai,
  xuatBai,
  type BaiPhang,
  type BaiXuat,
  type ChuyenMuc,
  type TrangThai,
} from "@/lib/admin-api";
import { LoiApi } from "@/lib/auth";
import { cn } from "@/lib/utils";

/**
 * Xuất / nhập bằng tệp Excel (.xlsx, .xls, .csv) hoặc JSON, cho hai tab:
 *   - "bai"  (Bài viết): mỗi dòng Excel là một bài;
 *   - "kinh" (Kinh sách): mỗi dòng là một CHƯƠNG - các dòng cùng "Tiêu đề" gộp
 *     thành một bộ kinh theo thứ tự dòng; dòng để trống cột "Chương" là lời
 *     dẫn (nội dung chung của bộ). JSON thì ghi thẳng mảng `chapters`.
 *
 * Nhập không ghi ngay: tệp được đọc ở trình duyệt rồi mở trong một popup toàn
 * màn hình để soát - sửa, xoá, đổi danh mục, trạng thái (mặc định "Chưa
 * duyệt"), bấm "Tự phân loại" để backend gợi ý danh mục theo các bài / kinh đã
 * có. Chỉ khi bấm "Nhập" mới gửi lên, chia từng gói nhỏ; backend ghi người
 * nhập, thời điểm, mã lượt và tên tệp (POST /v1/admin/content/import).
 *
 * Cột Excel / khoá JSON khi xuất trùng với khi nhập, nên xuất ra sửa rồi nhập
 * lại được. Đọc cột theo tên (tiếng Việt / Anh, có dấu hay không), không theo vị trí.
 *
 * SheetJS chỉ tải khi thật sự xuất / nhập Excel (import động).
 */

type Kieu = "bai" | "kinh";

const GOI_TOI_DA = 20;
/** Mỗi lần gửi giữ dưới ~3 MB (máy chủ nhận tối đa 8 MB một request) - kinh nhiều chương rất nặng. */
const GOI_BYTE_TOI_DA = 3 * 1024 * 1024;
const TOI_DA_DONG = 1000;
/** Ô Excel chứa tối đa 32.767 ký tự - nội dung dài hơn sẽ bị cắt khi mở bằng Excel. */
const O_EXCEL_TOI_DA = 32767;

const NHAN_TRANG_THAI: Partial<Record<TrangThai, string>> = {
  pending: "Chưa duyệt",
  draft: "Ẩn (nháp)",
  published: "Hiện (đăng ngay)",
};

const LOI_NHAP: Record<string, string> = {
  contentForbidden: "Bạn không có quyền tạo nội dung loại này",
  contentTitleRequired: "Thiếu tiêu đề",
  importPublishForbidden: "Bạn không có quyền đăng thẳng - chọn Chưa duyệt hoặc Ẩn",
  importBodyTooLong: "Nội dung quá dài (tối đa 500.000 ký tự mỗi bài / chương)",
  sutraSourceRequired: "Kinh sách bắt buộc có Nguồn",
  sutraForbidden: "Bạn không có quyền thêm kinh sách",
  errorWhileProcess: "Lỗi máy chủ khi lưu mục này",
};

const CAU_HINH: Record<Kieu, { ten: string; tenTep: string; donVi: string }> = {
  bai: { ten: "bài viết", tenTep: "bai-viet", donVi: "bài" },
  kinh: { ten: "kinh sách", tenTep: "kinh-sach", donVi: "bộ kinh" },
};

/* ------------------------------------------------------------------ */
/* Cột Excel khi xuất                                                  */
/* ------------------------------------------------------------------ */

type Cot = [string, (b: BaiXuat, i: number) => string | number];

/**
 * Bài viết - mẫu của ban biên tập: STT, Tiêu đề, Nội dung, Chuyên mục, Link
 * Ảnh, Hastag, Tác giả, Nguồn, Link nguồn - rồi tới các cột phụ. Tên cột nằm
 * trong BIET_DANH nên tệp xuất ra nhập lại được ngay. Cột STT bỏ qua khi nhập.
 * Không có cột Loại thì mặc định "Bài viết".
 */
const COT_BAI: Cot[] = [
  ["STT", (_b, i) => i + 1],
  ["Tiêu đề", (b) => b.title],
  ["Nội dung", (b) => b.bodyHtml],
  ["Chuyên mục", (b) => b.categoryName || b.category],
  ["Link Ảnh", (b) => b.coverUrl],
  ["Hastag", (b) => b.tags.join(", ")],
  ["Tác giả", (b) => b.author],
  ["Nguồn", (b) => b.sourceName],
  ["Link nguồn", (b) => b.sourceUrl],
  ["Loại", (b) => (b.type === "blog" ? "Tuỳ bút" : "Bài viết")],
  ["Trạng thái", (b) => nhanTrangThai[b.status] ?? b.status],
  ["Tóm tắt", (b) => b.summary],
  ["Danh xưng tác giả", (b) => b.authorTitle],
  ["Đường dẫn", (b) => b.slug],
  ["Ngày đăng", (b) => b.publishedAt],
  ["Lượt xem", (b) => b.viewCount],
  ["Ngày tạo", (b) => b.createdAt],
  ["Người tạo", (b) => b.createdByName],
  ["Người nhập", (b) => b.importedByName],
  ["Ngày nhập", (b) => b.importedAt],
  ["ID", (b) => b.id],
];

/** Kinh sách: cùng bộ cột, thêm "Chương" (mỗi dòng một chương) và "Dịch giả". */
const COT_KINH: Cot[] = [
  ["STT", (_b, i) => i + 1],
  ["Tiêu đề", (b) => b.title],
  ["Chương", () => ""],
  ["Nội dung", (b) => b.bodyHtml],
  ["Chuyên mục", (b) => b.categoryName || b.category],
  ["Link Ảnh", (b) => b.coverUrl],
  ["Hastag", (b) => b.tags.join(", ")],
  ["Dịch giả", (b) => b.translator ?? ""],
  ["Tác giả", (b) => b.author],
  ["Nguồn", (b) => b.sourceName],
  ["Link nguồn", (b) => b.sourceUrl],
  ["Trạng thái", (b) => nhanTrangThai[b.status] ?? b.status],
  ["Tóm tắt", (b) => b.summary],
  ["Đường dẫn", (b) => b.slug],
  ["Ngày đăng", (b) => b.publishedAt],
  ["Lượt xem", (b) => b.viewCount],
  ["Ngày tạo", (b) => b.createdAt],
  ["Người tạo", (b) => b.createdByName],
  ["Người nhập", (b) => b.importedByName],
  ["Ngày nhập", (b) => b.importedAt],
  ["ID", (b) => b.id],
];

const MAU: Record<Kieu, (string | number)[][]> = {
  bai: [
    COT_BAI.slice(0, 9).map(([t]) => t),
    [1, "Tiêu đề bài viết", "Nội dung bài. Mỗi đoạn cách nhau một dòng trống, hoặc dán HTML.", "Phật pháp ứng dụng", "https://…/anh.jpg", "#thiền #chánh niệm", "Thích …", "Tên nguồn", "https://…"],
  ],
  kinh: [
    COT_KINH.slice(0, 11).map(([t]) => t),
    [1, "Kinh Pháp Cú", "", "Lời dẫn của bộ kinh (dòng để trống cột Chương).", "Kinh tạng", "https://…/bia.jpg", "#pháp cú", "Thích Minh Châu", "", "Đại Tạng Kinh Việt Nam", "https://…"],
    [2, "Kinh Pháp Cú", "Phẩm Song Yếu", "Nội dung phẩm thứ nhất…", "", "", "", "", "", "", ""],
    [3, "Kinh Pháp Cú", "Phẩm Không Phóng Dật", "Nội dung phẩm thứ hai…", "", "", "", "", "", "", ""],
  ],
};

/** Một bộ kinh -> nhiều dòng Excel: dòng đầu mang thông tin chung + lời dẫn, mỗi chương một dòng. */
function dongKinhXuat(kq: BaiXuat[]) {
  const ra: Record<string, string | number>[] = [];
  for (const b of kq) {
    const chung = Object.fromEntries(COT_KINH.map(([ten, lay]) => [ten, lay(b, ra.length) ?? ""]));
    ra.push(chung);
    for (const c of b.chapters ?? []) {
      ra.push({ STT: ra.length + 1, "Tiêu đề": b.title, "Chương": c.title, "Nội dung": c.bodyHtml });
    }
  }
  return ra;
}

/* ------------------------------------------------------------------ */
/* Đọc tệp                                                             */
/* ------------------------------------------------------------------ */

/** "Tiêu đề " -> "tieude": so tên cột không phân biệt dấu, hoa thường, khoảng trắng. */
const khoaCot = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

type TruongDoc = keyof BaiPhang | "categoryName" | "chapter";

/** Tên cột chấp nhận cho từng trường (đã qua khoaCot). */
const BIET_DANH: Record<Exclude<TruongDoc, "chapters">, string[]> = {
  title: ["title", "tieude", "ten", "tenbai", "tenkinh", "name"],
  type: ["type", "loai", "loaibai"],
  slug: ["slug", "duongdan", "url"],
  summary: ["summary", "tomtat", "mota", "description", "excerpt", "sapo"],
  bodyHtml: ["bodyhtml", "body", "content", "noidung", "html", "thanbai", "text"],
  coverUrl: ["coverurl", "cover", "anhbia", "image", "thumbnail", "anh", "linkanh", "linkhinh", "hinhanh", "urlanh"],
  category: ["category", "danhmuc", "chuyenmuc", "categoryslug"],
  categoryName: ["categoryname", "tendanhmuc", "tenchuyenmuc"],
  tags: ["tags", "tag", "the", "tukhoa", "keywords", "hastag", "hashtag", "hastags", "hashtags"],
  author: ["author", "tacgia", "authorname"],
  authorTitle: ["authortitle", "danhxung", "chucdanh", "danhxungtacgia"],
  sourceName: ["sourcename", "source", "nguon", "tennguon"],
  sourceUrl: ["sourceurl", "linknguon", "urlnguon"],
  status: ["status", "trangthai", "hienthi"],
  publishedAt: ["publishedat", "ngaydang", "date", "ngay"],
  translator: ["translator", "dichgia", "nguoidich"],
  chapter: ["chuong", "tenchuong", "chapter", "chaptertitle", "pham"],
};

const layTruong = (dong: Record<string, unknown>, truong: keyof typeof BIET_DANH): string => {
  for (const [ten, giaTri] of Object.entries(dong)) {
    if (BIET_DANH[truong].includes(khoaCot(ten)) && giaTri !== null && giaTri !== undefined) {
      if (Array.isArray(giaTri)) return giaTri.join(", ");
      if (giaTri instanceof Date) return giaTri.toISOString();
      if (typeof giaTri === "object") {
        const o = giaTri as { slug?: string; name?: string };
        return String(o.slug ?? o.name ?? "");
      }
      return String(giaTri).trim();
    }
  }
  return "";
};

/** Chữ trạng thái tự do -> pending (mặc định) / draft / published. */
const docTrangThai = (s: string): TrangThai => {
  const k = khoaCot(s);
  if (["published", "hien", "hiendangngay", "dadang", "dang", "public", "1", "true", "yes", "co"].includes(k)) return "published";
  if (["draft", "an", "annhap", "nhap", "hidden", "0", "false", "no", "khong", "archived", "luutru"].includes(k)) return "draft";
  return "pending";
};

/** Văn bản thường (không có thẻ HTML) -> các đoạn <p>. */
const sangHtml = (s: string) => {
  // Chỉ coi là HTML khi có thẻ thật - chữ thường có "<...>" vẫn được chia đoạn.
  if (!s || /<\/?(p|br|div|span|h[1-6]|ul|ol|li|strong|em|b|i|u|a|img|blockquote|table|figure)\b[^>]*>/i.test(s)) return s;
  const thoat = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return s
    .split(/\r?\n\s*\r?\n/)
    .map((doan) => doan.trim())
    .filter(Boolean)
    .map((doan) => `<p>${thoat(doan).replace(/\r?\n/g, "<br>")}</p>`)
    .join("\n");
};

/**
 * Hashtag: "#thien #phat-phap", "thiền, phật pháp" hay "a; b" đều được.
 * Có dấu # thì tách theo #, không thì theo dấu phẩy / chấm phẩy.
 */
const tachThe = (s: string) =>
  (s.includes("#") ? s.split("#") : s.split(/[,;]/))
    .map((t) => t.replace(/[,;]+$/, "").trim())
    .filter(Boolean)
    .slice(0, 10);

type BaiDoc = BaiPhang & { dmGoc: string };

/**
 * Một dòng tệp -> BaiPhang + chữ "Chuyên mục" gốc khi không khớp danh mục nào
 * (để người soát thấy và chọn tay). Danh mục khớp theo slug hoặc tên, không
 * phân biệt dấu / hoa thường.
 */
function chuanHoaDong(dong: Record<string, unknown>, danhMuc: ChuyenMuc[], kieu: Kieu): BaiDoc & { chuong: string } {
  const dmVao = layTruong(dong, "category") || layTruong(dong, "categoryName");
  const dm = dmVao
    ? danhMuc.find((d) => d.slug === dmVao.toLowerCase() || khoaCot(d.name) === khoaCot(dmVao) || d.slug === khoaCot(dmVao))
    : undefined;
  const loai = khoaCot(layTruong(dong, "type"));
  const chuongJson = Array.isArray(dong.chapters) ? (dong.chapters as { title?: unknown; bodyHtml?: unknown }[]) : [];

  return {
    type: kieu === "kinh" ? "sutra" : loai === "blog" || loai === "tuybut" ? "blog" : "article",
    slug: layTruong(dong, "slug"),
    title: layTruong(dong, "title"),
    summary: layTruong(dong, "summary"),
    bodyHtml: sangHtml(layTruong(dong, "bodyHtml")),
    coverUrl: layTruong(dong, "coverUrl"),
    category: dm?.slug ?? "",
    tags: tachThe(layTruong(dong, "tags")),
    author: layTruong(dong, "author"),
    authorTitle: layTruong(dong, "authorTitle"),
    sourceName: layTruong(dong, "sourceName"),
    sourceUrl: layTruong(dong, "sourceUrl"),
    status: docTrangThai(layTruong(dong, "status")),
    publishedAt: layTruong(dong, "publishedAt"),
    translator: layTruong(dong, "translator"),
    chapters: chuongJson.map((c) => ({ title: String(c.title ?? "").trim(), bodyHtml: sangHtml(String(c.bodyHtml ?? "")) })),
    dmGoc: dm ? "" : dmVao,
    chuong: layTruong(dong, "chapter"),
  };
}

/**
 * Kinh sách từ Excel: gộp các dòng cùng tiêu đề thành một bộ. Dòng có "Chương"
 * thành một chương; dòng không có "Chương" góp vào lời dẫn và mang thông tin
 * chung (dòng có thông tin đầu tiên thắng). JSON đã có `chapters` thì giữ nguyên.
 */
function gopKinh(dong: (BaiDoc & { chuong: string })[]): BaiDoc[] {
  const theoTen = new Map<string, BaiDoc>();
  const kq: BaiDoc[] = [];
  for (const { chuong, ...d } of dong) {
    const khoa = khoaCot(d.title) || `__${kq.length}`;
    let bo = theoTen.get(khoa);
    if (!bo) {
      bo = { ...d, bodyHtml: chuong ? "" : d.bodyHtml, chapters: [...(d.chapters ?? [])] };
      theoTen.set(khoa, bo);
      kq.push(bo);
    } else {
      // Thông tin chung ghi ở dòng sau thì điền vào chỗ còn trống.
      for (const k of ["summary", "coverUrl", "category", "author", "sourceName", "sourceUrl", "translator", "slug", "publishedAt", "dmGoc"] as const) {
        if (!bo[k] && d[k]) (bo as Record<string, unknown>)[k] = d[k];
      }
      if (!bo.tags.length && d.tags.length) bo.tags = d.tags;
      if (!chuong && d.bodyHtml) bo.bodyHtml = [bo.bodyHtml, d.bodyHtml].filter(Boolean).join("\n");
    }
    if (chuong) bo.chapters!.push({ title: chuong, bodyHtml: d.bodyHtml });
  }
  return kq;
}

/** Tệp -> danh sách dòng thô. JSON nhận mảng, hoặc { items | data | posts: [...] }. */
async function docTep(tep: File): Promise<Record<string, unknown>[]> {
  if (/\.json$/i.test(tep.name)) {
    const json = JSON.parse(await tep.text()) as unknown;
    const o = json as { items?: unknown; data?: unknown; posts?: unknown };
    const ds = Array.isArray(json) ? json : o.items ?? o.data ?? o.posts;
    if (!Array.isArray(ds)) throw new Error("Tệp JSON phải là một mảng, hoặc có khoá items / data / posts.");
    return ds.filter((x): x is Record<string, unknown> => !!x && typeof x === "object");
  }
  const XLSX = await import("xlsx");
  const wb = XLSX.read(await tep.arrayBuffer(), { cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) throw new Error("Tệp Excel không có trang tính nào.");
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
}

function taiXuong(ten: string, du: Blob) {
  const url = URL.createObjectURL(du);
  const a = document.createElement("a");
  a.href = url;
  a.download = ten;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const ngayTep = () => new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "");

/** Chia danh sách thành các gói gửi: tối đa GOI_TOI_DA mục và ~GOI_BYTE_TOI_DA mỗi gói. */
function chiaGoi<T>(ds: T[]): T[][] {
  const goi: T[][] = [];
  let hienTai: T[] = [];
  let co = 0;
  for (const x of ds) {
    const n = JSON.stringify(x).length;
    if (hienTai.length && (hienTai.length >= GOI_TOI_DA || co + n > GOI_BYTE_TOI_DA)) {
      goi.push(hienTai);
      hienTai = [];
      co = 0;
    }
    hienTai.push(x);
    co += n;
  }
  if (hienTai.length) goi.push(hienTai);
  return goi;
}

/* ------------------------------------------------------------------ */
/* Nút Xuất / Nhập                                                     */
/* ------------------------------------------------------------------ */

export function NhapXuatBai({
  loai,
  locTrangThai,
  tuKhoa,
  onDaNhap,
  onLoi,
}: {
  /** type gửi API: "article,blog" (Bài viết) hoặc "sutra" (Kinh sách). */
  loai: string;
  locTrangThai: string;
  tuKhoa: string;
  onDaNhap: (soBai: number) => void;
  onLoi: (loi: string) => void;
}) {
  const locale = useLocale();
  const quyen = useQuyen();
  const kieu: Kieu = loai === "sutra" ? "kinh" : "bai";
  const ch = CAU_HINH[kieu];
  const duocNhap = quyen.includes(kieu === "kinh" ? "sutra.manage" : "content.editAny");
  const duocDang = quyen.includes(kieu === "kinh" ? "sutra.manage" : "content.publish");
  const tepRef = React.useRef<HTMLInputElement>(null);
  const [moMenu, setMoMenu] = React.useState(false);
  const [dangXuat, setDangXuat] = React.useState(false);
  const [dangDoc, setDangDoc] = React.useState(false);
  const [danhMuc, setDanhMuc] = React.useState<ChuyenMuc[]>([]);
  const [phien, setPhien] = React.useState<{ tenTep: string; bai: BaiDoc[]; boBot: number } | null>(null);

  async function xuat(dinhDang: "json" | "xlsx") {
    setMoMenu(false);
    setDangXuat(true);
    onLoi("");
    try {
      const kq = await xuatBai({ type: loai, status: locTrangThai || undefined, q: tuKhoa || undefined }, locale);
      const ten = `${ch.tenTep}-${ngayTep()}`;
      if (dinhDang === "json") {
        taiXuong(`${ten}.json`, new Blob([JSON.stringify(kq, null, 2)], { type: "application/json" }));
      } else {
        const XLSX = await import("xlsx");
        const cot = kieu === "kinh" ? COT_KINH : COT_BAI;
        const dong =
          kieu === "kinh"
            ? dongKinhXuat(kq.items)
            : kq.items.map((b, i) => Object.fromEntries(cot.map(([t, lay]) => [t, lay(b, i) ?? ""])));
        const ws = XLSX.utils.json_to_sheet(dong, { header: cot.map(([t]) => t) });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, kieu === "kinh" ? "Kinh sach" : "Bai viet");
        XLSX.writeFile(wb, `${ten}.xlsx`);
        const dai = dong.filter((d) => String(d["Nội dung"] ?? "").length > O_EXCEL_TOI_DA).length;
        if (dai) onLoi(`Đã xuất, nhưng ${dai} ô nội dung dài hơn giới hạn một ô Excel (32.767 ký tự) - mở bằng Excel sẽ bị cắt. Dùng JSON để giữ trọn.`);
      }
      if (kq.items.length >= kq.limit) onLoi(`Chỉ xuất ${kq.limit} mục mới nhất - lọc hẹp hơn để xuất phần còn lại.`);
    } catch (err) {
      onLoi(chuLoi(err, `Không xuất được ${ch.ten}.`));
    } finally {
      setDangXuat(false);
    }
  }

  async function taiMau() {
    setMoMenu(false);
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(MAU[kieu]), kieu === "kinh" ? "Kinh sach" : "Bai viet");
    XLSX.writeFile(wb, `mau-nhap-${ch.tenTep}.xlsx`);
  }

  async function chonTep(tep: File | undefined) {
    if (!tep) return;
    setDangDoc(true);
    onLoi("");
    try {
      const [dong, dm] = await Promise.all([docTep(tep), danhMuc.length ? danhMuc : layChuyenMuc(locale)]);
      setDanhMuc(dm);
      const doc = dong.map((d) => chuanHoaDong(d, dm, kieu));
      const bai = (kieu === "kinh" ? gopKinh(doc) : doc.map(({ chuong: _bo, ...b }) => b)).filter(
        (b) => b.title || b.bodyHtml || b.summary || b.chapters?.length,
      );
      if (!bai.length) throw new Error("Không tìm thấy mục nào trong tệp (cần ít nhất cột Tiêu đề / title).");
      setPhien({ tenTep: tep.name, bai: bai.slice(0, TOI_DA_DONG), boBot: Math.max(0, bai.length - TOI_DA_DONG) });
    } catch (err) {
      onLoi(err instanceof LoiApi ? chuLoi(err) : `Không đọc được tệp: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setDangDoc(false);
      if (tepRef.current) tepRef.current.value = "";
    }
  }

  return (
    <>
      <div className="relative">
        <Button variant="outline" onClick={() => setMoMenu(!moMenu)} disabled={dangXuat} aria-expanded={moMenu}>
          <Download aria-hidden /> {dangXuat ? "Đang xuất…" : "Xuất"} <ChevronDown className="size-3.5" aria-hidden />
        </Button>
        {moMenu ? (
          <div className="absolute right-0 top-full z-20 mt-1 flex w-60 flex-col rounded-md border border-line bg-surface p-1 shadow-card-lift">
            <button type="button" className="rounded px-3 py-2 text-left text-sm hover:bg-surface-2" onClick={() => xuat("xlsx")}>
              Excel (.xlsx){kieu === "kinh" ? " - mỗi chương một dòng" : ""}
            </button>
            <button type="button" className="rounded px-3 py-2 text-left text-sm hover:bg-surface-2" onClick={() => xuat("json")}>
              JSON (.json) - giữ trọn nội dung dài
            </button>
            <p className="px-3 py-1.5 text-xs text-muted">Theo bộ lọc trạng thái và từ khoá đang xem.</p>
            <button type="button" className="rounded border-t border-line px-3 py-2 text-left text-sm hover:bg-surface-2" onClick={taiMau}>
              Tải tệp Excel mẫu để nhập
            </button>
          </div>
        ) : null}
      </div>

      {duocNhap ? (
        <>
          <input
            ref={tepRef}
            type="file"
            accept=".xlsx,.xls,.csv,.json,application/json"
            className="hidden"
            onChange={(e) => chonTep(e.target.files?.[0])}
          />
          <Button variant="outline" onClick={() => tepRef.current?.click()} disabled={dangDoc}>
            <Upload aria-hidden /> {dangDoc ? "Đang đọc tệp…" : "Nhập"}
          </Button>
        </>
      ) : null}

      {phien ? (
        <HopNhapBai
          kieu={kieu}
          tenTep={phien.tenTep}
          baiBanDau={phien.bai}
          boBot={phien.boBot}
          danhMuc={danhMuc.filter((d) => (kieu === "kinh" ? d.kind !== "article" : d.kind !== "sutra"))}
          duocDang={duocDang}
          onDong={(soDaNhap) => {
            setPhien(null);
            if (soDaNhap) onDaNhap(soDaNhap);
          }}
        />
      ) : null}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Popup soát toàn màn hình                                            */
/* ------------------------------------------------------------------ */

type Dong = {
  key: string;
  bai: BaiPhang;
  chon: boolean;
  mo: boolean;
  /** "Chuyên mục" ghi trong tệp nhưng không khớp danh mục nào. */
  dmGoc: string;
  /** Độ tin cậy của gợi ý tự phân loại (0-1); undefined = chưa chạy / chọn tay. */
  diem?: number;
  loi?: string;
};

const oNho = "h-9 rounded-md border border-line bg-surface px-2 text-sm text-ink";

/** Lỗi phải sửa trước khi gửi (kiểm ở trình duyệt, backend vẫn kiểm lại). */
const thieu = (b: BaiPhang, kieu: Kieu) => !b.title.trim() || (kieu === "kinh" && !b.sourceName.trim());

function HopNhapBai({
  kieu,
  tenTep,
  baiBanDau,
  boBot,
  danhMuc,
  duocDang,
  onDong,
}: {
  kieu: Kieu;
  tenTep: string;
  baiBanDau: BaiDoc[];
  boBot: number;
  danhMuc: ChuyenMuc[];
  duocDang: boolean;
  onDong: (soDaNhap: number) => void;
}) {
  const locale = useLocale();
  const ch = CAU_HINH[kieu];
  const [dong, setDong] = React.useState<Dong[]>(() =>
    baiBanDau.map(({ dmGoc, ...bai }, i) => ({
      key: `d${i}`,
      dmGoc,
      // Không có quyền đăng thì mục ghi "hiện" trong tệp hạ về chưa duyệt.
      bai: !duocDang && bai.status === "published" ? { ...bai, status: "pending" as TrangThai } : bai,
      chon: false,
      mo: false,
    })),
  );
  const [dangPhanLoai, setDangPhanLoai] = React.useState(false);
  const [tienDo, setTienDo] = React.useState<{ xong: number; tong: number } | null>(null);
  const [thongBao, setThongBao] = React.useState("");
  const [daNhap, setDaNhap] = React.useState(0);
  const luot = React.useRef(`nhap-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`);

  const dangNhap = tienDo !== null;
  const soChon = dong.filter((d) => d.chon).length;
  const chuaPhanLoai = dong.filter((d) => !d.bai.category).length;
  const soThieu = dong.filter((d) => thieu(d.bai, kieu)).length;

  const dongPopup = React.useCallback(
    (hoiLai: boolean) => {
      if (dangNhap) return;
      if (hoiLai && dong.length && !window.confirm(`Đóng và bỏ ${dong.length} ${ch.donVi} chưa nhập?`)) return;
      onDong(daNhap);
    },
    [dangNhap, dong.length, daNhap, onDong, ch.donVi],
  );

  // Khoá cuộn trang phía sau + Esc để đóng.
  React.useEffect(() => {
    const cu = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const phim = (e: KeyboardEvent) => e.key === "Escape" && dongPopup(true);
    window.addEventListener("keydown", phim);
    return () => {
      document.body.style.overflow = cu;
      window.removeEventListener("keydown", phim);
    };
  }, [dongPopup]);

  const sua = (key: string, doi: Partial<BaiPhang>, them: Partial<Dong> = {}) =>
    setDong((ds) => ds.map((d) => (d.key === key ? { ...d, ...them, bai: { ...d.bai, ...doi }, loi: undefined } : d)));
  const suaChon = (doi: Partial<BaiPhang>) =>
    setDong((ds) => ds.map((d) => (d.chon ? { ...d, bai: { ...d.bai, ...doi }, ...(doi.category !== undefined ? { diem: undefined } : {}) } : d)));
  const xoa = (keys: string[]) => setDong((ds) => ds.filter((d) => !keys.includes(d.key)));

  async function tuPhanLoai() {
    const can = dong.filter((d) => !d.bai.category);
    if (!can.length) {
      setThongBao(`Mọi ${ch.donVi} đều đã có danh mục.`);
      return;
    }
    setDangPhanLoai(true);
    setThongBao("");
    try {
      const goiY = new Map<string, { category: string; score: number }>();
      let mau = 0;
      for (let i = 0; i < can.length; i += 50) {
        const goi = can.slice(i, i + 50);
        const kq = await phanLoaiBai(
          goi.map((d) => ({
            title: d.bai.title,
            summary: d.bai.summary,
            tags: d.bai.tags,
            // Kinh: tên chương + đầu các chương cũng là căn cứ.
            bodyHtml: [d.bai.bodyHtml, ...(d.bai.chapters ?? []).map((c) => `${c.title} ${c.bodyHtml.slice(0, 2000)}`)].join(" ").slice(0, 20000),
          })),
          kieu === "kinh" ? "sutra" : "article",
          locale,
        );
        mau = kq.sampleSize;
        goi.forEach((d, j) => goiY.set(d.key, kq.results[j] ?? { category: "", score: 0 }));
      }
      const duoc = Array.from(goiY.values()).filter((g) => g.category).length;
      setDong((ds) =>
        ds.map((d) => {
          const g = goiY.get(d.key);
          return g && g.category ? { ...d, bai: { ...d.bai, category: g.category }, diem: g.score } : d;
        }),
      );
      setThongBao(
        mau
          ? `Đã phân loại ${duoc}/${can.length} ${ch.donVi} (học từ ${mau} ${ch.donVi} đã có danh mục). ${can.length - duoc} mục không đủ căn cứ - để trống.`
          : `Chưa có ${ch.donVi} nào có danh mục để học - chỉ khớp được theo tên danh mục.`,
      );
    } catch (err) {
      setThongBao(chuLoi(err, "Không phân loại được."));
    } finally {
      setDangPhanLoai(false);
    }
  }

  async function nhap() {
    if (soThieu) {
      setThongBao(
        kieu === "kinh"
          ? `Còn ${soThieu} bộ kinh thiếu Tiêu đề hoặc Nguồn (bắt buộc với kinh sách) - điền hoặc bỏ trước khi nhập.`
          : `Còn ${soThieu} bài thiếu tiêu đề - điền hoặc bỏ trước khi nhập.`,
      );
      return;
    }
    const goi = chiaGoi(dong.slice());
    const tong = dong.length;
    setTienDo({ xong: 0, tong });
    setThongBao("");
    const ketQua = new Map<string, string | null>();
    let thanhCong = 0;
    let xong = 0;
    try {
      for (const g of goi) {
        const kq = await nhapBai(
          g.map((d) => d.bai),
          luot.current,
          tenTep,
          locale,
        );
        g.forEach((d, j) => {
          const r = kq.results[j];
          if (r && r.ok) {
            thanhCong++;
            ketQua.set(d.key, null);
          } else ketQua.set(d.key, LOI_NHAP[r && !r.ok ? r.error : ""] ?? "Không lưu được");
        });
        xong += g.length;
        setTienDo({ xong, tong });
      }
    } catch (err) {
      setThongBao(`Dừng giữa chừng: ${chuLoi(err)}`);
    }
    const tongDaNhap = daNhap + thanhCong;
    setDaNhap(tongDaNhap);
    setTienDo(null);
    // Mục đã nhập rời khỏi danh sách; mục lỗi hoặc chưa kịp gửi ở lại để sửa / gửi lại.
    const conLai = dong
      .filter((d) => ketQua.get(d.key) !== null)
      .map((d) => ({ ...d, loi: ketQua.get(d.key) ?? "Chưa gửi được - bấm Nhập để thử lại" }));
    setDong(conLai);
    if (!conLai.length) onDong(tongDaNhap);
    else setThongBao((cu) => cu || `Đã nhập ${thanhCong} ${ch.donVi}. ${conLai.length} mục lỗi - xem dòng báo đỏ, sửa rồi bấm Nhập lại.`);
  }

  const tatCaChon = dong.length > 0 && soChon === dong.length;
  const trangThaiDuoc = (Object.keys(NHAN_TRANG_THAI) as TrangThai[]).filter((t) => duocDang || t !== "published");

  return (
    <div role="dialog" aria-modal="true" aria-label={`Soát ${ch.ten} trước khi nhập`} className="fixed inset-0 z-[60] flex flex-col bg-paper">
      {/* Đầu popup */}
      <div className="flex flex-wrap items-center gap-3 border-b border-line bg-surface px-4 py-3 sm:px-6">
        <FileUp className="size-5 text-accent" aria-hidden />
        <div className="mr-auto flex min-w-0 flex-col">
          <h2 className="font-serif text-lg font-bold leading-tight">Soát {ch.ten} trước khi nhập</h2>
          <p className="truncate text-xs text-muted">
            {tenTep} · {dong.length} {ch.donVi} · {chuaPhanLoai} chưa phân loại
            {daNhap ? ` · đã nhập ${daNhap}` : ""}
            {boBot ? ` · bỏ ${boBot} mục vượt giới hạn ${TOI_DA_DONG}` : ""}
          </p>
        </div>
        <Button variant="outline" onClick={tuPhanLoai} disabled={dangPhanLoai || dangNhap || !dong.length}>
          <Sparkles aria-hidden /> {dangPhanLoai ? "Đang phân loại…" : `Tự phân loại${chuaPhanLoai ? ` (${chuaPhanLoai})` : ""}`}
        </Button>
        <Button onClick={nhap} disabled={dangNhap || dangPhanLoai || !dong.length}>
          <Upload aria-hidden />
          {dangNhap ? `Đang nhập ${tienDo.xong}/${tienDo.tong}…` : `Nhập ${dong.length} ${ch.donVi}`}
        </Button>
        <Button variant="ghost" size="icon" onClick={() => dongPopup(true)} disabled={dangNhap} aria-label="Đóng">
          <X aria-hidden />
        </Button>
      </div>

      {/* Thao tác hàng loạt */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-2 text-sm sm:px-6">
        <span className="text-muted">{soChon ? `Đã chọn ${soChon}:` : "Chọn các dòng để đổi hàng loạt."}</span>
        <select
          className={oNho}
          disabled={!soChon}
          value=""
          onChange={(e) => e.target.value && suaChon({ category: e.target.value === "_trong" ? "" : e.target.value })}
          aria-label="Đổi danh mục các dòng đã chọn"
        >
          <option value="">Đổi danh mục…</option>
          <option value="_trong">— Chưa phân loại —</option>
          {danhMuc.map((d) => (
            <option key={d.slug} value={d.slug}>
              {d.name}
            </option>
          ))}
        </select>
        <select
          className={oNho}
          disabled={!soChon}
          value=""
          onChange={(e) => e.target.value && suaChon({ status: e.target.value as TrangThai })}
          aria-label="Đổi trạng thái các dòng đã chọn"
        >
          <option value="">Đổi trạng thái…</option>
          {trangThaiDuoc.map((t) => (
            <option key={t} value={t}>
              {NHAN_TRANG_THAI[t]}
            </option>
          ))}
        </select>
        <Button
          variant="outline"
          size="sm"
          disabled={!soChon}
          onClick={() => window.confirm(`Bỏ ${soChon} mục đã chọn khỏi lượt nhập?`) && xoa(dong.filter((d) => d.chon).map((d) => d.key))}
        >
          <Trash2 aria-hidden /> Bỏ khỏi lượt nhập
        </Button>
        {thongBao ? (
          <p role="status" className="ml-auto text-sm text-accent">
            {thongBao}
          </p>
        ) : null}
      </div>

      {/* Bảng */}
      <div className="min-h-0 flex-1 overflow-auto">
        {dong.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted">Không còn mục nào trong lượt nhập.</p>
        ) : (
          <table className="w-full min-w-[64rem] text-sm">
            <thead className="sticky top-0 z-10 bg-surface-2">
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <th className="w-10 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={tatCaChon}
                    onChange={() => setDong((ds) => ds.map((d) => ({ ...d, chon: !tatCaChon })))}
                    aria-label="Chọn tất cả"
                  />
                </th>
                <th className="w-10 px-1 py-2">#</th>
                <th className="px-2 py-2 font-medium">Tiêu đề</th>
                <th className="w-40 px-2 py-2 font-medium">{kieu === "kinh" ? "Nguồn *" : "Loại"}</th>
                <th className="w-64 px-2 py-2 font-medium">Danh mục</th>
                <th className="w-44 px-2 py-2 font-medium">Trạng thái</th>
                <th className="w-28 px-2 py-2 font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {dong.map((d, i) => (
                <React.Fragment key={d.key}>
                  <tr className={cn("border-b border-line align-top", d.loi && "bg-lacquer/5", d.chon && "bg-accent-soft/40")}>
                    <td className="px-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={d.chon}
                        onChange={() => setDong((ds) => ds.map((x) => (x.key === d.key ? { ...x, chon: !x.chon } : x)))}
                        aria-label={`Chọn dòng ${i + 1}`}
                      />
                    </td>
                    <td className="px-1 py-2.5 tabular-nums text-muted">{i + 1}</td>
                    <td className="px-2 py-1.5">
                      <input
                        className={cn(oNho, "w-full", !d.bai.title.trim() && "border-lacquer")}
                        value={d.bai.title}
                        onChange={(e) => sua(d.key, { title: e.target.value })}
                        placeholder="Tiêu đề (bắt buộc)"
                        aria-label={`Tiêu đề dòng ${i + 1}`}
                      />
                      {kieu === "kinh" ? (
                        <p className="mt-1 text-xs text-muted">
                          {d.bai.chapters?.length ? `${d.bai.chapters.length} chương` : "Chưa chia chương"}
                          {d.bai.translator ? ` · Dịch: ${d.bai.translator}` : ""}
                        </p>
                      ) : null}
                      {d.loi ? <p className="mt-1 text-xs text-lacquer">{d.loi}</p> : null}
                    </td>
                    <td className="px-2 py-1.5">
                      {kieu === "kinh" ? (
                        <input
                          className={cn(oNho, "w-full", !d.bai.sourceName.trim() && "border-lacquer")}
                          value={d.bai.sourceName}
                          onChange={(e) => sua(d.key, { sourceName: e.target.value })}
                          placeholder="Bắt buộc"
                          aria-label="Nguồn"
                        />
                      ) : (
                        <select className={cn(oNho, "w-full")} value={d.bai.type} onChange={(e) => sua(d.key, { type: e.target.value as BaiPhang["type"] })} aria-label="Loại">
                          <option value="article">Bài viết</option>
                          <option value="blog">Tuỳ bút</option>
                        </select>
                      )}
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <select
                          className={cn(oNho, "min-w-0 flex-1", !d.bai.category && "text-muted")}
                          value={d.bai.category}
                          onChange={(e) => sua(d.key, { category: e.target.value }, { diem: undefined })}
                          aria-label="Danh mục"
                        >
                          <option value="">— Chưa phân loại —</option>
                          {danhMuc.map((dm) => (
                            <option key={dm.slug} value={dm.slug}>
                              {dm.name}
                            </option>
                          ))}
                        </select>
                        {d.diem !== undefined ? (
                          <Badge tone={d.diem >= 0.3 ? "accent" : "brass"} className="shrink-0" title="Độ tin cậy của gợi ý tự phân loại">
                            {Math.round(d.diem * 100)}%
                          </Badge>
                        ) : null}
                      </div>
                      {d.dmGoc && !d.bai.category ? (
                        <p className="mt-1 text-xs text-brass" title="Tạo danh mục này trước, hoặc chọn danh mục gần nhất">
                          Trong tệp: “{d.dmGoc}” - chưa có danh mục này
                        </p>
                      ) : null}
                    </td>
                    <td className="px-2 py-1.5">
                      <select className={cn(oNho, "w-full")} value={d.bai.status} onChange={(e) => sua(d.key, { status: e.target.value as TrangThai })} aria-label="Trạng thái">
                        {trangThaiDuoc.map((t) => (
                          <option key={t} value={t}>
                            {NHAN_TRANG_THAI[t]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-9"
                          onClick={() => setDong((ds) => ds.map((x) => (x.key === d.key ? { ...x, mo: !x.mo } : x)))}
                          aria-label={d.mo ? "Thu gọn" : "Sửa chi tiết"}
                          aria-expanded={d.mo}
                          title="Sửa chi tiết"
                        >
                          {d.mo ? <ChevronDown aria-hidden /> : <ChevronRight aria-hidden />}
                        </Button>
                        <Button variant="ghost" size="icon" className="size-9 text-lacquer" onClick={() => xoa([d.key])} aria-label="Bỏ dòng này" title="Bỏ khỏi lượt nhập">
                          <Trash2 aria-hidden />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  {d.mo ? (
                    <tr className="border-b border-line bg-surface">
                      <td />
                      <td colSpan={6} className="px-2 pb-4 pt-2">
                        <ChiTietBai kieu={kieu} bai={d.bai} onSua={(doi) => sua(d.key, doi)} />
                      </td>
                    </tr>
                  ) : null}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/** Khung soạn HTML có nút xem trước (iframe sandbox: HTML từ tệp ngoài, không cho chạy script). */
function SuaHtml({ nhan, giaTri, onDoi, cao = "h-80" }: { nhan: string; giaTri: string; onDoi: (v: string) => void; cao?: string }) {
  const [xemTruoc, setXemTruoc] = React.useState(false);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted">{nhan}</span>
        <button type="button" className="text-xs text-accent hover:underline" onClick={() => setXemTruoc(!xemTruoc)}>
          {xemTruoc ? "Sửa HTML" : "Xem trước"}
        </button>
      </div>
      {xemTruoc ? (
        <iframe
          title={`Xem trước: ${nhan}`}
          sandbox=""
          srcDoc={`<meta charset="utf-8"><style>body{font:15px/1.7 Georgia,serif;margin:16px;color:#2a2418}img{max-width:100%}</style>${giaTri}`}
          className={cn(cao, "w-full rounded-md border border-line bg-white")}
        />
      ) : (
        <textarea
          className={cn(cao, "rounded-md border border-line bg-surface px-3 py-2 font-mono text-xs text-ink")}
          value={giaTri}
          onChange={(e) => onDoi(e.target.value)}
          spellCheck={false}
        />
      )}
    </div>
  );
}

/** Phần sửa chi tiết một dòng (mở bằng nút mũi tên). */
function ChiTietBai({ kieu, bai, onSua }: { kieu: Kieu; bai: BaiPhang; onSua: (doi: Partial<BaiPhang>) => void }) {
  const o = (nhan: string, khoa: keyof BaiPhang, goiY = "") => (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted">{nhan}</span>
      <Input className="h-9" value={String(bai[khoa] ?? "")} onChange={(e) => onSua({ [khoa]: e.target.value } as Partial<BaiPhang>)} placeholder={goiY} />
    </label>
  );
  const chuong = bai.chapters ?? [];
  const doiChuong = (ds: { title: string; bodyHtml: string }[]) => onSua({ chapters: ds });

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted">Tóm tắt</span>
            <textarea
              className="min-h-20 rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
              value={bai.summary}
              onChange={(e) => onSua({ summary: e.target.value })}
              maxLength={600}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted">Thẻ (phân tách bằng dấu phẩy, tối đa 10)</span>
            <Input
              className="h-9"
              value={bai.tags.join(", ")}
              onChange={(e) => onSua({ tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 10) })}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            {kieu === "kinh" ? o("Dịch giả", "translator") : null}
            {o("Tác giả", "author")}
            {kieu === "bai" ? o("Danh xưng", "authorTitle", "Hoà thượng, Cư sĩ…") : null}
            {o("Nguồn", "sourceName", kieu === "kinh" ? "Bắt buộc" : "")}
            {o("Link nguồn", "sourceUrl", "https://…")}
            {o("Ảnh bìa", "coverUrl", "https://…")}
            {o("Đường dẫn (slug)", "slug", "Để trống = tự tạo từ tiêu đề")}
            {o("Ngày đăng", "publishedAt", "2026-10-06")}
          </div>
        </div>
        <SuaHtml nhan={kieu === "kinh" ? "Lời dẫn (HTML)" : "Nội dung (HTML)"} giaTri={bai.bodyHtml} onDoi={(v) => onSua({ bodyHtml: v })} />
      </div>

      {kieu === "kinh" ? (
        <div className="flex flex-col gap-3 border-t border-line pt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-ink">Các chương ({chuong.length})</span>
            <Button variant="outline" size="sm" onClick={() => doiChuong([...chuong, { title: `Chương ${chuong.length + 1}`, bodyHtml: "" }])}>
              <Plus aria-hidden /> Thêm chương
            </Button>
          </div>
          {chuong.map((c, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-md border border-line p-3">
              <div className="flex items-center gap-2">
                <span className="w-8 text-xs tabular-nums text-muted">{i + 1}.</span>
                <Input
                  className="h-9 flex-1"
                  value={c.title}
                  onChange={(e) => doiChuong(chuong.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))}
                  aria-label={`Tên chương ${i + 1}`}
                />
                <Button variant="ghost" size="icon" className="size-9 text-lacquer" onClick={() => doiChuong(chuong.filter((_x, j) => j !== i))} aria-label={`Bỏ chương ${i + 1}`}>
                  <Trash2 aria-hidden />
                </Button>
              </div>
              <SuaHtml nhan="Nội dung chương" giaTri={c.bodyHtml} cao="h-48" onDoi={(v) => doiChuong(chuong.map((x, j) => (j === i ? { ...x, bodyHtml: v } : x)))} />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
