import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Headphones } from "lucide-react";
import { LocaleLink as Link } from "@/components/ui/locale-link";
import { getContent, listContent } from "@/lib/api";
import { contentMetadata } from "@/lib/seo";
import { Badge, Container } from "@/components/ui/primitives";
import { Breadcrumbs } from "@/components/content/navigation";
import { ProseBody } from "@/components/content/prose-body";
import { ContentThumb } from "@/components/content/content-thumb";
import { ViewTracker } from "@/components/content/view-tracker";
import { formatDate } from "@/lib/format";
import { getDictionary } from "@/lib/dictionary";

export const revalidate = 3600;

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await props.params;
  const content = await getContent(slug);
  if (!content || content.type !== "library") return { title: "Không tìm thấy" };
  return contentMetadata(content);
}

/** Một mục thư viện: ảnh bìa, album ảnh, tệp âm thanh, nội dung. */
export default async function LibraryItemPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const [content, dict] = await Promise.all([getContent(slug), getDictionary()]);
  if (!content || content.type !== "library") notFound();

  const kind = content.libraryKind;
  const cungMuc = kind
    ? await listContent({ type: "library", libraryKind: kind, limit: 7 })
        .then((kq) => kq.data.filter((x) => x.slug !== content.slug).slice(0, 6))
        .catch(() => [])
    : [];

  return (
    <Container className="py-12">
      <article className="mx-auto flex max-w-4xl flex-col gap-6">
        <Breadcrumbs
          trail={[
            { name: dict.nav.home, href: "/" },
            { name: dict.library.title, href: "/thu-vien" },
            ...(kind ? [{ name: dict.library.kinds[kind], href: `/thu-vien?muc=${kind}` }] : []),
            { name: content.title, href: `/thu-vien/${content.slug}` },
          ]}
        />
        <header className="flex flex-col gap-3">
          {kind ? (
            <Link href={`/thu-vien?muc=${kind}`} className="w-fit">
              <Badge tone="brass">{dict.library.kinds[kind]}</Badge>
            </Link>
          ) : null}
          <h1 className="font-serif text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
            {content.title}
          </h1>
          {content.summary ? <p className="text-lg text-muted">{content.summary}</p> : null}
          <p className="text-sm text-muted">
            {content.author?.name ? `${dict.library.contributor}: ${content.author.name} · ` : ""}
            <time dateTime={content.publishedAt}>{formatDate(content.publishedAt)}</time>
          </p>
        </header>

        {content.coverUrl ? (
          <ContentThumb
            slug={content.slug}
            coverUrl={content.coverUrl}
            sizes="(min-width: 1024px) 56rem, 100vw"
            className="aspect-[16/9] rounded-lg"
          />
        ) : null}

        {content.media?.url ? (
          <div className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-4">
            <span className="flex items-center gap-2 text-sm font-medium text-ink">
              <Headphones className="size-4 text-accent" aria-hidden /> {dict.library.listen}
            </span>
            <audio controls preload="none" src={content.media.url} className="w-full" />
          </div>
        ) : null}

        {content.bodyHtml ? <ProseBody html={content.bodyHtml} /> : null}

        {content.gallery?.length ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {content.gallery.map((a, i) => (
              <li key={`${a.url}-${i}`}>
                <figure className="flex flex-col gap-1.5">
                  <a href={a.url} target="_blank" rel="noopener" className="block overflow-hidden rounded-md border border-line">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={a.url}
                      alt={a.caption || content.title}
                      loading="lazy"
                      className="aspect-square w-full object-cover transition-transform hover:scale-105"
                    />
                  </a>
                  {a.caption ? <figcaption className="text-xs text-muted">{a.caption}</figcaption> : null}
                </figure>
              </li>
            ))}
          </ul>
        ) : null}

        {cungMuc.length ? (
          <section className="flex flex-col gap-3 border-t border-line pt-6">
            <h2 className="font-serif text-xl font-bold">{kind ? dict.library.kinds[kind] : dict.library.title}</h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {cungMuc.map((x) => (
                <li key={x.id}>
                  <Link
                    href={`/thu-vien/${x.slug}`}
                    className="flex items-center gap-3 rounded-md border border-line p-2 hover:border-line-strong"
                  >
                    <ContentThumb
                      slug={x.slug}
                      coverUrl={x.coverUrl || x.gallery?.[0]?.url}
                      sizes="64px"
                      className="size-16 shrink-0 rounded"
                    />
                    <span className="line-clamp-2 text-sm font-medium text-ink">{x.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </article>
      <ViewTracker slug={content.slug} />
    </Container>
  );
}
