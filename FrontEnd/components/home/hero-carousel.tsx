"use client";

import * as React from "react";
import Image, { type StaticImageData } from "next/image";
import { cn } from "@/lib/utils";

/**
 * Ảnh nền khối mở đầu trang chủ, xoay vòng và chuyển mờ dần.
 *
 * Mọi ảnh nằm chồng lên nhau, chỉ đổi opacity: không có bố cục nào nhảy khi
 * chuyển ảnh, và chữ đè phía trên (câu kệ, nút) đứng yên. Chỉ ảnh đầu tiên
 * được `priority` vì nó là LCP; các ảnh sau tải lười, kịp trước lượt chuyển.
 *
 * Không tự chạy khi người dùng bật "giảm chuyển động", và tạm dừng khi tab
 * bị ẩn để không đốt CPU vô ích.
 */

export type AnhHero = { src: string | StaticImageData; alt: string };

const CHU_KY_MS = 7000;

export function HeroCarousel({ images, startIndex = 0 }: { images: AnhHero[]; startIndex?: number }) {
  const [dangHien, setDangHien] = React.useState(startIndex % Math.max(images.length, 1));

  React.useEffect(() => {
    if (images.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const hen = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        setDangHien((i) => (i + 1) % images.length);
      }
    }, CHU_KY_MS);

    return () => window.clearInterval(hen);
  }, [images.length]);

  return (
    <>
      {images.map((anh, i) => (
        <Image
          key={typeof anh.src === "string" ? anh.src : anh.src.src}
          src={anh.src}
          alt=""
          aria-hidden
          priority={i === startIndex}
          placeholder={typeof anh.src === "string" ? "empty" : "blur"}
          fill
          sizes="100vw"
          // Ảnh phủ kín màn hình: chất lượng mặc định 75 làm lộ vệt nén ở vùng
          // trời, mặt nước. Phải khớp `images.qualities` trong next.config.ts.
          quality={90}
          className={cn(
            "-z-10 object-cover transition-opacity duration-[1500ms] ease-in-out",
            i === dangHien ? "opacity-100" : "opacity-0",
          )}
        />
      ))}

      {images.length > 1 ? (
        <div className="absolute bottom-16 right-5 z-10 flex gap-1.5 sm:right-8">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Ảnh ${i + 1}`}
              aria-current={i === dangHien}
              onClick={() => setDangHien(i)}
              className={cn(
                "h-1.5 rounded-full bg-white/50 transition-all hover:bg-white/80",
                i === dangHien ? "w-5 bg-white" : "w-1.5",
              )}
            />
          ))}
        </div>
      ) : null}
    </>
  );
}
