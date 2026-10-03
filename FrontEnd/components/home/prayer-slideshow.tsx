"use client";

import * as React from "react";
import Image from "next/image";
import type { StaticImageData } from "next/image";
import { heroImages } from "@/lib/hero-images";
import { goiApi, urlApi } from "@/lib/auth";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import type { LoiNguyen } from "@/lib/prayers";
import { cn } from "@/lib/utils";

/**
 * Slideshow lời nguyện nổi bật (đã được kiểm duyệt chọn) phía trên ô viết.
 *
 * Hiện cùng lúc tối đa 3 thẻ trên màn hình rộng (2 trên máy tính bảng, 1 trên
 * điện thoại). Có nhiều lời hơn số thẻ đang thấy thì tự trượt mỗi 5 giây,
 * dừng khi rê chuột / chạm vào, và không tự trượt nếu người xem bật "giảm
 * chuyển động". Hết lượt thì quay về đầu.
 */

const CHU_KY_MS = 5000;

/**
 * Ảnh minh hoạ cho một thẻ: chọn trong `bo` theo id lời nguyện - trông như
 * ngẫu nhiên, nhưng mỗi lời luôn mang đúng một ảnh, không nhảy ảnh mỗi lần
 * tải lại trang.
 */
function anhCho<T>(id: string, bo: T[]): T {
  let bam = 0;
  for (let k = 0; k < id.length; k++) bam = (bam * 31 + id.charCodeAt(k)) >>> 0;
  return bo[bam % bo.length];
}

/**
 * Bộ ảnh cho thẻ lời nguyện: ảnh admin tải lên ở nhóm `prayer`
 * (/admin/dashboard, "Ảnh thẻ lời nguyện"); chưa có thì dùng bộ ảnh sẵn có.
 */
function useBoAnh(): (string | StaticImageData)[] {
  const [bo, setBo] = React.useState<(string | StaticImageData)[]>(heroImages);
  React.useEffect(() => {
    let conSong = true;
    goiApi<{ url: string }[]>("/v1/public/hero-images", { query: { group: "prayer" } })
      .then((ds) => {
        if (conSong && ds.length) setBo(ds.map((a) => urlApi(a.url)));
      })
      .catch(() => {});
    return () => {
      conSong = false;
    };
  }, []);
  return bo;
}

/** Số thẻ thấy cùng lúc theo bề rộng màn hình. */
function useSoThe(): number {
  const [so, setSo] = React.useState(3);
  React.useEffect(() => {
    const lg = window.matchMedia("(min-width: 1024px)");
    const sm = window.matchMedia("(min-width: 640px)");
    const tinh = () => setSo(lg.matches ? 3 : sm.matches ? 2 : 1);
    tinh();
    lg.addEventListener("change", tinh);
    sm.addEventListener("change", tinh);
    return () => {
      lg.removeEventListener("change", tinh);
      sm.removeEventListener("change", tinh);
    };
  }, []);
  return so;
}

export function PrayerSlideshow({
  ds,
  nhan,
  locale,
}: {
  ds: LoiNguyen[];
  nhan: { featuredTitle: string; anonymousName: string; kindCauAn: string; kindCauSieu: string; prev: string; next: string };
  locale: string;
}) {
  const soThe = Math.min(useSoThe(), Math.max(ds.length, 1));
  const boAnh = useBoAnh();
  const viTriCuoi = Math.max(0, ds.length - soThe);
  const [i, setI] = React.useState(0);
  const [dung, setDung] = React.useState(false);

  // Đổi bề rộng màn hình làm vị trí cũ vượt quá cuối thì kéo về.
  React.useEffect(() => {
    if (i > viTriCuoi) setI(viTriCuoi);
  }, [i, viTriCuoi]);

  React.useEffect(() => {
    if (viTriCuoi === 0 || dung) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const hen = window.setInterval(() => {
      if (document.visibilityState === "visible") setI((x) => (x >= viTriCuoi ? 0 : x + 1));
    }, CHU_KY_MS);
    return () => window.clearInterval(hen);
  }, [viTriCuoi, dung]);

  if (!ds.length) return null;

  return (
    <div
      className="flex flex-col gap-2"
      onMouseEnter={() => setDung(true)}
      onMouseLeave={() => setDung(false)}
      onFocus={() => setDung(true)}
      onBlur={() => setDung(false)}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">{nhan.featuredTitle}</span>
        {viTriCuoi > 0 ? (
          <span className="flex gap-1">
            <button
              type="button"
              onClick={() => setI((x) => (x <= 0 ? viTriCuoi : x - 1))}
              aria-label={nhan.prev}
              className="flex size-7 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-ink"
            >
              <ChevronLeft className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setI((x) => (x >= viTriCuoi ? 0 : x + 1))}
              aria-label={nhan.next}
              className="flex size-7 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-ink"
            >
              <ChevronRight className="size-4" aria-hidden />
            </button>
          </span>
        ) : null}
      </div>

      <div className="overflow-hidden">
        <ol
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${(i * 100) / soThe}%)` }}
        >
          {ds.map((ln) => (
            <li key={ln.id} className="shrink-0 px-1" style={{ width: `${100 / soThe}%` }}>
              <figure className="flex h-full flex-col overflow-hidden rounded-md border border-accent/20 bg-accent-soft/30">
                <div className="relative aspect-[16/9] w-full">
                  {(() => {
                    const anh = anhCho(ln.id, boAnh);
                    return (
                      <Image
                        src={anh}
                        alt=""
                        aria-hidden
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        // Ảnh tải lên là URL, không có ảnh mờ dựng sẵn như ảnh import tĩnh.
                        placeholder={typeof anh === "string" ? "empty" : "blur"}
                        className="object-cover"
                      />
                    );
                  })()}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" aria-hidden />
                </div>
                <div className="flex flex-1 flex-col gap-2 p-3">
                <Quote className="size-4 text-accent/60" aria-hidden />
                <blockquote className="line-clamp-5 flex-1 font-serif text-sm leading-relaxed text-ink">
                  {ln.body}
                </blockquote>
                <figcaption className="flex items-center gap-2 text-xs text-muted">
                  <Avatar
                    src={ln.anonymous ? "" : ln.author.avatarUrl}
                    name={ln.anonymous ? "" : ln.author.name}
                    size={20}
                  />
                  <span className="truncate font-medium text-body">
                    {ln.anonymous || !ln.author.name ? nhan.anonymousName : ln.author.name}
                  </span>
                  <span
                    className={cn(
                      "ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                      ln.kind === "cau-sieu" ? "bg-brass-soft text-brass" : "bg-accent-soft text-accent",
                    )}
                  >
                    {ln.kind === "cau-sieu" ? nhan.kindCauSieu : nhan.kindCauAn}
                  </span>
                </figcaption>
                <time dateTime={ln.createdAt} className="sr-only">
                  {new Date(ln.createdAt).toLocaleDateString(locale === "vi" ? "vi-VN" : locale)}
                </time>
                </div>
              </figure>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
