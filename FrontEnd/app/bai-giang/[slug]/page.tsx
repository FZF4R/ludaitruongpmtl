import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getContent, listSlugs } from "@/lib/api";
import { contentMetadata, contentJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { Container, Badge, JsonLd, Separator } from "@/components/ui/primitives";
import { Breadcrumbs } from "@/components/content/navigation";
import { AudioPlayer } from "@/components/media/audio-player";
import { VideoEmbed } from "@/components/media/video-embed";
import { formatDualDate, formatDuration } from "@/lib/format";
import { contentTypeLabel } from "@/lib/site";

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await listSlugs();
  return slugs
    .filter((s) => s.type === "audio" || s.type === "video")
    .map((s) => ({ slug: s.slug }));
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const content = await getContent(slug);
  if (!content) return { title: "Không tìm thấy bài giảng" };
  return contentMetadata(content);
}

export default async function TalkPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const content = await getContent(slug);

  if (!content || (content.type !== "audio" && content.type !== "video")) {
    notFound();
  }

  const trail = [
    { name: "Trang chủ", href: "/" },
    { name: "Bài giảng", href: "/bai-giang" },
    { name: content.title, href: `/bai-giang/${content.slug}` },
  ];

  return (
    <Container className="py-12">
      <article className="mx-auto flex max-w-3xl flex-col gap-8">
        <Breadcrumbs trail={trail} />

        <header className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">{contentTypeLabel[content.type]}</Badge>
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
                {content.author.name}
              </span>
            ) : null}
            <span aria-hidden>·</span>
            <time dateTime={content.publishedAt}>
              {formatDualDate(content.publishedAt)}
            </time>
            {content.media?.durationSec ? (
              <>
                <span aria-hidden>·</span>
                <span>{formatDuration(content.media.durationSec)}</span>
              </>
            ) : null}
          </div>
        </header>

        {content.media ? (
          content.type === "audio" ? (
            <AudioPlayer
              src={content.media.url}
              title={content.title}
              storageKey={content.slug}
            />
          ) : (
            <VideoEmbed
              provider={content.media.provider}
              url={content.media.url}
              title={content.title}
            />
          )
        ) : null}

        {/*
          Toàn văn là phần duy nhất của trang này mà bộ máy tìm kiếm đọc
          được. Không có nó thì trang bài giảng gần như vô hình.
        */}
        {content.media?.transcript ? (
          <section className="flex flex-col gap-4">
            <Separator />
            <h2 className="text-xl font-bold">Toàn văn</h2>
            <div className="prose prose-dharma max-w-none whitespace-pre-line">
              {content.media.transcript}
            </div>
          </section>
        ) : null}

        {content.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {content.tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
        ) : null}
      </article>

      <JsonLd data={contentJsonLd(content)} />
      <JsonLd data={breadcrumbJsonLd(trail)} />
    </Container>
  );
}
