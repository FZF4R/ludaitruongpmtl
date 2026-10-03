import { notFound } from "next/navigation";
import { listContent, type ListParams } from "@/lib/api";
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
        action={adminBar}
      />

      {result.data.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <>
          {layout === "list" ? (
            <ContentList items={result.data} />
          ) : (
            <ContentGrid items={result.data} columns={columns} thumbnail={thumbnail} />
          )}
          <Pagination
            basePath={basePath}
            page={result.page}
            total={result.total}
            limit={result.limit}
          />
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
