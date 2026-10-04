import type { Metadata } from "next";
import { getDictionary } from "@/lib/dictionary";
import { i18nAlternates } from "@/lib/seo";
import { ContentListPage } from "@/components/content/content-list-page";
import { ListAdminBar } from "@/components/content/list-admin-bar";
import { getSiteSettings } from "@/lib/api";

/**
 * Trang 1 KHÔNG đọc searchParams, nên Next sinh tĩnh được nó.
 *
 * Nếu để `?page=` trên chính route này thì cả trang trở thành dynamic —
 * kể cả lượt truy cập trang 1, vốn chiếm gần hết traffic và là trang
 * nhận backlink. Phân trang vì thế nằm ở /bai-viet/trang/[so].
 */
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();

  return {
  title: dict.nav.articles,
    description: dict.list.articlesDesc,
    alternates: await i18nAlternates("/bai-viet"),
  };
}


export default async function ArticleListPage() {
  const [dict, settings] = await Promise.all([getDictionary(), getSiteSettings()]);
  const layout = settings?.articleLayout === "list" ? "list" : "card";

  const trail = [
    { name: dict.nav.home, href: "/" },
    { name: dict.nav.articles, href: "/bai-viet" },
  ];

  return (
    <ContentListPage
      filter={{ type: ["article", "blog"] }}
      page={1}
      searchPath="/bai-viet/tim-kiem"
      basePath="/bai-viet"
      layout={layout}
      thumbnail
      adminBar={
        <ListAdminBar themHref="/admin/blog" themNhan="Thêm bài viết" kieuHienThi={layout} />
      }
      eyebrow={dict.footer.categories}
      title={dict.nav.articles}
      description={dict.list.articlesDesc}
      trail={trail}
      emptyTitle={dict.list.emptyArticles}
    />
  );
}
