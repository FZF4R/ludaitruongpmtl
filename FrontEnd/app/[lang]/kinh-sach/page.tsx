import type { Metadata } from "next";
import { getDictionary } from "@/lib/dictionary";
import { i18nAlternates } from "@/lib/seo";
import { ContentListPage } from "@/components/content/content-list-page";
import { ListAdminBar } from "@/components/content/list-admin-bar";

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
      searchPath="/kinh-sach/tim-kiem"
      basePath="/kinh-sach"
      adminBar={<ListAdminBar nhanCuaToi={dict.myContent.title} themHref="/admin/library" themNhan="Thêm kinh sách" quyenThem="sutra.manage" />}
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
