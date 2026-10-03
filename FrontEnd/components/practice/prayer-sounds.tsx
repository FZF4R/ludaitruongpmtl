"use client";

import * as React from "react";
import { Bell, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAmThanhNgan, useLuaChonNho } from "@/components/practice/use-sound";
import { AmNen, ChonAmThanh, ThanhTruot, useAmThanhDaChon, useDsAmThanh, type NhanTuTap } from "@/components/practice/common";

/** Chuông và âm nền nhẹ khi đọc / viết lời nguyện (mục cau-an). Không tự phát - người dùng bấm mới phát. */
export function PrayerSounds({ nhan }: { nhan: NhanTuTap }) {
  const { ds } = useDsAmThanh("cau-an");
  const am = useAmThanhNgan();
  const chuong = useAmThanhDaChon("cau-an", "chuong", ds);
  const nen = useAmThanhDaChon("cau-an", "am-nen", ds);
  const [dangPhat, setDangPhat] = React.useState(false);
  const [amLuong, setAmLuong] = useLuaChonNho("cau-an_am-luong", 0.5);

  if (ds.length === 0) return null;

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-4">
      <AmNen src={nen.amThanh?.src ?? null} chay={dangPhat} amLuong={amLuong} />
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
        <ChonAmThanh nhan={nhan} label={nhan.prayersPage.ambient} cungLoai={nen.cungLoai} value={nen.id} onChange={nen.chon} />
        <ThanhTruot
          label={nhan.meditation.volume}
          giaTri={Math.round(amLuong * 100)}
          hienThi={`${Math.round(amLuong * 100)}%`}
          min={0}
          max={100}
          onChange={(v) => setAmLuong(v / 100)}
        />
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={!nen.amThanh} onClick={() => setDangPhat(!dangPhat)}>
            {dangPhat ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
            {dangPhat ? nhan.pause : nhan.start}
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="size-9"
            disabled={!chuong.amThanh}
            aria-label={chuong.amThanh?.title ?? nhan.sound}
            title={chuong.amThanh?.title}
            onClick={() => chuong.amThanh && void am.phat(chuong.amThanh.src)}
          >
            <Bell className="size-4" aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  );
}
