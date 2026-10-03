"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { CheckCircle2, EyeOff, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCheDoSua } from "@/components/layout/inline-edit";
import { LoiApi, goiApi } from "@/lib/auth";
import { splitLocale } from "@/lib/i18n";

/**
 * Góp ý gọn ở footer TRANG CHỦ, chỉ cho người đã đăng nhập.
 *
 * Chỉ một ô nội dung, mặc định GỬI ẨN DANH: người gửi không thấy tên mình
 * trên form. Backend vẫn lưu tên, liên hệ, tài khoản người gửi (lấy từ token,
 * System/Public/FeedbackController) để quản trị kiểm tra khi cần - trang quản
 * trị hiện "Ẩn danh" kèm tên thật.
 *
 * Footer dùng chung mọi trang nên component tự ẩn khi không phải trang chủ,
 * hoặc chưa đăng nhập.
 */

export type NhanGopYFooter = {
  footerTitle: string;
  anonymousNote: string;
  footerPlaceholder: string;
  submit: string;
  sending: string;
  thanks: string;
  error: string;
};

const DAI_TOI_DA = 2000;

export function FooterFeedback({ nhan }: { nhan: NhanGopYFooter }) {
  const { locale, path } = splitLocale(usePathname());
  const { nguoiDung } = useCheDoSua();
  const [noiDung, setNoiDung] = React.useState("");
  const [dangGui, setDangGui] = React.useState(false);
  const [xong, setXong] = React.useState(false);
  const [loi, setLoi] = React.useState("");

  if (path !== "/" || !nguoiDung) return null;

  async function gui(e: React.FormEvent) {
    e.preventDefault();
    if (noiDung.trim().length < 5) return;
    setDangGui(true);
    setLoi("");
    try {
      await goiApi("/v1/public/feedback", {
        method: "POST",
        body: { kind: "de-xuat", body: noiDung.trim(), anonymous: true },
        locale,
      });
      setXong(true);
      setNoiDung("");
      window.setTimeout(() => setXong(false), 5000);
    } catch (err) {
      setLoi((err instanceof LoiApi && err.thongDiep) || nhan.error);
    } finally {
      setDangGui(false);
    }
  }

  return (
    <div className="mt-10 w-full rounded-card border border-line bg-surface-2/60 p-4">
      <div className="mb-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
          {nhan.footerTitle}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted">
          <EyeOff className="size-3.5" aria-hidden /> {nhan.anonymousNote}
        </span>
      </div>

      {xong ? (
        <p className="flex items-center gap-2 text-sm text-accent">
          <CheckCircle2 className="size-4" aria-hidden /> {nhan.thanks}
        </p>
      ) : (
        <form onSubmit={gui} className="flex w-full items-end gap-2">
          <textarea
            value={noiDung}
            onChange={(e) => setNoiDung(e.target.value)}
            placeholder={nhan.footerPlaceholder}
            aria-label={nhan.footerPlaceholder}
            maxLength={DAI_TOI_DA}
            rows={2}
            className="min-h-[2.75rem] flex-1 resize-y rounded-md border border-line bg-surface px-3 py-2 text-sm leading-relaxed text-ink placeholder:text-muted focus:border-accent focus:outline-none"
          />
          <Button
            type="submit"
            size="sm"
            disabled={dangGui || noiDung.trim().length < 5}
            aria-label={dangGui ? nhan.sending : nhan.submit}
          >
            <Send aria-hidden />
            <span className="hidden sm:inline">{dangGui ? nhan.sending : nhan.submit}</span>
          </Button>
        </form>
      )}

      {loi ? (
        <p role="alert" className="mt-1.5 text-xs text-lacquer">
          {loi}
        </p>
      ) : null}
    </div>
  );
}
