import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocaleLink as Link } from "@/components/ui/locale-link";
import { getContent, listSlugs } from "@/lib/api";
import { contentMetadata, contentJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { Container, Badge, JsonLd, Separator } from "@/components/ui/primitives";
import { Breadcrumbs } from "@/components/content/navigation";
import { ProseBody } from "@/components/content/prose-body";
import { formatDualDate, readingTime } from "@/lib/format";
import { getDictionary } from "@/lib/dictionary";
import { ViewTracker } from "@/components/content/view-tracker";
import { CommentSection } from "@/components/content/comment-section";

export const revalidate = 3600;

/**
 * Sinh sẵn đường dẫn của mọi bài đã đăng lúc build. Bài đăng sau đó vẫn
 * render được nhờ ISR (dynamicParams mặc định là true).
 */
export async function generateStaticParams() {
  const slugs = await listSlugs();
  return slugs
    .filter((s) => s.type === "article" || s.type === "blog")
    .map((s) => ({ slug: s.slug }));
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const content = await getContent(slug);
  if (!content) return { title: "Không tìm thấy bài viết" };
  return contentMetadata(content);
}

export default async function ArticlePage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const content = await getContent(slug);
  const dict = await getDictionary();

  if (!content || (content.type !== "article" && content.type !== "blog")) {
    notFound();
  }

  const trail = [
    { name: dict.nav.home, href: "/" },
    { name: dict.nav.articles, href: "/bai-viet" },
    { name: content.title, href: `/bai-viet/${content.slug}` },
  ];

  return (
    <Container className="py-12">
      <article className="mx-auto flex max-w-3xl flex-col gap-8">
        <Breadcrumbs trail={trail} />

        <header className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">{dict.contentType[content.type]}</Badge>
            {content.categories.map((c) => (
              <Link key={c.slug} href={`/danh-muc/${c.slug}`}>
                <Badge className="hover:bg-accent-soft hover:text-accent">{c.name}</Badge>
              </Link>
            ))}
          </div>

          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            {content.title}
          </h1>

          {content.summary ? (
            <p className="font-serif text-lg leading-relaxed text-muted">
              {content.summary}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            {content.author ? (
              <span>
                {content.author.title ? `${content.author.title} ` : ""}
                <span className="font-medium text-ink">{content.author.name}</span>
                {content.author.dharmaName ? (
                  <span className="text-accent">
                    {" "}
                    · {dict.comments.dharmaName}: {content.author.dharmaName}
                  </span>
                ) : null}
              </span>
            ) : null}
            <span aria-hidden>·</span>
            <time dateTime={content.publishedAt}>
              {formatDualDate(content.publishedAt)}
            </time>
            {content.readingMinutes ? (
              <>
                <span aria-hidden>·</span>
                <span>{readingTime(content.readingMinutes)}</span>
              </>
            ) : null}
          </div>
        </header>

        <Separator />

        {content.bodyHtml ? <ProseBody html={content.bodyHtml} /> : null}

        {content.source ? (
          <footer className="rounded-card border border-line bg-surface-2 px-5 py-4 text-sm text-muted">
            <span className="font-medium text-ink">Nguồn: </span>
            {content.source.url ? (
              <a
                href={content.source.url}
                rel="noopener noreferrer nofollow"
                target="_blank"
                className="text-accent hover:underline"
              >
                {content.source.name}
              </a>
            ) : (
              content.source.name
            )}
          </footer>
        ) : null}

        {content.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {content.tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
        ) : null}

        <CommentSection slug={content.slug} nhan={dict.comments} />
      </article>

      <ViewTracker slug={content.slug} />
      <JsonLd data={contentJsonLd(content)} />
      <JsonLd data={breadcrumbJsonLd(trail)} />
    </Container>
  );
}
