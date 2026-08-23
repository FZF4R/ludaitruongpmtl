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
export function LoginPanel({ nhan }: { nhan: NhanDangNhap }) {
  const router = useRouter();
  const { locale } = splitLocale(usePathname());

  return (
    <SocialLogin
      nhan={nhan}
      onXong={(ketQua) =>
        router.replace(
          localePath(locale, ketQua.isNewUser ? "/hoan-thien-ho-so" : "/tai-khoan"),
        )
      }
    />
  );
}
