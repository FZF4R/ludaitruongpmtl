import type { Metadata } from "next";
import { Container, SectionHeading, Card } from "@/components/ui/primitives";
import { Breadcrumbs } from "@/components/content/navigation";
import { LoginPanel } from "@/components/auth/login-panel";
import { getDictionary } from "@/lib/dictionary";

/**
 * Đăng nhập bằng Google hoặc Facebook.
 *
 * noindex và không cache — không có gì ở đây cho bộ máy tìm kiếm, và cả trang
 * chỉ là một khung bọc quanh hai cái nút chạy phía trình duyệt.
 *
 * Chưa có đăng nhập bằng mật khẩu trên giao diện này. Backend vẫn còn
 * `POST /v1/user/login`, nhưng site không có màn hình đăng ký, nên mở ô mật
 * khẩu ra chỉ tổ dẫn người dùng vào ngõ cụt.
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
        />
      </Card>
    </Container>
  );
}
