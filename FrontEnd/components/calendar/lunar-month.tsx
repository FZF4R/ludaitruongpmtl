import Link from "next/link";
import {
  buildMonthGrid,
  lunarMonthLabel,
  WEEKDAY_LABELS,
  type CalendarCell,
} from "@/lib/lunar";
import type { LunarEvent } from "@/lib/schema";
import { cn } from "@/lib/utils";
import { Badge, Card } from "@/components/ui/primitives";
import { TodayMarker } from "@/components/calendar/today-marker";

/**
 * Lưới lịch một tháng.
 *
 * Server Component, sinh tĩnh: toàn bộ phép tính lịch âm chạy lúc build
 * nên client không tải một dòng JavaScript lịch nào. Ô "hôm nay" do
 * TodayMarker tô ở client — nếu tô sẵn trên server thì trang cache 24h
 * sẽ chỉ đúng trong ngày đầu tiên.
 */
export function LunarMonth({
  year,
  month,
  events,
}: {
  year: number;
  month: number;
  events: LunarEvent[];
}) {
  const cells = buildMonthGrid(year, month);

  const eventsOn = (cell: CalendarCell) =>
    events.filter(
      (e) =>
        e.lunarDay === cell.lunar.day &&
        e.lunarMonth === cell.lunar.month &&
        e.isLeapMonth === cell.lunar.isLeapMonth &&
        (e.solarYear === null || e.solarYear === year),
    );

  return (
    <Card className="overflow-hidden">
      <TodayMarker />
      <div className="grid grid-cols-7 border-b border-line bg-surface-2">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-muted"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((cell) => {
          const dayEvents = eventsOn(cell);
          const special = cell.isFullMoon || cell.isNewMoon;
          return (
            <div
              key={cell.iso}
              data-date={cell.iso}
              className={cn(
                "relative flex min-h-[76px] flex-col gap-0.5 border-b border-r border-line p-1.5 sm:min-h-[92px] sm:p-2",
                "[&[data-today='1']]:bg-accent-soft",
                !cell.isCurrentMonth && "opacity-40",
              )}
            >
              <div className="flex items-baseline justify-between gap-1">
                <span
                  className={cn(
                    "text-sm font-semibold tabular-nums",
                    special ? "text-accent" : "text-ink",
                  )}
                >
                  {cell.solarDay}
                </span>
                <span
                  className={cn(
                    "text-[10px] tabular-nums",
                    special ? "font-semibold text-accent" : "text-muted",
                  )}
                >
                  {cell.lunar.day === 1
                    ? `1/${lunarMonthLabel(cell.lunar.month)}`
                    : cell.lunar.day}
                </span>
              </div>

              {dayEvents.map((e) =>
                e.contentSlug ? (
                  <Link
                    key={e.id}
                    href={`/bai-viet/${e.contentSlug}`}
                    className="truncate text-[10px] leading-tight text-accent hover:underline"
                    title={e.title}
                  >
                    {e.title}
                  </Link>
                ) : (
                  <span
                    key={e.id}
                    className="truncate text-[10px] leading-tight text-brass"
                    title={e.title}
                  >
                    {e.title}
                  </span>
                ),
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export function EventList({ events }: { events: LunarEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-muted">Tháng này không có ngày vía đặc biệt.</p>;
  }

  const kindLabel = {
    via: "Ngày vía",
    le: "Đại lễ",
    "gio-to": "Giỗ tổ",
    "bat-quan-trai": "Bát quan trai",
  } as const;

  return (
    <ul className="flex flex-col divide-y divide-line">
      {events
        .slice()
        .sort((a, b) => a.lunarDay - b.lunarDay)
        .map((e) => (
          <li key={e.id} className="flex items-start gap-4 py-3.5">
            <span className="w-16 shrink-0 text-sm font-semibold tabular-nums text-accent">
              {e.lunarDay}/{e.lunarMonth} ÂL
            </span>
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-ink">{e.title}</span>
                <Badge tone={e.kind === "le" ? "brass" : "neutral"}>
                  {kindLabel[e.kind]}
                </Badge>
              </div>
              {e.description ? (
                <p className="text-sm text-muted">{e.description}</p>
              ) : null}
            </div>
          </li>
        ))}
    </ul>
  );
}
