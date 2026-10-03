"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import { PrayerSlideshow } from "@/components/home/prayer-slideshow";
import type { NhanLoiNguyen } from "@/components/home/prayer-wall";
import { localePath, splitLocale } from "@/lib/i18n";
import { layLoiNguyenNoiBat, type LoiNguyen } from "@/lib/prayers";

/**
 * Lời nguyện ở trang chủ: chỉ còn slideshow lời nổi bật và nút dẫn sang trang
 * Cầu an / Cầu siêu - nơi viết lời nguyện (PrayerWall) nay nằm ở đó.
 */
export function PrayerTeaser({ nhan, cta }: { nhan: NhanLoiNguyen; cta: string }) {
  const { locale } = splitLocale(usePathname());
  const [ds, setDs] = React.useState<LoiNguyen[]>([]);

  React.useEffect(() => {
    layLoiNguyenNoiBat(locale)
      .then(setDs)
      .catch(() => setDs([]));
  }, [locale]);

  return (
    <Card className="flex flex-col gap-4 p-5">
      <PrayerSlideshow ds={ds} nhan={nhan} locale={locale} />
      <div className="flex justify-center">
        <Button asChild>
          <Link href={localePath(locale, "/tu-tap/cau-an-cau-sieu")}>
            <PenLine className="size-4" aria-hidden /> {cta}
          </Link>
        </Button>
      </div>
    </Card>
  );
}
