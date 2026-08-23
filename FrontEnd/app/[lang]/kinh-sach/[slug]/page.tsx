import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocaleLink as Link } from "@/components/ui/locale-link";
import { ArrowRight } from "lucide-react";
import { getContent, listSlugs } from "@/lib/api";
import { contentMetadata, contentJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { Container, Badge, JsonLd, Separator, Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/content/navigation";
import { ProseBody } from "@/components/content/prose-body";
import { formatDualDate } from "@/lib/format";

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await listSlugs();
  return slugs.filter((s) => s.type === "sutra").map((s) => ({ slug: s.slug }));
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const content = await getContent(slug);
  if (!content) return { title: "Không tìm thấy kinh sách" };
  return contentMetadata(content);
}

export default async function SutraPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const content = await getContent(slug);

  if (!content || content.type !== "sutra") notFound();

  const trail = [
    { name: "Trang chủ", href: "/" },
    { name: "Kinh sách", href: "/kinh-sach" },
    { name: content.title, href: `/kinh-sach/${content.slug}` },
  ];

  const first = content.chapters[0];

  return (
    <Container className="py-12">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <Breadcrumbs trail={trail} />

        <header className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {content.categories.map((c) => (
              <Link key={c.slug} href={`/danh-muc/${c.slug}`}>
                <Badge tone="accent">{c.name}</Badge>
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
                Bản dịch: {content.author.title ? `${content.author.title} ` : ""}
                {content.author.name}
              </span>
            ) : null}
            {content.source ? (
              <>
                <span aria-hidden>·</span>
                <span>{content.source.name}</span>
              </>
            ) : null}
            <span aria-hidden>·</span>
            <time dateTime={content.publishedAt}>
              {formatDualDate(content.publishedAt)}
            </time>
          </div>

          {first ? (
            <div>
              <Button asChild>
                <Link href={`/kinh-sach/${content.slug}/${first.slug}`}>
                  Bắt đầu đọc <ArrowRight />
                </Link>
              </Button>
            </div>
          ) : null}
        </header>

        <Separator />

        {content.chapters.length > 0 ? (
          <section className="flex flex-col gap-4">
            <h2 className="text-xl font-bold">Mục lục</h2>
            <ol className="flex flex-col gap-2">
              {content.chapters.map((ch) => (
                <li key={ch.slug}>
                  <Card className="p-0 hover:border-line-strong">
                    <Link
                      href={`/kinh-sach/${content.slug}/${ch.slug}`}
                      className="flex items-center gap-4 px-4 py-3.5"
                    >
                      <span className="w-8 shrink-0 text-sm tabular-nums text-muted">
                        {String(ch.order).padStart(2, "0")}
                      </span>
                      <span className="font-serif font-medium text-ink">{ch.title}</span>
                      <ArrowRight className="ml-auto size-4 shrink-0 text-muted" aria-hidden />
                    </Link>
                  </Card>
                </li>
              ))}
            </ol>
          </section>
        ) : content.bodyHtml ? (
          // Kinh ngắn (Tâm Kinh, Bát Nhã…) không chia chương: đọc thẳng tại đây.
          <ProseBody html={content.bodyHtml} />
        ) : null}
      </div>

      <JsonLd data={contentJsonLd(content)} />
      <JsonLd data={breadcrumbJsonLd(trail)} />
    </Container>
  );
}
