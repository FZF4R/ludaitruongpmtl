"use client";

import * as React from "react";
import { Plus, Search, Trash2, Check, ArrowLeft } from "lucide-react";
import { Badge, Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { HopLoi, chuLoi, useLocale } from "@/components/admin/admin-shell";
import {
  doiTrangThai,
  layBai,
  layChuyenMuc,
  layDanhSachBai,
  luuBai,
  nhanLoai,
  nhanTrangThai,
  taoBai,
  trangThai as moiTrangThai,
  xoaBai,
  type BaiChiTiet,
  type BaiTomTat,
  type Chuong,
  type ChuyenMuc,
  type LoaiNoiDung,
  type TrangThai,
} from "@/lib/admin-api";

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
}: {
  /** Danh sách type gửi cho API, phân tách bằng dấu phẩy. */
  loai: string;
  /** Những type người dùng được chọn khi tạo bài ở trang này. */
  loaiChon: LoaiNoiDung[];
  tieuDe: string;
  moTa: string;
  /** Kinh sách chia chương; bài viết thì không. */
  coChuong?: boolean;
}) {
  const locale = useLocale();

  const [locTrangThai, setLocTrangThai] = React.useState<TrangThai | "">("");
  const [tuKhoa, setTuKhoa] = React.useState("");
  const [daGui, setDaGui] = React.useState("");
  const [trang, setTrang] = React.useState(1);

  const [danhSach, setDanhSach] = React.useState<BaiTomTat[]>([]);
  const [tong, setTong] = React.useState(0);
  const [thongKe, setThongKe] = React.useState<Record<string, number>>({});
  const [dangTai, setDangTai] = React.useState(true);
  const [loi, setLoi] = React.useState("");
  const [ban, setBan] = React.useState(false);

  /** null = đang xem danh sách, "moi" = tạo bài, còn lại là id đang sửa. */
  const [dangSoan, setDangSoan] = React.useState<string | null>(null);

  const nap = React.useCallback(() => {
    setDangTai(true);
    setLoi("");
    layDanhSachBai(
      { type: loai, status: locTrangThai || undefined, q: daGui, page: trang, limit: MOI_TRANG },
      locale,
    )
      .then((kq) => {
        setDanhSach(kq.data ?? []);
        setTong(kq.total ?? 0);
        setThongKe(kq.stats ?? {});
      })
      .catch((err) => setLoi(chuLoi(err, "Không tải được danh sách.")))
      .finally(() => setDangTai(false));
  }, [loai, locTrangThai, daGui, trang, locale]);

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
        <Button onClick={() => setDangSoan("moi")}>
          <Plus aria-hidden /> Thêm mới
        </Button>
      </div>

      <HopLoi loi={loi} thuLai={nap} />

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
              placeholder="Tìm theo tiêu đề…"
              aria-label="Tìm bài"
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="outline">
            Tìm
          </Button>
        </form>
      </div>

      <Card className="flex flex-col overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[46rem] text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-2 text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-2.5 font-medium">Tiêu đề</th>
                <th className="px-4 py-2.5 font-medium">Trạng thái</th>
                <th className="px-4 py-2.5 font-medium">Cập nhật</th>
                <th className="px-4 py-2.5 font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {dangTai ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-muted">
                    Đang tải…
                  </td>
                </tr>
              ) : danhSach.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-muted">
                    Chưa có bài nào ở mục này.
                  </td>
                </tr>
              ) : (
                danhSach.map((bai) => (
                  <tr key={bai.id} className="border-b border-line last:border-0 align-top">
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-ink">{bai.title}</span>
                        <span className="text-xs text-muted">
                          {nhanLoai[bai.type] ?? bai.type} · /{bai.slug}
                          {bai.chapterCount ? ` · ${bai.chapterCount} chương` : ""}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={tongMau[bai.status]}>{nhanTrangThai[bai.status]}</Badge>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-muted">{gonNgay(bai.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <Button size="sm" variant="outline" onClick={() => setDangSoan(bai.id)}>
                          Sửa
                        </Button>

                        {bai.status !== "published" ? (
                          <Button
                            size="sm"
                            disabled={ban}
                            onClick={() => chay(() => doiTrangThai(bai.id, "published", locale))}
                          >
                            <Check aria-hidden /> Duyệt
                          </Button>
                        ) : null}

                        {bai.status !== "archived" ? (
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
  const [bodyHtml, setBodyHtml] = React.useState("");
  const [chuong, setChuong] = React.useState<Chuong[]>([]);

  React.useEffect(() => {
    layChuyenMuc(locale).then(setChuyenMuc).catch(() => setChuyenMuc([]));
  }, [locale]);

  React.useEffect(() => {
    if (!id) return;

    let conSong = true;
    setDangTai(true);
    layBai(id, locale)
      .then((bai) => {
        if (!conSong) return;
        setGoc(bai);
        setType(bai.type);
        setTitle(bai.title);
        setSlug(bai.slug);
        setSummary(bai.summary);
        setCoverUrl(bai.coverUrl);
        setTags((bai.tags ?? []).join(", "));
        setDanhMuc(bai.categories?.[0]?.slug ?? "");
        setTenTacGia(bai.author?.name ?? "");
        setChucDanh(bai.author?.title ?? "");
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

    const muc = chuyenMuc.find((c) => c.slug === danhMuc);
    const than = {
      type,
      title: title.trim(),
      summary: summary.trim(),
      coverUrl: coverUrl.trim(),
      bodyHtml,
      // Bỏ ô trống: gửi { name: "" } lên thì phần công khai coi là "có tác giả"
      // và hiện ra một dòng trắng.
      author: tenTacGia.trim() ? { name: tenTacGia.trim(), title: chucDanh.trim() } : {},
      categories: muc ? [{ slug: muc.slug, name: muc.name }] : [],
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      ...(coChuong ? { chapters: chuong } : {}),
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
          <Badge tone={tongMau[goc.status]} className="ml-auto">
            {nhanTrangThai[goc.status]}
          </Badge>
        ) : null}
      </div>

      <HopLoi loi={loi} />

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

        <Field id="c-author" label="Tác giả / dịch giả">
          {(p) => (
            <Input {...p} value={tenTacGia} onChange={(e) => setTenTacGia(e.target.value)} maxLength={120} />
          )}
        </Field>

        <Field id="c-title2" label="Chức danh" hint="Hoà thượng, Thượng toạ, Cư sĩ…">
          {(p) => (
            <Input {...p} value={chucDanh} onChange={(e) => setChucDanh(e.target.value)} maxLength={60} />
          )}
        </Field>

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

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="lg" disabled={dangLuu}>
          {dangLuu ? "Đang lưu…" : goc ? "Lưu thay đổi" : "Tạo bài (ở dạng nháp)"}
        </Button>
        <Button type="button" variant="ghost" onClick={onThoat}>
          Huỷ
        </Button>
        {!goc ? (
          <p className="text-xs text-muted">
            Bài mới luôn ở dạng nháp. Duyệt để đăng ở màn hình danh sách.
          </p>
        ) : null}
      </div>
    </form>
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
