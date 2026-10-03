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
import { ViewTracker } from "@/components/content/view-tracker";
import { Avatar } from "@/components/ui/avatar";

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

          {/*
            Thông tin xuất xứ: dịch giả, nguồn tham khảo (bắt buộc với kinh sách
            mới) và người đăng. Kinh nhập trước khi có các trường này thì rơi
            về dòng "Bản dịch" cũ đọc từ author.
          */}
          <dl className="grid gap-x-6 gap-y-1.5 rounded-card border border-line bg-surface-2 px-4 py-3 text-sm sm:grid-cols-[auto_1fr]">
            {content.translator ? (
              <>
                <dt className="text-muted">Dịch giả</dt>
                <dd className="text-ink">
                  {content.translator.name}
                  {content.translator.dharmaName ? (
                    <span className="text-accent"> · Pháp danh: {content.translator.dharmaName}</span>
                  ) : null}
                </dd>
              </>
            ) : content.author ? (
              <>
                <dt className="text-muted">Bản dịch</dt>
                <dd className="text-ink">
                  {content.author.title ? `${content.author.title} ` : ""}
                  {content.author.name}
                </dd>
              </>
            ) : null}
            {content.source ? (
              <>
                <dt className="text-muted">Nguồn tham khảo</dt>
                <dd className="min-w-0 break-words text-ink">
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
                </dd>
              </>
            ) : null}
            {content.postedBy ? (
              <>
                <dt className="text-muted">Người đăng</dt>
                <dd className="flex items-center gap-2 text-ink">
                  <Avatar src={content.postedBy.avatarUrl} name={content.postedBy.name} size={22} />
                  {content.postedBy.name}
                </dd>
              </>
            ) : null}
            <dt className="text-muted">Ngày đăng</dt>
            <dd className="text-ink">
              <time dateTime={content.publishedAt}>{formatDualDate(content.publishedAt)}</time>
            </dd>
          </dl>

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
                  <Card className="p-0 hover:border-line-strong hover:shadow-card-lift">
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

      <ViewTracker slug={content.slug} />
      <JsonLd data={contentJsonLd(content)} />
      <JsonLd data={breadcrumbJsonLd(trail)} />
    </Container>
  );
}
