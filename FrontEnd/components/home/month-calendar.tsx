"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/primitives";
import type { ThangLich, ONgay } from "@/lib/buddhist-events";
import { localePath, splitLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Lịch tháng bên phải mục Lịch Phật giáo trang chủ: chuyển qua lại giữa các
 * tháng (đã tính sẵn trên server - lib/buddhist-events.ts cacThangToi), đánh
 * dấu ngày Trai (thập trai) và ngày có sự kiện. Bấm một ngày để xem chi tiết
 * ngay dưới lưới.
 *
 * Chuyển tháng bằng nút ‹ ›, chấm tháng bên dưới, hoặc vuốt ngang trên điện
 * thoại. Không tự chạy: lịch là thứ người ta dừng lại đọc, tự lật sẽ khó chịu.
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
};

export function MonthCalendar({
  thang,
  homNay,
  nhan,
  className,
  thangDangXem,
  onDoiThang,
}: {
  thang: ThangLich[];
  /** "YYYY-MM-DD" theo giờ Việt Nam. */
  homNay: string;
  nhan: NhanLichThang;
  className?: string;
  /** Điều khiển từ ngoài (HomeCalendar): chỉ số tháng đang xem trong `thang`. */
  thangDangXem?: number;
  onDoiThang?: (i: number) => void;
}) {
  const { locale } = splitLocale(usePathname());
  const [iRieng, setIRieng] = React.useState(0);
  const i = thangDangXem ?? iRieng;
  const setI = (doi: number | ((cu: number) => number)) => {
    const moi = typeof doi === "function" ? doi(i) : doi;
    setIRieng(moi);
    onDoiThang?.(moi);
  };
  const [chon, setChon] = React.useState<string>(homNay);
  const t = thang[i];
  const ngayChon: ONgay | undefined = t?.o.find((o) => o.iso === chon && o.thuocThang);

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
          {t.o.map((o) => {
            const laHomNay = o.iso === homNay;
            const dangChon = o.iso === chon && o.thuocThang;
            const coSuKien = o.suKien.length > 0;
            return (
              <button
                key={o.iso}
                type="button"
                disabled={!o.thuocThang}
                onClick={() => setChon(o.iso)}
                aria-pressed={dangChon}
                aria-label={`${o.ngay}, ${nhan.lunarFull.replace("{d}", String(o.am)).replace("{m}", String(o.thangAm))}${o.trai ? `, ${nhan.traiDay}` : ""}${coSuKien ? `, ${o.suKien.map((s) => s.title).join(", ")}` : ""}`}
                className={cn(
                  "relative flex aspect-square flex-col items-center justify-center gap-0.5 border-b border-r border-line/60 text-sm transition-colors",
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
                {/* Chấm ở chân ô: xanh = ngày Trai, vàng = có sự kiện. */}
                <span className="absolute bottom-1 flex gap-0.5">
                  {o.trai ? <span className="size-1.5 rounded-full bg-emerald-600" /> : null}
                  {coSuKien ? <span className="size-1.5 rounded-full bg-brass" /> : null}
                </span>
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
            ) : !ngayChon.trai ? (
              <span className="text-xs text-muted">{nhan.noEventDay}</span>
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
