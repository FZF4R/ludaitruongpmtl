/**
 * Kiểu dữ liệu dùng chung giữa web và app mobile sau này.
 *
 * Cố tình dùng zod thay vì chỉ khai báo `type`: API Sails trả JSON
 * không có kiểu, và một trường thiếu sẽ làm hỏng trang đã render sẵn
 * theo cách rất khó truy. Parse ở biên giúp lỗi nổ ngay tại tầng fetch
 * với thông báo đọc được, thay vì nổ lúc render.
 */
import { z } from "zod";

export const contentTypeSchema = z.enum([
  "article",
  "blog",
  "sutra",
  "audio",
  "video",
]);
export type ContentType = z.infer<typeof contentTypeSchema>;

export const seoSchema = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
    ogImage: z.string().optional(),
    canonical: z.string().optional(),
  })
  .default({});

export const chapterSchema = z.object({
  order: z.number(),
  title: z.string(),
  slug: z.string(),
  bodyHtml: z.string().optional(),
});
export type Chapter = z.infer<typeof chapterSchema>;

export const mediaSchema = z.object({
  provider: z.enum(["self", "youtube"]),
  url: z.string(),
  durationSec: z.number().optional(),
  transcript: z.string().optional(),
});

export const authorSchema = z.object({
  name: z.string(),
  /** Hoà thượng, Thượng toạ, Đại đức, Sư cô, Cư sĩ… */
  title: z.string().optional(),
});

export const categoryRefSchema = z.object({
  slug: z.string(),
  name: z.string(),
});

export const contentSchema = z.object({
  id: z.string(),
  type: contentTypeSchema,
  slug: z.string(),
  title: z.string(),
  summary: z.string().default(""),
  coverUrl: z.string().optional(),
  bodyHtml: z.string().optional(),
  chapters: z.array(chapterSchema).default([]),
  media: mediaSchema.optional(),
  author: authorSchema.optional(),
  source: z.object({ name: z.string(), url: z.string().optional() }).optional(),
  categories: z.array(categoryRefSchema).default([]),
  tags: z.array(z.string()).default([]),
  publishedAt: z.string(),
  updatedAt: z.string().optional(),
  readingMinutes: z.number().optional(),
  viewCount: z.number().optional(),
  seo: seoSchema,
});
export type Content = z.infer<typeof contentSchema>;

/** Bản rút gọn dùng cho danh sách — không kéo theo bodyHtml. */
export const contentSummarySchema = contentSchema.omit({
  bodyHtml: true,
  chapters: true,
});
export type ContentSummary = z.infer<typeof contentSummarySchema>;

export const categorySchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string().default(""),
  coverUrl: z.string().optional(),
  kind: z.enum(["article", "sutra", "audio", "video", "all"]).default("all"),
  count: z.number().default(0),
  children: z.array(categoryRefSchema).default([]),
});
export type Category = z.infer<typeof categorySchema>;

export const lunarEventSchema = z.object({
  id: z.string(),
  lunarDay: z.number(),
  lunarMonth: z.number(),
  isLeapMonth: z.boolean().default(false),
  /** null = lặp lại hằng năm. */
  solarYear: z.number().nullable().default(null),
  kind: z.enum(["via", "le", "gio-to", "bat-quan-trai"]),
  title: z.string(),
  description: z.string().default(""),
  contentSlug: z.string().optional(),
});
export type LunarEvent = z.infer<typeof lunarEventSchema>;

export function paginated<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    data: z.array(item),
    total: z.number().default(0),
    page: z.number().default(1),
    limit: z.number().default(12),
  });
}

export type Paginated<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};

export const slugEntrySchema = z.object({
  type: contentTypeSchema,
  slug: z.string(),
  updatedAt: z.string(),
  chapters: z.array(z.string()).default([]),
});
export type SlugEntry = z.infer<typeof slugEntrySchema>;
