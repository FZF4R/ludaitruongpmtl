import { ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import type { Chapter } from "@/lib/schema";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/primitives";
import { LocaleLink as Link } from "@/components/ui/locale-link";
import { getDictionary } from "@/lib/dictionary";

export type Crumb = { name: string; href: string };

export async function Breadcrumbs({ trail }: { trail: Crumb[] }) {
  const dict = await getDictionary();

  return (
    <nav aria-label={dict.common.breadcrumb} className="text-xs text-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        {trail.map((crumb, i) => {
          const last = i === trail.length - 1;
          return (
            <li key={crumb.href} className="flex items-center gap-1.5">
              {last ? (
                <span aria-current="page" className="text-body">
                  {crumb.name}
                </span>
              ) : (
                <>
                  <Link href={crumb.href} className="transition-colors hover:text-accent">
                    {crumb.name}
                  </Link>
                  <ChevronsRight className="size-3 shrink-0" aria-hidden />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Mục lục kinh sách. Ở màn hình rộng nó dính bên trái khi cuộn. */
export async function ChapterNav({
  chapters,
  bookSlug,
  currentSlug,
}: {
  chapters: Chapter[];
  bookSlug: string;
  currentSlug?: string;
}) {
  if (chapters.length === 0) return null;
  const dict = await getDictionary();

  return (
    <nav aria-label={dict.common.tableOfContents} className="flex flex-col gap-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
        {dict.common.tableOfContents}
      </p>
      <ol className="flex flex-col">
        {chapters.map((ch) => {
          const active = ch.slug === currentSlug;
          return (
            <li key={ch.slug}>
              <Link
                href={`/kinh-sach/${bookSlug}/${ch.slug}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex gap-3 border-l-2 py-2 pl-3 text-sm transition-colors",
                  active
                    ? "border-accent font-medium text-accent"
                    : "border-line text-muted hover:border-line-strong hover:shadow-card-lift hover:text-ink",
                )}
              >
                <span className="tabular-nums opacity-60">
                  {String(ch.order).padStart(2, "0")}
                </span>
                <span>{ch.title}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Điều hướng chương trước / chương sau ở cuối trang đọc. */
export async function ChapterPager({
  bookSlug,
  prev,
  next,
}: {
  bookSlug: string;
  prev?: Chapter;
  next?: Chapter;
}) {
  if (!prev && !next) return null;
  const dict = await getDictionary();

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {prev ? (
        <Card className="p-4 hover:border-line-strong hover:shadow-card-lift">
          <Link href={`/kinh-sach/${bookSlug}/${prev.slug}`} className="flex flex-col gap-1">
            <span className="flex items-center gap-1 text-xs text-muted">
              <ChevronLeft className="size-3" aria-hidden /> {dict.common.previousChapter}
            </span>
            <span className="font-serif font-semibold text-ink">{prev.title}</span>
          </Link>
        </Card>
      ) : (
        <div className="hidden sm:block" />
      )}
      {next ? (
        <Card className="p-4 text-right hover:border-line-strong hover:shadow-card-lift">
          <Link href={`/kinh-sach/${bookSlug}/${next.slug}`} className="flex flex-col gap-1">
            <span className="flex items-center justify-end gap-1 text-xs text-muted">
              {dict.common.nextChapter} <ChevronRight className="size-3" aria-hidden />
            </span>
            <span className="font-serif font-semibold text-ink">{next.title}</span>
          </Link>
        </Card>
      ) : null}
    </div>
  );
}

/**
 * Phân trang danh sách.
 *
 * Dùng thẻ <a> thật với href chứa số trang, không phải nút gọi JS:
 * bộ máy tìm kiếm phải đi được tới trang 2, 3 để lập chỉ mục hết nội dung.
 *
 * Mặc định phân trang theo đường dẫn (/bai-viet, /bai-viet/trang/2) để
 * trang 1 sinh tĩnh được. Truyền `query` khi cần phân trang bằng
 * querystring — trang tìm kiếm dùng cách đó vì nó vốn đã là trang động.
 */
export async function Pagination({
  basePath,
  page,
  total,
  limit,
  query,
}: {
  basePath: string;
  page: number;
  total: number;
  limit: number;
  query?: Record<string, string | undefined>;
}) {
  const pages = Math.ceil(total / limit);
  if (pages <= 1) return null;
  const dict = await getDictionary();

  const href = (p: number) => {
    if (query) {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(query)) {
        if (v) params.set(k, v);
      }
      if (p > 1) params.set("page", String(p));
      const qs = params.toString();
      return qs ? `${basePath}?${qs}` : basePath;
    }
    return p > 1 ? `${basePath}/trang/${p}` : basePath;
  };

  const window = Array.from({ length: pages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === pages || Math.abs(p - page) <= 1,
  );

  return (
    <nav aria-label={dict.common.pagination} className="flex items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link
          href={href(page - 1)}
          rel="prev"
          className="rounded-md border border-line px-3 py-2 text-sm text-body hover:bg-surface-2"
        >
          {dict.common.previous}
        </Link>
      ) : null}

      {window.map((p, i) => {
        const gap = i > 0 && p - window[i - 1] > 1;
        return (
          <span key={p} className="flex items-center gap-1.5">
            {gap ? <span className="px-1 text-muted">…</span> : null}
            <Link
              href={href(p)}
              aria-current={p === page ? "page" : undefined}
              className={cn(
                "rounded-md border px-3 py-2 text-sm tabular-nums",
                p === page
                  ? "border-accent bg-accent-soft font-medium text-accent"
                  : "border-line text-body hover:bg-surface-2",
              )}
            >
              {p}
            </Link>
          </span>
        );
      })}

      {page < pages ? (
        <Link
          href={href(page + 1)}
          rel="next"
          className="rounded-md border border-line px-3 py-2 text-sm text-body hover:bg-surface-2"
        >
          {dict.common.next}
        </Link>
      ) : null}
    </nav>
  );
}
