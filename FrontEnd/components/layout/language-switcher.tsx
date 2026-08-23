"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { Check, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  localeNames,
  localePath,
  locales,
  splitLocale,
  type Locale,
} from "@/lib/i18n";

type Props = {
  /** Nhãn đã dịch, truyền từ Server Component xuống. */
  label: string;
  chooseLabel: string;
};

/**
 * Bộ chọn ngôn ngữ.
 *
 * Đổi ngôn ngữ là điều hướng thật sang URL của ngôn ngữ đó, không phải đổi
 * state tại chỗ: mỗi ngôn ngữ có một địa chỉ riêng nên chia sẻ link được, nút
 * back của trình duyệt chạy đúng, và Google đánh chỉ mục được cả bốn bản.
 *
 * Cookie chỉ để nhớ lựa chọn cho lần sau vào thẳng trang gốc - nó không quyết
 * định nội dung đang hiển thị, URL mới là thứ quyết định.
 */
export function LanguageSwitcher({ label, chooseLabel }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [mo, setMo] = React.useState(false);
  const boc = React.useRef<HTMLDivElement>(null);

  const { locale: hienTai, path } = splitLocale(pathname);

  // Đóng khi bấm ra ngoài hoặc nhấn Esc.
  React.useEffect(() => {
    if (!mo) return;

    const bamNgoai = (e: MouseEvent) => {
      if (boc.current && !boc.current.contains(e.target as Node)) setMo(false);
    };
    const nhanPhim = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMo(false);
    };

    document.addEventListener("mousedown", bamNgoai);
    document.addEventListener("keydown", nhanPhim);

    return () => {
      document.removeEventListener("mousedown", bamNgoai);
      document.removeEventListener("keydown", nhanPhim);
    };
  }, [mo]);

  function chon(locale: Locale) {
    setMo(false);
    if (locale === hienTai) return;

    // Nhớ lựa chọn cho lần sau vào "/" mà chưa có tiền tố nào.
    document.cookie = `sv_ngon_ngu=${locale}; path=/; max-age=31536000; samesite=lax`;
    router.push(localePath(locale, path));
  }

  return (
    <div className="relative" ref={boc}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setMo((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={mo}
        aria-label={`${label}: ${localeNames[hienTai]}`}
        title={label}
      >
        <Globe />
      </Button>

      {mo ? (
        <div
          role="menu"
          aria-label={chooseLabel}
          className="absolute right-0 z-50 mt-1 min-w-44 overflow-hidden rounded-md border border-line bg-surface py-1 shadow-lg"
        >
          {locales.map((locale) => {
            const dangChon = locale === hienTai;

            return (
              <button
                key={locale}
                type="button"
                role="menuitemradio"
                aria-checked={dangChon}
                lang={locale}
                onClick={() => chon(locale)}
                className={cn(
                  "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors",
                  dangChon
                    ? "font-medium text-accent"
                    : "text-body hover:bg-surface-2 hover:text-ink",
                )}
              >
                <Check
                  className={cn("size-4 shrink-0", dangChon ? "opacity-100" : "opacity-0")}
                  aria-hidden
                />
                {localeNames[locale]}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
