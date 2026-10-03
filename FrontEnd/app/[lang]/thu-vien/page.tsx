import type { Metadata } from "next";
import { Headphones, Images, PenLine } from "lucide-react";
import { LocaleLink as Link } from "@/components/ui/locale-link";
import { Badge, Card, Container, SectionHeading } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/content/navigation";
import { ContentThumb } from "@/components/content/content-thumb";
import { listContent } from "@/lib/api";
import { getDictionary } from "@/lib/dictionary";
import { i18nAlternates } from "@/lib/seo";
import { libraryKinds, type LibraryKind } from "@/lib/schema";
import { cn } from "@/lib/utils";

const MOI_TRANG = 24;

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return {
    title: dict.library.title,
    description: dict.library.description,
    alternates: await i18nAlternates("/thu-vien"),
  };
}

/**
 * Thư viện: nội dung cộng đồng đóng góp (ảnh, review chùa đền, Phật - Bồ Tát,
 * nhạc thiền, audio kinh). Lọc danh mục qua ?muc=, phân trang qua ?trang=.
 * Nội dung của Cộng tác viên chỉ hiện sau khi được duyệt (backend chỉ trả published).
 */
export default async function LibraryPage(props: { searchParams: Promise<{ muc?: string; trang?: string }> }) {
  const sp = await props.searchParams;
  const muc = libraryKinds.includes(sp.muc as LibraryKind) ? (sp.muc as LibraryKind) : undefined;
  const trang = Math.max(1, Number(sp.trang) || 1);
  const dict = await getDictionary();
  const kq = await listContent({ type: "library", libraryKind: muc, page: trang, limit: MOI_TRANG }).catch(() => null);
  const ds = kq?.data ?? [];
  const soTrang = kq ? Math.max(1, Math.ceil(kq.total / MOI_TRANG)) : 1;
  const link = (m?: string, t = 1) => {
    const q = new URLSearchParams();
    if (m) q.set("muc", m);
    if (t > 1) q.set("trang", String(t));
    const s = q.toString();
    return s ? `/thu-vien?${s}` : "/thu-vien";
  };

  return (
    <Container className="flex flex-col gap-8 py-12">
      <Breadcrumbs
        trail={[
          { name: dict.nav.home, href: "/" },
          { name: dict.library.title, href: "/thu-vien" },
        ]}
      />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading title={dict.library.title} description={dict.library.description} />
        <Button variant="outline" asChild>
          <Link href="/tai-khoan/bai-viet?moi=library">
            <PenLine aria-hidden /> {dict.library.contribute}
          </Link>
        </Button>
      </div>

      <nav aria-label={dict.library.title} className="flex flex-wrap gap-1.5">
        {[undefined, ...libraryKinds].map((k) => (
          <Link
            key={k ?? "all"}
            href={link(k)}
            aria-current={muc === k ? "page" : undefined}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
              muc === k
                ? "border-accent bg-accent-soft font-medium text-accent"
                : "border-line text-body hover:border-line-strong hover:text-ink",
            )}
          >
            {k ? dict.library.kinds[k] : dict.library.all}
          </Link>
        ))}
      </nav>

      {ds.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted">{dict.library.empty}</Card>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ds.map((item) => {
            const anh = item.coverUrl || item.gallery?.[0]?.url;
            const amThanh = item.libraryKind === "nhac-thien" || item.libraryKind === "audio-kinh";
            return (
              <li key={item.id}>
                <Card className="group relative flex h-full flex-col overflow-hidden hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card-lift">
                  <ContentThumb
                    slug={item.slug}
                    coverUrl={anh}
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="aspect-[4/3]"
                  />
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <div className="flex items-center gap-2 text-xs text-muted">
                      {item.libraryKind ? <Badge tone="brass">{dict.library.kinds[item.libraryKind]}</Badge> : null}
                      {amThanh ? <Headphones className="size-3.5" aria-label={dict.library.listen} /> : null}
                      {item.gallery?.length ? (
                        <span className="flex items-center gap-1">
                          <Images className="size-3.5" aria-hidden />{" "}
                          {dict.library.photos.replace("{n}", String(item.gallery.length))}
                        </span>
                      ) : null}
                    </div>
                    <h2 className="font-serif text-lg font-bold leading-snug text-ink">
                      <Link href={`/thu-vien/${item.slug}`} className="transition-colors group-hover:text-accent">
                        <span className="absolute inset-0" aria-hidden />
                        {item.title}
                      </Link>
                    </h2>
                    {item.summary ? <p className="line-clamp-2 text-sm text-muted">{item.summary}</p> : null}
                    {item.author?.name ? (
                      <p className="mt-auto pt-1 text-xs text-muted">
                        {dict.library.contributor}: {item.author.name}
                      </p>
                    ) : null}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {soTrang > 1 ? (
        <div className="flex justify-center gap-2">
          {trang > 1 ? (
            <Button variant="outline" asChild>
              <Link href={link(muc, trang - 1)}>←</Link>
            </Button>
          ) : null}
          <span className="self-center text-sm text-muted">
            {trang}/{soTrang}
          </span>
          {trang < soTrang ? (
            <Button variant="outline" asChild>
              <Link href={link(muc, trang + 1)}>→</Link>
            </Button>
          ) : null}
        </div>
      ) : null}
    </Container>
  );
}
