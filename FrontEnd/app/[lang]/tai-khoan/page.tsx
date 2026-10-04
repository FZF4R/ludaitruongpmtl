import type { Metadata } from "next";
import { Container, SectionHeading } from "@/components/ui/primitives";
import { Breadcrumbs } from "@/components/content/navigation";
import { AccountPanel } from "@/components/auth/account-panel";
import { ContributionHistory } from "@/components/account/contribution-history";
import { getDictionary } from "@/lib/dictionary";

/**
 * Khu vực cá nhân.
 *
 * noindex và không cache: dữ liệu riêng của từng người, không có gì ở đây
 * đáng để bộ máy tìm kiếm nhìn thấy.
 *
 * Toàn bộ phần động nằm trong <AccountPanel> chạy phía trình duyệt, vì access
 * token ở localStorage nên server không biết ai đang xem (xem lib/auth.ts).
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tài khoản",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const dict = await getDictionary();

  return (
    <Container className="flex flex-col gap-8 py-12">
      <Breadcrumbs
        trail={[
          { name: dict.nav.home, href: "/" },
          { name: dict.account.title, href: "/tai-khoan" },
        ]}
      />

      <SectionHeading
        eyebrow={dict.account.eyebrow}
        title={dict.account.title}
        description={dict.account.description}
      />

      <AccountPanel nhanAuth={dict.auth} nhanHoSo={dict.onboarding} nhanTaiKhoan={dict.account} />
      <ContributionHistory nhan={dict.account} nhanBai={dict.myContent} nhanThuVien={dict.library} />
    </Container>
  );
}
