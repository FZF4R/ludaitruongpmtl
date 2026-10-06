import type { Metadata } from "next";
import { Container, SectionHeading, Card } from "@/components/ui/primitives";
import { Breadcrumbs } from "@/components/content/navigation";
import { LoginPanel } from "@/components/auth/login-panel";
import { getDictionary } from "@/lib/dictionary";

/**
 * Đăng nhập bằng Google / Facebook, hoặc tên đăng nhập + mật khẩu (kèm đăng ký
 * tài khoản mới có số điện thoại - tài khoản đó được đánh dấu isNotVerified).
 *
 * noindex và không cache — không có gì ở đây cho bộ máy tìm kiếm, và cả trang
 * chỉ là một khung bọc quanh các form chạy phía trình duyệt.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Đăng nhập",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  const dict = await getDictionary();

  return (
    <Container className="flex flex-col gap-6 py-6 sm:py-8">
      <Breadcrumbs
        trail={[
          { name: dict.nav.home, href: "/" },
          { name: dict.auth.title, href: "/dang-nhap" },
        ]}
      />

      {/*
        Hai cột: lời giới thiệu bên trái, khung đăng nhập sát phải và bắt đầu
        ngay đầu trang - tab Đăng ký dài thêm hai ô mà nút "Tạo tài khoản" vẫn
        nằm trong màn hình, không phải cuộn. Màn hình hẹp thì xếp dọc như cũ.
      */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_28rem] lg:items-start">
        <SectionHeading
          eyebrow={dict.auth.eyebrow}
          title={dict.auth.title}
          description={dict.auth.description}
        />

        <Card className="flex w-full max-w-md flex-col gap-4 p-6 lg:max-w-none lg:justify-self-end">
          <LoginPanel
            nhan={{
              google: dict.auth.google,
              facebook: dict.auth.facebook,
              connecting: dict.auth.connecting,
              notConfigured: dict.auth.notConfigured,
              failed: dict.auth.failed,
              cancelled: dict.auth.cancelled,
              needTwoFactor: dict.auth.needTwoFactor,
              privacy: dict.auth.privacy,
            }}
            nhanMatKhau={{
              ...dict.auth.password,
              failed: dict.auth.failed,
              needTwoFactor: dict.auth.needTwoFactor,
            }}
            hoac={dict.auth.or}
          />
        </Card>
      </div>
    </Container>
  );
}
