import type { Metadata } from "next";
import {
  ContentListPage,
  pageParams,
  parsePageNumber,
} from "@/components/content/content-list-page";
import { ListAdminBar } from "@/components/content/list-admin-bar";
import { getSiteSettings } from "@/lib/api";
import { i18nAlternates } from "@/lib/seo";

export const revalidate = 3600;

const filter = { type: ["article", "blog"] as const };

export async function generateStaticParams() {
  return pageParams({ type: ["article", "blog"] });
}

export async function generateMetadata(props: {
  params: Promise<{ so: string }>;
}): Promise<Metadata> {
  const { so } = await props.params;
  return {
    title: `Bài viết — trang ${so}`,
    description: "Pháp thoại, tuỳ bút và hỏi đáp Phật pháp.",
    alternates: await i18nAlternates(`/bai-viet/trang/${so}`),
    // Trang 2 trở đi không mang giá trị xếp hạng riêng, nhưng vẫn phải
    // cho bot đi tiếp để nó thu thập hết bài ở các trang sau.
    robots: { index: false, follow: true },
  };
}

export default async function ArticleListPagedPage(props: {
  params: Promise<{ so: string }>;
}) {
  const { so } = await props.params;
  const page = parsePageNumber(so);
  const settings = await getSiteSettings();
  const layout = settings?.articleLayout === "list" ? "list" : "card";

  return (
    <ContentListPage
      filter={{ type: [...filter.type] }}
      page={page}
      searchPath="/bai-viet/tim-kiem"
      basePath="/bai-viet"
      layout={layout}
      thumbnail
      adminBar={
        <ListAdminBar themHref="/admin/blog" themNhan="Thêm bài viết" kieuHienThi={layout} />
      }
      eyebrow="Chuyên mục"
      title="Bài viết"
      description={`Trang ${page}`}
      trail={[
        { name: "Trang chủ", href: "/" },
        { name: "Bài viết", href: "/bai-viet" },
        { name: `Trang ${page}`, href: `/bai-viet/trang/${page}` },
      ]}
    />
  );
}
