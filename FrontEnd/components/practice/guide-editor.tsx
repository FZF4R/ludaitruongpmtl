"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCheDoSua } from "@/components/layout/inline-edit";
import { docToken } from "@/lib/auth";
import { splitLocale } from "@/lib/i18n";
import { luuChuGiaoDien } from "@/lib/site-text-action";

/**
 * Chế độ sửa: thêm / xoá mục trong phần Hướng dẫn của trang tu tập.
 * Mục thêm là hai chữ giao diện `practiceTools.guides.<nhom>.<i>.title|body`
 * (lưu theo ngôn ngữ đang xem), nên sửa nội dung bằng bút chì như mục có sẵn.
 */
async function luuNhieu(lang: string, cap: [string, string][]) {
  const token = docToken();
  if (!token) throw new Error("Phiên đăng nhập đã hết, hãy đăng nhập lại.");
  for (const [key, value] of cap) {
    const kq = await luuChuGiaoDien({ token, lang, key, value });
    if (!kq.ok) throw new Error(kq.message || "Không lưu được, vui lòng thử lại.");
  }
}

export function ThemMucHuongDan({ nhom, chiSoMoi }: { nhom: string; chiSoMoi: number }) {
  const { dangSua } = useCheDoSua();
  const router = useRouter();
  const { locale } = splitLocale(usePathname());
  const [dang, startDang] = React.useTransition();
  if (!dangSua) return null;

  return (
    <Button
      type="button"
      variant="outline"
      className="w-fit border-dashed border-accent text-accent"
      disabled={dang}
      onClick={() =>
        startDang(async () => {
          try {
            await luuNhieu(locale, [
              [`practiceTools.guides.${nhom}.${chiSoMoi}.title`, "Mục hướng dẫn mới"],
              [`practiceTools.guides.${nhom}.${chiSoMoi}.body`, "Bấm bút chì để sửa nội dung mục này."],
            ]);
            router.refresh();
          } catch (err) {
            window.alert(err instanceof Error ? err.message : "Không thêm được mục.");
          }
        })
      }
    >
      <Plus aria-hidden /> {dang ? "Đang thêm…" : "Thêm mục hướng dẫn"}
    </Button>
  );
}

/** Xoá một mục đã thêm (mục có sẵn trong từ điển chỉ sửa được, không xoá). */
export function XoaMucHuongDan({ nhom, chiSo }: { nhom: string; chiSo: number }) {
  const { dangSua } = useCheDoSua();
  const router = useRouter();
  const { locale } = splitLocale(usePathname());
  const [dang, startDang] = React.useTransition();
  if (!dangSua) return null;

  return (
    <button
      type="button"
      disabled={dang}
      onClick={() => {
        if (!window.confirm("Xoá mục hướng dẫn này?")) return;
        startDang(async () => {
          try {
            await luuNhieu(locale, [
              [`practiceTools.guides.${nhom}.${chiSo}.title`, ""],
              [`practiceTools.guides.${nhom}.${chiSo}.body`, ""],
            ]);
            router.refresh();
          } catch (err) {
            window.alert(err instanceof Error ? err.message : "Không xoá được mục.");
          }
        });
      }}
      className="mt-2 flex items-center gap-1 text-xs text-muted hover:text-lacquer disabled:opacity-50"
    >
      <Trash2 className="size-3.5" aria-hidden /> Xoá mục
    </button>
  );
}
