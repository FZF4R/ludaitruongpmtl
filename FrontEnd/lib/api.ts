/**
 * Tầng gọi API Sails.
 *
 * Backend nội dung (Content / ContentCategory / LunarEvent) chưa được
 * dựng, nên tầng này có hai nguồn dữ liệu chọn bằng biến môi trường
 * CONTENT_SOURCE:
 *
 *   mock  (mặc định) - đọc từ lib/mock.ts, chạy được ngay không cần backend
 *   api              - gọi thật sang NEXT_PUBLIC_API_URL
 *
 * Cố tình KHÔNG tự động rơi về mock khi API lỗi: một sự cố backend trên
 * production mà trang vẫn hiện nội dung giả là kiểu lỗi tệ nhất - không
 * ai phát hiện ra. Lỗi thì để nó nổ và cho error.tsx xử lý.
 */
import {
  categorySchema,
  contentSchema,
  contentSummarySchema,
  lunarEventSchema,
  paginated,
  slugEntrySchema,
  type Category,
  type Content,
  type ContentSummary,
  type ContentType,
  type LunarEvent,
  type Paginated,
  type SlugEntry,
} from "@/lib/schema";
import * as mock from "@/lib/mock";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:1337";
const SOURCE = process.env.CONTENT_SOURCE ?? "mock";

export const isMock = SOURCE !== "api";

/** Thời gian sống của cache theo loại trang, tính bằng giây. */
export const revalidate = {
  home: 300,
  list: 3600,
  detail: 3600,
  calendar: 86400,
} as const;

/** Tag cache để webhook /api/revalidate làm mới đúng phần cần thiết. */
export const tags = {
  content: "content",
  contentBySlug: (slug: string) => `content:${slug}`,
  contentByType: (type: ContentType) => `content-type:${type}`,
  categories: "categories",
  calendar: "calendar",
  settings: "settings",
  siteTexts: "site-texts",
} as const;

class ApiError extends Error {
  constructor(
    public status: number,
    public endpoint: string,
    message: string,
  ) {
    super(`API ${status} tại ${endpoint}: ${message}`);
    this.name = "ApiError";
  }
}

type FetchOptions = {
  revalidate?: number;
  tags?: string[];
  query?: Record<string, string | number | undefined>;
};

async function get<T>(
  endpoint: string,
  parse: (raw: unknown) => T,
  options: FetchOptions = {},
): Promise<T> {
  const url = new URL(endpoint, API_URL);
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: {
      revalidate: options.revalidate ?? revalidate.detail,
      tags: options.tags,
    },
  });

  if (!res.ok) {
    throw new ApiError(res.status, endpoint, res.statusText);
  }

  // responseToClient của Sails bọc dữ liệu trong { data: ... }
  const body = (await res.json()) as { data?: unknown };
  return parse(body.data ?? body);
}

/* ------------------------------------------------------------------ */
/* Nội dung                                                            */
/* ------------------------------------------------------------------ */

export type ListParams = {
  type?: ContentType | ContentType[];
  category?: string;
  q?: string;
  page?: number;
  limit?: number;
  /** "popular" = nhiều lượt đọc nhất trước; mặc định mới nhất trước. */
  sort?: "newest" | "popular";
  /** Lọc danh mục thư viện (type = library). */
  libraryKind?: string;
};

export async function listContent(
  params: ListParams = {},
): Promise<Paginated<ContentSummary>> {
  if (isMock) return mock.listContent(params);

  const type = Array.isArray(params.type) ? params.type.join(",") : params.type;
  return get(
    "/v1/public/content/list",
    (raw) => paginated(contentSummarySchema).parse(raw),
    {
      query: {
        type,
        category: params.category,
        q: params.q,
        page: params.page ?? 1,
        limit: params.limit ?? 12,
        sort: params.sort,
        libraryKind: params.libraryKind,
      },
      revalidate: revalidate.list,
      tags: [tags.content],
    },
  );
}

/**
 * Bài liên quan để hiện cuối một bài: backend ưu tiên cùng chuyên mục, cùng
 * tác giả, rồi nhiều lượt đọc, rồi mới. Hỏng thì trả rỗng - phần phụ.
 */
export async function getRelated(slug: string, limit = 3): Promise<ContentSummary[]> {
  if (isMock) {
    const ds = await mock.listContent({ type: ["article", "blog"], limit: limit + 1 });
    return ds.data.filter((b) => b.slug !== slug).slice(0, limit);
  }

  try {
    return await get(
      "/v1/public/content/related",
      (raw) => contentSummarySchema.array().parse((raw as { data?: unknown }).data ?? []),
      { query: { slug, limit }, revalidate: revalidate.list, tags: [tags.content] },
    );
  } catch {
    return [];
  }
}

export async function getContent(slug: string): Promise<Content | null> {
  if (isMock) return mock.getContent(slug);

  try {
    return await get(
      `/v1/public/content/${encodeURIComponent(slug)}`,
      (raw) => contentSchema.parse(raw),
      { revalidate: revalidate.detail, tags: [tags.content, tags.contentBySlug(slug)] },
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function searchContent(q: string, page = 1): Promise<Paginated<ContentSummary>> {
  if (isMock) return mock.listContent({ q, page });

  return get("/v1/public/search", (raw) => paginated(contentSummarySchema).parse(raw), {
    query: { q, page },
    // Trang tìm kiếm render động, không cache theo từ khoá.
    revalidate: 0,
  });
}

/* ------------------------------------------------------------------ */
/* Danh mục                                                            */
/* ------------------------------------------------------------------ */

export async function listCategories(): Promise<Category[]> {
  if (isMock) return mock.listCategories();

  return get(
    "/v1/public/category/tree",
    (raw) => categorySchema.array().parse(raw),
    { revalidate: revalidate.list, tags: [tags.categories] },
  );
}

export async function getCategory(slug: string): Promise<Category | null> {
  if (isMock) return mock.getCategory(slug);

  const all = await listCategories();
  return all.find((c) => c.slug === slug) ?? null;
}

/* ------------------------------------------------------------------ */
/* Phật lịch                                                           */
/* ------------------------------------------------------------------ */

export async function listLunarEvents(month?: number): Promise<LunarEvent[]> {
  if (isMock) return mock.listLunarEvents(month);

  return get(
    "/v1/public/calendar",
    (raw) => lunarEventSchema.array().parse(raw),
    { query: { month }, revalidate: revalidate.calendar, tags: [tags.calendar] },
  );
}

/* ------------------------------------------------------------------ */
/* Sitemap                                                             */
/* ------------------------------------------------------------------ */

export async function listSlugs(): Promise<SlugEntry[]> {
  if (isMock) return mock.listSlugs();

  return get("/v1/public/slugs", (raw) => slugEntrySchema.array().parse(raw), {
    revalidate: revalidate.list,
    tags: [tags.content],
  });
}

/* ------------------------------------------------------------------ */
/* Cấu hình site do admin quản lý (API này đã có sẵn ở backend)        */
/* ------------------------------------------------------------------ */

export type SiteSettings = {
  title?: string;
  notify?: string;
  warning?: string;
  supportphonenumber?: string;
  supportfacebook?: string;
  /** Khung liên hệ góc dưới phải trang chủ. */
  zalosupportinfo?: string;
  zaloadminsupportinfo?: string;
  supporttiktok?: string;
  supportemail?: string;
  isMaintaning?: boolean;
  /** Kiểu hiển thị danh sách /bai-viet, admin chọn ở trang Tổng quan. */
  articleLayout?: "card" | "list";
  /**
   * Màu quản trị viên đặt, dạng { accent: "#8a6414", ... }. Khoá lạ và giá
   * trị không phải hex bị bỏ qua ở lib/theme.ts, nên kiểu ở đây để lỏng.
   */
  theme?: Record<string, unknown>;
  themeDark?: Record<string, unknown>;
  /** Ảnh từng mục Tu tập (lib/practice-images.ts). */
  practiceImages?: Partial<Record<"chantingRecitation" | "meditation" | "woodenFishMala" | "prayers", string>>;
  /** Ảnh đại diện danh mục Thư viện (lib/library-images.ts). */
  libraryImages?: Partial<Record<"anh" | "review" | "bo-tat" | "nhac-thien" | "audio-kinh", string>>;
  /** Thứ tự danh mục Thư viện (Chế độ sửa). */
  libraryOrder?: string[];
};

/**
 * Chữ giao diện admin đã sửa ngay trên trang, dạng phẳng { "home.latest": "..." }.
 *
 * Gọi trong getI18n nên mọi trang đều chạm tới nó; fetch cache gộp các lần gọi
 * trong cùng một lượt render thành một request. Lưu chữ xong thì Server Action
 * gọi updateTag(tags.siteTexts) nên admin thấy ngay, không chờ hết ISR.
 */
export async function getSiteTexts(locale: string): Promise<Record<string, string>> {
  if (isMock) return {};

  try {
    return await get(
      "/v1/public/texts",
      (raw) => (raw && typeof raw === "object" ? (raw as Record<string, string>) : {}),
      { query: { lang: locale }, revalidate: revalidate.list, tags: [tags.siteTexts] },
    );
  } catch {
    // Như cấu hình site: hỏng thì trang vẫn lên với chữ mặc định.
    return {};
  }
}

export type HeroImage = {
  id: string;
  /** URL tuyệt đối tới tệp ảnh trên API. */
  src: string;
  width: number;
  height: number;
  alt: string;
};

/** Hình dạng backend trả về: `url` là đường dẫn tương đối trên API. */
type HeroImageRaw = { id: string; url: string; width?: number; height?: number; alt?: string };

/**
 * Ảnh xoay vòng trang chủ admin đã tải lên. Rỗng = dùng bộ ảnh có sẵn trong
 * lib/img. Chung tag `settings` với cấu hình site, nên lưu ở /admin/dashboard
 * là làm mới cả hai.
 */
export async function getHeroImages(): Promise<HeroImage[]> {
  if (isMock) return [];

  try {
    return await get(
      "/v1/public/hero-images",
      (raw) =>
        (Array.isArray(raw) ? (raw as HeroImageRaw[]) : []).map((r) => ({
          id: r.id,
          src: new URL(r.url, API_URL).toString(),
          width: r.width ?? 0,
          height: r.height ?? 0,
          alt: r.alt ?? "",
        })),
      { revalidate: revalidate.home, tags: [tags.settings] },
    );
  } catch {
    return [];
  }
}

export async function getSiteSettings(): Promise<SiteSettings | null> {
  if (isMock) return mock.getSiteSettings();

  try {
    return await get("/v1/public/settings", (raw) => raw as SiteSettings, {
      revalidate: revalidate.home,
      // Có tag để admin đổi màu / đổi thông báo là làm mới được ngay qua
      // webhook, thay vì chờ hết 5 phút ISR. Quan trọng vì layout dùng dữ
      // liệu này, nên nếu chờ theo ISR thì mỗi trang đổi màu vào một lúc
      // khác nhau - trang chi tiết mất tới 1 giờ.
      tags: [tags.settings],
    });
  } catch {
    // Cấu hình phụ trợ: hỏng thì trang vẫn phải lên, chỉ mất banner.
    return null;
  }
}

/**
 * Nội dung trang Về chúng tôi (HTML admin soạn) theo ngôn ngữ; rỗng = dùng mẫu
 * (lib/about-template.ts). Cùng tag `settings` nên lưu ở trình sửa là làm mới ngay.
 */
export async function getAbout(lang: string): Promise<string> {
  if (isMock) return "";
  try {
    return await get("/v1/public/about", (raw) => String((raw as { html?: string }).html ?? ""), {
      query: { lang },
      revalidate: revalidate.home,
      tags: [tags.settings],
    });
  } catch {
    return "";
  }
}
