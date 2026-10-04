"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { useCheDoSua } from "@/components/layout/inline-edit";
import type { ThangLich, ONgay } from "@/lib/buddhist-events";
import { laySuKienNgay, type SuKienNgayDuong } from "@/lib/day-events";
import { localePath, splitLocale, type Locale } from "@/lib/i18n";
import { LoiApi } from "@/lib/auth";
import { luuSuKienNgay, xoaSuKienNgay } from "@/lib/admin-api";
import { taiTep } from "@/lib/my-content";
import { cn } from "@/lib/utils";

/**
 * Lịch tháng bên phải mục Lịch Phật giáo trang chủ: chuyển qua lại giữa các
 * tháng (đã tính sẵn trên server - lib/buddhist-events.ts cacThangToi), đánh
 * dấu ngày Trai (thập trai) và ngày có sự kiện. Bấm một ngày để xem chi tiết
 * ngay dưới lưới.
 *
 * Chuyển tháng bằng nút ‹ ›, chấm tháng bên dưới, hoặc vuốt ngang trên điện
 * thoại. Không tự chạy: lịch là thứ người ta dừng lại đọc, tự lật sẽ khó chịu.
 *
 * Sự kiện theo ngày dương (DayEvent) tải ở trình duyệt: ô có sự kiện có chấm
 * đỏ, rê chuột hiện tooltip (tiêu đề + nội dung chính), bấm ngày hiện đầy đủ
 * (ảnh + nội dung) ở khung dưới lưới. Người có quyền `calendar.manage` thêm /
 * sửa / xoá ngay ở khung đó.
 */

export type NhanLichThang = {
  weekdays: string[];
  monthTitle: string;
  prevMonth: string;
  nextMonth: string;
  traiLegend: string;
  eventLegend: string;
  traiDay: string;
  noEventDay: string;
  lunarFull: string;
  todayLabel: string;
  eventKind: Record<string, string>;
  dayEventLegend: string;
  dayEventMore: string;
};

/** Tiêu đề sự kiện ngày tối đa 80 ký tự, nội dung 3.000 (backend chặn lại). */
const TIEU_DE_TOI_DA = 80;
const NOI_DUNG_TOI_DA = 3000;

export function MonthCalendar({
  thang,
  homNay,
  nhan,
  className,
  thangDangXem,
  onDoiThang,
  chonNgay,
  onChonNgay,
  suKien,
  quanTriTaiCho = true,
  ghiChu,
}: {
  thang: ThangLich[];
  /** "YYYY-MM-DD" theo giờ Việt Nam. */
  homNay: string;
  nhan: NhanLichThang;
  className?: string;
  /** Điều khiển từ ngoài (HomeCalendar): chỉ số tháng đang xem trong `thang`. */
  thangDangXem?: number;
  onDoiThang?: (i: number) => void;
  /** Điều khiển từ ngoài: ngày đang chọn ("YYYY-MM-DD") - trang quản trị đặt form bên phải lịch. */
  chonNgay?: string;
  onChonNgay?: (iso: string) => void;
  /** Có thì dùng danh sách này (bên ngoài tự tải / cập nhật), không tự tải. */
  suKien?: SuKienNgayDuong[];
  /** false: không hiện nút thêm / sửa / xoá trong lịch (form nằm chỗ khác). */
  quanTriTaiCho?: boolean;
  /**
   * Ghi chú riêng từng ngày (vd. công đức, tu tập ở trang Quá trình tu tập):
   * `nhanO` hiện nhỏ ở góc ô, `dong` hiện ở khung chi tiết khi chọn ngày.
   */
  ghiChu?: Record<string, { nhanO?: string; dong: string[] }>;
}) {
  const { locale } = splitLocale(usePathname());
  const [iRieng, setIRieng] = React.useState(0);
  const i = thangDangXem ?? iRieng;
  const setI = (doi: number | ((cu: number) => number)) => {
    const moi = typeof doi === "function" ? doi(i) : doi;
    setIRieng(moi);
    onDoiThang?.(moi);
  };
  const [chonRieng, setChonRieng] = React.useState<string>(homNay);
  const chon = chonNgay ?? chonRieng;
  const setChon = (iso: string) => {
    setChonRieng(iso);
    onChonNgay?.(iso);
  };
  const t = thang[i];
  const ngayChon: ONgay | undefined = t?.o.find((o) => o.iso === chon && o.thuocThang);

  // Sự kiện ngày dương của cả khoảng lịch (mọi tháng trong `thang`), tải một lần.
  const { quyen } = useCheDoSua();
  const quanTri = quanTriTaiCho && quyen.includes("calendar.manage");
  const [suKienRieng, setSuKienNgay] = React.useState<SuKienNgayDuong[]>([]);
  const suKienNgay = suKien ?? suKienRieng;
  const tu = thang[0]?.o[0]?.iso ?? "";
  const den = thang.at(-1)?.o.at(-1)?.iso ?? "";
  React.useEffect(() => {
    if (!tu || !den || suKien) return;
    let song = true;
    laySuKienNgay(tu, den, locale)
      .then((ds) => song && setSuKienNgay(ds))
      .catch(() => {});
    return () => {
      song = false;
    };
  }, [tu, den, locale, suKien]);
  const theoNgay = React.useMemo(() => {
    const m = new Map<string, SuKienNgayDuong[]>();
    for (const e of suKienNgay) m.set(e.date, [...(m.get(e.date) ?? []), e]);
    return m;
  }, [suKienNgay]);
  const skChon = ngayChon ? (theoNgay.get(ngayChon.iso) ?? []) : [];

  // Vuốt ngang trên màn hình cảm ứng.
  const batDauVuot = React.useRef<number | null>(null);
  const sang = (buoc: number) => setI((x) => Math.min(thang.length - 1, Math.max(0, x + buoc)));

  if (!t) return null;

  return (
    <Card className={cn("flex flex-col overflow-hidden", className)}>
      <div className="flex items-center justify-between border-b border-line px-3 py-2.5">
        <button
          type="button"
          onClick={() => sang(-1)}
          disabled={i === 0}
          aria-label={nhan.prevMonth}
          className="flex size-8 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-ink disabled:opacity-30"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <span className="font-serif text-lg font-bold" aria-live="polite">
          {nhan.monthTitle.replace("{m}", String(t.thang)).replace("{y}", String(t.nam))}
        </span>
        <button
          type="button"
          onClick={() => sang(1)}
          disabled={i === thang.length - 1}
          aria-label={nhan.nextMonth}
          className="flex size-8 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-ink disabled:opacity-30"
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>

      <div
        onTouchStart={(e) => (batDauVuot.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (batDauVuot.current === null) return;
          const lech = e.changedTouches[0].clientX - batDauVuot.current;
          if (Math.abs(lech) > 50) sang(lech < 0 ? 1 : -1);
          batDauVuot.current = null;
        }}
      >
        <div className="grid grid-cols-7 bg-surface-2/60">
          {nhan.weekdays.map((w) => (
            <span key={w} className="py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-muted">
              {w}
            </span>
          ))}
        </div>
        {/* key theo tháng: đổi tháng thì lưới mới mờ dần vào. */}
        <div key={`${t.nam}-${t.thang}`} className="grid grid-cols-7 animate-[fadeIn_.25s_ease-out]">
          {t.o.map((o, idx) => {
            const laHomNay = o.iso === homNay;
            const dangChon = o.iso === chon && o.thuocThang;
            const coSuKien = o.suKien.length > 0;
            const skNgay = o.thuocThang ? (theoNgay.get(o.iso) ?? []) : [];
            const gc = o.thuocThang ? ghiChu?.[o.iso] : undefined;
            const cot = idx % 7;
            // Thẻ Card cắt phần tràn: hai hàng đầu cho tooltip xuống dưới ô, các hàng sau lên trên.
            const xuongDuoi = Math.floor(idx / 7) < 2;
            return (
              <button
                key={o.iso}
                type="button"
                disabled={!o.thuocThang}
                onClick={() => setChon(o.iso)}
                aria-pressed={dangChon}
                aria-label={`${o.ngay}, ${nhan.lunarFull.replace("{d}", String(o.am)).replace("{m}", String(o.thangAm))}${o.trai ? `, ${nhan.traiDay}` : ""}${coSuKien ? `, ${o.suKien.map((s) => s.title).join(", ")}` : ""}`}
                className={cn(
                  "group relative flex aspect-square flex-col items-center justify-center gap-0.5 border-b border-r border-line/60 text-sm transition-colors",
                  !o.thuocThang && "opacity-30",
                  o.thuocThang && "hover:bg-surface-2",
                  o.trai && o.thuocThang && "bg-emerald-500/10",
                  dangChon && "ring-2 ring-inset ring-accent",
                )}
              >
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full font-semibold tabular-nums",
                    laHomNay ? "bg-accent text-paper" : coSuKien ? "text-accent" : "text-ink",
                  )}
                >
                  {o.ngay}
                </span>
                <span
                  className={cn(
                    "text-[10px] leading-none tabular-nums",
                    o.am === 1 || o.am === 15 ? "font-semibold text-accent" : "text-muted",
                  )}
                >
                  {o.am === 1 ? `${o.am}/${o.thangAm}` : o.am}
                </span>
                {gc?.nhanO ? (
                  <span className="absolute right-0.5 top-0.5 rounded bg-accent-soft px-0.5 text-[9px] font-bold leading-tight text-accent tabular-nums">
                    {gc.nhanO}
                  </span>
                ) : null}
                {/* Chấm ở chân ô: xanh = ngày Trai, vàng = có sự kiện. */}
                <span className="absolute bottom-1 flex gap-0.5">
                  {o.trai ? <span className="size-1.5 rounded-full bg-emerald-600" /> : null}
                  {coSuKien ? <span className="size-1.5 rounded-full bg-brass" /> : null}
                  {skNgay.length ? <span className="size-1.5 rounded-full bg-lacquer" /> : null}
                </span>
                {/* Tooltip khi rê chuột (màn hình có chuột); điện thoại bấm ngày để xem ở khung dưới. */}
                {skNgay.length ? (
                  <span
                    role="tooltip"
                    className={cn(
                      "pointer-events-none absolute z-30 hidden w-60 flex-col gap-1.5 rounded-md border border-line bg-surface p-3 text-left shadow-card-lift [@media(hover:hover)]:group-hover:flex",
                      xuongDuoi ? "top-full mt-1" : "bottom-full mb-1",
                      cot < 2 ? "left-0" : cot > 4 ? "right-0" : "left-1/2 -translate-x-1/2",
                    )}
                  >
                    {skNgay.map((e) => (
                      <span key={e.id} className="flex flex-col gap-0.5">
                        <span className="text-xs font-semibold text-ink">{e.title}</span>
                        {e.body ? <span className="line-clamp-3 whitespace-pre-line text-[11px] font-normal leading-snug text-muted">{e.body}</span> : null}
                      </span>
                    ))}
                    <span className="text-[10px] font-normal text-accent">{nhan.dayEventMore}</span>
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chi tiết ngày đang chọn */}
      <div className="flex min-h-[4.5rem] flex-col gap-1 border-t border-line px-4 py-3 text-sm">
        {ngayChon ? (
          <>
            <span className="font-medium text-ink">
              {ngayChon.ngay}/{t.thang}/{t.nam} ·{" "}
              <span className="text-muted">
                {nhan.lunarFull.replace("{d}", String(ngayChon.am)).replace("{m}", String(ngayChon.thangAm))}
              </span>
              {ngayChon.iso === homNay ? <span className="ml-1.5 text-accent">({nhan.todayLabel})</span> : null}
            </span>
            {ngayChon.trai ? (
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">● {nhan.traiDay}</span>
            ) : null}
            {ghiChu?.[ngayChon.iso]?.dong.map((d, k) => (
              <span key={k} className="text-xs font-medium text-accent">
                ✦ {d}
              </span>
            ))}
            {skChon.map((e) => (
              <SuKienNgayChiTiet
                key={e.id}
                e={e}
                quanTri={quanTri}
                locale={locale}
                onDoi={(moi) => setSuKienNgay((cu) => cu.map((x) => (x.id === moi.id ? moi : x)))}
                onXoa={() => setSuKienNgay((cu) => cu.filter((x) => x.id !== e.id))}
              />
            ))}
            {ngayChon.suKien.length ? (
              ngayChon.suKien.map((s) => (
                <span key={s.title} className="text-xs">
                  <span className="text-brass">● </span>
                  {s.contentSlug ? (
                    <Link
                      href={localePath(locale, `/bai-viet/${s.contentSlug}`)}
                      className="font-medium text-ink hover:text-accent hover:underline"
                    >
                      {s.title}
                    </Link>
                  ) : (
                    <span className="font-medium text-ink">{s.title}</span>
                  )}
                  <span className="text-muted"> · {nhan.eventKind[s.kind] ?? s.kind}</span>
                </span>
              ))
            ) : !ngayChon.trai && !skChon.length && !ghiChu?.[ngayChon.iso] ? (
              <span className="text-xs text-muted">{nhan.noEventDay}</span>
            ) : null}
            {quanTri ? (
              <ThemSuKienNgay
                date={ngayChon.iso}
                locale={locale}
                daCo={skChon.length}
                onThem={(moi) => setSuKienNgay((cu) => [...cu, moi])}
              />
            ) : null}
          </>
        ) : null}
      </div>

      {/* Chú thích + chấm chuyển tháng */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-2.5 text-xs text-muted">
        <span className="flex flex-wrap gap-x-3 gap-y-1">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-600" /> {nhan.traiLegend}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-brass" /> {nhan.eventLegend}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-lacquer" /> {nhan.dayEventLegend}
          </span>
        </span>
        <span className="flex gap-1">
          {thang.map((th, k) => (
            <button
              key={`${th.nam}-${th.thang}`}
              type="button"
              onClick={() => setI(k)}
              aria-label={nhan.monthTitle.replace("{m}", String(th.thang)).replace("{y}", String(th.nam))}
              aria-current={k === i}
              className={cn("h-1.5 rounded-full transition-all", k === i ? "w-4 bg-accent" : "w-1.5 bg-line-strong")}
            />
          ))}
        </span>
      </div>
    </Card>
  );
}

const loiCua = (err: unknown) => (err instanceof LoiApi && err.thongDiep) || "Không lưu được, vui lòng thử lại.";

/** Một sự kiện ngày trong khung chi tiết: ảnh, tiêu đề, nội dung chính. Quản trị: sửa / xoá tại chỗ. */
export function SuKienNgayChiTiet({
  e,
  quanTri,
  locale,
  onDoi,
  onXoa,
}: {
  e: SuKienNgayDuong;
  quanTri: boolean;
  locale: Locale;
  onDoi: (moi: SuKienNgayDuong) => void;
  onXoa: () => void;
}) {
  const [dangSua, setDangSua] = React.useState(false);

  if (dangSua) {
    return (
      <FormSuKienNgay
        date={e.date}
        goc={e}
        locale={locale}
        onXong={(moi) => {
          onDoi(moi);
          setDangSua(false);
        }}
        onHuy={() => setDangSua(false)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-lacquer/25 bg-lacquer/5 p-3">
      <div className="flex items-start gap-2">
        <span className="mt-1.5 size-2 shrink-0 rounded-full bg-lacquer" aria-hidden />
        <span className="flex-1 font-semibold text-ink">{e.title}</span>
        {quanTri ? (
          <span className="flex gap-1">
            <button type="button" onClick={() => setDangSua(true)} aria-label="Sửa sự kiện" className="text-muted hover:text-accent">
              <Pencil className="size-3.5" aria-hidden />
            </button>
            <button
              type="button"
              aria-label="Xoá sự kiện"
              className="text-muted hover:text-lacquer"
              onClick={async () => {
                if (!window.confirm(`Xoá sự kiện “${e.title}”?`)) return;
                try {
                  await xoaSuKienNgay(e.id, locale);
                  onXoa();
                } catch (err) {
                  window.alert(loiCua(err));
                }
              }}
            >
              <Trash2 className="size-3.5" aria-hidden />
            </button>
          </span>
        ) : null}
      </div>
      {e.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={e.imageUrl} alt="" loading="lazy" className="max-h-56 w-full rounded-md object-cover" />
      ) : null}
      {e.body ? <p className="max-h-60 overflow-y-auto whitespace-pre-line text-sm leading-relaxed text-body [scrollbar-width:thin]">{e.body}</p> : null}
    </div>
  );
}

/** Nút "+ Thêm sự kiện" cho ngày đang chọn (chỉ người có calendar.manage). */
function ThemSuKienNgay({
  date,
  locale,
  daCo,
  onThem,
}: {
  date: string;
  locale: Locale;
  daCo: number;
  onThem: (moi: SuKienNgayDuong) => void;
}) {
  const [mo, setMo] = React.useState(false);
  React.useEffect(() => setMo(false), [date]);
  if (daCo >= 10) return null;
  if (!mo) {
    return (
      <Button type="button" size="sm" variant="outline" className="mt-1 w-fit" onClick={() => setMo(true)}>
        <Plus aria-hidden /> Thêm sự kiện cho ngày này
      </Button>
    );
  }
  return (
    <FormSuKienNgay
      date={date}
      locale={locale}
      onXong={(moi) => {
        onThem(moi);
        setMo(false);
      }}
      onHuy={() => setMo(false)}
    />
  );
}

export function FormSuKienNgay({
  date,
  goc,
  locale,
  onXong,
  onHuy,
}: {
  date: string;
  goc?: SuKienNgayDuong;
  locale: Locale;
  onXong: (moi: SuKienNgayDuong) => void;
  /** Không có thì không hiện nút Huỷ (form luôn mở). */
  onHuy?: () => void;
}) {
  const [title, setTitle] = React.useState(goc?.title ?? "");
  const [imageUrl, setImageUrl] = React.useState(goc?.imageUrl ?? "");
  const [body, setBody] = React.useState(goc?.body ?? "");
  const [dang, setDang] = React.useState(false);
  const [loi, setLoi] = React.useState("");
  const tep = React.useRef<HTMLInputElement>(null);

  async function taiAnh(f: File | undefined) {
    if (!f) return;
    setDang(true);
    setLoi("");
    try {
      setImageUrl((await taiTep(f, locale)).url);
    } catch (err) {
      setLoi(loiCua(err));
    } finally {
      setDang(false);
      if (tep.current) tep.current.value = "";
    }
  }

  async function luu(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return setLoi("Nhập tiêu đề.");
    setDang(true);
    setLoi("");
    try {
      onXong(await luuSuKienNgay({ id: goc?.id, date, title: title.trim(), imageUrl: imageUrl.trim(), body: body.trim() }, locale));
    } catch (err) {
      setLoi(loiCua(err));
    } finally {
      setDang(false);
    }
  }

  const o = "w-full rounded-md border border-line bg-surface px-2.5 py-1.5 text-sm text-ink focus:border-accent focus:outline-none";
  return (
    <form onSubmit={luu} className="mt-1 flex flex-col gap-2 rounded-md border border-dashed border-line p-3">
      <span className="text-xs font-semibold text-muted">{goc ? "Sửa sự kiện" : "Sự kiện mới"} · {date.split("-").reverse().join("/")}</span>
      <label className="flex flex-col gap-1">
        <span className="flex justify-between text-xs text-muted">
          <span>Tiêu đề</span>
          <span className="tabular-nums">
            {title.length}/{TIEU_DE_TOI_DA}
          </span>
        </span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={TIEU_DE_TOI_DA} className={o} />
      </label>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted">Ảnh</span>
        <div className="flex gap-2">
          <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" aria-label="Đường dẫn ảnh" className={cn(o, "min-w-0 flex-1")} />
          <input ref={tep} type="file" accept="image/*" className="hidden" onChange={(e) => taiAnh(e.target.files?.[0])} />
          <Button type="button" size="sm" variant="outline" disabled={dang} onClick={() => tep.current?.click()}>
            Tải ảnh
          </Button>
        </div>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="max-h-32 w-fit rounded border border-line object-cover" />
        ) : null}
      </div>
      <label className="flex flex-col gap-1">
        <span className="flex justify-between text-xs text-muted">
          <span>Nội dung chính (hiện ở tooltip và khi bấm vào ngày)</span>
          <span className="tabular-nums">
            {body.length}/{NOI_DUNG_TOI_DA}
          </span>
        </span>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={NOI_DUNG_TOI_DA} rows={4} className={o} />
      </label>
      {loi ? (
        <span role="alert" className="text-xs text-lacquer">
          {loi}
        </span>
      ) : null}
      <span className="flex gap-2">
        <Button type="submit" size="sm" disabled={dang}>
          Lưu
        </Button>
        {onHuy ? (
          <Button type="button" size="sm" variant="ghost" onClick={onHuy}>
            Huỷ
          </Button>
        ) : null}
      </span>
    </form>
  );
}
