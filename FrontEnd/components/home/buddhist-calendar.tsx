"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Badge, Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import type { SuKienNgay } from "@/lib/buddhist-events";
import { localePath, splitLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Mục "Lịch Phật giáo" trang chủ: ba tab Tháng này / 3 tháng tới / Năm nay.
 *
 * Danh sách đã được server tính sẵn (lib/buddhist-events.ts) - component chỉ
 * chuyển tab, nên không có tính toán âm lịch nào chạy ở trình duyệt.
 */

type Tab = "thangNay" | "baThangToi" | "namNay";

export type NhanLichTrangChu = {
  tabMonth: string;
  tabNext3: string;
  tabYear: string;
  empty: string;
  lunarDate: string;
  daysLeft: string;
  todayLabel: string;
  passed: string;
  viewCalendar: string;
  eventKind: Record<string, string>;
};

const MOT_NGAY = 86_400_000;

export function BuddhistCalendar({
  ds,
  homNay,
  linkLich,
  nhan,
  className,
  nhanTabThang,
  thangChon,
}: {
  ds: Record<Tab, SuKienNgay[]>;
  /** "YYYY-MM-DD" theo giờ Việt Nam. */
  homNay: string;
  /** /phat-lich/<năm>/<tháng> của tháng hiện tại, chưa có tiền tố ngôn ngữ. */
  linkLich: string;
  nhan: NhanLichTrangChu;
  className?: string;
  /** Nhãn tab tháng khi đang xem tháng khác tháng hiện tại, vd "Tháng 11/2026". */
  nhanTabThang?: string;
  /** Đổi giá trị này (tháng chọn ở lịch bên cạnh) thì tự chuyển sang tab tháng. */
  thangChon?: string;
}) {
  const { locale } = splitLocale(usePathname());
  const [tab, setTab] = React.useState<Tab>("baThangToi");
  const lanDau = React.useRef(true);
  React.useEffect(() => {
    // Lần gắn đầu giữ tab mặc định; từ lần đổi tháng thứ nhất mới chuyển tab.
    if (lanDau.current) {
      lanDau.current = false;
      return;
    }
    setTab("thangNay");
  }, [thangChon]);
  const tabs: { id: Tab; nhan: string }[] = [
    { id: "thangNay", nhan: nhanTabThang || nhan.tabMonth },
    { id: "baThangToi", nhan: nhan.tabNext3 },
    { id: "namNay", nhan: nhan.tabYear },
  ];
  const homNayMs = Date.parse(homNay);
  const dinhDangThang = new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : locale, {
    month: "short",
    timeZone: "UTC",
  });

  return (
    <Card className={cn("flex flex-col overflow-hidden", className)}>
      <div role="tablist" aria-label={nhan.viewCalendar} className="flex border-b border-line">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "-mb-px flex-1 border-b-2 px-3 py-3 text-sm font-medium transition-colors",
              tab === t.id
                ? "border-accent text-accent"
                : "border-transparent text-muted hover:text-ink",
            )}
          >
            {t.nhan}
            <span className="ml-1.5 text-xs tabular-nums opacity-60">{ds[t.id].length}</span>
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        className="max-h-[26rem] min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin] lg:max-h-none"
      >
        {ds[tab].length === 0 ? (
          <p className="p-6 text-sm text-muted">{nhan.empty}</p>
        ) : (
          <ol className="flex flex-col divide-y divide-line">
            {ds[tab].map((sk) => {
              const ngayMs = Date.parse(sk.ngay);
              const conLai = Math.round((ngayMs - homNayMs) / MOT_NGAY);
              const d = new Date(ngayMs);
              const daQua = conLai < 0;

              return (
                <li
                  key={sk.key}
                  className={cn("flex items-center gap-4 px-4 py-3", daQua && "opacity-55")}
                >
                  <div
                    className={cn(
                      "flex w-12 shrink-0 flex-col items-center rounded-md py-1",
                      conLai === 0 ? "bg-accent text-paper" : "bg-surface-2 text-ink",
                    )}
                  >
                    <span className="text-lg font-bold leading-tight tabular-nums">{d.getUTCDate()}</span>
                    <span className="text-[10px] uppercase tracking-wide opacity-80">
                      {dinhDangThang.format(d)}
                    </span>
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className={cn("leading-snug", sk.tuDong ? "text-body" : "font-serif font-semibold text-ink")}>
                      {sk.contentSlug ? (
                        <Link
                          href={localePath(locale, `/bai-viet/${sk.contentSlug}`)}
                          className="hover:text-accent hover:underline"
                        >
                          {sk.title}
                        </Link>
                      ) : (
                        sk.title
                      )}
                    </span>
                    <span className="text-xs text-muted">
                      {nhan.lunarDate.replace("{d}", String(sk.lunarDay)).replace("{m}", String(sk.lunarMonth))}
                    </span>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {!sk.tuDong ? <Badge tone="brass">{nhan.eventKind[sk.kind] ?? sk.kind}</Badge> : null}
                    <span className={cn("text-xs", conLai === 0 ? "font-semibold text-accent" : "text-muted")}>
                      {conLai === 0
                        ? nhan.todayLabel
                        : daQua
                          ? nhan.passed
                          : nhan.daysLeft.replace("{n}", String(conLai))}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <div className="border-t border-line p-3">
        <Button variant="link" size="sm" asChild>
          <Link href={localePath(locale, linkLich)}>
            {nhan.viewCalendar} <ArrowRight />
          </Link>
        </Button>
      </div>
    </Card>
  );
}
