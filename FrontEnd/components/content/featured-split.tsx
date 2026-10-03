import { LocaleLink as Link } from "@/components/ui/locale-link";
import { Flame } from "lucide-react";
import type { ContentSummary } from "@/lib/schema";
import { Card } from "@/components/ui/primitives";
import { ContentGrid } from "@/components/content/content-card";
import { contentHref } from "@/lib/seo";
import { formatDate, readingTime } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Khối trang chủ: 2 bài nổi bật dạng thẻ có ảnh (chiếm 2/3) + cột danh sách
 * bài mới gọn (1/3). Dùng cho cả Bài viết và Kinh sách.
 *
 * `daoCot` chỉ đổi vị trí trên màn hình rộng (lg:order), còn thứ tự trong
 * HTML giữ nguyên: trên điện thoại hai khối xếp dọc thì phần nổi bật vẫn lên
 * trước, và trình đọc màn hình đọc theo cùng một thứ tự ở mọi khối.
 */
export function FeaturedSplit({
  noiBat,
  moi,
  nhanNoiBat,
  nhanMoi,
  hanhDongMoi,
  daoCot = false,
}: {
  noiBat: ContentSummary[];
  moi: ContentSummary[];
  nhanNoiBat: React.ReactNode;
  nhanMoi: React.ReactNode;
  /** Nút đặt cùng dòng với nhãn cột "mới", ví dụ "Tất cả bài viết". */
  hanhDongMoi?: React.ReactNode;
  /** true = cột "mới" bên trái, khối nổi bật bên phải. */
  daoCot?: boolean;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-3 lg:gap-6">
      <div className={cn("flex flex-col gap-3 lg:col-span-2", daoCot && "lg:order-2")}>
        <p className="flex min-h-8 items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
          <Flame className="size-3.5" aria-hidden />
          {nhanNoiBat}
        </p>
        <ContentGrid items={noiBat} columns={2} thumbnail />
      </div>

      {moi.length > 0 || hanhDongMoi ? (
        <div className={cn("flex flex-col gap-3", daoCot && "lg:order-1")}>
          {/* min-h khớp chiều cao nhãn bên khối nổi bật để hai cột vẫn thẳng hàng. */}
          <div className="flex min-h-8 items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              {nhanMoi}
            </p>
            {hanhDongMoi}
          </div>
          {moi.length > 0 ? (
            <Card className="flex flex-col divide-y divide-line overflow-hidden">
              {moi.map((item) => (
                <article
                  key={item.id}
                  className="group relative flex flex-col gap-1.5 p-4 transition-colors hover:bg-surface-2/60"
                >
                  <Link
                    href={contentHref(item)}
                    className="font-serif font-semibold leading-snug text-ink transition-colors group-hover:text-accent"
                  >
                    <span className="absolute inset-0" aria-hidden />
                    {item.title}
                  </Link>
                  <span className="text-xs text-muted">
                    {formatDate(item.publishedAt)}
                    {item.readingMinutes ? ` · ${readingTime(item.readingMinutes)}` : ""}
                  </span>
                </article>
              ))}
            </Card>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** Bỏ khỏi danh sách "mới" những bài đã nằm ở khối nổi bật, rồi lấy `soLuong` bài. */
export function boTrung(
  noiBat: ContentSummary[],
  moi: ContentSummary[],
  soLuong = 4,
): ContentSummary[] {
  const daCo = new Set(noiBat.map((b) => b.id));
  return moi.filter((b) => !daCo.has(b.id)).slice(0, soLuong);
}
