import Image from "next/image";
import { LocaleLink as Link } from "@/components/ui/locale-link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { listContent, listCategories, getSiteSettings } from "@/lib/api";
import { Container, SectionHeading, Card, Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { ContentCard, ContentGrid } from "@/components/content/content-card";
import { TodayLunarBadge } from "@/components/calendar/today-marker";
import { contentHref } from "@/lib/seo";
import { formatDate } from "@/lib/format";
import { getDictionary } from "@/lib/dictionary";
import { randomHeroImage } from "@/lib/hero-images";

/**
 * Trang chủ ISR 5 phút: nội dung đổi theo ngày nhưng vẫn phải nằm sẵn
 * trong HTML để bộ máy tìm kiếm và người đọc đều nhận trang tức thì.
 */
export const revalidate = 300;

export default async function HomePage() {
  const dict = await getDictionary();
  const [featured, sutras, talks, categories, settings] = await Promise.all([
    listContent({ type: ["article", "blog"], limit: 7 }),
    listContent({ type: "sutra", limit: 3 }),
    listContent({ type: ["audio", "video"], limit: 4 }),
    listCategories(),
    getSiteSettings(),
  ]);

  const [lead, ...rest] = featured.data;
  const heroImage = randomHeroImage();

  return (
    <>
      {settings?.notify ? (
        <div className="border-b border-line bg-brass-soft">
          <Container className="py-2.5 text-center text-xs text-brass">
            {settings.notify}
          </Container>
        </div>
      ) : null}

      {/*
        Mở đầu: câu kệ trên nền ảnh phủ kín khối.

        Ảnh đổi mỗi lần trang được sinh lại (ISR 5 phút), không phải mỗi lượt xem.

        Chữ nằm ĐÈ lên ảnh nên không thể trông cậy vào token màu của giao diện:
        ảnh nào cũng có thể sáng hoặc tối ở bất kỳ vùng nào. Vì vậy khối này cố
        định chữ trắng trên một lớp phủ tối, giống nhau ở cả chế độ sáng và tối
        — đây là chỗ hiếm hoi trong site không theo bảng màu, và là chủ ý.
      */}
      <section className="relative isolate overflow-hidden border-b border-line">
        {/*
          priority: đây là ảnh lớn nhất trong khung nhìn đầu tiên, để Next tải
          sớm thay vì lazy-load — lazy ở đây làm chậm LCP.
          alt rỗng + aria-hidden: ảnh trang trí, mọi thông tin đã có trong chữ.
        */}
        <Image
          src={heroImage}
          alt=""
          aria-hidden
          priority
          placeholder="blur"
          fill
          sizes="100vw"
          className="-z-10 object-cover"
        />

        {/*
          Hai lớp phủ chồng nhau: một lớp tối đều để bảo đảm tương phản tối
          thiểu ở mọi vùng ảnh, một lớp chuyển sắc đậm dần xuống dưới để phần
          chân khối (nơi có nút bấm) luôn đủ tối.
        */}
        <div className="absolute inset-0 -z-10 bg-black/55" aria-hidden />
        <div
          className="absolute inset-0 -z-10 bg-gradient-to-t from-black/70 via-black/20 to-black/40"
          aria-hidden
        />

        <Container className="flex flex-col gap-8 py-24 sm:py-32">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/80">
            <CalendarDays className="size-3.5" aria-hidden />
            <TodayLunarBadge />
          </div>

          <blockquote className="max-w-3xl">
            <p className="whitespace-pre-line font-serif text-2xl leading-relaxed text-white drop-shadow-sm sm:text-[2rem] sm:leading-[1.5]">
              {`Ý dẫn đầu các pháp,
Ý làm chủ, ý tạo;
Nếu với ý thanh tịnh,
An lạc bước theo sau,
Như bóng, không rời hình.`}
            </p>
            <footer className="mt-5 text-sm text-white/75">
              — Kinh Pháp Cú, phẩm Song Yếu
            </footer>
          </blockquote>

          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/kinh-sach">
                Đọc kinh sách <ArrowRight />
              </Link>
            </Button>
            <Button
              variant="outline"
              className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              asChild
            >
              <Link href="/bai-giang">Nghe bài giảng</Link>
            </Button>
          </div>
        </Container>
      </section>

      <Container className="flex flex-col gap-16 py-16">
        {lead ? (
          <section className="flex flex-col gap-6">
            <SectionHeading
              eyebrow={dict.home.latest}
              title={dict.nav.articles}
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
                  <Card key={item.id} className="relative p-4 hover:border-line-strong hover:shadow-card-lift">
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
              eyebrow={dict.home.sutrasEyebrow}
              title={dict.nav.sutras}
              description={dict.home.sutrasDesc2}
              action={
                <Button variant="link" asChild>
                  <Link href="/kinh-sach">
                    {dict.home.viewAll} <ArrowRight />
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
              eyebrow={dict.home.talksEyebrow}
              title={dict.nav.talks}
              description={dict.home.talksDesc2}
              action={
                <Button variant="link" asChild>
                  <Link href="/bai-giang">
                    {dict.home.viewAll} <ArrowRight />
                  </Link>
                </Button>
              }
            />
            <ContentGrid items={talks.data} columns={2} />
          </section>
        ) : null}

        {categories.length > 0 ? (
          <section className="flex flex-col gap-6">
            <SectionHeading eyebrow={dict.home.browseBy} title={dict.home.categories} />
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
