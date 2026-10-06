"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, Trash2, Check, ArrowLeft, ExternalLink } from "lucide-react";
import { Badge, Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { HopLoi, chuLoi, useHoSoQuanTri, useLocale, useQuyen } from "@/components/admin/admin-shell";
import { RevisionDiff, nhanTruong } from "@/components/admin/revision-diff";
import {
  doiTrangThai,
  layBai,
  layLichSuBai,
  timNguoi,
  layChuyenMuc,
  layDanhSachBai,
  luuBai,
  nhanDanhMucThuVien,
  nhanLoai,
  nhanTrangThai,
  taoBai,
  trangThai as moiTrangThai,
  xoaBai,
  type BaiChiTiet,
  type NhatKyBai,
  type NguoiChon,
  type BaiTomTat,
  type SapXepBai,
  type Chuong,
  type ChuyenMuc,
  type LoaiNoiDung,
  type TrangThai,
} from "@/lib/admin-api";
import { contentTypeBase } from "@/lib/site";
import { NhapXuatBai } from "@/components/admin/content-import";
import { localePath } from "@/lib/i18n";

/**
 * Bảng quản trị nội dung, dùng chung cho /admin/blog và /admin/library.
 *
 * Hai trang chỉ khác nhau ở `loai` truyền vào — bài viết là article+blog, thư
 * viện kinh sách là sutra. Backend cũng chung một bộ endpoint vì cả hai là
 * cùng một bảng `Content`; xem chú thích đầu
 * Backend/api/controllers/System/Admin/ContentController.js.
 *
 * Trạng thái đi theo một đường: nháp -> chờ duyệt -> đã đăng -> lưu trữ. "Lưu
 * trữ" gỡ bài khỏi trang công khai nhưng GIỮ bản ghi, nên nút Xoá luôn hỏi lại
 * và luôn đứng sau nút Lưu trữ.
 */

const MOI_TRANG = 20;

const gonNgay = (iso: string) =>
  iso
    ? new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "—";

const tongMau: Record<TrangThai, "neutral" | "accent" | "brass"> = {
  draft: "neutral",
  pending: "brass",
  published: "accent",
  archived: "neutral",
};

export function ContentPanel({
  loai,
  loaiChon,
  tieuDe,
  moTa,
  coChuong = false,
  coNhapXuat = false,
}: {
  /** Danh sách type gửi cho API, phân tách bằng dấu phẩy. */
  loai: string;
  /** Những type người dùng được chọn khi tạo bài ở trang này. */
  loaiChon: LoaiNoiDung[];
  tieuDe: string;
  moTa: string;
  /** Kinh sách chia chương; bài viết thì không. */
  coChuong?: boolean;
  /** Nút Xuất / Nhập Excel, JSON (components/admin/content-import) - chỉ trang Bài viết. */
  coNhapXuat?: boolean;
}) {
  const locale = useLocale();
  const quyen = useQuyen();
  const duocXoa = quyen.includes("content.delete");
  // Kiểm duyệt viên chỉ có content.review: duyệt / đề xuất sửa bài người dùng, không tạo bài mới.
  const duocTao = loaiChon.some((l) =>
    quyen.includes(l === "sutra" ? "sutra.manage" : l === "library" ? "library.manage" : "content.editAny"),
  );

  const [locTrangThai, setLocTrangThai] = React.useState<TrangThai | "">("");
  const [tuKhoa, setTuKhoa] = React.useState("");
  const [daGui, setDaGui] = React.useState("");
  const [trang, setTrang] = React.useState(1);
  const [sapXep, setSapXep] = React.useState<SapXepBai>("updated");
  const [tongQuan, setTongQuan] = React.useState<{ views: number; viewsToday: number; commentsToday: number } | null>(null);

  const [danhSach, setDanhSach] = React.useState<BaiTomTat[]>([]);
  const [tong, setTong] = React.useState(0);
  const [thongKe, setThongKe] = React.useState<Record<string, number>>({});
  const [dangTai, setDangTai] = React.useState(true);
  const [loi, setLoi] = React.useState("");
  const [ban, setBan] = React.useState(false);
  const [thongBao, setThongBao] = React.useState("");

  /*
   * Bài đang soạn nằm trên URL (?sua=<id> hoặc ?sua=moi) chứ không trong state:
   * mỗi bài có link riêng để gửi cho nhau, tải lại trang vẫn mở đúng bài, và
   * nút Back của trình duyệt quay về danh sách.
   * null = đang xem danh sách, "moi" = tạo bài, còn lại là id đang sửa.
   */
  const router = useRouter();
  const pathname = usePathname();
  const dangSoan = useSearchParams().get("sua");
  const linkSua = (id: string) => `${pathname}?sua=${encodeURIComponent(id)}`;
  const setDangSoan = (id: string | null) => router.push(id ? linkSua(id) : pathname);

  const nap = React.useCallback(() => {
    setDangTai(true);
    setLoi("");
    layDanhSachBai(
      { type: loai, status: locTrangThai || undefined, q: daGui, page: trang, limit: MOI_TRANG, sort: sapXep },
      locale,
    )
      .then((kq) => {
        setDanhSach(kq.data ?? []);
        setTong(kq.total ?? 0);
        setThongKe(kq.stats ?? {});
        setTongQuan(kq.overview ?? null);
      })
      .catch((err) => setLoi(chuLoi(err, "Không tải được danh sách.")))
      .finally(() => setDangTai(false));
  }, [loai, locTrangThai, daGui, trang, locale, sapXep]);

  React.useEffect(nap, [nap]);

  const chay = async (viec: () => Promise<unknown>) => {
    setBan(true);
    setLoi("");
    try {
      await viec();
      nap();
    } catch (err) {
      setLoi(chuLoi(err));
    } finally {
      setBan(false);
    }
  };

  if (dangSoan !== null) {
    return (
      <TrinhSoan
        // Đổi bài qua URL (Back/Forward giữa hai bài) thì dựng lại từ đầu,
        // không để form giữ chữ của bài trước.
        key={dangSoan}
        id={dangSoan === "moi" ? null : dangSoan}
        loaiChon={loaiChon}
        coChuong={coChuong}
        onThoat={() => setDangSoan(null)}
        onLuuXong={() => {
          setDangSoan(null);
          nap();
        }}
      />
    );
  }

  const soTrang = Math.max(1, Math.ceil(tong / MOI_TRANG));
  const tongTatCa = moiTrangThai.reduce((s, tt) => s + (thongKe[tt] ?? 0), 0);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-serif text-2xl font-bold tracking-tight">{tieuDe}</h1>
          <p className="text-sm text-muted">{moTa}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {coNhapXuat ? (
            <NhapXuatBai
              loai={loai}
              locTrangThai={locTrangThai}
              tuKhoa={daGui}
              onLoi={setLoi}
              onDaNhap={(n) => {
                setThongBao(`Đã nhập ${n} bài. Bài nhập mặc định ở trạng thái Chưa duyệt - lọc "${nhanTrangThai.pending}" để duyệt.`);
                nap();
              }}
            />
          ) : null}
          {duocTao ? (
            <Button onClick={() => setDangSoan("moi")}>
              <Plus aria-hidden /> Thêm mới
            </Button>
          ) : null}
        </div>
      </div>

      <HopLoi loi={loi} thuLai={loi.startsWith("Đã xuất") || loi.startsWith("Chỉ xuất") ? undefined : nap} />
      {thongBao ? (
        <Card className="flex items-center justify-between gap-3 border-accent/40 p-4">
          <p role="status" className="text-sm text-accent">{thongBao}</p>
          <Button variant="ghost" size="sm" onClick={() => setThongBao("")}>Đóng</Button>
        </Card>
      ) : null}

      {/* Tổng quan cả mục: số bài, tổng lượt xem, lượt xem và bình luận hôm nay. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            ["Số bài", tongTatCa],
            ["Tổng lượt xem", tongQuan?.views ?? 0],
            ["Lượt xem hôm nay", tongQuan?.viewsToday ?? 0],
            ["Bình luận hôm nay", tongQuan?.commentsToday ?? 0],
          ] as const
        ).map(([nhan, so]) => (
          <Card key={nhan} className="flex flex-col gap-0.5 p-4">
            <span className="text-xs text-muted">{nhan}</span>
            <span className="font-serif text-2xl font-bold tabular-nums text-ink">{so.toLocaleString("vi-VN")}</span>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          <NutLoc
            nhan="Tất cả"
            so={tongTatCa}
            dangChon={locTrangThai === ""}
            onChon={() => {
              setLocTrangThai("");
              setTrang(1);
            }}
          />
          {moiTrangThai.map((tt) => (
            <NutLoc
              key={tt}
              nhan={nhanTrangThai[tt]}
              so={thongKe[tt] ?? 0}
              dangChon={locTrangThai === tt}
              onChon={() => {
                setLocTrangThai(tt);
                setTrang(1);
              }}
            />
          ))}
        </div>

        <form
          className="ml-auto flex w-full max-w-xs gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setTrang(1);
            setDaGui(tuKhoa.trim());
          }}
        >
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <Input
              value={tuKhoa}
              onChange={(e) => setTuKhoa(e.target.value)}
              placeholder="Tìm theo tiêu đề, tác giả, thẻ…"
              aria-label="Tìm bài"
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="outline">
            Tìm
          </Button>
        </form>
        <label className="flex items-center gap-2 text-sm text-muted">
          Sắp xếp
          <Select
            value={sapXep}
            onChange={(e) => {
              setSapXep(e.target.value as SapXepBai);
              setTrang(1);
            }}
            className="h-9 w-auto"
            aria-label="Sắp xếp"
          >
            <option value="updated">Mới cập nhật</option>
            <option value="newest">Bài mới nhất</option>
            <option value="oldest">Bài cũ nhất</option>
            <option value="views">Nhiều lượt xem nhất</option>
            <option value="title">Theo tên (A–Z)</option>
          </Select>
        </label>
      </div>

      <Card className="flex flex-col overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[60rem] text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-2 text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-2.5 font-medium">Tiêu đề</th>
                <th className="px-4 py-2.5 font-medium">Trạng thái</th>
                <th className="px-3 py-2.5 text-right font-medium" title="Tổng lượt xem">Lượt xem</th>
                <th className="px-3 py-2.5 text-right font-medium" title="Lượt xem hôm nay (giờ Việt Nam)">Hôm nay</th>
                <th className="px-3 py-2.5 text-right font-medium" title="Lượt xem 7 ngày gần nhất">7 ngày</th>
                <th className="px-3 py-2.5 text-right font-medium" title="Bình luận đang hiện (bị giữ chờ duyệt)">Bình luận</th>
                <th className="px-4 py-2.5 font-medium">Tạo / cập nhật</th>
                <th className="px-4 py-2.5 font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {dangTai ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted">
                    Đang tải…
                  </td>
                </tr>
              ) : danhSach.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted">
                    Chưa có bài nào ở mục này.
                  </td>
                </tr>
              ) : (
                danhSach.map((bai) => (
                  <tr key={bai.id} className="border-b border-line last:border-0 align-top">
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <Link
                          href={linkSua(bai.id)}
                          className="font-medium text-ink underline-offset-2 hover:text-accent hover:underline"
                        >
                          {bai.title}
                        </Link>
                        <span className="text-xs text-muted">
                          {bai.type === "library" && bai.libraryKind
                            ? `Thư viện: ${nhanDanhMucThuVien[bai.libraryKind] ?? bai.libraryKind}`
                            : nhanLoai[bai.type] ?? bai.type}{" "}
                          · /{bai.slug}
                          {bai.chapterCount ? ` · ${bai.chapterCount} chương` : ""}
                          {bai.author?.name ? ` · ${bai.author.name}` : ""}
                        </span>
                        {bai.pendingEdit ? (
                          <span className="text-xs text-brass">
                            Chờ tác giả đồng ý bản sửa của {bai.pendingEdit.byName || "ban biên tập"}
                          </span>
                        ) : null}
                        {bai.status === "draft" && bai.reviewNote ? (
                          <span className="text-xs text-lacquer">Đã trả lại: {bai.reviewNote}</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={tongMau[bai.status]}>{nhanTrangThai[bai.status]}</Badge>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-ink">{(bai.viewCount ?? 0).toLocaleString("vi-VN")}</td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {bai.metrics?.viewsToday ? (
                        <span className="font-semibold text-accent">+{bai.metrics.viewsToday}</span>
                      ) : (
                        <span className="text-muted">0</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-muted">{bai.metrics?.viewsWeek ?? 0}</td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      <span className="text-ink">{bai.metrics?.comments ?? 0}</span>
                      {bai.metrics?.commentsFlagged ? (
                        <span className="ml-1 text-xs text-lacquer" title="Bị giữ chờ duyệt">
                          ({bai.metrics.commentsFlagged})
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-xs tabular-nums text-muted">
                      <span className="block">{gonNgay(bai.createdAt)}</span>
                      <span className="block opacity-80">↻ {gonNgay(bai.updatedAt)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={linkSua(bai.id)}>Sửa</Link>
                        </Button>

                        {/* Trang công khai chỉ trả bài đã đăng; bài khác mở ra sẽ là 404. */}
                        {bai.status === "published" ? (
                          <Button size="sm" variant="outline" asChild>
                            <a
                              href={localePath(locale, `${contentTypeBase[bai.type]}/${bai.slug}`)}
                              target="_blank"
                              rel="noopener"
                            >
                              <ExternalLink aria-hidden /> Xem bài
                            </a>
                          </Button>
                        ) : null}

                        {bai.status !== "published" ? (
                          <Button
                            size="sm"
                            disabled={ban}
                            onClick={() => chay(() => doiTrangThai(bai.id, "published", locale))}
                          >
                            <Check aria-hidden /> Duyệt
                          </Button>
                        ) : null}

                        {bai.status === "pending" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={ban}
                            onClick={() => {
                              const lyDo = window.prompt(
                                "Lý do trả lại (gửi kèm thông báo cho tác giả):",
                                "",
                              );
                              if (lyDo !== null) void chay(() => doiTrangThai(bai.id, "draft", locale, lyDo));
                            }}
                          >
                            Trả lại
                          </Button>
                        ) : bai.status !== "archived" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={ban}
                            onClick={() => chay(() => doiTrangThai(bai.id, "archived", locale))}
                          >
                            Lưu trữ
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={ban}
                            onClick={() => chay(() => doiTrangThai(bai.id, "draft", locale))}
                          >
                            Trả về nháp
                          </Button>
                        )}

                        {duocXoa ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={ban}
                          aria-label={`Xoá ${bai.title}`}
                          onClick={() => {
                            if (
                              confirm(
                                `Xoá hẳn "${bai.title}"?\n\nThao tác này không hoàn tác được. Nếu chỉ muốn gỡ khỏi trang công khai, hãy dùng Lưu trữ.`,
                              )
                            ) {
                              void chay(() => xoaBai(bai.id, locale));
                            }
                          }}
                        >
                          <Trash2 aria-hidden />
                        </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {soTrang > 1 ? (
          <div className="flex items-center justify-between border-t border-line px-4 py-3 text-sm">
            <span className="text-muted">
              Trang {trang}/{soTrang} · {tong} bài
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={trang <= 1}
                onClick={() => setTrang((t) => t - 1)}
              >
                Trước
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={trang >= soTrang}
                onClick={() => setTrang((t) => t + 1)}
              >
                Sau
              </Button>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}

function NutLoc({
  nhan,
  so,
  dangChon,
  onChon,
}: {
  nhan: string;
  so: number;
  dangChon: boolean;
  onChon: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChon}
      aria-pressed={dangChon}
      className={
        "rounded-full border px-3 py-1.5 text-sm transition-colors " +
        (dangChon
          ? "border-accent bg-accent-soft font-medium text-accent"
          : "border-line bg-surface text-body hover:border-line-strong hover:text-ink")
      }
    >
      {nhan} <span className="tabular-nums text-muted">({so})</span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Trình soạn                                                          */
/* ------------------------------------------------------------------ */

const oVanBan =
  "w-full rounded-md border border-line bg-surface px-3 py-2 font-mono text-sm text-ink placeholder:text-muted";

function TrinhSoan({
  id,
  loaiChon,
  coChuong,
  onThoat,
  onLuuXong,
}: {
  id: string | null;
  loaiChon: LoaiNoiDung[];
  coChuong: boolean;
  onThoat: () => void;
  onLuuXong: () => void;
}) {
  const locale = useLocale();

  const [dangTai, setDangTai] = React.useState(!!id);
  const [dangLuu, setDangLuu] = React.useState(false);
  const [loi, setLoi] = React.useState("");
  const [goc, setGoc] = React.useState<BaiChiTiet | null>(null);
  const [chuyenMuc, setChuyenMuc] = React.useState<ChuyenMuc[]>([]);

  const [type, setType] = React.useState<string>(loaiChon[0]);
  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [summary, setSummary] = React.useState("");
  const [coverUrl, setCoverUrl] = React.useState("");
  const [tags, setTags] = React.useState("");
  const [danhMuc, setDanhMuc] = React.useState("");
  const [tenTacGia, setTenTacGia] = React.useState("");
  const [chucDanh, setChucDanh] = React.useState("");
  const [phapDanh, setPhapDanh] = React.useState("");
  /*
   * Tác giả lấy theo hồ sơ người đăng (họ tên + pháp danh, tự cập nhật khi hồ
   * sơ đổi). Bài viết mới bật sẵn; kinh sách mới thì tắt vì thường ghi tên
   * dịch giả. Bài đang có thì theo đúng cờ đã lưu.
   */
  const [theoHoSo, setTheoHoSo] = React.useState(!id && !coChuong);
  const hoSoToi = useHoSoQuanTri();

  // Kinh sách: nguồn tham khảo bắt buộc, dịch giả chọn người dùng hoặc nhập tay.
  const laKinh = type === "sutra";
  const [nguonTen, setNguonTen] = React.useState("");
  const [nguonUrl, setNguonUrl] = React.useState("");
  const [dichGia, setDichGia] = React.useState<GiaTriDichGia>({ cach: "nguoiDung", chon: null, ten: "", phapDanh: "" });
  const [bodyHtml, setBodyHtml] = React.useState("");
  const [chuong, setChuong] = React.useState<Chuong[]>([]);
  // Thư viện: danh mục, album ảnh (mỗi dòng "url | chú thích"), tệp âm thanh.
  const [libraryKind, setLibraryKind] = React.useState("");
  const [album, setAlbum] = React.useState("");
  const [amThanh, setAmThanh] = React.useState("");
  // Bài của người dùng: lưu thành đề xuất sửa, kèm lời nhắn cho tác giả.
  const [loiNhan, setLoiNhan] = React.useState("");

  React.useEffect(() => {
    layChuyenMuc(locale).then(setChuyenMuc).catch(() => setChuyenMuc([]));
  }, [locale]);

  React.useEffect(() => {
    if (!id) return;

    let conSong = true;
    setDangTai(true);
    layBai(id, locale)
      .then((goc0) => {
        if (!conSong) return;
        // Đang có đề xuất sửa chờ tác giả: mở bản đề xuất để sửa tiếp (lưu lại = cập nhật đề xuất).
        const bai = { ...goc0, ...(goc0.pendingEditFields ?? {}) } as BaiChiTiet;
        setGoc(goc0);
        setLibraryKind(bai.libraryKind ?? "");
        setAlbum((bai.gallery ?? []).map((a) => (a.caption ? `${a.url} | ${a.caption}` : a.url)).join("\n"));
        setAmThanh(typeof bai.media?.url === "string" ? bai.media.url : "");
        setType(bai.type);
        setTitle(bai.title);
        setSlug(bai.slug);
        setSummary(bai.summary);
        setCoverUrl(bai.coverUrl);
        setTags((bai.tags ?? []).join(", "));
        setDanhMuc(bai.categories?.[0]?.slug ?? "");
        setTenTacGia(bai.author?.name ?? "");
        setChucDanh(bai.author?.title ?? "");
        setPhapDanh(bai.author?.dharmaName ?? "");
        setTheoHoSo(!!bai.author?.fromProfile);
        setNguonTen(bai.source?.name ?? "");
        setNguonUrl(bai.source?.url ?? "");
        const dg = bai.translator ?? {};
        setDichGia(
          dg.userId
            ? { cach: "nguoiDung", chon: { id: dg.userId, name: dg.name ?? "", dharmaName: dg.dharmaName ?? "" }, ten: "", phapDanh: "" }
            : { cach: dg.name ? "tay" : "nguoiDung", chon: null, ten: dg.name ?? "", phapDanh: dg.dharmaName ?? "" },
        );
        setBodyHtml(bai.bodyHtml ?? "");
        setChuong(bai.chapters ?? []);
      })
      .catch((err) => conSong && setLoi(chuLoi(err, "Không tải được bài.")))
      .finally(() => conSong && setDangTai(false));

    return () => {
      conSong = false;
    };
  }, [id, locale]);

  if (dangTai) return <Card className="p-6 text-sm text-muted">Đang tải…</Card>;

  const gui = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setLoi("Vui lòng nhập tiêu đề.");
      return;
    }
    // Backend cũng chặn (sutraSourceRequired); báo sớm ở đây để khỏi mất một lượt gửi.
    if (laKinh && !nguonTen.trim()) {
      setLoi("Kinh sách bắt buộc ghi nguồn tham khảo.");
      return;
    }
    if (type === "library" && !libraryKind) {
      setLoi("Chọn danh mục thư viện.");
      return;
    }

    const muc = chuyenMuc.find((c) => c.slug === danhMuc);
    const than = {
      type,
      title: title.trim(),
      summary: summary.trim(),
      coverUrl: coverUrl.trim(),
      bodyHtml,
      // Theo hồ sơ: backend tự điền họ tên + pháp danh, tên gửi kèm bị bỏ qua.
      // Gõ tay: bỏ ô trống, vì gửi { name: "" } lên thì phần công khai coi là
      // "có tác giả" và hiện ra một dòng trắng.
      author: theoHoSo
        ? { fromProfile: true }
        : tenTacGia.trim()
          ? { name: tenTacGia.trim(), title: chucDanh.trim(), dharmaName: phapDanh.trim() }
          : {},
      source: nguonTen.trim() ? { name: nguonTen.trim(), url: nguonUrl.trim() } : {},
      // Chọn người dùng: chỉ gửi userId, backend tự đọc tên + pháp danh từ hồ sơ.
      ...(laKinh
        ? {
            translator:
              dichGia.cach === "nguoiDung"
                ? dichGia.chon
                  ? { userId: dichGia.chon.id }
                  : {}
                : dichGia.ten.trim()
                  ? { name: dichGia.ten.trim(), dharmaName: dichGia.phapDanh.trim() }
                  : {},
          }
        : {}),
      categories: muc ? [{ slug: muc.slug, name: muc.name }] : [],
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      ...(coChuong ? { chapters: chuong } : {}),
      ...(type === "library"
        ? {
            libraryKind,
            gallery: album
              .split("\n")
              .map((d) => d.trim())
              .filter(Boolean)
              .map((d) => {
                const [url, ...chu] = d.split("|");
                return { url: url.trim(), caption: chu.join("|").trim() };
              }),
            media: amThanh.trim() ? { provider: "self", url: amThanh.trim() } : {},
          }
        : {}),
      ...(goc?.ownerIsUser ? { editNote: loiNhan.trim() } : {}),
      // Slug chỉ gửi khi người dùng thật sự nhập; để trống lúc tạo thì backend
      // tự sinh từ tiêu đề.
      ...(slug.trim() ? { slug: slug.trim() } : {}),
    };

    setDangLuu(true);
    setLoi("");
    try {
      if (goc) await luuBai({ ...than, id: goc.id }, locale);
      else await taoBai(than, locale);
      onLuuXong();
    } catch (err) {
      setLoi(chuLoi(err));
      setDangLuu(false);
    }
  };

  return (
    <form onSubmit={gui} className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="ghost" onClick={onThoat}>
          <ArrowLeft aria-hidden /> Danh sách
        </Button>
        <h1 className="font-serif text-xl font-bold">
          {goc ? `Sửa: ${goc.title}` : "Thêm bài mới"}
        </h1>
        {goc ? (
          <div className="ml-auto flex items-center gap-2">
            <Badge tone={tongMau[goc.status]}>{nhanTrangThai[goc.status]}</Badge>
            {goc.status === "published" ? (
              <Button type="button" size="sm" variant="outline" asChild>
                <a
                  href={localePath(locale, `${contentTypeBase[goc.type]}/${goc.slug}`)}
                  target="_blank"
                  rel="noopener"
                >
                  <ExternalLink aria-hidden /> Xem bài
                </a>
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      <HopLoi loi={loi} />

      {goc?.ownerIsUser ? (
        <Card className="flex flex-col gap-3 border-brass/50 p-5">
          <p className="text-sm text-body">
            <span className="font-semibold text-ink">Bài do người dùng viết.</span> Lưu thay đổi sẽ{" "}
            <span className="font-medium">không ghi đè</span> mà gửi thành đề xuất sửa cho tác giả. Trang công khai
            vẫn hiện bản hiện tại cho tới khi tác giả đồng ý; đồng ý xong bài được đăng.
          </p>
          {goc.pendingEdit ? (
            <p className="text-sm text-brass">
              Đang có đề xuất của {goc.pendingEdit.byName || "ban biên tập"} chờ tác giả (form dưới đây là bản đề
              xuất). Lưu lại sẽ thay đề xuất cũ.
            </p>
          ) : null}
          <Field id="c-note" label="Lời nhắn cho tác giả" hint="Tuỳ chọn — giải thích vì sao sửa">
            {(p) => <Input {...p} value={loiNhan} onChange={(e) => setLoiNhan(e.target.value)} maxLength={500} />}
          </Field>
        </Card>
      ) : null}

      <Card className="grid gap-5 p-6 sm:grid-cols-2">
        <Field id="c-title" label="Tiêu đề" required className="sm:col-span-2">
          {(p) => (
            <Input {...p} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} required />
          )}
        </Field>

        <Field id="c-type" label="Loại nội dung">
          {(p) => (
            <Select {...p} value={type} onChange={(e) => setType(e.target.value)}>
              {loaiChon.map((l) => (
                <option key={l} value={l}>
                  {nhanLoai[l]}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field
          id="c-slug"
          label="Đường dẫn"
          hint={goc ? "Đổi đường dẫn sẽ làm hỏng các liên kết cũ" : "Bỏ trống để tự sinh từ tiêu đề"}
        >
          {(p) => (
            <Input
              {...p}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="vi-du-duong-dan"
              maxLength={90}
            />
          )}
        </Field>

        <Field id="c-summary" label="Tóm tắt" className="sm:col-span-2">
          {(p) => (
            <Input {...p} value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={400} />
          )}
        </Field>

        <Field id="c-cat" label="Chuyên mục">
          {(p) => (
            <Select {...p} value={danhMuc} onChange={(e) => setDanhMuc(e.target.value)}>
              <option value="">— Không thuộc chuyên mục nào —</option>
              {chuyenMuc.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field id="c-tags" label="Thẻ" hint="Cách nhau bằng dấu phẩy">
          {(p) => <Input {...p} value={tags} onChange={(e) => setTags(e.target.value)} />}
        </Field>

        {laKinh ? (
          <>
            <p className="rounded-md bg-surface-2 px-4 py-3 text-sm text-muted sm:col-span-2">
              Người đăng:{" "}
              <span className="font-medium text-ink">
                {goc?.audit?.createdByName || hoSoToi?.fullName || hoSoToi?.username || "—"}
              </span>{" "}
              — tự ghi theo tài khoản tạo kinh sách và hiện trên trang công khai.
            </p>
            <KhoiDichGia giaTri={dichGia} onDoi={setDichGia} />
          </>
        ) : (
        <div className="flex flex-col gap-3 rounded-md border border-line p-4 sm:col-span-2">
          <label className="flex w-fit cursor-pointer items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={theoHoSo}
              onChange={(e) => setTheoHoSo(e.target.checked)}
              className="size-4 accent-accent"
            />
            <span className="font-medium text-ink">Tác giả là người đăng (lấy theo hồ sơ)</span>
          </label>

          {theoHoSo ? (
            <p className="text-sm text-muted">
              {/*
                Bài đã có người tạo khác mình thì backend giữ hồ sơ của người đó
                (xem chuanHoaTacGia ở Admin/ContentController) - báo đúng như vậy.
              */}
              {goc?.authorId && hoSoToi && goc.authorId !== hoSoToi.id ? (
                <>Họ tên và pháp danh lấy từ hồ sơ của người đã tạo bài này</>
              ) : (
                <>
                  Hiện là:{" "}
                  <span className="font-medium text-ink">
                    {hoSoToi?.fullName || hoSoToi?.username || "—"}
                  </span>
                  {hoSoToi?.dharmaName ? <> · Pháp danh: {hoSoToi.dharmaName}</> : null}
                </>
              )}
              . Khi hồ sơ đổi họ tên hoặc pháp danh, bài tự cập nhật theo.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              <Field id="c-author" label="Tác giả / dịch giả">
                {(p) => (
                  <Input
                    {...p}
                    value={tenTacGia}
                    onChange={(e) => setTenTacGia(e.target.value)}
                    maxLength={120}
                  />
                )}
              </Field>

              <Field id="c-dharma" label="Pháp danh">
                {(p) => (
                  <Input {...p} value={phapDanh} onChange={(e) => setPhapDanh(e.target.value)} maxLength={80} />
                )}
              </Field>

              <Field id="c-title2" label="Chức danh" hint="Hoà thượng, Thượng toạ, Cư sĩ…">
                {(p) => (
                  <Input {...p} value={chucDanh} onChange={(e) => setChucDanh(e.target.value)} maxLength={60} />
                )}
              </Field>
            </div>
          )}
        </div>

        )}

        <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
          <Field
            id="c-source"
            label="Nguồn tham khảo"
            required={laKinh}
            hint={laKinh ? "Bắt buộc với kinh sách: bản kinh, bộ Tạng, nhà xuất bản…" : "Tuỳ chọn"}
          >
            {(p) => (
              <Input {...p} value={nguonTen} onChange={(e) => setNguonTen(e.target.value)} maxLength={200} />
            )}
          </Field>
          <Field id="c-source-url" label="Đường dẫn nguồn" hint="Tuỳ chọn">
            {(p) => (
              <Input
                {...p}
                type="url"
                value={nguonUrl}
                onChange={(e) => setNguonUrl(e.target.value)}
                maxLength={500}
                placeholder="https://…"
              />
            )}
          </Field>
        </div>

        {type === "library" ? (
          <>
            <Field id="c-libkind" label="Danh mục thư viện" required>
              {(p) => (
                <Select {...p} value={libraryKind} onChange={(e) => setLibraryKind(e.target.value)}>
                  <option value="">— Chọn —</option>
                  {Object.entries(nhanDanhMucThuVien).map(([k, ten]) => (
                    <option key={k} value={k}>
                      {ten}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field id="c-audio" label="Tệp âm thanh" hint="Nhạc thiền / audio bài giảng: đường dẫn MP3">
              {(p) => <Input {...p} value={amThanh} onChange={(e) => setAmThanh(e.target.value)} placeholder="https://…" />}
            </Field>
            <Field
              id="c-album"
              label="Album ảnh"
              hint="Mỗi dòng một ảnh: đường dẫn | chú thích (chú thích tuỳ chọn)"
              className="sm:col-span-2"
            >
              {(p) => (
                <textarea
                  id={p.id}
                  value={album}
                  onChange={(e) => setAlbum(e.target.value)}
                  rows={5}
                  className={oVanBan}
                  placeholder="https://…/anh-1.jpg | Chánh điện"
                />
              )}
            </Field>
          </>
        ) : null}

        <Field id="c-cover" label="Ảnh bìa" hint="Đường dẫn ảnh; để trống thì trang tự chọn ảnh" className="sm:col-span-2">
          {(p) => <Input {...p} value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} />}
        </Field>
      </Card>

      <Card className="flex flex-col gap-3 p-6">
        <div className="flex flex-col gap-1">
          <h2 className="font-serif text-lg font-bold">Nội dung</h2>
          <p className="text-sm text-muted">
            Nhập HTML. Phần công khai lọc lại bằng allow-list trước khi hiển thị, nên thẻ script
            hay style sẽ bị bỏ.
          </p>
        </div>
        <textarea
          value={bodyHtml}
          onChange={(e) => setBodyHtml(e.target.value)}
          rows={14}
          className={oVanBan}
          aria-label="Nội dung HTML"
        />
      </Card>

      {coChuong ? (
        <KhoiChuong chuong={chuong} onDoi={setChuong} />
      ) : null}

      {/*
        Thanh nút dính đáy màn hình: form dài (thân bài, chương kinh) vẫn bấm lưu
        được ngay mà không phải cuộn xuống cuối.
      */}
      <div className="sticky bottom-0 z-20 -mx-4 flex flex-wrap items-center gap-3 border-t border-line bg-surface/95 px-4 py-3 shadow-[0_-6px_16px_-12px_rgba(0,0,0,0.25)] backdrop-blur sm:-mx-6 sm:px-6">
        <Button type="submit" size="lg" disabled={dangLuu}>
          {dangLuu
            ? "Đang lưu…"
            : goc?.ownerIsUser
              ? "Gửi đề xuất sửa cho tác giả"
              : goc
                ? "Lưu thay đổi"
                : laKinh
                  ? "Thêm kinh sách"
                  : type === "library"
                    ? "Thêm nội dung thư viện"
                    : "Thêm bài viết"}
        </Button>
        <Button type="button" variant="ghost" onClick={onThoat}>
          Huỷ
        </Button>
        {!goc ? (
          <p className="text-xs text-muted">
            Bài mới lưu ở dạng nháp. Duyệt để đăng ở màn hình danh sách.
          </p>
        ) : null}
      </div>

      {goc ? <KhoiLichSu bai={goc} /> : null}
    </form>
  );
}

/* ------------------------------------------------------------------ */

const ngayGio = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const nhanTT = (tt: string) => nhanTrangThai[tt as TrangThai] ?? tt;

/** Một dòng nhật ký -> câu đọc được. */
function moTaThaoTac(nk: NhatKyBai): string {
  if (nk.action === "create") return "Tạo bài";
  if (nk.action === "import") return `Nhập từ tệp (${nhanTT(nk.toStatus)})`;
  if (nk.action === "delete") return "Xoá bài";
  if (nk.action === "status") {
    if (nk.toStatus === "published") return "Duyệt đăng";
    return `Đổi trạng thái: ${nhanTT(nk.fromStatus)} → ${nhanTT(nk.toStatus)}`;
  }
  const truong = nk.changedFields.map((t) => nhanTruong[t] ?? t).join(", ");
  return truong ? `Sửa: ${truong}` : "Sửa bài";
}

/**
 * Truy vết của một bài: tóm tắt ai tạo / sửa cuối / duyệt, và toàn bộ diễn biến.
 * Bài tạo trước khi có tính năng nhật ký sẽ thiếu phần tóm tắt và các dòng cũ.
 */
function KhoiLichSu({ bai }: { bai: BaiChiTiet }) {
  const locale = useLocale();
  const [ds, setDs] = React.useState<NhatKyBai[] | null>(null);
  const [loi, setLoi] = React.useState("");
  const [moRong, setMoRong] = React.useState(false);
  /** Các dòng nhật ký đang mở phần đối chiếu nội dung. */
  const [dangXem, setDangXem] = React.useState<Set<string>>(new Set());
  const batTat = (id: string) =>
    setDangXem((cu) => {
      const moi = new Set(cu);
      if (moi.has(id)) moi.delete(id);
      else moi.add(id);
      return moi;
    });

  React.useEffect(() => {
    let conSong = true;
    layLichSuBai(bai.id, locale)
      .then((kq) => conSong && setDs(kq))
      .catch((err) => conSong && setLoi(chuLoi(err, "Không tải được lịch sử.")));
    return () => {
      conSong = false;
    };
  }, [bai.id, locale]);

  const av = bai.audit;
  const tomTat = [
    { nhan: "Người tạo", ten: av?.createdByName, luc: bai.createdAt },
    { nhan: "Sửa gần nhất", ten: av?.updatedByName, luc: bai.updatedAt },
    { nhan: "Duyệt đăng", ten: av?.approvedByName, luc: av?.approvedAt },
  ];
  const hien = moRong ? ds ?? [] : (ds ?? []).slice(0, 8);

  return (
    <Card className="flex flex-col gap-4 p-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-serif text-lg font-bold">Lịch sử &amp; truy vết</h2>
        <p className="text-sm text-muted">
          Ghi tự động mỗi lần tạo, sửa, đổi trạng thái hay xoá bài — kèm người thao tác, thời điểm
          và địa chỉ IP. Nhật ký không sửa, không xoá được.
        </p>
      </div>

      <dl className="grid gap-3 sm:grid-cols-3">
        {tomTat.map((m) => (
          <div key={m.nhan} className="flex flex-col gap-0.5 rounded-md bg-surface-2 p-3">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
              {m.nhan}
            </dt>
            <dd className="text-sm font-medium text-ink">{m.ten || "—"}</dd>
            <dd className="text-xs tabular-nums text-muted">{m.ten ? ngayGio(m.luc) : ""}</dd>
          </div>
        ))}
      </dl>

      <HopLoi loi={loi} />

      {ds === null ? (
        <p className="text-sm text-muted">Đang tải…</p>
      ) : ds.length === 0 ? (
        <p className="text-sm text-muted">
          Chưa có dòng nhật ký nào (bài tạo trước khi bật tính năng truy vết).
        </p>
      ) : (
        <ol className="flex flex-col border-l border-line">
          {hien.map((nk) => (
            <li key={nk.id} className="relative flex flex-col gap-0.5 py-2 pl-5 text-sm">
              <span
                aria-hidden
                className={
                  "absolute -left-[5px] top-3.5 size-2.5 rounded-full border-2 border-surface " +
                  (nk.action === "status" && nk.toStatus === "published"
                    ? "bg-accent"
                    : nk.action === "delete"
                      ? "bg-lacquer"
                      : "bg-line-strong")
                }
              />
              <span className="text-ink">{moTaThaoTac(nk)}</span>
              <span className="text-xs text-muted">
                {nk.actorName || "—"}
                {nk.actorUsername && nk.actorUsername !== nk.actorName ? ` (@${nk.actorUsername})` : ""}
                {" · "}
                <span className="tabular-nums">{ngayGio(nk.createdAt)}</span>
                {nk.ip ? ` · IP ${nk.ip}` : ""}
              </span>
              {nk.hasRevision ? (
                <div className="flex flex-col gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => batTat(nk.id)}
                    aria-expanded={dangXem.has(nk.id)}
                    className="w-fit text-xs font-medium text-accent hover:underline"
                  >
                    {dangXem.has(nk.id)
                      ? "Ẩn nội dung"
                      : nk.action === "update"
                        ? "Xem nội dung đã sửa"
                        : "Xem nội dung"}
                  </button>
                  {dangXem.has(nk.id) ? <RevisionDiff logId={nk.id} /> : null}
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      )}

      {ds && ds.length > 8 ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => setMoRong((x) => !x)}
        >
          {moRong ? "Thu gọn" : `Xem toàn bộ (${ds.length})`}
        </Button>
      ) : null}
    </Card>
  );
}

/* ------------------------------------------------------------------ */

type GiaTriDichGia = {
  /** "nguoiDung" = chọn người trong hệ thống; "tay" = nhập tên tự do. */
  cach: "nguoiDung" | "tay";
  chon: NguoiChon | null;
  ten: string;
  phapDanh: string;
};

/**
 * Dịch giả kinh sách: chọn một người dùng (tên + pháp danh lấy từ hồ sơ và tự
 * cập nhật khi họ đổi hồ sơ) hoặc nhập tay cho dịch giả ngoài hệ thống.
 */
function KhoiDichGia({
  giaTri,
  onDoi,
}: {
  giaTri: GiaTriDichGia;
  onDoi: (moi: GiaTriDichGia) => void;
}) {
  const locale = useLocale();
  const [tuKhoa, setTuKhoa] = React.useState("");
  const [ketQua, setKetQua] = React.useState<NguoiChon[] | null>(null);
  const [dangTim, setDangTim] = React.useState(false);

  // Tìm sau khi ngừng gõ 300ms, khỏi gọi API mỗi phím.
  React.useEffect(() => {
    if (giaTri.cach !== "nguoiDung" || giaTri.chon) return;
    let conSong = true;
    const hen = window.setTimeout(() => {
      setDangTim(true);
      timNguoi(tuKhoa.trim(), locale)
        .then((ds) => conSong && setKetQua(ds))
        .catch(() => conSong && setKetQua([]))
        .finally(() => conSong && setDangTim(false));
    }, 300);
    return () => {
      conSong = false;
      window.clearTimeout(hen);
    };
  }, [tuKhoa, locale, giaTri.cach, giaTri.chon]);

  return (
    <div className="flex flex-col gap-3 rounded-md border border-line p-4 sm:col-span-2">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <span className="font-medium text-ink">Dịch giả</span>
        {(
          [
            { id: "nguoiDung", nhan: "Chọn người dùng" },
            { id: "tay", nhan: "Nhập tay" },
          ] as const
        ).map((c) => (
          <label key={c.id} className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="cach-dich-gia"
              checked={giaTri.cach === c.id}
              onChange={() => onDoi({ ...giaTri, cach: c.id })}
              className="size-4 accent-accent"
            />
            {c.nhan}
          </label>
        ))}
      </div>

      {giaTri.cach === "nguoiDung" ? (
        giaTri.chon ? (
          <div className="flex flex-wrap items-center gap-3 rounded-md bg-surface-2 px-3 py-2 text-sm">
            <span>
              <span className="font-medium text-ink">{giaTri.chon.name || "—"}</span>
              {giaTri.chon.dharmaName ? (
                <span className="text-accent"> · Pháp danh: {giaTri.chon.dharmaName}</span>
              ) : null}
            </span>
            <span className="text-xs text-muted">Tự cập nhật khi người này đổi hồ sơ.</span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="ml-auto"
              onClick={() => onDoi({ ...giaTri, chon: null })}
            >
              Đổi người
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Input
              value={tuKhoa}
              onChange={(e) => setTuKhoa(e.target.value)}
              placeholder="Tìm theo họ tên, pháp danh hoặc tên tài khoản…"
              aria-label="Tìm dịch giả"
            />
            {dangTim && !ketQua ? <p className="text-xs text-muted">Đang tìm…</p> : null}
            {ketQua && ketQua.length === 0 ? (
              <p className="text-xs text-muted">
                Không có người dùng nào khớp. Dịch giả ngoài hệ thống thì chọn “Nhập tay”.
              </p>
            ) : null}
            {ketQua && ketQua.length > 0 ? (
              <ul className="flex max-h-56 flex-col divide-y divide-line overflow-y-auto rounded-md border border-line">
                {ketQua.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => onDoi({ ...giaTri, chon: n })}
                      className="flex w-full items-baseline gap-2 px-3 py-2 text-left text-sm hover:bg-surface-2"
                    >
                      <span className="font-medium text-ink">{n.name || "—"}</span>
                      {n.dharmaName ? <span className="text-xs text-accent">Pháp danh: {n.dharmaName}</span> : null}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        )
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="c-tr-name" label="Tên dịch giả">
            {(p) => (
              <Input
                {...p}
                value={giaTri.ten}
                onChange={(e) => onDoi({ ...giaTri, ten: e.target.value })}
                maxLength={120}
              />
            )}
          </Field>
          <Field id="c-tr-dharma" label="Pháp danh" hint="Tuỳ chọn">
            {(p) => (
              <Input
                {...p}
                value={giaTri.phapDanh}
                onChange={(e) => onDoi({ ...giaTri, phapDanh: e.target.value })}
                maxLength={80}
              />
            )}
          </Field>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function KhoiChuong({
  chuong,
  onDoi,
}: {
  chuong: Chuong[];
  onDoi: (moi: Chuong[]) => void;
}) {
  const sua = (i: number, phan: Partial<Chuong>) =>
    onDoi(chuong.map((c, j) => (i === j ? { ...c, ...phan } : c)));

  return (
    <Card className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h2 className="font-serif text-lg font-bold">Các chương</h2>
          <p className="text-sm text-muted">
            Kinh dài chia theo chương để đọc và tra. Không có chương nào thì phần Nội dung ở trên
            được dùng làm toàn văn.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            onDoi([...chuong, { order: chuong.length + 1, title: "", slug: "", bodyHtml: "" }])
          }
        >
          <Plus aria-hidden /> Thêm chương
        </Button>
      </div>

      {chuong.length === 0 ? (
        <p className="text-sm text-muted">Chưa có chương nào.</p>
      ) : (
        <ol className="flex flex-col gap-5">
          {chuong.map((c, i) => (
            <li key={i} className="flex flex-col gap-3 rounded-card border border-line p-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-ink">Chương {i + 1}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="ml-auto"
                  aria-label={`Xoá chương ${i + 1}`}
                  onClick={() => {
                    if (confirm(`Xoá chương ${i + 1}${c.title ? ` — ${c.title}` : ""}?`)) {
                      onDoi(chuong.filter((_, j) => j !== i));
                    }
                  }}
                >
                  <Trash2 aria-hidden />
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field id={`ch-t-${i}`} label="Tiêu đề chương">
                  {(p) => (
                    <Input
                      {...p}
                      value={c.title}
                      onChange={(e) => sua(i, { title: e.target.value })}
                      maxLength={200}
                    />
                  )}
                </Field>
                <Field id={`ch-s-${i}`} label="Đường dẫn chương">
                  {(p) => (
                    <Input
                      {...p}
                      value={c.slug}
                      onChange={(e) => sua(i, { slug: e.target.value })}
                      placeholder="pham-thu-nhat"
                      maxLength={90}
                    />
                  )}
                </Field>
              </div>

              <textarea
                value={c.bodyHtml ?? ""}
                onChange={(e) => sua(i, { bodyHtml: e.target.value })}
                rows={6}
                className={oVanBan}
                aria-label={`Nội dung chương ${i + 1}`}
              />
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
