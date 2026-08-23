import type { Metadata } from "next";
import { getDictionary } from "@/lib/dictionary";
import { i18nAlternates } from "@/lib/seo";
import { ContentListPage } from "@/components/content/content-list-page";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();

  return {
    title: dict.nav.sutras,
    description: dict.list.sutrasDesc,
    alternates: await i18nAlternates("/kinh-sach"),
  };
}

export default async function SutraListPage() {
  const dict = await getDictionary();

  const trail = [
    { name: dict.nav.home, href: "/" },
    { name: dict.nav.sutras, href: "/kinh-sach" },
  ];

  return (
    <ContentListPage
      filter={{ type: "sutra" }}
      page={1}
      basePath="/kinh-sach"
      eyebrow={dict.footer.categories}
      title={dict.nav.sutras}
      description={dict.list.sutrasDesc}
      trail={[
        { name: dict.nav.home, href: "/" },
        { name: dict.nav.sutras, href: "/kinh-sach" },
      ]}
      emptyTitle={dict.list.emptySutras}
    />
  );
}
