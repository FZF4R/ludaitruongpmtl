import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/primitives";
import { Breadcrumbs } from "@/components/content/navigation";
import { getDictionary } from "@/lib/dictionary";
import { i18nAlternates } from "@/lib/seo";
import type { PracticeKey } from "@/lib/site";

/** Metadata chung cho bốn trang công cụ tu tập. */
export async function practiceMetadata(key: PracticeKey, href: string): Promise<Metadata> {
  const dict = await getDictionary();
  return {
    title: dict.nav[key],
    description: dict.nav[`${key}Hint`],
    alternates: await i18nAlternates(href),
  };
}

/** Breadcrumb + tiêu đề đầu trang công cụ tu tập. */
export async function PracticeHeader({ navKey, href }: { navKey: PracticeKey; href: string }) {
  const dict = await getDictionary();
  return (
    <>
      <Breadcrumbs
        trail={[
          { name: dict.nav.home, href: "/" },
          { name: dict.nav.practice, href: "/tu-tap" },
          { name: dict.nav[navKey], href },
        ]}
      />
      <SectionHeading eyebrow={dict.nav.practice} title={dict.nav[navKey]} description={dict.nav[`${navKey}Hint`]} />
    </>
  );
}
