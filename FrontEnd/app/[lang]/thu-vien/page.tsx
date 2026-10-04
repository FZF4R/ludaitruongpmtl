import type { Metadata } from "next";
import { AudioLines, Flower2, Headphones, Images, Landmark, Music, PenLine, type LucideIcon } from "lucide-react";
import { LocaleLink as Link } from "@/components/ui/locale-link";
import { Badge, Card, Container, SectionHeading } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/content/navigation";
import { ContentThumb } from "@/components/content/content-thumb";
import Image from "next/image";
import { getSiteSettings, listContent } from "@/lib/api";
import { getDictionary, getLocale } from "@/lib/dictionary";
import { anhDanhMucThuVien } from "@/lib/library-images";
import { LibraryImageEditor, LibraryOrderControls } from "@/components/library/library-image-editor";
import { EditableText } from "@/components/layout/inline-edit";
import { i18nAlternates } from "@/lib/seo";
import { libraryKinds, type LibraryKind } from "@/lib/schema";
import { cn } from "@/lib/utils";

const MOI_TRANG = 24;

/** Biểu tượng từng danh mục thư viện. */
const ICON_DANH_MUC: Record<LibraryKind, LucideIcon> = {
  anh: Images,
  review: Landmark,
  "bo-tat": Flower2,
  "nhac-thien": Music,
  "audio-kinh": AudioLines,
};

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
  const [dict, locale, settings] = await Promise.all([getDictionary(), getLocale(), getSiteSettings().catch(() => null)]);
  const anhDaDat = settings?.libraryImages ?? {};
  // Thứ tự danh mục admin sắp (Chế độ sửa); khoá lạ bị bỏ, khoá thiếu nối vào cuối.
  const daSap = (settings?.libraryOrder ?? []).filter((k): k is LibraryKind => libraryKinds.includes(k as LibraryKind));
  const thuTu: LibraryKind[] = [...new Set([...daSap, ...libraryKinds])];
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
        <SectionHeading
          title={<EditableText k="library.title" value={dict.library.title} />}
          description={<EditableText k="library.description" value={dict.library.description} multiline />}
        />
        <Button variant="outline" asChild>
          <Link href="/tai-khoan/bai-viet?moi=library">
            <PenLine aria-hidden /> {dict.library.contribute}
          </Link>
        </Button>
      </div>

      {/* Danh mục dạng thẻ có biểu tượng; bấm lại thẻ đang chọn để xem tất cả. */}
      <nav aria-label={dict.library.title} className="flex flex-col gap-3">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {thuTu.map((k) => {
            const Icon = ICON_DANH_MUC[k];
            const dangChon = muc === k;
            return (
              <li key={k} className="relative">
                <Link
                  href={dangChon ? link() : link(k)}
                  aria-current={dangChon ? "page" : undefined}
                  className={cn(
                    "group flex h-full flex-col overflow-hidden rounded-card border transition-all hover:-translate-y-0.5 hover:shadow-card-lift",
                    dangChon ? "border-accent bg-accent-soft" : "border-line bg-surface hover:border-line-strong",
                  )}
                >
                  {/* Ảnh đại diện danh mục (đổi ở Chế độ sửa) + biểu tượng đè góc dưới. */}
                  <span className="relative block aspect-[4/3] overflow-hidden bg-surface-2">
                    {(() => {
                      const anh = anhDanhMucThuVien(k, anhDaDat);
                      return (
                        <Image
                          src={anh}
                          alt=""
                          fill
                          sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
                          unoptimized={typeof anh === "string"}
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      );
                    })()}
                    <span
                      className={cn(
                        "absolute bottom-2 left-2 flex size-10 items-center justify-center rounded-full shadow-sm transition-colors",
                        dangChon ? "bg-accent text-paper" : "bg-surface text-accent group-hover:bg-accent group-hover:text-paper",
                      )}
                    >
                      <Icon className="size-5" aria-hidden />
                    </span>
                  </span>
                  <span className="flex flex-1 flex-col gap-1.5 p-3.5">
                    <span className={cn("font-serif text-base font-bold leading-snug", dangChon ? "text-accent" : "text-ink")}>
                      <EditableText k={`library.kinds.${k}`} value={dict.library.kinds[k]} />
                    </span>
                    <span className="text-xs leading-relaxed text-muted">
                      <EditableText k={`library.kindHints.${k}`} value={dict.library.kindHints[k]} multiline />
                    </span>
                  </span>
                </Link>
                <LibraryImageEditor kind={k} ten={dict.library.kinds[k]} daDat={anhDaDat} locale={locale} />
                <LibraryOrderControls kind={k} thuTu={thuTu} locale={locale} />
              </li>
            );
          })}
        </ul>
        {muc ? (
          <Link href={link()} className="w-fit text-sm text-accent hover:underline">
            ← {dict.library.all}
          </Link>
        ) : null}
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
