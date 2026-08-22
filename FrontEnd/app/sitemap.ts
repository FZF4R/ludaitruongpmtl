import type { MetadataRoute } from "next";
import { listSlugs, listCategories } from "@/lib/api";
import { contentTypeBase, site } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [slugs, categories] = await Promise.all([listSlugs(), listCategories()]);
  const url = (path: string) => new URL(path, site.url).toString();
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: url("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: url("/bai-viet"), lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: url("/kinh-sach"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: url("/bai-giang"), lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: url("/phat-lich"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];

  const contentPages: MetadataRoute.Sitemap = slugs.map((s) => ({
    url: url(`${contentTypeBase[s.type]}/${s.slug}`),
    lastModified: new Date(s.updatedAt),
    changeFrequency: s.type === "sutra" ? "yearly" : "monthly",
    priority: 0.7,
  }));

  // Mỗi chương kinh là một trang riêng, phải có mặt trong sitemap.
  const chapterPages: MetadataRoute.Sitemap = slugs.flatMap((s) =>
    s.chapters.map((chuong) => ({
      url: url(`/kinh-sach/${s.slug}/${chuong}`),
      lastModified: new Date(s.updatedAt),
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  );

  const categoryPages: MetadataRoute.Sitemap = categories.map((c) => ({
    url: url(`/danh-muc/${c.slug}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  // Lịch của năm nay và năm sau.
  const year = now.getUTCFullYear();
  const calendarPages: MetadataRoute.Sitemap = [year, year + 1].flatMap((y) =>
    Array.from({ length: 12 }, (_, i) => ({
      url: url(`/phat-lich/${y}/${i + 1}`),
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.4,
    })),
  );

  return [
    ...staticPages,
    ...contentPages,
    ...chapterPages,
    ...categoryPages,
    ...calendarPages,
  ];
}
