"use client";

import { useRouter, usePathname } from "next/navigation";
import { SocialLogin, type NhanDangNhap } from "@/components/auth/social-login";
import { localePath, splitLocale } from "@/lib/i18n";

/**
 * Khung đăng nhập của trang /dang-nhap.
 *
 * Tách khỏi <SocialLogin> vì chỗ nào cũng cần hai cái nút đó, nhưng "xong rồi
 * thì đi đâu" lại khác nhau: ở đây là chuyển trang, còn ở trang tài khoản là
 * nạp lại hồ sơ ngay tại chỗ.
 *
 * Dùng `replace` chứ không `push`: bấm Quay lại sau khi đăng nhập xong mà rơi
 * về đúng màn hình đăng nhập thì rất khó hiểu.
 */
/**
 * `?next=` do RequireLogin gắn vào. Chỉ nhận đường dẫn nội bộ ("/..." nhưng
 * không "//" hay "/\") để link đăng nhập không bị dùng chuyển người ta sang site lạ.
 */
function trangQuayLai(): string | null {
  const tiep = new URLSearchParams(window.location.search).get("next");
  if (!tiep || !tiep.startsWith("/") || tiep.startsWith("//") || tiep.startsWith("/\\")) return null;
  return tiep;
}

export function LoginPanel({ nhan }: { nhan: NhanDangNhap }) {
  const router = useRouter();
  const { locale } = splitLocale(usePathname());

  return (
    <SocialLogin
      nhan={nhan}
      onXong={(ketQua) => {
        const tiep = trangQuayLai();
        if (tiep && !ketQua.isNewUser) {
          // Tải lại cả trang chứ không router.replace: InlineEditProvider chỉ đọc
          // hồ sơ một lần lúc tải trang, đi bằng router thì trang đích vẫn coi là
          // chưa đăng nhập và RequireLogin đá ngược về đây.
          window.location.replace(tiep);
          return;
        }
        router.replace(
          localePath(locale, ketQua.isNewUser ? "/hoan-thien-ho-so" : "/tai-khoan"),
        );
      }}
    />
  );
}
