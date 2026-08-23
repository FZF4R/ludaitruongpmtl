import type { Metadata } from "next";
import { Container, SectionHeading } from "@/components/ui/primitives";
import { Breadcrumbs } from "@/components/content/navigation";
import { OnboardingForm } from "@/components/auth/onboarding-form";
import { getDictionary } from "@/lib/dictionary";

/**
 * Khai hồ sơ Phật tử + khảo sát tu tập.
 *
 * Người dùng tới đây ngay sau lần đăng nhập đầu tiên (backend trả
 * `isNewUser: true` khi Users.profileCompleted còn false), và cũng vào lại
 * được từ trang tài khoản mỗi khi muốn sửa.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Hoàn thiện hồ sơ",
  robots: { index: false, follow: false },
};

export default async function OnboardingPage() {
  const dict = await getDictionary();

  return (
    <Container className="flex max-w-3xl flex-col gap-8 py-12">
      <Breadcrumbs
        trail={[
          { name: dict.nav.home, href: "/" },
          { name: dict.nav.account, href: "/tai-khoan" },
          { name: dict.onboarding.title, href: "/hoan-thien-ho-so" },
        ]}
      />

      <SectionHeading
        eyebrow={dict.onboarding.eyebrow}
        title={dict.onboarding.title}
        description={dict.onboarding.description}
      />

      <OnboardingForm
        nhan={dict.onboarding}
        nhanAuth={{ loading: dict.auth.loading, title: dict.auth.title }}
      />
    </Container>
  );
}
