import type { Metadata } from "next";
import { getDictionary } from "@/lib/dictionary";
import { i18nAlternates } from "@/lib/seo";
import { ContentListPage } from "@/components/content/content-list-page";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();

  return {
    title: dict.nav.talks,
    description: dict.list.talksDesc,
    alternates: await i18nAlternates("/bai-giang"),
  };
}

export default async function TalkListPage() {
  const dict = await getDictionary();

  const trail = [
    { name: dict.nav.home, href: "/" },
    { name: dict.nav.talks, href: "/bai-giang" },
  ];

  return (
    <ContentListPage
      filter={{ type: ["audio", "video"] }}
      page={1}
      basePath="/bai-giang"
      eyebrow={dict.footer.categories}
      title={dict.nav.talks}
      description={dict.list.talksDesc}
      trail={[
        { name: dict.nav.home, href: "/" },
        { name: dict.nav.talks, href: "/bai-giang" },
      ]}
      columns={2}
      emptyTitle={dict.list.emptyTalks}
    />
  );
}
