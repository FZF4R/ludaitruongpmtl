"use client";

import * as React from "react";
import Link from "next/link";
import { BookOpen, Disc3, Flame, Flower2, Hand, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import { useCheDoSua } from "@/components/layout/inline-edit";
import { localePath } from "@/lib/i18n";
import { layThongKeTuTap, type LoaiNhatKy, type ThongKeTuTap } from "@/lib/practice";
import { dien, useLocaleHienTai, type NhanTuTap } from "@/components/practice/common";
import { cn } from "@/lib/utils";

const LOAI: { type: LoaiNhatKy; icon: React.ElementType; href: string }[] = [
  { type: "tung-kinh", icon: BookOpen, href: "/tu-tap/tung-kinh-niem-phat" },
  { type: "niem-phat", icon: Flower2, href: "/tu-tap/tung-kinh-niem-phat" },
  { type: "thien", icon: Wind, href: "/tu-tap/thien-dinh" },
  { type: "go-mo", icon: Hand, href: "/tu-tap/go-mo-chuoi-hat" },
  { type: "chuoi-hat", icon: Disc3, href: "/tu-tap/go-mo-chuoi-hat" },
];

/** Thiền lưu bằng giây, hiển thị bằng phút. */
const doi = (type: LoaiNhatKy, v: number) => (type === "thien" ? Math.round(v / 60) : v);

export function Journey({ nhan }: { nhan: NhanTuTap }) {
  const j = nhan.journey;
  const locale = useLocaleHienTai();
  const { nguoiDungId, daBiet } = useCheDoSua();
  const [tk, setTk] = React.useState<ThongKeTuTap | null>(null);
  const [loi, setLoi] = React.useState(false);
  const [loaiBieuDo, setLoaiBieuDo] = React.useState<LoaiNhatKy | null>(null);

  React.useEffect(() => {
    if (!daBiet || !nguoiDungId) return;
    layThongKeTuTap(locale)
      .then(setTk)
      .catch(() => setLoi(true));
  }, [daBiet, nguoiDungId, locale]);

  if (!daBiet) return null;
  if (!nguoiDungId) {
    return (
      <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
        <p className="text-sm text-muted">{j.signIn}</p>
        <Button size="sm" asChild>
          <Link href={localePath(locale, "/dang-nhap")}>{nhan.signInToSave}</Link>
        </Button>
      </Card>
    );
  }
  if (loi) return <p className="text-sm text-lacquer">{nhan.saveError}</p>;
  if (!tk) return <div className="h-64 animate-pulse rounded-lg bg-surface-2" />;

  const coGhi = LOAI.some((l) => (tk.totals[l.type]?.sessions ?? 0) > 0);
  // Biểu đồ mặc định: loại đã tu nhiều buổi nhất.
  const loaiChon =
    loaiBieuDo ??
    [...LOAI].sort((a, b) => (tk.totals[b.type]?.sessions ?? 0) - (tk.totals[a.type]?.sessions ?? 0))[0].type;
  const giaTriNgay = tk.days.map((d) => doi(loaiChon, d.values[loaiChon] ?? 0));
  const lonNhat = Math.max(1, ...giaTriNgay);
  const ngayHien = (s: string) => new Date(`${s}T00:00:00`).toLocaleDateString(locale === "vi" ? "vi-VN" : locale, { day: "numeric", month: "numeric" });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-3">
        <span className="flex items-center gap-2 rounded-full bg-accent-soft px-4 py-2 text-sm font-semibold text-accent">
          <Flame className="size-4" aria-hidden /> {dien(j.streak, { n: tk.streak })}
        </span>
        <span className="flex items-center gap-2 rounded-full bg-surface-2 px-4 py-2 text-sm text-body">
          {dien(j.activeDays, { n: tk.activeDays })}
        </span>
      </div>

      {!coGhi ? <p className="rounded-md bg-surface-2 p-4 text-sm text-muted">{j.empty}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {LOAI.map(({ type, icon: Icon, href }) => {
          const t = tk.totals[type] ?? { today: 0, week: 0, all: 0, sessions: 0 };
          const donVi = j.units[type];
          return (
            <Card key={type} className="flex flex-col gap-3 p-4">
              <Link href={localePath(locale, href)} className="flex items-center gap-2 font-semibold text-ink hover:text-accent">
                <Icon className="size-4 text-accent" aria-hidden /> {j.types[type]}
              </Link>
              <dl className="grid grid-cols-3 gap-2 text-center">
                {(
                  [
                    [j.today, t.today],
                    [j.week, t.week],
                    [j.all, t.all],
                  ] as const
                ).map(([nhanMuc, v]) => (
                  <div key={nhanMuc} className="flex flex-col">
                    <dt className="text-[11px] text-muted">{nhanMuc}</dt>
                    <dd className="text-lg font-bold tabular-nums text-ink">{doi(type, v).toLocaleString()}</dd>
                  </div>
                ))}
              </dl>
              <span className="text-xs text-muted">{donVi}</span>
            </Card>
          );
        })}
      </div>

      {/* Màn hình rộng: cao ít nhất bằng khung lịch bên trái (--lich-cao do JourneyCalendar đo); cột biểu đồ giãn theo. */}
      <Card className="flex flex-col gap-4 p-5 lg:min-h-[var(--lich-cao,0px)]">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="mr-auto font-serif text-lg font-bold text-ink">{j.chart}</h2>
          {LOAI.map(({ type }) => (
            <Button key={type} size="sm" variant={loaiChon === type ? "solid" : "ghost"} onClick={() => setLoaiBieuDo(type)}>
              {j.types[type]}
            </Button>
          ))}
        </div>
        <div className="flex min-h-44 flex-1 items-end gap-[3px]" role="img" aria-label={`${j.chart} — ${j.types[loaiChon]}`}>
          {tk.days.map((d, i) => {
            const v = giaTriNgay[i];
            return (
              <div key={d.day} className="group relative flex h-full flex-1 flex-col justify-end">
                <div
                  className={cn("w-full rounded-t-sm", v > 0 ? "bg-accent" : "bg-line")}
                  style={{ height: v > 0 ? `${Math.max(4, (v / lonNhat) * 100)}%` : "2px" }}
                />
                <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink px-2 py-1 text-xs text-paper group-hover:block">
                  {ngayHien(d.day)}: {v.toLocaleString()} {j.units[loaiChon]}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-muted">
          <span>{tk.days[0] ? ngayHien(tk.days[0].day) : ""}</span>
          <span>{tk.days.at(-1) ? ngayHien(tk.days.at(-1)!.day) : ""}</span>
        </div>
      </Card>

      {tk.recent.length ? (
        <Card className="flex flex-col gap-3 p-5">
          <h2 className="font-serif text-lg font-bold text-ink">{j.recent}</h2>
          <ul className="divide-y divide-line">
            {tk.recent.map((r) => (
              <li key={r.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 py-2.5 text-sm">
                <span className="font-medium text-ink">{j.types[r.type]}</span>
                <span className="tabular-nums text-accent">
                  {doi(r.type, r.amount).toLocaleString()} {j.units[r.type]}
                </span>
                {r.note ? <span className="text-muted">· {r.note}</span> : null}
                <time dateTime={r.createdAt} className="ml-auto text-xs text-muted">
                  {new Date(r.createdAt).toLocaleString(locale === "vi" ? "vi-VN" : locale, { dateStyle: "short", timeStyle: "short" })}
                </time>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
