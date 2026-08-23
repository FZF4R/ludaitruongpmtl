import type { MetadataRoute } from "next";
import { listSlugs, listCategories } from "@/lib/api";
import { contentTypeBase, site } from "@/lib/site";
import { localePath, localeTags, locales } from "@/lib/i18n";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [slugs, categories] = await Promise.all([listSlugs(), listCategories()]);
  const now = new Date();

  /**
   * Mỗi trang xuất hiện một lần cho mỗi ngôn ngữ, và mỗi mục mang theo
   * `alternates.languages` trỏ sang ba bản còn lại. Chỉ liệt kê bản tiếng Việt
   * thì Google không có đường nào tìm ra ba bản kia ngoài việc dò link.
   */
  const url = (path: string) => new URL(path, site.url).toString();

  const ngonNgu = (path: string) => {
    const languages: Record<string, string> = {};
    for (const item of locales) {
      languages[localeTags[item]] = url(localePath(item, path));
    }
    return languages;
  };

  /** Nhân một đường dẫn thô thành bốn mục, một cho mỗi ngôn ngữ. */
  const nhanNgonNgu = (
    path: string,
    thuocTinh: Omit<MetadataRoute.Sitemap[number], "url" | "alternates">,
  ): MetadataRoute.Sitemap =>
    locales.map((locale) => ({
      ...thuocTinh,
      url: url(localePath(locale, path)),
      alternates: { languages: ngonNgu(path) },
    }));

  const staticPages: MetadataRoute.Sitemap = [
    ...nhanNgonNgu("/", { lastModified: now, changeFrequency: "daily", priority: 1 }),
    ...nhanNgonNgu("/bai-viet", { lastModified: now, changeFrequency: "daily", priority: 0.8 }),
    ...nhanNgonNgu("/kinh-sach", { lastModified: now, changeFrequency: "weekly", priority: 0.8 }),
    ...nhanNgonNgu("/bai-giang", { lastModified: now, changeFrequency: "daily", priority: 0.8 }),
    ...nhanNgonNgu("/phat-lich", { lastModified: now, changeFrequency: "monthly", priority: 0.6 }),
    ...nhanNgonNgu("/tu-tap", { lastModified: now, changeFrequency: "monthly", priority: 0.7 }),
  ];

  /*
   * Sáu trang pháp tu con, /thu-vien, /qua-trinh-tu-tap và /ve-chung-toi CỐ Ý
   * không có ở đây: chúng đang là trang giữ chỗ và đã đặt noindex. Đưa trang
   * rỗng vào sitemap là mời Google lập chỉ mục thứ sau này phải gỡ ra.
   * Thêm vào đây khi từng trang có nội dung thật.
   */

  const contentPages: MetadataRoute.Sitemap = slugs.flatMap((s) =>
    nhanNgonNgu(`${contentTypeBase[s.type]}/${s.slug}`, {
      lastModified: new Date(s.updatedAt),
      changeFrequency: s.type === "sutra" ? "yearly" : "monthly",
      priority: 0.7,
    }),
  );

  // Mỗi chương kinh là một trang riêng, phải có mặt trong sitemap.
  const chapterPages: MetadataRoute.Sitemap = slugs.flatMap((s) =>
    s.chapters.flatMap((chuong) =>
      nhanNgonNgu(`/kinh-sach/${s.slug}/${chuong}`, {
        lastModified: new Date(s.updatedAt),
        changeFrequency: "yearly" as const,
        priority: 0.6,
      }),
    ),
  );

  const categoryPages: MetadataRoute.Sitemap = categories.flatMap((c) =>
    nhanNgonNgu(`/danh-muc/${c.slug}`, {
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.5,
    }),
  );

  // Lịch của năm nay và năm sau.
  const year = now.getUTCFullYear();
  const calendarPages: MetadataRoute.Sitemap = [year, year + 1].flatMap((y) =>
    Array.from({ length: 12 }, (_, i) => i + 1).flatMap((thang) =>
      nhanNgonNgu(`/phat-lich/${y}/${thang}`, {
        lastModified: now,
        changeFrequency: "yearly" as const,
        priority: 0.4,
      }),
    ),
  );

  return [
    ...staticPages,
    ...contentPages,
    ...chapterPages,
    ...categoryPages,
    ...calendarPages,
  ];
}
