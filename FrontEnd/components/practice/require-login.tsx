"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCheDoSua } from "@/components/layout/inline-edit";
import { localePath, splitLocale } from "@/lib/i18n";

/**
 * Bắt đăng nhập trước khi dùng các công cụ trong mục "Tu tập" và trang
 * "Quá trình tu tập" (mỗi nơi gắn qua layout.tsx của route đó).
 *
 * Token nằm ở localStorage (xem lib/auth.ts) nên máy chủ không biết ai đang
 * xem - chỉ chặn được ở trình duyệt. Trang tổng quan /tu-tap vẫn mở cho mọi
 * người: đó là đường vào và là trang cho bộ máy tìm kiếm.
 *
 * Nội dung vẫn được render (ẩn bằng `hidden`) thay vì bỏ hẳn: HTML máy chủ trả
 * về giữ nguyên chữ cho SEO, còn người chưa đăng nhập không thấy và không bấm
 * được gì trước khi bị chuyển sang /dang-nhap?next=...
 */
export function RequireLogin({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { nguoiDungId, daBiet } = useCheDoSua();
  const { locale, path } = splitLocale(pathname);

  const tongQuan = path === "/tu-tap";
  const choPhep = tongQuan || (daBiet && !!nguoiDungId);

  React.useEffect(() => {
    if (tongQuan || !daBiet || nguoiDungId) return;
    router.replace(`${localePath(locale, "/dang-nhap")}?next=${encodeURIComponent(pathname)}`);
  }, [tongQuan, daBiet, nguoiDungId, locale, pathname, router]);

  return (
    <>
      {!choPhep && (
        <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted" aria-busy>
          …
        </div>
      )}
      <div hidden={!choPhep}>{children}</div>
    </>
  );
}
