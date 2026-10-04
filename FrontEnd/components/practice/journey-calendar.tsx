"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { MonthCalendar, type NhanLichThang } from "@/components/home/month-calendar";
import { useCheDoSua } from "@/components/layout/inline-edit";
import { cacThangToi, homNayVN, sangChuoiNgay, type ThangLich } from "@/lib/buddhist-events";
import { splitLocale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/dictionary";
import type { LunarEvent } from "@/lib/schema";
import { layCongDucTheoNgay, type NgayCongDuc } from "@/lib/my-content";

/** Lùi 6 tháng (xem lại lịch sử) và tới tháng sau (xem ngày vía sắp tới). */
const THANG_TRUOC = 6;
const SO_THANG = THANG_TRUOC + 2;

/**
 * Lịch ở trang Quá trình tu tập: ngày vía / lễ, sự kiện admin gắn trên lịch,
 * và công đức + tu tập của chính người xem theo từng ngày (ô có "+N", bấm
 * ngày để xem chi tiết từng khoản cộng điểm và từng buổi tu).
 */
export function JourneyCalendar({
  suKien,
  nhan,
  nhanCongDuc,
  nhanTuTap,
}: {
  suKien: LunarEvent[];
  nhan: NhanLichThang;
  nhanCongDuc: Dictionary["stats"]["actions"];
  nhanTuTap: Dictionary["practiceTools"];
}) {
  const { locale } = splitLocale(usePathname());
  const { nguoiDungId, daBiet } = useCheDoSua();
  const j = nhanTuTap.journey;

  // Tính ở trình duyệt sau khi gắn (tránh lệch ngày giữa server và client).
  const [lich, setLich] = React.useState<{ thang: ThangLich[]; homNay: string } | null>(null);
  const [i, setI] = React.useState(THANG_TRUOC);
  React.useEffect(() => {
    const homNay = homNayVN();
    const batDau = new Date(Date.UTC(homNay.getUTCFullYear(), homNay.getUTCMonth() - THANG_TRUOC, 1));
    setLich({ thang: cacThangToi(batDau, SO_THANG, suKien), homNay: sangChuoiNgay(homNay) });
  }, [suKien]);

  const [ngay, setNgay] = React.useState<NgayCongDuc[]>([]);
  React.useEffect(() => {
    if (!lich || !daBiet || !nguoiDungId) return;
    const tu = lich.thang[0]?.o[0]?.iso;
    const den = lich.homNay;
    if (!tu) return;
    layCongDucTheoNgay(tu, den, locale)
      .then(setNgay)
      .catch(() => setNgay([]));
  }, [lich, daBiet, nguoiDungId, locale]);

  const ghiChu = React.useMemo(() => {
    const kq: Record<string, { nhanO?: string; dong: string[] }> = {};
    for (const n of ngay) {
      const dong: string[] = [];
      if (n.points > 0) {
        dong.push(nhanTuTap.journeyCal.points.replace("{n}", String(n.points)));
        for (const m of n.merit) {
          dong.push(`  +${m.points} · ${nhanCongDuc[m.action as keyof typeof nhanCongDuc] ?? m.action}${m.times > 1 ? ` ×${m.times}` : ""}`);
        }
      }
      for (const p of n.practice) {
        const loai = p.type as keyof typeof j.types;
        const soLuong = p.type === "thien" ? Math.round(p.amount / 60) : p.amount;
        dong.push(
          nhanTuTap.journeyCal.practiceLine
            .replace("{type}", j.types[loai] ?? p.type)
            .replace("{amount}", soLuong.toLocaleString())
            .replace("{unit}", j.units[loai] ?? ""),
        );
      }
      if (dong.length) kq[n.day] = { nhanO: n.points > 0 ? `+${n.points}` : "•", dong };
    }
    return kq;
  }, [ngay, nhanCongDuc, nhanTuTap, j]);

  if (!lich) return <div className="aspect-square w-full animate-pulse rounded-card bg-surface-2" />;

  return (
    <MonthCalendar
      thang={lich.thang}
      homNay={lich.homNay}
      nhan={nhan}
      thangDangXem={i}
      onDoiThang={setI}
      ghiChu={ghiChu}
      quanTriTaiCho={false}
    />
  );
}
