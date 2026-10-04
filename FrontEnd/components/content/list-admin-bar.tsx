"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGrid, List, PenLine, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCheDoSua } from "@/components/layout/inline-edit";
import { docToken } from "@/lib/auth";
import { luuCauHinh } from "@/lib/admin-api";
import { localePath, splitLocale } from "@/lib/i18n";
import { lamMoiCauHinh } from "@/lib/settings-action";
import { cn } from "@/lib/utils";

/**
 * Thanh nhỏ cho quản trị viên ngay trên trang danh sách công khai.
 *
 * - "Thêm …": người có quyền `quyenThem` (mặc định `content.editAny`, kinh
 *   sách là `sutra.manage`) luôn thấy, dẫn thẳng vào trình soạn bài mới.
 * - Đổi kiểu hiển thị thẻ/danh sách: chỉ hiện khi đang bật "Sửa giao diện" và
 *   có `system.settings`, vì nó đổi cho MỌI người đọc chứ không riêng mình.
 *
 * Người đọc bình thường: component không in ra gì.
 */
export function ListAdminBar({
  themHref,
  themNhan,
  quyenThem = "content.editAny",
  kieuHienThi,
  nhanCuaToi,
}: {
  /** Có thì hiện nút "Bài viết của tôi" (người đã đăng nhập, được viết bài) dẫn tới /tai-khoan/bai-viet. */
  nhanCuaToi?: string;
  /** Đường dẫn khu quản trị, chưa có tiền tố ngôn ngữ, ví dụ "/admin/library". */
  themHref: string;
  themNhan: string;
  /** Quyền cần để thấy nút thêm; kinh sách dùng `sutra.manage`. */
  quyenThem?: string;
  /** Có thì hiện nút đổi kiểu hiển thị (chỉ trang Bài viết). */
  kieuHienThi?: "card" | "list";
}) {
  const { quyen, dangSua, nguoiDungId } = useCheDoSua();
  const router = useRouter();
  const { locale } = splitLocale(usePathname());
  const [dangDoi, startDoi] = React.useTransition();
  const [loi, setLoi] = React.useState("");

  const duocThem = quyen.includes(quyenThem);
  const duocDoiKieu = !!kieuHienThi && dangSua && quyen.includes("system.settings");
  const cuaToi =
    !!nhanCuaToi && !!nguoiDungId && (quyen.includes("content.draft") || quyen.includes("library.write") || quyen.includes("library.manage"));
  if (!duocThem && !duocDoiKieu && !cuaToi) return null;

  function doiKieu(kieu: "card" | "list") {
    if (kieu === kieuHienThi) return;
    setLoi("");
    startDoi(async () => {
      try {
        await luuCauHinh({ articleLayout: kieu }, locale);
        const token = docToken();
        if (token) await lamMoiCauHinh(token);
        router.refresh();
      } catch {
        setLoi("Không đổi được kiểu hiển thị.");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {cuaToi ? (
        <Button size="sm" variant="outline" asChild>
          <Link href={localePath(locale, "/tai-khoan/bai-viet")}>
            <PenLine aria-hidden /> {nhanCuaToi}
          </Link>
        </Button>
      ) : null}
      {duocThem ? (
        <Button size="sm" asChild>
          <Link href={`${localePath(locale, themHref)}?sua=moi`}>
            <Plus aria-hidden /> {themNhan}
          </Link>
        </Button>
      ) : null}

      {duocDoiKieu ? (
        <div
          role="group"
          aria-label="Kiểu hiển thị cho người đọc"
          className="flex items-center rounded-md border border-dashed border-accent/60 p-0.5"
        >
          {(
            [
              { id: "card", nhan: "Thẻ", Icon: LayoutGrid },
              { id: "list", nhan: "Danh sách", Icon: List },
            ] as const
          ).map(({ id, nhan, Icon }) => (
            <button
              key={id}
              type="button"
              disabled={dangDoi}
              aria-pressed={kieuHienThi === id}
              onClick={() => doiKieu(id)}
              className={cn(
                "flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50",
                kieuHienThi === id ? "bg-accent text-paper" : "text-muted hover:text-ink",
              )}
            >
              <Icon className="size-3.5" aria-hidden /> {nhan}
            </button>
          ))}
        </div>
      ) : null}

      {loi ? <span className="text-xs text-lacquer">{loi}</span> : null}
    </div>
  );
}
