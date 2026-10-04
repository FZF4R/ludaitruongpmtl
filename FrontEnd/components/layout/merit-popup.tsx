"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, Sparkles, X } from "lucide-react";
import { useCheDoSua } from "@/components/layout/inline-edit";
import { localePath, splitLocale } from "@/lib/i18n";

export type NhanChaoNgayMoi = {
  welcomeTitle: string;
  earned: string;
  streak: string;
  viewStats: string;
  close: string;
};

/**
 * Popup góc trên phải khi vừa tự điểm danh ngày mới: "+N công đức", một lời
 * nhắn an lành (admin cấu hình ở /admin/merit), chuỗi ngày điểm danh. Trượt
 * vào, tự đóng sau 8 giây (rê chuột thì giữ), bấm X để đóng ngay.
 */
export function MeritPopup({ nhan }: { nhan: NhanChaoNgayMoi }) {
  const { congDucMoi, loiChao, xoaCongDucMoi } = useCheDoSua();
  const { locale } = splitLocale(usePathname());
  const [giu, setGiu] = React.useState(false);

  React.useEffect(() => {
    if (!congDucMoi || giu) return;
    const t = window.setTimeout(xoaCongDucMoi, 8000);
    return () => window.clearTimeout(t);
  }, [congDucMoi, giu, xoaCongDucMoi]);

  if (!congDucMoi) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      onMouseEnter={() => setGiu(true)}
      onMouseLeave={() => setGiu(false)}
      className="fixed right-4 top-20 z-[70] w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-card border border-brass/40 bg-surface shadow-card-lift"
      style={{ animation: "cd-popup 0.55s cubic-bezier(0.2, 0.9, 0.3, 1.2) both" }}
    >
      {/* Vệt sáng chạy ngang + hạt sáng: chỉ trang trí */}
      <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brass/15 via-transparent to-accent-soft/60" />
      <span aria-hidden className="pointer-events-none absolute -left-1/2 top-0 h-full w-1/2 bg-gradient-to-r from-transparent via-white/50 to-transparent" style={{ animation: "cd-quet 1.6s ease-out 0.4s both" }} />
      <div className="relative flex gap-3 p-4">
        <span className="relative flex size-12 shrink-0 items-center justify-center rounded-full bg-brass text-white shadow-md">
          <Sparkles className="size-6" aria-hidden />
          <span aria-hidden className="absolute inset-0 rounded-full border-2 border-brass" style={{ animation: "tt-gon 1.4s ease-out 0.3s 2 both" }} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-brass">{nhan.welcomeTitle}</span>
            <button type="button" onClick={xoaCongDucMoi} aria-label={nhan.close} className="-mr-1 -mt-1 rounded p-1 text-muted hover:text-ink">
              <X className="size-4" aria-hidden />
            </button>
          </div>
          <span className="font-serif text-2xl font-bold text-accent">{nhan.earned.replace("{n}", String(congDucMoi))}</span>
          {loiChao?.message ? <p className="text-sm leading-relaxed text-body">{loiChao.message}</p> : null}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            {loiChao?.streak ? (
              <span className="flex items-center gap-1 text-muted">
                <Flame className="size-3.5 text-lacquer" aria-hidden /> {nhan.streak.replace("{n}", String(loiChao.streak))}
              </span>
            ) : null}
            <Link href={localePath(locale, "/tai-khoan/thong-ke")} onClick={xoaCongDucMoi} className="font-medium text-accent hover:underline">
              {nhan.viewStats} →
            </Link>
            {loiChao?.test ? <span className="rounded bg-surface-2 px-1.5 text-[10px] text-muted">Admin · thử nghiệm</span> : null}
          </div>
        </div>
      </div>
      {/* Thanh thời gian tự đóng */}
      <span
        aria-hidden
        className="absolute bottom-0 left-0 h-0.5 bg-brass"
        style={{ animation: giu ? "none" : "cd-thoi-gian 8s linear forwards", width: giu ? "100%" : undefined }}
      />
    </div>
  );
}
