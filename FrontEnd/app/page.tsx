import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { listContent, listCategories, getSiteSettings } from "@/lib/api";
import { Container, SectionHeading, Card, Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { ContentCard, ContentGrid } from "@/components/content/content-card";
import { TodayLunarBadge } from "@/components/calendar/today-marker";
import { contentHref } from "@/lib/seo";
import { formatDate } from "@/lib/format";

/**
 * Trang chủ ISR 5 phút: nội dung đổi theo ngày nhưng vẫn phải nằm sẵn
 * trong HTML để bộ máy tìm kiếm và người đọc đều nhận trang tức thì.
 */
export const revalidate = 300;

export default async function HomePage() {
  const [featured, sutras, talks, categories, settings] = await Promise.all([
    listContent({ type: ["article", "blog"], limit: 7 }),
    listContent({ type: "sutra", limit: 3 }),
    listContent({ type: ["audio", "video"], limit: 4 }),
    listCategories(),
    getSiteSettings(),
  ]);

  const [lead, ...rest] = featured.data;

  return (
    <>
      {settings?.notify ? (
        <div className="border-b border-line bg-brass-soft">
          <Container className="py-2.5 text-center text-xs text-brass">
            {settings.notify}
          </Container>
        </div>
      ) : null}

      {/* Mở đầu: câu kệ, không phải khẩu hiệu marketing. */}
      <section className="border-b border-line bg-surface">
        <Container className="flex flex-col gap-8 py-16 sm:py-24">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <CalendarDays className="size-3.5" aria-hidden />
            <TodayLunarBadge />
          </div>

          <blockquote className="max-w-3xl">
            <p className="whitespace-pre-line font-serif text-2xl leading-relaxed text-ink sm:text-[2rem] sm:leading-[1.5]">
              {"Ý dẫn đầu các pháp,\nÝ làm chủ, ý tạo;\nNếu với ý thanh tịnh,\nAn lạc bước theo sau,\nNhư bóng, không rời hình."}
            </p>
            <footer className="mt-5 text-sm text-muted">
              — Kinh Pháp Cú, phẩm Song Yếu
            </footer>
          </blockquote>

          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/kinh-sach">
                Đọc kinh sách <ArrowRight />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/bai-giang">Nghe bài giảng</Link>
            </Button>
          </div>
        </Container>
      </section>

      <Container className="flex flex-col gap-16 py-16">
        {lead ? (
          <section className="flex flex-col gap-6">
            <SectionHeading
              eyebrow="Mới đăng"
              title="Bài viết"
              action={
                <Button variant="link" asChild>
                  <Link href="/bai-viet">
                    Tất cả bài viết <ArrowRight />
                  </Link>
                </Button>
              }
            />
            <div className="grid gap-5 lg:grid-cols-3">
              <div className="relative lg:col-span-2">
                <ContentCard item={lead} featured />
              </div>
              <div className="flex flex-col gap-3">
                {rest.slice(0, 4).map((item) => (
                  <Card key={item.id} className="relative p-4 hover:border-line-strong">
                    <Link href={contentHref(item)} className="flex flex-col gap-1.5">
                      <span className="font-serif font-semibold leading-snug text-ink">
                        {item.title}
                      </span>
                      <span className="text-xs text-muted">
                        {formatDate(item.publishedAt)}
                      </span>
                    </Link>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {sutras.data.length > 0 ? (
          <section className="flex flex-col gap-6">
            <SectionHeading
              eyebrow="Kinh, luật, luận"
              title="Kinh sách"
              description="Đọc theo chương, giữ nguyên bản dịch và ghi rõ xuất xứ."
              action={
                <Button variant="link" asChild>
                  <Link href="/kinh-sach">
                    Xem tất cả <ArrowRight />
                  </Link>
                </Button>
              }
            />
            <ContentGrid items={sutras.data} />
          </section>
        ) : null}

        {talks.data.length > 0 ? (
          <section className="flex flex-col gap-6">
            <SectionHeading
              eyebrow="Nghe và xem"
              title="Bài giảng"
              description="Mỗi bài đều kèm toàn văn để tiện đối chiếu và tra cứu."
              action={
                <Button variant="link" asChild>
                  <Link href="/bai-giang">
                    Xem tất cả <ArrowRight />
                  </Link>
                </Button>
              }
            />
            <ContentGrid items={talks.data} columns={2} />
          </section>
        ) : null}

        {categories.length > 0 ? (
          <section className="flex flex-col gap-6">
            <SectionHeading eyebrow="Duyệt theo" title="Chuyên mục" />
            <div className="flex flex-wrap gap-2.5">
              {categories.map((c) => (
                <Link key={c.slug} href={`/danh-muc/${c.slug}`}>
                  <Badge
                    tone="neutral"
                    className="px-4 py-2 text-sm transition-colors hover:bg-accent-soft hover:text-accent"
                  >
                    {c.name}
                    <span className="ml-2 tabular-nums opacity-60">{c.count}</span>
                  </Badge>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </Container>
    </>
  );
}
