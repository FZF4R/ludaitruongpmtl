import type { Metadata } from "next";
import { site, contentTypeBase, contentTypeLabel } from "@/lib/site";
import type { Content, ContentSummary } from "@/lib/schema";

export function absoluteUrl(path: string): string {
  return new URL(path, site.url).toString();
}

/** Đường dẫn công khai của một mục nội dung. */
export function contentHref(c: Pick<ContentSummary, "type" | "slug">): string {
  return `${contentTypeBase[c.type]}/${c.slug}`;
}

/**
 * Metadata cho trang chi tiết. Ưu tiên trường seo do admin nhập, có
 * fallback về title/summary để không bao giờ để trống thẻ mô tả.
 */
export function contentMetadata(c: Content): Metadata {
  const url = c.seo.canonical ?? absoluteUrl(contentHref(c));
  const title = c.seo.title ?? c.title;
  const description = c.seo.description ?? c.summary;
  const images = c.seo.ogImage ?? c.coverUrl;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title,
      description,
      url,
      siteName: site.name,
      locale: site.locale,
      publishedTime: c.publishedAt,
      modifiedTime: c.updatedAt,
      images: images ? [{ url: images }] : undefined,
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title,
      description,
      images: images ? [images] : undefined,
    },
  };
}

type JsonLd = Record<string, unknown>;

export function breadcrumbJsonLd(
  trail: { name: string; href: string }[],
): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.href),
    })),
  };
}

/**
 * JSON-LD theo đúng loại nội dung. Chọn sai @type còn tệ hơn không có:
 * bài giảng audio khai báo là Article thì Google không đưa vào các
 * khối kết quả dành cho nội dung nghe được.
 */
export function contentJsonLd(c: Content): JsonLd {
  const url = absoluteUrl(contentHref(c));
  const base: JsonLd = {
    "@context": "https://schema.org",
    name: c.title,
    headline: c.title,
    description: c.summary,
    inLanguage: "vi-VN",
    url,
    datePublished: c.publishedAt,
    dateModified: c.updatedAt ?? c.publishedAt,
    publisher: {
      "@type": "Organization",
      name: site.name,
      url: site.url,
    },
    ...(c.author && {
      author: {
        "@type": "Person",
        name: c.author.title ? `${c.author.title} ${c.author.name}` : c.author.name,
      },
    }),
    ...(c.coverUrl && { image: [c.coverUrl] }),
  };

  switch (c.type) {
    case "sutra":
      return {
        ...base,
        "@type": "Book",
        bookFormat: "https://schema.org/EBook",
        numberOfPages: undefined,
        hasPart: c.chapters.map((ch) => ({
          "@type": "Chapter",
          position: ch.order,
          name: ch.title,
          url: `${url}/${ch.slug}`,
        })),
      };
    case "audio":
      return {
        ...base,
        "@type": "AudioObject",
        contentUrl: c.media?.url,
        duration: isoDuration(c.media?.durationSec),
        transcript: c.media?.transcript,
      };
    case "video":
      return {
        ...base,
        "@type": "VideoObject",
        embedUrl:
          c.media?.provider === "youtube"
            ? `https://www.youtube.com/embed/${c.media.url}`
            : c.media?.url,
        duration: isoDuration(c.media?.durationSec),
        uploadDate: c.publishedAt,
        transcript: c.media?.transcript,
        thumbnailUrl: c.coverUrl ? [c.coverUrl] : undefined,
      };
    default:
      return {
        ...base,
        "@type": "Article",
        articleSection: c.categories[0]?.name ?? contentTypeLabel[c.type],
        wordCount: undefined,
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
      };
  }
}

/** 2880 -> "PT48M" theo ISO 8601 duration. */
function isoDuration(seconds?: number): string | undefined {
  if (!seconds || seconds <= 0) return undefined;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `PT${h ? `${h}H` : ""}${m ? `${m}M` : ""}${s ? `${s}S` : ""}`;
}

export function websiteJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    alternateName: site.tagline,
    url: site.url,
    inLanguage: "vi-VN",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${site.url}/tim-kiem?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}
