import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategory, listCategories } from "@/lib/api";
import { ContentListPage } from "@/components/content/content-list-page";
import { i18nAlternates } from "@/lib/seo";

export const revalidate = 3600;

export async function generateStaticParams() {
  const categories = await listCategories();
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const category = await getCategory(slug);
  if (!category) return { title: "Không tìm thấy chuyên mục" };

  return {
    title: category.name,
    description: category.description || `Nội dung thuộc chuyên mục ${category.name}.`,
    alternates: await i18nAlternates(`/danh-muc/${category.slug}`),
  };
}

export default async function CategoryPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const category = await getCategory(slug);
  if (!category) notFound();

  return (
    <ContentListPage
      filter={{ category: slug }}
      page={1}
      basePath={`/danh-muc/${category.slug}`}
      eyebrow="Chuyên mục"
      title={category.name}
      description={category.description}
      trail={[
        { name: "Trang chủ", href: "/" },
        { name: category.name, href: `/danh-muc/${category.slug}` },
      ]}
      emptyTitle="Chuyên mục này chưa có nội dung"
    />
  );
}
