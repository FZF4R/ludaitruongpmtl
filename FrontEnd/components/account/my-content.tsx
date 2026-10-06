"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, ExternalLink, ImagePlus, Music, PenLine, Plus, Trash2, Upload, X } from "lucide-react";
import { Badge, Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { useCheDoSua } from "@/components/layout/inline-edit";
import { LoiApi } from "@/lib/auth";
import { localePath, splitLocale, type Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/dictionary";
import { contentTypeBase } from "@/lib/site";
import {
  dongYDeXuat,
  layBaiCuaToi,
  layChiTietBaiCuaToi,
  luuBaiCuaToi,
  taiTep,
  tuChoiDeXuat,
  xoaBaiCuaToi,
  type BaiCuaToi,
  type BaiCuaToiChiTiet,
  type DanhSachCuaToi,
  type LoaiBaiCuaToi,
  type ThayDoi,
  type TrangThaiBai,
} from "@/lib/my-content";
import { cn } from "@/lib/utils";

type Nhan = Dictionary["myContent"];
type NhanThuVien = Dictionary["library"];

const TRANG_THAI: TrangThaiBai[] = ["draft", "pending", "published", "archived"];
// "audio-kinh" (Audio bài giảng) chỉ ban quản trị đăng ở khu quản trị - backend chặn libraryKindAdminOnly.
const DANH_MUC_TV = ["anh", "review", "bo-tat", "nhac-thien"] as const;
/** Danh mục dùng album ảnh / tệp âm thanh. */
const CO_ALBUM = ["anh", "bo-tat", "review"];
const CO_AM_THANH = ["nhac-thien", "audio-kinh"];

const mauTT: Record<TrangThaiBai, "neutral" | "accent" | "brass"> = {
  draft: "neutral",
  pending: "brass",
  published: "accent",
  archived: "neutral",
};

const loiCua = (err: unknown, mac: string) => (err instanceof LoiApi && err.thongDiep) || mac;

/**
 * Trang "Bài viết của tôi" (/tai-khoan/bai-viet): danh sách bài + trình soạn.
 * Bài đang soạn nằm trên URL (?id=... hoặc ?moi=article|library) - thông báo
 * "đề xuất sửa" / "trả lại" dẫn thẳng vào đúng bài.
 */
export function MyContent({
  nhan,
  nhanTV,
  chuyenMuc,
}: {
  nhan: Nhan;
  nhanTV: NhanThuVien;
  chuyenMuc: { slug: string; name: string }[];
}) {
  const { locale } = splitLocale(usePathname());
  const { nguoiDungId, daBiet } = useCheDoSua();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const id = sp.get("id");
  const moi = sp.get("moi") as LoaiBaiCuaToi | null;

  const [loc, setLoc] = React.useState<TrangThaiBai | "">("");
  const [ds, setDs] = React.useState<DanhSachCuaToi | null>(null);
  const [loi, setLoi] = React.useState("");

  const nap = React.useCallback(() => {
    setLoi("");
    layBaiCuaToi({ status: loc || undefined }, locale)
      .then(setDs)
      .catch((err) => setLoi(err instanceof LoiApi && err.status === 403 ? nhan.noPermission : loiCua(err, nhan.loadError)));
  }, [loc, locale, nhan.noPermission, nhan.loadError]);

  React.useEffect(() => {
    if (daBiet && nguoiDungId) nap();
  }, [daBiet, nguoiDungId, nap]);

  if (!daBiet) return null;
  if (!nguoiDungId) {
    return (
      <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
        <span className="text-sm text-muted">{nhan.signIn}</span>
        <Button size="sm" asChild>
          <Link href={localePath(locale, "/dang-nhap")}>{nhan.signIn}</Link>
        </Button>
      </Card>
    );
  }

  const di = (q: string) => router.push(q ? `${pathname}?${q}` : pathname);

  if (id || moi) {
    return (
      <TrinhSoan
        key={id ?? moi ?? ""}
        id={id}
        loaiMoi={moi}
        nhan={nhan}
        nhanTV={nhanTV}
        chuyenMuc={chuyenMuc}
        locale={locale}
        can={ds?.can}
        onThoat={() => {
          di("");
          nap();
        }}
        onDaTao={(baiId) => router.replace(`${pathname}?id=${baiId}`)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        {ds?.can.article ? (
          <Button onClick={() => di("moi=article")}>
            <PenLine aria-hidden /> {nhan.newArticle}
          </Button>
        ) : null}
        {ds?.can.library ? (
          <Button variant="outline" onClick={() => di("moi=library")}>
            <ImagePlus aria-hidden /> {nhan.newLibrary}
          </Button>
        ) : null}
      </div>

      {loi ? <p role="alert" className="text-sm text-lacquer">{loi}</p> : null}

      {ds ? (
        <>
          <div className="flex flex-wrap gap-1.5">
            {(["", ...TRANG_THAI] as const).map((tt) => (
              <Button key={tt || "all"} size="sm" variant={loc === tt ? "solid" : "outline"} onClick={() => setLoc(tt)}>
                {tt ? nhan.statuses[tt] : nhan.all}
                <span className="opacity-70">
                  ({tt ? ds.stats[tt] : TRANG_THAI.reduce((s, t) => s + (ds.stats[t] ?? 0), 0)})
                </span>
              </Button>
            ))}
          </div>

          {ds.data.length === 0 ? (
            <Card className="p-6 text-sm text-muted">{nhan.empty}</Card>
          ) : (
            <ul className="flex flex-col gap-3">
              {ds.data.map((bai) => (
                <DongBai
                  key={bai.id}
                  bai={bai}
                  nhan={nhan}
                  nhanTV={nhanTV}
                  locale={locale}
                  onSua={() => di(`id=${bai.id}`)}
                  onXoa={async () => {
                    if (!window.confirm(nhan.confirmDelete.replace("{title}", bai.title))) return;
                    try {
                      await xoaBaiCuaToi(bai.id, locale);
                      nap();
                    } catch (err) {
                      window.alert(loiCua(err, nhan.loadError));
                    }
                  }}
                />
              ))}
            </ul>
          )}
        </>
      ) : !loi ? (
        <div className="h-40 animate-pulse rounded-lg bg-surface-2" />
      ) : null}
    </div>
  );
}

function DongBai({
  bai,
  nhan,
  nhanTV,
  locale,
  onSua,
  onXoa,
}: {
  bai: BaiCuaToi;
  nhan: Nhan;
  nhanTV: NhanThuVien;
  locale: Locale;
  onSua: () => void;
  onXoa: () => void;
}) {
  const loai = bai.type === "library" ? nhanTV.kinds[bai.libraryKind as keyof NhanThuVien["kinds"]] ?? nhan.typeLibrary : nhan.typeArticle;
  return (
    <li>
      <Card className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={mauTT[bai.status]}>{nhan.statuses[bai.status]}</Badge>
            <span className="text-xs text-muted">{loai}</span>
            {bai.hasProposal ? <Badge tone="brass">{nhan.proposalBadge}</Badge> : null}
          </div>
          <button type="button" onClick={onSua} className="text-left font-serif text-lg font-bold leading-snug text-ink hover:text-accent">
            {bai.title}
          </button>
          {bai.status === "draft" && bai.reviewNote ? (
            <p className="text-sm text-lacquer">
              {nhan.reviewNote}: {bai.reviewNote}
            </p>
          ) : null}
          <span className="text-xs text-muted">
            {new Date(bai.updatedAt).toLocaleDateString(locale === "vi" ? "vi-VN" : locale)}
            {bai.status === "published" ? ` · ${nhan.views.replace("{n}", String(bai.viewCount))}` : ""}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" variant="outline" onClick={onSua}>
            {nhan.edit}
          </Button>
          {bai.status === "published" ? (
            <Button size="sm" variant="outline" asChild>
              <a href={localePath(locale, `${contentTypeBase[bai.type]}/${bai.slug}`)} target="_blank" rel="noopener">
                <ExternalLink aria-hidden /> {nhan.view}
              </a>
            </Button>
          ) : null}
          {bai.status === "draft" || bai.status === "pending" ? (
            <Button size="sm" variant="ghost" onClick={onXoa} aria-label={nhan.delete} className="hover:text-lacquer">
              <Trash2 aria-hidden />
            </Button>
          ) : null}
        </div>
      </Card>
    </li>
  );
}

/* ------------------------------------------------------------------ */

const oVanBan =
  "w-full rounded-md border border-line bg-surface px-3 py-2 text-sm leading-relaxed text-ink placeholder:text-muted focus:border-accent focus:outline-none";

/** Văn bản thuần -> HTML đoạn văn; HTML có sẵn thì giữ nguyên. */
const sangHtml = (s: string) =>
  /<\w+[^>]*>/.test(s)
    ? s
    : s
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p) => `<p>${p.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\n/g, "<br>")}</p>`)
        .join("\n");

function TrinhSoan({
  id,
  loaiMoi,
  nhan,
  nhanTV,
  chuyenMuc,
  locale,
  can,
  onThoat,
  onDaTao,
}: {
  id: string | null;
  loaiMoi: LoaiBaiCuaToi | null;
  nhan: Nhan;
  nhanTV: NhanThuVien;
  chuyenMuc: { slug: string; name: string }[];
  locale: Locale;
  can?: DanhSachCuaToi["can"];
  onThoat: () => void;
  onDaTao: (id: string) => void;
}) {
  const [goc, setGoc] = React.useState<BaiCuaToiChiTiet | null>(null);
  const [dangTai, setDangTai] = React.useState(!!id);
  const [loi, setLoi] = React.useState("");
  const [baoXong, setBaoXong] = React.useState("");
  const [dangLuu, setDangLuu] = React.useState(false);

  const [type, setType] = React.useState<LoaiBaiCuaToi>(loaiMoi === "library" ? "library" : "article");
  const [libraryKind, setLibraryKind] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [summary, setSummary] = React.useState("");
  const [coverUrl, setCoverUrl] = React.useState("");
  const [body, setBody] = React.useState("");
  const [tags, setTags] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [gallery, setGallery] = React.useState<{ url: string; caption: string }[]>([]);
  const [audio, setAudio] = React.useState("");

  const napVao = React.useCallback((b: BaiCuaToiChiTiet) => {
    setGoc(b);
    setType(b.type);
    setLibraryKind(b.libraryKind);
    setTitle(b.title);
    setSummary(b.summary);
    setCoverUrl(b.coverUrl);
    setBody(b.bodyHtml);
    setTags(b.tags.join(", "));
    setCategory(b.categories[0]?.slug ?? "");
    setGallery(b.gallery ?? []);
    setAudio(b.media?.url ?? "");
  }, []);

  React.useEffect(() => {
    if (!id) return;
    let song = true;
    layChiTietBaiCuaToi(id, locale)
      .then((b) => song && napVao(b))
      .catch((err) => song && setLoi(loiCua(err, nhan.loadError)))
      .finally(() => song && setDangTai(false));
    return () => {
      song = false;
    };
  }, [id, locale, napVao, nhan.loadError]);

  if (dangTai) return <div className="h-64 animate-pulse rounded-lg bg-surface-2" />;

  const dangThang = type === "library" ? !!can?.publishLibrary : !!can?.publishArticle;
  const khoa = !!goc?.proposal;

  async function luu(guiDi: boolean) {
    setLoi("");
    setBaoXong("");
    if (!title.trim()) return setLoi(nhan.fTitle);
    if (type === "library" && !libraryKind) return setLoi(nhan.libraryKind);
    setDangLuu(true);
    try {
      const kq = await luuBaiCuaToi(
        {
          ...(goc ? { id: goc.id } : { type }),
          title: title.trim(),
          summary: summary.trim(),
          coverUrl: coverUrl.trim(),
          bodyHtml: sangHtml(body),
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
          ...(type === "article" ? { category } : { libraryKind, gallery, media: { url: audio.trim() } }),
          submit: guiDi,
        },
        locale,
      );
      setBaoXong(guiDi ? (kq.status === "published" ? nhan.statuses.published : nhan.statuses.pending) : nhan.statuses[kq.status]);
      if (!goc) onDaTao(kq.id);
      else napVao(kq);
    } catch (err) {
      setLoi(loiCua(err, nhan.loadError));
    } finally {
      setDangLuu(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" onClick={onThoat}>
          <ArrowLeft aria-hidden /> {nhan.back}
        </Button>
        {goc ? <Badge tone={mauTT[goc.status]}>{nhan.statuses[goc.status]}</Badge> : null}
        {goc?.status === "published" ? (
          <Button size="sm" variant="outline" asChild>
            <a href={localePath(locale, `${contentTypeBase[goc.type]}/${goc.slug}`)} target="_blank" rel="noopener">
              <ExternalLink aria-hidden /> {nhan.view}
            </a>
          </Button>
        ) : null}
      </div>

      {goc?.proposal ? (
        <KhoiDeXuat
          bai={goc}
          nhan={nhan}
          locale={locale}
          onXong={(b) => napVao(b)}
          onLoi={setLoi}
        />
      ) : null}

      {goc?.status === "draft" && goc.reviewNote ? (
        <p className="rounded-md border border-lacquer/30 bg-lacquer/5 px-4 py-3 text-sm text-lacquer">
          {nhan.reviewNote}: {goc.reviewNote}
        </p>
      ) : null}
      {goc?.status === "published" && !dangThang ? (
        <p className="rounded-md bg-surface-2 px-4 py-3 text-sm text-muted">{nhan.editPublishedNote}</p>
      ) : null}
      {dangThang ? <p className="text-sm text-muted">{nhan.directPublishNote}</p> : null}

      <fieldset disabled={khoa} className="contents">
        <Card className="grid gap-5 p-5 sm:grid-cols-2">
          <Field id="m-title" label={nhan.fTitle} required className="sm:col-span-2">
            {(p) => <Input {...p} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />}
          </Field>

          {type === "library" ? (
            <Field id="m-kind" label={nhan.libraryKind} required>
              {(p) => (
                <Select {...p} value={libraryKind} onChange={(e) => setLibraryKind(e.target.value)}>
                  <option value="">—</option>
                  {DANH_MUC_TV.map((k) => (
                    <option key={k} value={k}>
                      {nhanTV.kinds[k]}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          ) : (
            <Field id="m-cat" label={nhan.fCategory}>
              {(p) => (
                <Select {...p} value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">{nhan.noCategory}</option>
                  {chuyenMuc.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          )}

          <Field id="m-tags" label={nhan.fTags} hint={nhan.tagsHint}>
            {(p) => <Input {...p} value={tags} onChange={(e) => setTags(e.target.value)} />}
          </Field>

          <Field id="m-summary" label={nhan.fSummary} className="sm:col-span-2">
            {(p) => <Input {...p} value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={600} />}
          </Field>

          <div className="flex flex-col gap-2 sm:col-span-2">
            <span className="text-sm font-medium text-ink">{nhan.fCover}</span>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="https://…"
                aria-label={nhan.fCover}
                className="min-w-0 flex-1"
              />
              <NutTaiLen nhan={nhan} locale={locale} accept="image/*" onXong={(u) => setCoverUrl(u)} onLoi={setLoi} />
            </div>
            <span className="text-xs text-muted">{nhan.coverHint}</span>
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverUrl} alt="" className="max-h-48 w-fit rounded-md border border-line object-cover" />
            ) : null}
          </div>
        </Card>

        {type === "library" && CO_ALBUM.includes(libraryKind) ? (
          <Card className="flex flex-col gap-3 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-serif text-lg font-bold">{nhan.fGallery}</h2>
                <p className="text-xs text-muted">{nhan.galleryHint}</p>
              </div>
              <NutTaiLen
                nhan={nhan}
                locale={locale}
                accept="image/*"
                nhieu
                nhanNut={nhan.addImages}
                onXong={(u) => setGallery((cu) => [...cu, { url: u, caption: "" }].slice(0, 60))}
                onLoi={setLoi}
              />
            </div>
            {gallery.length ? (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {gallery.map((a, i) => (
                  <li key={`${a.url}-${i}`} className="flex flex-col gap-1.5">
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={a.url} alt="" className="aspect-square w-full rounded-md border border-line object-cover" />
                      <button
                        type="button"
                        aria-label={nhan.remove}
                        onClick={() => setGallery((cu) => cu.filter((_, k) => k !== i))}
                        className="absolute right-1 top-1 rounded-full bg-ink/70 p-1 text-paper hover:bg-lacquer"
                      >
                        <X className="size-3.5" aria-hidden />
                      </button>
                    </div>
                    <Input
                      value={a.caption}
                      placeholder={nhan.caption}
                      aria-label={nhan.caption}
                      onChange={(e) => setGallery((cu) => cu.map((x, k) => (k === i ? { ...x, caption: e.target.value } : x)))}
                      maxLength={300}
                    />
                  </li>
                ))}
              </ul>
            ) : null}
          </Card>
        ) : null}

        {type === "library" && CO_AM_THANH.includes(libraryKind) ? (
          <Card className="flex flex-col gap-3 p-5">
            <h2 className="flex items-center gap-2 font-serif text-lg font-bold">
              <Music className="size-4 text-accent" aria-hidden /> {nhan.fAudio}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <Input value={audio} onChange={(e) => setAudio(e.target.value)} placeholder="https://…" aria-label={nhan.fAudio} className="min-w-0 flex-1" />
              <NutTaiLen nhan={nhan} locale={locale} accept="audio/*" onXong={(u) => setAudio(u)} onLoi={setLoi} />
            </div>
            <span className="text-xs text-muted">{nhan.audioHint}</span>
            {audio ? <audio controls src={audio} className="h-10 w-full max-w-lg" /> : null}
          </Card>
        ) : null}

        <Card className="flex flex-col gap-3 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-serif text-lg font-bold">{nhan.fBody}</h2>
              <p className="text-xs text-muted">{nhan.bodyHint}</p>
            </div>
            <NutTaiLen
              nhan={nhan}
              locale={locale}
              accept="image/*"
              nhanNut={nhan.addImages}
              onXong={(u) => setBody((cu) => `${cu}${cu ? "\n\n" : ""}<p><img src="${u}" alt=""></p>`)}
              onLoi={setLoi}
            />
          </div>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={16} className={oVanBan} aria-label={nhan.fBody} />
        </Card>
      </fieldset>

      {loi ? (
        <p role="alert" className="text-sm text-lacquer">
          {loi}
        </p>
      ) : null}
      {baoXong ? (
        <p className="flex items-center gap-1.5 text-sm text-accent">
          <Check className="size-4" aria-hidden /> {baoXong}
        </p>
      ) : null}

      {!khoa ? (
        <div className="flex flex-wrap gap-3">
          <Button size="lg" disabled={dangLuu} onClick={() => luu(true)}>
            {dangLuu ? nhan.saving : dangThang ? nhan.publish : nhan.submit}
          </Button>
          {!goc || goc.status === "draft" ? (
            <Button size="lg" variant="outline" disabled={dangLuu} onClick={() => luu(false)}>
              {nhan.saveDraft}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** Nút tải tệp lên (ảnh / âm thanh). `nhieu`: chọn nhiều ảnh một lượt. */
function NutTaiLen({
  nhan,
  locale,
  accept,
  nhieu = false,
  nhanNut,
  onXong,
  onLoi,
}: {
  nhan: Nhan;
  locale: Locale;
  accept: string;
  nhieu?: boolean;
  nhanNut?: string;
  onXong: (url: string) => void;
  onLoi: (s: string) => void;
}) {
  const ref = React.useRef<HTMLInputElement>(null);
  const [dang, setDang] = React.useState(false);

  async function chon(tep: FileList | null) {
    if (!tep?.length) return;
    setDang(true);
    onLoi("");
    try {
      for (const f of Array.from(tep)) {
        const kq = await taiTep(f, locale);
        onXong(kq.url);
      }
    } catch (err) {
      onLoi(loiCua(err, nhan.uploadError));
    } finally {
      setDang(false);
      if (ref.current) ref.current.value = "";
    }
  }

  return (
    <>
      <input ref={ref} type="file" accept={accept} multiple={nhieu} className="hidden" onChange={(e) => chon(e.target.files)} />
      <Button type="button" variant="outline" size="sm" disabled={dang} onClick={() => ref.current?.click()}>
        {nhanNut ? <Plus aria-hidden /> : <Upload aria-hidden />}
        {dang ? nhan.uploading : nhanNut ?? nhan.upload}
      </Button>
    </>
  );
}

/** Văn bản đọc được cho một giá trị trường (HTML -> chữ thuần, mảng -> liệt kê). */
function hienGiaTri(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "string") return v.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || "—";
  if (Array.isArray(v))
    return v.map((x) => (typeof x === "object" && x ? (x as { name?: string; url?: string }).name ?? (x as { url?: string }).url ?? "" : String(x))).join(", ") || "—";
  if (typeof v === "object") return (v as { url?: string; name?: string }).url ?? (v as { name?: string }).name ?? JSON.stringify(v);
  return String(v);
}

function KhoiDeXuat({
  bai,
  nhan,
  locale,
  onXong,
  onLoi,
}: {
  bai: BaiCuaToiChiTiet;
  nhan: Nhan;
  locale: Locale;
  onXong: (b: BaiCuaToiChiTiet) => void;
  onLoi: (s: string) => void;
}) {
  const de = bai.proposal!;
  const [dang, setDang] = React.useState(false);
  const truong = nhan.fields as Record<string, string>;

  async function lam(viec: () => Promise<BaiCuaToiChiTiet>) {
    setDang(true);
    onLoi("");
    try {
      onXong(await viec());
    } catch (err) {
      onLoi(loiCua(err, nhan.loadError));
    } finally {
      setDang(false);
    }
  }

  return (
    <Card className="flex flex-col gap-4 border-brass/50 p-5">
      <div className="flex flex-col gap-1">
        <h2 className="font-serif text-lg font-bold text-ink">{nhan.proposal.title}</h2>
        <p className="text-sm text-muted">
          {nhan.proposal.by
            .replace("{name}", de.byName || "—")
            .replace("{date}", new Date(de.at).toLocaleString(locale === "vi" ? "vi-VN" : locale, { dateStyle: "short", timeStyle: "short" }))}
        </p>
        {de.note ? (
          <p className="text-sm text-body">
            <span className="font-medium">{nhan.proposal.note}:</span> {de.note}
          </p>
        ) : null}
        <p className="text-xs text-muted">{nhan.proposal.info}</p>
      </div>

      <div className="flex flex-col gap-3">
        {de.changes.map((c: ThayDoi) => (
          <div key={c.field} className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">{truong[c.field] ?? c.field}</span>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-md bg-lacquer/5 p-3 text-sm text-body">
                <span className="mb-1 block text-[11px] font-medium text-lacquer">{nhan.proposal.before}</span>
                <p className="line-clamp-[12] whitespace-pre-line">{hienGiaTri(c.before)}</p>
              </div>
              <div className="rounded-md bg-accent-soft/50 p-3 text-sm text-body">
                <span className="mb-1 block text-[11px] font-medium text-accent">{nhan.proposal.after}</span>
                <p className="line-clamp-[12] whitespace-pre-line">{hienGiaTri(c.after)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button disabled={dang} onClick={() => lam(() => dongYDeXuat(bai.id, locale))}>
          <Check aria-hidden /> {nhan.proposal.accept}
        </Button>
        <Button
          variant="outline"
          disabled={dang}
          className={cn("hover:text-lacquer")}
          onClick={() => {
            const lyDo = window.prompt(nhan.proposal.rejectReason, "");
            if (lyDo === null) return;
            void lam(() => tuChoiDeXuat(bai.id, lyDo, locale));
          }}
        >
          <X aria-hidden /> {nhan.proposal.reject}
        </Button>
      </div>
    </Card>
  );
}
