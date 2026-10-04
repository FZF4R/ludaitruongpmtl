import { notFound } from "next/navigation";
import { Search } from "lucide-react";
import { listContent, type ListParams } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { LocaleLink } from "@/components/ui/locale-link";
import { getDictionary, getLocale } from "@/lib/dictionary";
import { localePath } from "@/lib/i18n";
import {
  Container,
  SectionHeading,
  EmptyState,
  JsonLd,
} from "@/components/ui/primitives";
import { ContentGrid, ContentList } from "@/components/content/content-card";
import { Breadcrumbs, Pagination, type Crumb } from "@/components/content/navigation";
import { breadcrumbJsonLd } from "@/lib/seo";

export const LIST_LIMIT = 12;

/**
 * Thân chung của mọi trang danh sách.
 *
 * Tách ra để trang 1 và các trang phân trang dùng chung một layout mà
 * vẫn là hai route riêng — xem ghi chú ở dưới về lý do tách route.
 */
export async function ContentListPage({
  filter,
  page,
  basePath,
  eyebrow,
  title,
  description,
  trail,
  columns = 3,
  layout = "card",
  thumbnail = false,
  adminBar,
  emptyTitle = "Chưa có nội dung nào",
  emptyDescription = "Nội dung đang được biên tập. Xin quay lại sau.",
  searchPath,
}: {
  filter: ListParams;
  page: number;
  basePath: string;
  eyebrow?: string;
  title: string;
  description?: string;
  trail: Crumb[];
  columns?: 2 | 3;
  /** "list" = mỗi bài một hàng có ảnh nhỏ (luôn có ảnh); "card" = lưới thẻ. */
  layout?: "card" | "list";
  /** Dạng thẻ có hiện ảnh bìa hay không. */
  thumbnail?: boolean;
  /** Nút quản trị (client) đặt cạnh tiêu đề; tự ẩn với người đọc thường. */
  adminBar?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  /** Có thì hiện ô tìm kiếm, gửi tới trang kết quả này (vd. /bai-viet/tim-kiem). */
  searchPath?: string;
}) {
  const result = await listContent({ ...filter, page, limit: LIST_LIMIT });

  // Trang vượt quá số trang thật phải trả 404, không phải trang rỗng:
  // trang rỗng bị Google xếp vào "soft 404" và kéo chất lượng tên miền xuống.
  if (page > 1 && result.data.length === 0) notFound();

  return (
    <Container className="flex flex-col gap-8 py-12">
      <Breadcrumbs trail={trail} />
      <SectionHeading
        eyebrow={eyebrow}
        title={title}
        description={description}
        action={searchPath ? undefined : adminBar}
      />

      {/*
        Ô tìm kiếm (trái) và các nút "Bài viết của tôi" / "Thêm …" (phải) cùng một
        hàng, DÍNH ngay dưới header (cao 4rem) khi cuộn - tìm / thêm bài lúc nào cũng
        trong tầm tay. Tràn ra mép Container (-mx) để nền mờ phủ hết bề ngang.
      */}
      {searchPath ? (
        <div className="sticky top-16 z-30 -mx-5 flex flex-wrap items-center gap-3 border-b border-line/60 bg-paper/90 px-5 py-2.5 backdrop-blur sm:-mx-8 sm:px-8">
          <div className="min-w-[16rem] flex-1">
            <SearchBox action={searchPath} />
          </div>
          {adminBar}
        </div>
      ) : null}

      {result.data.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <>
          {layout === "list" ? (
            <ContentList items={result.data} />
          ) : (
            <ContentGrid items={result.data} columns={columns} thumbnail={thumbnail} />
          )}
          {/* Phân trang ở góc dưới bên phải. */}
          <div className="flex justify-end">
            <Pagination
              basePath={basePath}
              page={result.page}
              total={result.total}
              limit={result.limit}
            />
          </div>
        </>
      )}

      <JsonLd data={breadcrumbJsonLd(trail)} />
    </Container>
  );
}

/** Số trang của một bộ lọc, dùng cho generateStaticParams của route phân trang. */
export async function pageParams(filter: ListParams) {
  const first = await listContent({ ...filter, page: 1, limit: LIST_LIMIT });
  const pages = Math.ceil(first.total / LIST_LIMIT);
  return Array.from({ length: Math.max(0, pages - 1) }, (_, i) => ({
    so: String(i + 2),
  }));
}

/** Đọc và kiểm tra số trang từ đường dẫn /trang/[so]. */
export function parsePageNumber(so: string): number {
  const page = Number(so);
  if (!Number.isInteger(page) || page < 2) notFound();
  return page;
}

/**
 * Ô tìm kiếm: form GET thường (chạy được cả khi chưa tải JS). Tìm theo tiêu
 * đề / tóm tắt / thẻ, tên tác giả, pháp danh, dịch giả; gõ "#thẻ" để lọc đúng thẻ.
 */
export async function SearchBox({ action, q = "" }: { action: string; q?: string }) {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  return (
    <form action={localePath(locale, action)} method="get" role="search" className="flex w-full max-w-xl gap-2">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
        <input
          type="search"
          name="q"
          defaultValue={q}
          maxLength={100}
          placeholder={dict.list.searchPlaceholder}
          aria-label={dict.list.searchPlaceholder}
          className="h-10 w-full rounded-md border border-line bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none"
        />
      </div>
      <Button type="submit">{dict.list.searchSubmit}</Button>
    </form>
  );
}

/**
 * Trang kết quả tìm kiếm của một loại nội dung (/bai-viet/tim-kiem,
 * /kinh-sach/tim-kiem). Tách khỏi trang danh sách để trang danh sách không đọc
 * searchParams - giữ được sinh tĩnh / ISR. Phân trang bằng ?trang=.
 */
export async function ContentSearchPage({
  filter,
  q,
  page,
  listPath,
  searchPath,
  title,
  trail,
  layout = "card",
  thumbnail = false,
}: {
  filter: ListParams;
  q: string;
  page: number;
  listPath: string;
  searchPath: string;
  title: string;
  trail: Crumb[];
  layout?: "card" | "list";
  thumbnail?: boolean;
}) {
  const dict = await getDictionary();
  const tuKhoa = q.trim().slice(0, 100);
  const result = tuKhoa ? await listContent({ ...filter, q: tuKhoa, page, limit: LIST_LIMIT }).catch(() => null) : null;
  const soTrang = result ? Math.max(1, Math.ceil(result.total / LIST_LIMIT)) : 1;
  const link = (t: number) => `${searchPath}?q=${encodeURIComponent(tuKhoa)}${t > 1 ? `&trang=${t}` : ""}`;

  return (
    <Container className="flex flex-col gap-8 py-12">
      <Breadcrumbs trail={[...trail, { name: dict.list.searchTitle, href: searchPath }]} />
      <SectionHeading
        title={title}
        description={result ? dict.list.searchResults.replace("{n}", String(result.total)).replace("{q}", tuKhoa) : undefined}
        action={
          <Button variant="outline" asChild>
            <LocaleLink href={listPath}>{dict.list.searchClear}</LocaleLink>
          </Button>
        }
      />
      <div className="sticky top-16 z-30 -mx-5 flex flex-wrap items-center gap-3 border-b border-line/60 bg-paper/90 px-5 py-2.5 backdrop-blur sm:-mx-8 sm:px-8">
        <div className="min-w-[16rem] flex-1">
          <SearchBox action={searchPath} q={tuKhoa} />
        </div>
      </div>

      {!result || result.data.length === 0 ? (
        tuKhoa ? <EmptyState title={dict.list.searchTitle} description={dict.list.searchEmpty} /> : null
      ) : (
        <>
          {layout === "list" ? (
            <ContentList items={result.data} />
          ) : (
            <ContentGrid items={result.data} columns={3} thumbnail={thumbnail} />
          )}
          {soTrang > 1 ? (
            <nav className="flex items-center justify-end gap-3 text-sm" aria-label={dict.list.searchTitle}>
              {page > 1 ? (
                <Button variant="outline" asChild>
                  <LocaleLink href={link(page - 1)}>← {dict.list.prev}</LocaleLink>
                </Button>
              ) : null}
              <span className="text-muted">
                {page}/{soTrang}
              </span>
              {page < soTrang ? (
                <Button variant="outline" asChild>
                  <LocaleLink href={link(page + 1)}>{dict.list.next} →</LocaleLink>
                </Button>
              ) : null}
            </nav>
          ) : null}
        </>
      )}
    </Container>
  );
}
