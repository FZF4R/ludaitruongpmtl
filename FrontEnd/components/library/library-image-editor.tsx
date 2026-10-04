"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ImageUp, Link2, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCheDoSua } from "@/components/layout/inline-edit";
import { docToken, LoiApi } from "@/lib/auth";
import { luuCauHinh } from "@/lib/admin-api";
import { lamMoiCauHinh } from "@/lib/settings-action";
import { taiTep } from "@/lib/my-content";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Nút "Đổi ảnh" đặt trên một ảnh đại diện lưu trong cấu hình site (ảnh danh
 * mục Thư viện - `libraryImages`, ảnh mục Tu tập - `practiceImages`). Chỉ hiện
 * ở Chế độ sửa, với người có `system.settings`. Đặt CẠNH thẻ (không lồng
 * trong <a>) để bấm không điều hướng.
 *
 * Lưu cả bộ ảnh (`daDat` + ảnh mới của khoá này), xoá cache cấu hình rồi
 * router.refresh() - thứ admin thấy là thứ người đọc sẽ thấy.
 */
export function SettingImageEditor({
  truong,
  kind,
  ten,
  daDat,
  locale,
  className,
}: {
  /** Trường cấu hình chứa bộ ảnh. */
  truong: "libraryImages" | "practiceImages";
  /** Khoá trong bộ ảnh (vd. "bo-tat", "meditation"). */
  kind: string;
  ten: string;
  daDat: Partial<Record<string, string>>;
  locale: Locale;
  className?: string;
}) {
  const { dangSua, quyen } = useCheDoSua();
  const router = useRouter();
  const [mo, setMo] = React.useState(false);
  const [link, setLink] = React.useState(daDat[kind] ?? "");
  const [dang, setDang] = React.useState(false);
  const [loi, setLoi] = React.useState("");
  const tep = React.useRef<HTMLInputElement>(null);

  if (!dangSua || !quyen.includes("system.settings")) return null;

  async function luu(url: string) {
    setDang(true);
    setLoi("");
    try {
      const moi = { ...daDat, [kind]: url };
      if (!url) delete moi[kind];
      await luuCauHinh({ [truong]: moi }, locale);
      const token = docToken();
      if (token) await lamMoiCauHinh(token);
      setMo(false);
      router.refresh();
    } catch (err) {
      setLoi((err instanceof LoiApi && err.thongDiep) || "Không lưu được, vui lòng thử lại.");
    } finally {
      setDang(false);
    }
  }

  async function taiLen(f: File | undefined) {
    if (!f) return;
    setDang(true);
    setLoi("");
    try {
      const kq = await taiTep(f, locale);
      await luu(kq.url);
    } catch (err) {
      setLoi((err instanceof LoiApi && err.thongDiep) || "Không tải được ảnh lên.");
      setDang(false);
    } finally {
      if (tep.current) tep.current.value = "";
    }
  }

  return (
    <div className={cn("absolute right-2 top-2 z-10 flex flex-col items-end gap-1.5", className)}>
      <button
        type="button"
        onClick={() => setMo((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-dashed border-accent bg-surface/95 px-3 py-1.5 text-xs font-medium text-accent shadow-sm hover:bg-accent hover:text-paper"
        aria-expanded={mo}
      >
        <ImageUp className="size-3.5" aria-hidden /> Đổi ảnh
      </button>
      {mo ? (
        <div className="flex w-64 flex-col gap-2 rounded-md border border-line bg-surface p-3 text-left shadow-card-lift">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink">Ảnh “{ten}”</span>
            <button type="button" onClick={() => setMo(false)} aria-label="Đóng" className="text-muted hover:text-ink">
              <X className="size-3.5" aria-hidden />
            </button>
          </div>
          <input ref={tep} type="file" accept="image/*" className="hidden" onChange={(e) => taiLen(e.target.files?.[0])} />
          <Button type="button" size="sm" disabled={dang} onClick={() => tep.current?.click()}>
            <ImageUp aria-hidden /> {dang ? "Đang lưu…" : "Tải ảnh lên"}
          </Button>
          <div className="flex gap-1.5">
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="hoặc dán link https://…"
              aria-label="Link ảnh"
              className="h-8 min-w-0 flex-1 rounded-md border border-line bg-surface px-2 text-xs focus:border-accent focus:outline-none"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={dang || !/^https?:\/\//i.test(link.trim())}
              onClick={() => luu(link.trim())}
              aria-label="Lưu link ảnh"
            >
              <Link2 aria-hidden />
            </Button>
          </div>
          {daDat[kind] ? (
            <button
              type="button"
              disabled={dang}
              onClick={() => luu("")}
              className={cn("flex w-fit items-center gap-1 text-xs text-muted hover:text-lacquer")}
            >
              <RotateCcw className="size-3" aria-hidden /> Dùng ảnh có sẵn
            </button>
          ) : null}
          {loi ? (
            <span role="alert" className="text-xs text-lacquer">
              {loi}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** Ảnh danh mục Thư viện. */
export function LibraryImageEditor(props: Omit<React.ComponentProps<typeof SettingImageEditor>, "truong">) {
  return <SettingImageEditor truong="libraryImages" {...props} />;
}
