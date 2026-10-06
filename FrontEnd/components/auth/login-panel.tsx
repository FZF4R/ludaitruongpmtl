"use client";

import { usePathname } from "next/navigation";
import { SocialLogin, type NhanDangNhap } from "@/components/auth/social-login";
import { PasswordLogin, type NhanMatKhau } from "@/components/auth/password-login";
import { localePath, splitLocale } from "@/lib/i18n";

/**
 * `?next=` do RequireLogin gắn vào. Chỉ nhận đường dẫn nội bộ ("/..." nhưng
 * không "//" hay "/\") để link đăng nhập không bị dùng chuyển người ta sang site lạ.
 */
function trangQuayLai(): string | null {
  const tiep = new URLSearchParams(window.location.search).get("next");
  if (!tiep || !tiep.startsWith("/") || tiep.startsWith("//") || tiep.startsWith("/\\")) return null;
  return tiep;
}

/**
 * Khung đăng nhập của trang /dang-nhap.
 *
 * Tách khỏi <SocialLogin> vì chỗ nào cũng cần hai cái nút đó, nhưng "xong rồi
 * thì đi đâu" lại khác nhau: ở đây là chuyển trang, còn ở trang tài khoản là
 * tải lại ngay tại chỗ.
 *
 * Tải lại CẢ TRANG (window.location) chứ không router.replace: InlineEditProvider
 * (header, quyền, RequireLogin) chỉ đọc hồ sơ một lần lúc tải trang, đi bằng
 * router thì site vẫn coi là chưa đăng nhập cho tới khi bấm Ctrl+F5.
 * Dùng `replace` chứ không `assign`: bấm Quay lại sau khi đăng nhập xong mà rơi
 * về đúng màn hình đăng nhập thì rất khó hiểu.
 */
export function LoginPanel({ nhan, nhanMatKhau, hoac }: { nhan: NhanDangNhap; nhanMatKhau: NhanMatKhau; hoac: string }) {
  const { locale } = splitLocale(usePathname());

  const xong = (ketQua: { isNewUser: boolean }) => {
    const dich = ketQua.isNewUser
      ? localePath(locale, "/hoan-thien-ho-so")
      : trangQuayLai() ?? localePath(locale, "/tai-khoan");
    window.location.replace(dich);
  };

  return (
    <div className="flex flex-col gap-5">
      <SocialLogin nhan={nhan} onXong={xong} />
      <HoacNgang chu={hoac} />
      <PasswordLogin nhan={nhanMatKhau} onXong={xong} />
    </div>
  );
}

/** Đường kẻ "hoặc" giữa hai cách đăng nhập. */
export function HoacNgang({ chu }: { chu: string }) {
  return (
    <div className="flex items-center gap-3 text-xs uppercase tracking-[0.12em] text-muted" aria-hidden>
      <span className="h-px flex-1 bg-line" />
      {chu}
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
