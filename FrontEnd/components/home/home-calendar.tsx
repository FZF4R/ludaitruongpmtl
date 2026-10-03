"use client";

import * as React from "react";
import { BuddhistCalendar, type NhanLichTrangChu } from "@/components/home/buddhist-calendar";
import { MonthCalendar, type NhanLichThang } from "@/components/home/month-calendar";
import type { SuKienNgay, ThangLich } from "@/lib/buddhist-events";

/**
 * Mục "Sự kiện" trang chủ: lịch tháng (trái) và danh sách sự kiện (phải) dùng
 * chung "tháng đang chọn". Lật tháng ở lịch thì tab tháng bên phải hiện đúng
 * sự kiện của tháng đó (kèm Mùng Một / Rằm) và tự được chọn.
 *
 * Mọi danh sách đã tính sẵn trên server cho cả 12 tháng - ở đây chỉ chọn mảng.
 *
 * Bố cục: lịch tháng quyết định chiều cao hàng; danh sách nằm tuyệt đối trong
 * ô của nó (lg:absolute inset-0) nên cao đúng bằng lịch, dài hơn thì cuộn.
 */
export function HomeCalendar({
  thang,
  suKienTheoThang,
  baThangToi,
  namNay,
  homNay,
  linkLich,
  nhan,
}: {
  thang: ThangLich[];
  /** Sự kiện của từng tháng trong `thang`, cùng thứ tự. */
  suKienTheoThang: SuKienNgay[][];
  baThangToi: SuKienNgay[];
  namNay: SuKienNgay[];
  homNay: string;
  linkLich: string;
  nhan: NhanLichTrangChu & NhanLichThang;
}) {
  const [i, setI] = React.useState(0);
  const t = thang[i];
  const nhanTabThang =
    i === 0 || !t ? undefined : nhan.monthTitle.replace("{m}", String(t.thang)).replace("{y}", String(t.nam));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <MonthCalendar thang={thang} homNay={homNay} nhan={nhan} thangDangXem={i} onDoiThang={setI} />
      <div className="relative lg:min-h-[24rem]">
        <BuddhistCalendar
          ds={{ thangNay: suKienTheoThang[i] ?? [], baThangToi, namNay }}
          homNay={homNay}
          linkLich={t ? `/phat-lich/${t.nam}/${t.thang}` : linkLich}
          nhan={nhan}
          nhanTabThang={nhanTabThang}
          thangChon={t ? `${t.nam}-${t.thang}` : ""}
          className="lg:absolute lg:inset-0"
        />
      </div>
    </div>
  );
}
