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
    <Container className="flex flex-col gap-8 py-12">
      <Breadcrumbs
        trail={[
          { name: dict.nav.home, href: "/" },
          { name: dict.auth.title, href: "/dang-nhap" },
        ]}
      />

      <SectionHeading
        eyebrow={dict.auth.eyebrow}
        title={dict.auth.title}
        description={dict.auth.description}
      />

      <Card className="flex max-w-md flex-col gap-4 p-6">
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
          nhanMatKhau={{ ...dict.auth.password, failed: dict.auth.failed, needTwoFactor: dict.auth.needTwoFactor }}
          hoac={dict.auth.or}
        />
      </Card>
    </Container>
  );
}
