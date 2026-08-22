import type { Metadata } from "next";
import { Search } from "lucide-react";
import { searchContent } from "@/lib/api";
import { Container, SectionHeading, EmptyState } from "@/components/ui/primitives";
import { ContentGrid } from "@/components/content/content-card";
import { Breadcrumbs, Pagination } from "@/components/content/navigation";
import { Button } from "@/components/ui/button";

/**
 * Trang tìm kiếm render động và KHÔNG cho lập chỉ mục.
 *
 * Trang kết quả tìm kiếm bị Google xếp vào nhóm "soft 404 / thin
 * content" — để nó vào chỉ mục sẽ kéo chất lượng tên miền xuống.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tìm kiếm",
  description: "Tìm bài viết, kinh sách và bài giảng trên toàn trang.",
  robots: { index: false, follow: true },
};

export default async function SearchPage(props: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q = "", page: pageParam } = await props.searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const query = q.trim();

  const result = query ? await searchContent(query, page) : null;

  return (
    <Container className="flex flex-col gap-8 py-12">
      <Breadcrumbs
        trail={[
          { name: "Trang chủ", href: "/" },
          { name: "Tìm kiếm", href: "/tim-kiem" },
        ]}
      />

      <SectionHeading
        eyebrow="Toàn trang"
        title="Tìm kiếm"
        description="Tìm theo tiêu đề, tóm tắt và từ khoá. Không phân biệt dấu."
      />

      {/* Form GET thật: kết quả có URL riêng, chia sẻ và tải lại được. */}
      <form action="/tim-kiem" method="get" className="flex max-w-xl gap-2">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Ví dụ: quán niệm hơi thở"
            aria-label="Từ khoá tìm kiếm"
            className="h-11 w-full rounded-md border border-line bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-muted"
          />
        </div>
        <Button type="submit" size="lg">
          Tìm
        </Button>
      </form>

      {!query ? (
        <p className="text-sm text-muted">Nhập từ khoá để bắt đầu tìm.</p>
      ) : result && result.data.length > 0 ? (
        <>
          <p className="text-sm text-muted">
            Tìm thấy <span className="font-medium text-ink">{result.total}</span> kết
            quả cho “{query}”.
          </p>
          <ContentGrid items={result.data} />
          <Pagination
            basePath="/tim-kiem"
            page={result.page}
            total={result.total}
            limit={result.limit}
            query={{ q: query }}
          />
        </>
      ) : (
        <EmptyState
          title={`Không có kết quả cho “${query}”`}
          description="Thử từ khoá ngắn hơn, hoặc duyệt theo chuyên mục ở chân trang."
        />
      )}
    </Container>
  );
}
