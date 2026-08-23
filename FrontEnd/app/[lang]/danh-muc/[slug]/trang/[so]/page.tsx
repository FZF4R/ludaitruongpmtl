import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategory, listCategories } from "@/lib/api";
import {
  ContentListPage,
  pageParams,
  parsePageNumber,
} from "@/components/content/content-list-page";
import { i18nAlternates } from "@/lib/seo";

export const revalidate = 3600;

export async function generateStaticParams() {
  const categories = await listCategories();
  const nested = await Promise.all(
    categories.map(async (c) => {
      const pages = await pageParams({ category: c.slug });
      return pages.map((p) => ({ slug: c.slug, so: p.so }));
    }),
  );
  return nested.flat();
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string; so: string }>;
}): Promise<Metadata> {
  const { slug, so } = await props.params;
  const category = await getCategory(slug);
  if (!category) return { title: "Không tìm thấy chuyên mục" };

  return {
    title: `${category.name} — trang ${so}`,
    alternates: await i18nAlternates(`/danh-muc/${slug}/trang/${so}`),
    robots: { index: false, follow: true },
  };
}

export default async function CategoryPagedPage(props: {
  params: Promise<{ slug: string; so: string }>;
}) {
  const { slug, so } = await props.params;
  const page = parsePageNumber(so);
  const category = await getCategory(slug);
  if (!category) notFound();

  return (
    <ContentListPage
      filter={{ category: slug }}
      page={page}
      basePath={`/danh-muc/${category.slug}`}
      eyebrow="Chuyên mục"
      title={category.name}
      description={`Trang ${page}`}
      trail={[
        { name: "Trang chủ", href: "/" },
        { name: category.name, href: `/danh-muc/${category.slug}` },
        { name: `Trang ${page}`, href: `/danh-muc/${category.slug}/trang/${page}` },
      ]}
    />
  );
}
