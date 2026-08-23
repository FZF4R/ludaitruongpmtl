import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getContent, listSlugs } from "@/lib/api";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";
import { Container, JsonLd, Separator } from "@/components/ui/primitives";
import {
  Breadcrumbs,
  ChapterNav,
  ChapterPager,
} from "@/components/content/navigation";
import { ProseBody } from "@/components/content/prose-body";
import { toPlainText } from "@/lib/sanitize";
import { site } from "@/lib/site";

export const revalidate = 3600;

/**
 * Mỗi chương là một trang riêng, sinh tĩnh toàn bộ. Nội dung kinh gần
 * như bất biến nên đây là dạng trang rẻ nhất và nhanh nhất có thể.
 */
export async function generateStaticParams() {
  const slugs = await listSlugs();
  return slugs
    .filter((s) => s.type === "sutra")
    .flatMap((s) => s.chapters.map((chuong) => ({ slug: s.slug, chuong })));
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string; chuong: string }>;
}): Promise<Metadata> {
  const { slug, chuong } = await props.params;
  const book = await getContent(slug);
  const chapter = book?.chapters.find((c) => c.slug === chuong);
  if (!book || !chapter) return { title: "Không tìm thấy chương" };

  const url = absoluteUrl(`/kinh-sach/${slug}/${chuong}`);
  const description = chapter.bodyHtml
    ? toPlainText(chapter.bodyHtml, 160)
    : `${chapter.title} — ${book.title}`;

  return {
    title: `${chapter.title} — ${book.title}`,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: `${chapter.title} — ${book.title}`,
      description,
      url,
      siteName: site.name,
      locale: site.locale,
    },
  };
}

export default async function ChapterPage(props: {
  params: Promise<{ slug: string; chuong: string }>;
}) {
  const { slug, chuong } = await props.params;
  const book = await getContent(slug);
  if (!book || book.type !== "sutra") notFound();

  const index = book.chapters.findIndex((c) => c.slug === chuong);
  if (index === -1) notFound();

  const chapter = book.chapters[index];
  const trail = [
    { name: "Trang chủ", href: "/" },
    { name: "Kinh sách", href: "/kinh-sach" },
    { name: book.title, href: `/kinh-sach/${book.slug}` },
    { name: chapter.title, href: `/kinh-sach/${book.slug}/${chapter.slug}` },
  ];

  return (
    <Container className="py-12">
      <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12">
        {/* Mục lục dính bên trái ở màn hình rộng, xếp trên ở màn hình hẹp. */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <ChapterNav
            chapters={book.chapters}
            bookSlug={book.slug}
            currentSlug={chapter.slug}
          />
        </aside>

        <article className="flex min-w-0 max-w-3xl flex-col gap-7">
          <Breadcrumbs trail={trail} />

          <header className="flex flex-col gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
              {book.title} · Chương {chapter.order}
            </p>
            <h1 className="text-3xl font-bold leading-tight tracking-tight">
              {chapter.title}
            </h1>
          </header>

          <Separator />

          {chapter.bodyHtml ? <ProseBody html={chapter.bodyHtml} /> : null}

          <Separator className="mt-4" />

          <ChapterPager
            bookSlug={book.slug}
            prev={book.chapters[index - 1]}
            next={book.chapters[index + 1]}
          />
        </article>
      </div>

      <JsonLd data={breadcrumbJsonLd(trail)} />
    </Container>
  );
}
