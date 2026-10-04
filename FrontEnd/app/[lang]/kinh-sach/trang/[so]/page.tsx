import type { Metadata } from "next";
import {
  ContentListPage,
  pageParams,
  parsePageNumber,
} from "@/components/content/content-list-page";
import { ListAdminBar } from "@/components/content/list-admin-bar";
import { i18nAlternates } from "@/lib/seo";

export const revalidate = 3600;

export async function generateStaticParams() {
  return pageParams({ type: "sutra" });
}

export async function generateMetadata(props: {
  params: Promise<{ so: string }>;
}): Promise<Metadata> {
  const { so } = await props.params;
  return {
    title: `Kinh sách — trang ${so}`,
    alternates: await i18nAlternates(`/kinh-sach/trang/${so}`),
    robots: { index: false, follow: true },
  };
}

export default async function SutraListPagedPage(props: {
  params: Promise<{ so: string }>;
}) {
  const { so } = await props.params;
  const page = parsePageNumber(so);

  return (
    <ContentListPage
      filter={{ type: "sutra" }}
      page={page}
      searchPath="/kinh-sach/tim-kiem"
      basePath="/kinh-sach"
      adminBar={<ListAdminBar themHref="/admin/library" themNhan="Thêm kinh sách" quyenThem="sutra.manage" />}
      eyebrow="Kinh, luật, luận"
      title="Kinh sách"
      description={`Trang ${page}`}
      trail={[
        { name: "Trang chủ", href: "/" },
        { name: "Kinh sách", href: "/kinh-sach" },
        { name: `Trang ${page}`, href: `/kinh-sach/trang/${page}` },
      ]}
    />
  );
}
