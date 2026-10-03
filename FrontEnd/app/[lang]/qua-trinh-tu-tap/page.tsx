import type { Metadata } from "next";
import { Container, SectionHeading } from "@/components/ui/primitives";
import { Breadcrumbs } from "@/components/content/navigation";
import { Journey } from "@/components/practice/journey";
import { getDictionary } from "@/lib/dictionary";
import { i18nAlternates } from "@/lib/seo";

const HREF = "/qua-trinh-tu-tap";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return {
    title: dict.nav.journey,
    alternates: await i18nAlternates(HREF),
    // Nhật ký riêng của từng người: không có gì để lập chỉ mục.
    robots: { index: false, follow: true },
  };
}

export default async function Page() {
  const dict = await getDictionary();
  return (
    <Container className="flex flex-col gap-8 py-12">
      <Breadcrumbs
        trail={[
          { name: dict.nav.home, href: "/" },
          { name: dict.nav.journey, href: HREF },
        ]}
      />
      <SectionHeading title={dict.practiceTools.journey.title} description={dict.nav.journeyHint} />
      <Journey nhan={dict.practiceTools} />
    </Container>
  );
}
