import type { Metadata } from "next";
import { Container, SectionHeading } from "@/components/ui/primitives";
import { Breadcrumbs } from "@/components/content/navigation";
import { UserStats } from "@/components/account/user-stats";
import { getDictionary } from "@/lib/dictionary";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.stats.title, robots: { index: false, follow: false } };
}

export default async function Page() {
  const dict = await getDictionary();
  return (
    <Container className="flex flex-col gap-8 py-12">
      <Breadcrumbs
        trail={[
          { name: dict.nav.home, href: "/" },
          { name: dict.account.title, href: "/tai-khoan" },
          { name: dict.stats.title, href: "/tai-khoan/thong-ke" },
        ]}
      />
      <SectionHeading eyebrow={dict.account.eyebrow} title={dict.stats.title} description={dict.stats.description} />
      <UserStats nhan={dict.stats} nhanTuTap={dict.practiceTools.journey} nhanBai={dict.myContent} />
    </Container>
  );
}
