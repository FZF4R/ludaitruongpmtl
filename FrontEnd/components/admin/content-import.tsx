"use client";

import * as React from "react";
import { ChevronDown, ChevronRight, Download, FileUp, Sparkles, Trash2, Upload, X } from "lucide-react";
import { Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { chuLoi, useLocale, useQuyen } from "@/components/admin/admin-shell";
import {
  layChuyenMuc,
  nhapBai,
  phanLoaiBai,
  xuatBai,
  type BaiPhang,
  type ChuyenMuc,
  type TrangThai,
} from "@/lib/admin-api";
import { LoiApi } from "@/lib/auth";
import { cn } from "@/lib/utils";

/**
 * Xuất / nhập bài viết bằng tệp Excel (.xlsx, .xls, .csv) hoặc JSON.
 *
 * Nhập không ghi ngay: tệp được đọc ở trình duyệt rồi mở trong một popup toàn
 * màn hình để soát - sửa, xoá, đổi danh mục, trạng thái (mặc định "Chưa
 * duyệt"), bấm "Tự phân loại" để backend gợi ý danh mục theo các bài đã có.
 * Chỉ khi bấm "Nhập" mới gửi lên, chia từng gói nhỏ; backend ghi người nhập,
 * thời điểm, mã lượt và tên tệp vào từng bài (POST /v1/admin/content/import).
 *
 * Cột Excel / khoá JSON khi xuất trùng với khi nhập, nên xuất ra sửa rồi nhập
 * lại được. Đọc cột theo nhiều tên (tiếng Việt / Anh, có dấu hay không).
 *
 * SheetJS chỉ tải khi thật sự xuất / nhập Excel (import động) - trang quản trị
 * không phải gánh thêm thư viện cho người không dùng tới.
 */

const GOI_GUI = 20;
const TOI_DA_DONG = 1000;
/** Ô Excel chứa tối đa 32.767 ký tự - thân bài dài hơn sẽ bị cắt khi mở bằng Excel. */
const O_EXCEL_TOI_DA = 32767;

const NHAN_TRANG_THAI: Partial<Record<TrangThai, string>> = {
  pending: "Chưa duyệt",
  draft: "Ẩn (nháp)",
  published: "Hiện (đăng ngay)",
};

const LOI_NHAP: Record<string, string> = {
  contentForbidden: "Bạn không có quyền tạo bài loại này",
  contentTitleRequired: "Thiếu tiêu đề",
  importPublishForbidden: "Bạn không có quyền đăng thẳng - chọn Chưa duyệt hoặc Ẩn",
  importBodyTooLong: "Nội dung quá dài (tối đa 500.000 ký tự)",
  errorWhileProcess: "Lỗi máy chủ khi lưu bài này",
};

/** Thứ tự cột khi xuất (cũng là tên khoá JSON). */
const COT_XUAT = [
  "title",
  "type",
  "category",
  "categoryName",
  "status",
  "summary",
  "bodyHtml",
  "tags",
  "author",
  "authorTitle",
  "sourceName",
  "sourceUrl",
  "coverUrl",
  "slug",
  "publishedAt",
  "viewCount",
  "createdAt",
  "createdByName",
  "importedByName",
  "importedAt",
  "id",
] as const;

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

/** Tên cột chấp nhận cho từng trường (đã qua khoaCot). */
const BIET_DANH: Record<keyof BaiPhang | "categoryName", string[]> = {
  title: ["title", "tieude", "ten", "tenbai", "name"],
  type: ["type", "loai", "loaibai"],
  slug: ["slug", "duongdan", "url"],
  summary: ["summary", "tomtat", "mota", "description", "excerpt", "sapo"],
  bodyHtml: ["bodyhtml", "body", "content", "noidung", "html", "thanbai", "text"],
  coverUrl: ["coverurl", "cover", "anhbia", "image", "thumbnail", "anh"],
  category: ["category", "danhmuc", "chuyenmuc", "categoryslug"],
  categoryName: ["categoryname", "tendanhmuc", "tenchuyenmuc"],
  tags: ["tags", "tag", "the", "tukhoa", "keywords"],
  author: ["author", "tacgia", "authorname"],
  authorTitle: ["authortitle", "danhxung", "chucdanh"],
  sourceName: ["sourcename", "source", "nguon", "tennguon"],
  sourceUrl: ["sourceurl", "linknguon", "urlnguon"],
  status: ["status", "trangthai", "hienthi"],
  publishedAt: ["publishedat", "ngaydang", "date", "ngay"],
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
  if (["published", "hien", "dadang", "dang", "public", "1", "true", "yes", "co"].includes(k)) return "published";
  if (["draft", "an", "nhap", "hidden", "0", "false", "no", "khong", "archived", "luutru"].includes(k)) return "draft";
  return "pending";
};

/** Văn bản thường (không có thẻ HTML) -> các đoạn <p>. */
const sangHtml = (s: string) => {
  if (!s || /<[a-z][\s\S]*>/i.test(s)) return s;
  const thoat = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return s
    .split(/\r?\n\s*\r?\n/)
    .map((doan) => doan.trim())
    .filter(Boolean)
    .map((doan) => `<p>${thoat(doan).replace(/\r?\n/g, "<br>")}</p>`)
    .join("\n");
};

/** Một dòng tệp -> BaiPhang. Danh mục nhận cả slug lẫn tên (không dấu, hoa thường). */
function chuanHoaDong(dong: Record<string, unknown>, danhMuc: ChuyenMuc[]): BaiPhang {
  const dmVao = layTruong(dong, "category") || layTruong(dong, "categoryName");
  const dm = dmVao
    ? danhMuc.find((d) => d.slug === dmVao.toLowerCase() || khoaCot(d.name) === khoaCot(dmVao) || d.slug === khoaCot(dmVao))
    : undefined;
  const loai = khoaCot(layTruong(dong, "type"));

  return {
    type: loai === "blog" || loai === "tuybut" ? "blog" : "article",
    slug: layTruong(dong, "slug"),
    title: layTruong(dong, "title"),
    summary: layTruong(dong, "summary"),
    bodyHtml: sangHtml(layTruong(dong, "bodyHtml")),
    coverUrl: layTruong(dong, "coverUrl"),
    category: dm?.slug ?? "",
    tags: layTruong(dong, "tags")
      .split(/[,;]/)
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 10),
    author: layTruong(dong, "author"),
    authorTitle: layTruong(dong, "authorTitle"),
    sourceName: layTruong(dong, "sourceName"),
    sourceUrl: layTruong(dong, "sourceUrl"),
    status: docTrangThai(layTruong(dong, "status")),
    publishedAt: layTruong(dong, "publishedAt"),
  };
}

/** Tệp -> danh sách dòng thô. JSON nhận mảng, hoặc { items | data | posts: [...] }. */
async function docTep(tep: File): Promise<Record<string, unknown>[]> {
  if (/\.json$/i.test(tep.name)) {
    const json = JSON.parse(await tep.text()) as unknown;
    const o = json as { items?: unknown; data?: unknown; posts?: unknown };
    const ds = Array.isArray(json) ? json : o.items ?? o.data ?? o.posts;
    if (!Array.isArray(ds)) throw new Error("Tệp JSON phải là một mảng bài, hoặc có khoá items / data / posts.");
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
  /** type gửi API, ví dụ "article,blog". */
  loai: string;
  locTrangThai: string;
  tuKhoa: string;
  onDaNhap: (soBai: number) => void;
  onLoi: (loi: string) => void;
}) {
  const locale = useLocale();
  const quyen = useQuyen();
  const duocNhap = quyen.includes("content.editAny");
  const tepRef = React.useRef<HTMLInputElement>(null);
  const [moMenu, setMoMenu] = React.useState(false);
  const [dangXuat, setDangXuat] = React.useState(false);
  const [dangDoc, setDangDoc] = React.useState(false);
  const [danhMuc, setDanhMuc] = React.useState<ChuyenMuc[]>([]);
  const [phien, setPhien] = React.useState<{ tenTep: string; bai: BaiPhang[]; boBot: number } | null>(null);

  async function xuat(dinhDang: "json" | "xlsx") {
    setMoMenu(false);
    setDangXuat(true);
    onLoi("");
    try {
      const kq = await xuatBai({ type: loai, status: locTrangThai || undefined, q: tuKhoa || undefined }, locale);
      const ten = `bai-viet-${ngayTep()}`;
      if (dinhDang === "json") {
        taiXuong(`${ten}.json`, new Blob([JSON.stringify(kq, null, 2)], { type: "application/json" }));
      } else {
        const XLSX = await import("xlsx");
        const dong = kq.items.map((b) => {
          const o: Record<string, string | number> = {};
          for (const c of COT_XUAT) {
            const v = b[c as keyof typeof b];
            o[c] = Array.isArray(v) ? v.join(", ") : (v as string | number) ?? "";
          }
          return o;
        });
        const ws = XLSX.utils.json_to_sheet(dong, { header: [...COT_XUAT] });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Bai viet");
        XLSX.writeFile(wb, `${ten}.xlsx`);
        const dai = kq.items.filter((b) => b.bodyHtml.length > O_EXCEL_TOI_DA).length;
        if (dai) onLoi(`Đã xuất, nhưng ${dai} bài có nội dung dài hơn giới hạn một ô Excel (32.767 ký tự) - mở bằng Excel sẽ bị cắt. Dùng JSON cho các bài này.`);
      }
      if (kq.items.length >= kq.limit) onLoi(`Chỉ xuất ${kq.limit} bài mới nhất - lọc hẹp hơn để xuất phần còn lại.`);
    } catch (err) {
      onLoi(chuLoi(err, "Không xuất được bài."));
    } finally {
      setDangXuat(false);
    }
  }

  async function chonTep(tep: File | undefined) {
    if (!tep) return;
    setDangDoc(true);
    onLoi("");
    try {
      const [dong, dm] = await Promise.all([docTep(tep), danhMuc.length ? danhMuc : layChuyenMuc(locale)]);
      setDanhMuc(dm);
      const bai = dong.map((d) => chuanHoaDong(d, dm)).filter((b) => b.title || b.bodyHtml || b.summary);
      if (!bai.length) throw new Error("Không tìm thấy bài nào trong tệp (cần ít nhất cột tiêu đề / title).");
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
          <div className="absolute right-0 top-full z-20 mt-1 flex w-56 flex-col rounded-md border border-line bg-surface p-1 shadow-card-lift">
            <button type="button" className="rounded px-3 py-2 text-left text-sm hover:bg-surface-2" onClick={() => xuat("xlsx")}>
              Excel (.xlsx)
            </button>
            <button type="button" className="rounded px-3 py-2 text-left text-sm hover:bg-surface-2" onClick={() => xuat("json")}>
              JSON (.json) - giữ trọn nội dung dài
            </button>
            <p className="px-3 py-1.5 text-xs text-muted">Theo bộ lọc trạng thái và từ khoá đang xem.</p>
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
          tenTep={phien.tenTep}
          baiBanDau={phien.bai}
          boBot={phien.boBot}
          danhMuc={danhMuc}
          duocDang={quyen.includes("content.publish")}
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
/* Popup soát bài toàn màn hình                                        */
/* ------------------------------------------------------------------ */

type Dong = {
  key: string;
  bai: BaiPhang;
  chon: boolean;
  mo: boolean;
  /** Độ tin cậy của gợi ý tự phân loại (0-1); undefined = chưa chạy / chọn tay. */
  diem?: number;
  loi?: string;
};

const oNho = "h-9 rounded-md border border-line bg-surface px-2 text-sm text-ink";

function HopNhapBai({
  tenTep,
  baiBanDau,
  boBot,
  danhMuc,
  duocDang,
  onDong,
}: {
  tenTep: string;
  baiBanDau: BaiPhang[];
  boBot: number;
  danhMuc: ChuyenMuc[];
  duocDang: boolean;
  onDong: (soDaNhap: number) => void;
}) {
  const locale = useLocale();
  const [dong, setDong] = React.useState<Dong[]>(() =>
    baiBanDau.map((bai, i) => ({
      key: `d${i}`,
      // Không có quyền đăng thì bài ghi "hiện" trong tệp hạ về chưa duyệt.
      bai: !duocDang && bai.status === "published" ? { ...bai, status: "pending" } : bai,
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
  const thieuTieuDe = dong.filter((d) => !d.bai.title.trim()).length;

  const dong1 = React.useCallback(
    (lyDoXacNhan: boolean) => {
      if (dangNhap) return;
      if (lyDoXacNhan && dong.length && !window.confirm(`Đóng và bỏ ${dong.length} bài chưa nhập?`)) return;
      onDong(daNhap);
    },
    [dangNhap, dong.length, daNhap, onDong],
  );

  // Khoá cuộn trang phía sau + Esc để đóng.
  React.useEffect(() => {
    const cu = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const phim = (e: KeyboardEvent) => e.key === "Escape" && dong1(true);
    window.addEventListener("keydown", phim);
    return () => {
      document.body.style.overflow = cu;
      window.removeEventListener("keydown", phim);
    };
  }, [dong1]);

  const sua = (key: string, doi: Partial<BaiPhang>, them: Partial<Dong> = {}) =>
    setDong((ds) => ds.map((d) => (d.key === key ? { ...d, ...them, bai: { ...d.bai, ...doi }, loi: undefined } : d)));
  const suaChon = (doi: Partial<BaiPhang>) =>
    setDong((ds) => ds.map((d) => (d.chon ? { ...d, bai: { ...d.bai, ...doi }, ...(doi.category !== undefined ? { diem: undefined } : {}) } : d)));
  const xoa = (keys: string[]) => setDong((ds) => ds.filter((d) => !keys.includes(d.key)));

  async function tuPhanLoai() {
    const can = dong.filter((d) => !d.bai.category);
    if (!can.length) {
      setThongBao("Mọi bài đều đã có danh mục.");
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
          goi.map((d) => ({ title: d.bai.title, summary: d.bai.summary, tags: d.bai.tags, bodyHtml: d.bai.bodyHtml.slice(0, 20000) })),
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
          ? `Đã phân loại ${duoc}/${can.length} bài (học từ ${mau} bài đã có danh mục). ${can.length - duoc} bài không đủ căn cứ - để trống.`
          : "Chưa có bài nào có danh mục để học - chỉ khớp được theo tên danh mục.",
      );
    } catch (err) {
      setThongBao(chuLoi(err, "Không phân loại được."));
    } finally {
      setDangPhanLoai(false);
    }
  }

  async function nhap() {
    if (thieuTieuDe) {
      setThongBao(`Còn ${thieuTieuDe} bài thiếu tiêu đề - điền hoặc xoá trước khi nhập.`);
      return;
    }
    const can = dong.slice();
    setTienDo({ xong: 0, tong: can.length });
    setThongBao("");
    const loiTheoKey = new Map<string, string>();
    let thanhCong = 0;
    try {
      for (let i = 0; i < can.length; i += GOI_GUI) {
        const goi = can.slice(i, i + GOI_GUI);
        const kq = await nhapBai(
          goi.map((d) => d.bai),
          luot.current,
          tenTep,
          locale,
        );
        goi.forEach((d, j) => {
          const r = kq.results[j];
          if (r && r.ok) thanhCong++;
          else loiTheoKey.set(d.key, LOI_NHAP[r && !r.ok ? r.error : ""] ?? "Không lưu được");
        });
        setTienDo({ xong: Math.min(can.length, i + GOI_GUI), tong: can.length });
      }
    } catch (err) {
      // Gói đang gửi hỏng cả gói: các bài chưa có kết quả giữ lại để nhập lại.
      setThongBao(`Dừng giữa chừng: ${chuLoi(err)}`);
      const daCoKetQua = new Set(loiTheoKey.keys());
      can.slice(thanhCong + daCoKetQua.size).forEach((d) => loiTheoKey.set(d.key, "Chưa gửi được - bấm Nhập để thử lại"));
    }
    const tong = daNhap + thanhCong;
    setDaNhap(tong);
    setTienDo(null);
    // Bài lỗi ở lại để sửa; bài đã nhập rời khỏi danh sách.
    setDong((ds) => ds.filter((d) => loiTheoKey.has(d.key)).map((d) => ({ ...d, loi: loiTheoKey.get(d.key) })));
    if (!loiTheoKey.size) onDong(tong);
    else setThongBao((cu) => cu || `Đã nhập ${thanhCong} bài. ${loiTheoKey.size} bài lỗi - xem dòng báo đỏ, sửa rồi bấm Nhập lại.`);
  }

  const tatCaChon = dong.length > 0 && soChon === dong.length;

  return (
    <div role="dialog" aria-modal="true" aria-label="Soát bài trước khi nhập" className="fixed inset-0 z-[60] flex flex-col bg-paper">
      {/* Đầu popup */}
      <div className="flex flex-wrap items-center gap-3 border-b border-line bg-surface px-4 py-3 sm:px-6">
        <FileUp className="size-5 text-accent" aria-hidden />
        <div className="mr-auto flex min-w-0 flex-col">
          <h2 className="font-serif text-lg font-bold leading-tight">Soát bài trước khi nhập</h2>
          <p className="truncate text-xs text-muted">
            {tenTep} · {dong.length} bài · {chuaPhanLoai} chưa phân loại
            {daNhap ? ` · đã nhập ${daNhap}` : ""}
            {boBot ? ` · bỏ ${boBot} dòng vượt giới hạn ${TOI_DA_DONG}` : ""}
          </p>
        </div>
        <Button variant="outline" onClick={tuPhanLoai} disabled={dangPhanLoai || dangNhap || !dong.length}>
          <Sparkles aria-hidden /> {dangPhanLoai ? "Đang phân loại…" : `Tự phân loại${chuaPhanLoai ? ` (${chuaPhanLoai})` : ""}`}
        </Button>
        <Button onClick={nhap} disabled={dangNhap || dangPhanLoai || !dong.length}>
          <Upload aria-hidden />
          {dangNhap ? `Đang nhập ${tienDo.xong}/${tienDo.tong}…` : `Nhập ${dong.length} bài`}
        </Button>
        <Button variant="ghost" size="icon" onClick={() => dong1(true)} disabled={dangNhap} aria-label="Đóng">
          <X aria-hidden />
        </Button>
      </div>

      {/* Thao tác hàng loạt */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-2 text-sm sm:px-6">
        <span className="text-muted">{soChon ? `Đã chọn ${soChon}:` : "Chọn bài để đổi hàng loạt."}</span>
        <select
          className={oNho}
          disabled={!soChon}
          value=""
          onChange={(e) => e.target.value && suaChon({ category: e.target.value === "_trong" ? "" : e.target.value })}
          aria-label="Đổi danh mục các bài đã chọn"
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
          aria-label="Đổi trạng thái các bài đã chọn"
        >
          <option value="">Đổi trạng thái…</option>
          {(Object.keys(NHAN_TRANG_THAI) as TrangThai[])
            .filter((t) => duocDang || t !== "published")
            .map((t) => (
              <option key={t} value={t}>
                {NHAN_TRANG_THAI[t]}
              </option>
            ))}
        </select>
        <Button
          variant="outline"
          size="sm"
          disabled={!soChon}
          onClick={() => window.confirm(`Bỏ ${soChon} bài đã chọn khỏi lượt nhập?`) && xoa(dong.filter((d) => d.chon).map((d) => d.key))}
        >
          <Trash2 aria-hidden /> Bỏ khỏi lượt nhập
        </Button>
        {thongBao ? (
          <p role="status" className="ml-auto text-sm text-accent">
            {thongBao}
          </p>
        ) : null}
      </div>

      {/* Bảng bài */}
      <div className="min-h-0 flex-1 overflow-auto">
        {dong.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted">Không còn bài nào trong lượt nhập.</p>
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
                <th className="w-32 px-2 py-2 font-medium">Loại</th>
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
                        aria-label={`Chọn bài ${i + 1}`}
                      />
                    </td>
                    <td className="px-1 py-2.5 tabular-nums text-muted">{i + 1}</td>
                    <td className="px-2 py-1.5">
                      <input
                        className={cn(oNho, "w-full", !d.bai.title.trim() && "border-lacquer")}
                        value={d.bai.title}
                        onChange={(e) => sua(d.key, { title: e.target.value })}
                        placeholder="Tiêu đề (bắt buộc)"
                        aria-label={`Tiêu đề bài ${i + 1}`}
                      />
                      {d.loi ? <p className="mt-1 text-xs text-lacquer">{d.loi}</p> : null}
                    </td>
                    <td className="px-2 py-1.5">
                      <select className={cn(oNho, "w-full")} value={d.bai.type} onChange={(e) => sua(d.key, { type: e.target.value as BaiPhang["type"] })} aria-label="Loại">
                        <option value="article">Bài viết</option>
                        <option value="blog">Tuỳ bút</option>
                      </select>
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
                    </td>
                    <td className="px-2 py-1.5">
                      <select className={cn(oNho, "w-full")} value={d.bai.status} onChange={(e) => sua(d.key, { status: e.target.value as TrangThai })} aria-label="Trạng thái">
                        {(Object.keys(NHAN_TRANG_THAI) as TrangThai[])
                          .filter((t) => duocDang || t !== "published")
                          .map((t) => (
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
                        <Button variant="ghost" size="icon" className="size-9 text-lacquer" onClick={() => xoa([d.key])} aria-label="Bỏ bài này" title="Bỏ khỏi lượt nhập">
                          <Trash2 aria-hidden />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  {d.mo ? (
                    <tr className="border-b border-line bg-surface">
                      <td />
                      <td colSpan={6} className="px-2 pb-4 pt-2">
                        <ChiTietBai bai={d.bai} onSua={(doi) => sua(d.key, doi)} />
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

/** Phần sửa chi tiết một bài (mở bằng nút mũi tên). */
function ChiTietBai({ bai, onSua }: { bai: BaiPhang; onSua: (doi: Partial<BaiPhang>) => void }) {
  const [xemTruoc, setXemTruoc] = React.useState(false);
  const o = (nhan: string, khoa: keyof BaiPhang, goiY = "") => (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted">{nhan}</span>
      <Input className="h-9" value={String(bai[khoa] ?? "")} onChange={(e) => onSua({ [khoa]: e.target.value } as Partial<BaiPhang>)} placeholder={goiY} />
    </label>
  );

  return (
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
          {o("Tác giả", "author")}
          {o("Danh xưng", "authorTitle", "Hoà thượng, Cư sĩ…")}
          {o("Nguồn", "sourceName")}
          {o("Link nguồn", "sourceUrl", "https://…")}
          {o("Ảnh bìa", "coverUrl", "https://…")}
          {o("Đường dẫn (slug)", "slug", "Để trống = tự tạo từ tiêu đề")}
          {o("Ngày đăng", "publishedAt", "2026-10-06")}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted">Nội dung (HTML)</span>
          <button type="button" className="text-xs text-accent hover:underline" onClick={() => setXemTruoc(!xemTruoc)}>
            {xemTruoc ? "Sửa HTML" : "Xem trước"}
          </button>
        </div>
        {xemTruoc ? (
          // Xem trước trong iframe sandbox: HTML lấy từ tệp ngoài, không cho chạy script.
          <iframe
            title="Xem trước nội dung"
            sandbox=""
            srcDoc={`<meta charset="utf-8"><style>body{font:15px/1.7 Georgia,serif;margin:16px;color:#2a2418}img{max-width:100%}</style>${bai.bodyHtml}`}
            className="h-80 w-full rounded-md border border-line bg-white"
          />
        ) : (
          <textarea
            className="h-80 rounded-md border border-line bg-surface px-3 py-2 font-mono text-xs text-ink"
            value={bai.bodyHtml}
            onChange={(e) => onSua({ bodyHtml: e.target.value })}
            spellCheck={false}
          />
        )}
      </div>
    </div>
  );
}
