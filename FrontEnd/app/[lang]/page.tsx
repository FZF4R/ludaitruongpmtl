import { LocaleLink as Link } from "@/components/ui/locale-link";
import { ArrowRight, CalendarDays } from "lucide-react";
import {
  listContent,
  listCategories,
  getSiteSettings,
  getHeroImages,
  listLunarEvents,
} from "@/lib/api";
import { baKhoang, cacThangToi, homNayVN, sangChuoiNgay, suKienTrongKhoang } from "@/lib/buddhist-events";
import { HomeCalendar } from "@/components/home/home-calendar";
import { PrayerWall } from "@/components/home/prayer-wall";
import { ContactDock } from "@/components/home/contact-dock";
import { Container, SectionHeading, Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { ContentGrid } from "@/components/content/content-card";
import { FeaturedSplit, boTrung } from "@/components/content/featured-split";
import { TodayLunarBadge } from "@/components/calendar/today-marker";
import { getI18n } from "@/lib/dictionary";
import { EditableText } from "@/components/layout/inline-edit";
import { heroImages } from "@/lib/hero-images";
import { HeroCarousel, type AnhHero } from "@/components/home/hero-carousel";

/**
 * Trang chủ ISR 5 phút: nội dung đổi theo ngày nhưng vẫn phải nằm sẵn
 * trong HTML để bộ máy tìm kiếm và người đọc đều nhận trang tức thì.
 */
export const revalidate = 300;

/** Câu kệ mở đầu: chưa nằm trong từ điển nên mặc định viết ở đây, admin sửa được. */
const KE_MAC_DINH = `Ý dẫn đầu các pháp,
Ý làm chủ, ý tạo;
Nếu với ý thanh tịnh,
An lạc bước theo sau,
Như bóng, không rời hình.`;

export default async function HomePage() {
  const { dict, texts } = await getI18n();
  // `k` có trong từ điển thì `dict` đã gộp sẵn bản sửa; khoá riêng thì đọc `texts`.
  const sua = (k: string, macDinh: string) => (
    <EditableText k={k} value={texts[k] ?? macDinh} />
  );
  const [popular, newest, popularSutras, newestSutras, talks, categories, settings, uploaded, lunarEvents] =
    await Promise.all([
      listContent({ type: ["article", "blog"], sort: "popular", limit: 2 }),
      listContent({ type: ["article", "blog"], limit: 6 }),
      listContent({ type: "sutra", sort: "popular", limit: 2 }),
      listContent({ type: "sutra", limit: 6 }),
      listContent({ type: ["audio", "video"], limit: 4 }),
      listCategories(),
      getSiteSettings(),
      getHeroImages(),
      // Lịch là phụ trợ: API hỏng thì mục lịch rỗng, trang chủ vẫn lên.
      listLunarEvents().catch(() => []),
    ]);

  // Lịch Phật giáo: tính sẵn ba khoảng trên server. Trang chủ ISR 5 phút nên
  // "hôm nay" lệch tối đa 5 phút - đủ cho lịch tính theo ngày.
  const homNay = homNayVN();
  const khoang = baKhoang(homNay);
  const tenTuDong = {
    mungMot: (m: number) => `${dict.calendar.newMoon} ${dict.homeCalendar.monthOf.replace("{m}", String(m))}`,
    ram: (m: number) => `${dict.calendar.fullMoon} ${dict.homeCalendar.monthOf.replace("{m}", String(m))}`,
  };
  const lichPhat = {
    baThangToi: suKienTrongKhoang(lunarEvents, khoang.baThangToi.tu, khoang.baThangToi.den, tenTuDong),
    // Cả năm: chỉ sự kiện thật, bỏ Mùng Một / Rằm cho danh sách khỏi dài.
    namNay: suKienTrongKhoang(lunarEvents, khoang.namNay.tu, khoang.namNay.den, null),
  };
  const linkLich = `/phat-lich/${homNay.getUTCFullYear()}/${homNay.getUTCMonth() + 1}`;
  // Lịch tháng bên phải: 12 tháng từ tháng này, chuyển qua lại ở trình duyệt.
  const lichThang = cacThangToi(homNay, 12, lunarEvents);
  // Sự kiện của từng tháng trong lịch (kèm Mùng Một / Rằm), để tab tháng bên
  // phải đổi theo tháng đang lật ở lịch bên trái.
  const suKienTheoThang = lichThang.map((t) =>
    suKienTrongKhoang(
      lunarEvents,
      new Date(Date.UTC(t.nam, t.thang - 1, 1)),
      new Date(Date.UTC(t.nam, t.thang, 0)),
      tenTuDong,
    ),
  );

  // Bài đã nằm ở khối nổi bật thì không lặp lại ở cột "mới".
  const mostRead = popular.data;
  const latest = boTrung(mostRead, newest.data);
  const sutrasPopular = popularSutras.data;
  const sutrasLatest = boTrung(sutrasPopular, newestSutras.data);
  // Xoay vòng CẢ ảnh admin tải lên (/admin/dashboard, theo thứ tự admin xếp)
  // lẫn bộ ảnh sẵn có trong lib/img nối phía sau. Có ảnh admin thì bắt đầu từ
  // ảnh admin đầu tiên; chưa có thì bắt đầu từ một ảnh sẵn có ngẫu nhiên mỗi
  // lần trang được sinh lại (ISR).
  const anhNen: AnhHero[] = [
    ...uploaded.map((a) => ({ src: a.src, alt: a.alt })),
    ...heroImages.map((src) => ({ src, alt: "" })),
  ];
  const anhDau = uploaded.length ? 0 : Math.floor(Math.random() * anhNen.length);

  return (
    <>
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
          Ảnh nền xoay vòng. Ảnh trang trí: alt rỗng + aria-hidden, mọi thông
          tin đã có trong chữ. Ảnh đầu được priority vì là LCP (xem HeroCarousel).
        */}
        <HeroCarousel images={anhNen} startIndex={anhDau} />

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
              {sua("home.heroQuote", KE_MAC_DINH)}
            </p>
            <footer className="mt-5 text-sm text-white/75">
              — {sua("home.heroSource", "Kinh Pháp Cú, phẩm Song Yếu")}
            </footer>
          </blockquote>

          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/kinh-sach">
                {sua("home.heroCtaSutras", "Đọc kinh sách")} <ArrowRight />
              </Link>
            </Button>
            <Button
              variant="outline"
              className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              asChild
            >
              <Link href="/bai-giang">{sua("home.heroCtaTalks", "Nghe bài giảng")}</Link>
            </Button>
          </div>
        </Container>

        {/*
          Dải thiền ngữ (cấu hình ở /admin/dashboard) nằm ở đáy ảnh bìa, vẫn
          trong khối ảnh. Cùng lý do với câu kệ ở trên: chữ đè lên ảnh nên cố
          định trắng trên nền tối mờ, không theo bảng màu giao diện.
        */}
        {settings?.notify ? (
          <div className="border-t border-white/15 bg-black/40 backdrop-blur-sm">
            <Container className="py-3 text-center font-serif text-sm italic leading-relaxed text-white/90">
              {settings.notify}
            </Container>
          </div>
        ) : null}
      </section>

      <Container className="flex flex-col gap-16 py-16">
        {/*
          Lịch Phật giáo: trái là lịch tháng chuyển qua lại được (ngày Trai + sự
          kiện), phải là danh sách sự kiện theo tab. Màn hình hẹp thì xếp dọc.
        */}
        <section className="flex flex-col gap-6">
          <SectionHeading
            eyebrow={sua("homeCalendar.eyebrow", dict.homeCalendar.eyebrow)}
            title={sua("homeCalendar.title", dict.homeCalendar.title)}
          />
          <HomeCalendar
            thang={lichThang}
            suKienTheoThang={suKienTheoThang}
            baThangToi={lichPhat.baThangToi}
            namNay={lichPhat.namNay}
            homNay={sangChuoiNgay(homNay)}
            linkLich={linkLich}
            nhan={{ ...dict.homeCalendar, eventKind: dict.calendar.eventKind }}
          />
        </section>

        {mostRead.length > 0 ? (
          <section className="flex flex-col gap-6">
            <SectionHeading
              eyebrow={sua("home.articlesEyebrow", "Pháp thoại · Tuỳ bút")}
              title={sua("nav.articles", dict.nav.articles)}
            />
            <FeaturedSplit
              noiBat={mostRead}
              moi={latest}
              nhanNoiBat={sua("home.mostRead", "Đọc nhiều nhất")}
              nhanMoi={sua("home.latest", dict.home.latest)}
              hanhDongMoi={
                <Button size="sm" asChild>
                  <Link href="/bai-viet">
                    {sua("home.allArticles", "Tất cả bài viết")} <ArrowRight />
                  </Link>
                </Button>
              }
            />
          </section>
        ) : null}

        {sutrasPopular.length > 0 ? (
          <section className="flex flex-col gap-6">
            <SectionHeading
              eyebrow={sua("home.sutrasEyebrow", dict.home.sutrasEyebrow)}
              title={sua("nav.sutras", dict.nav.sutras)}
              description={sua("home.sutrasDesc2", dict.home.sutrasDesc2)}
              action={
                <Button size="sm" asChild>
                  <Link href="/kinh-sach">
                    {sua("home.allSutras", "Tất cả kinh sách")} <ArrowRight />
                  </Link>
                </Button>
              }
            />
            {/* Đảo cột so với Bài viết để hai khối liền nhau không lặp một nhịp. */}
            <FeaturedSplit
              noiBat={sutrasPopular}
              moi={sutrasLatest}
              nhanNoiBat={sua("home.popularSutras", "Kinh sách phổ biến")}
              nhanMoi={sua("home.sutrasLatest", "Mới cập nhật")}
              daoCot
            />
          </section>
        ) : null}

        {talks.data.length > 0 ? (
          <section className="flex flex-col gap-6">
            <SectionHeading
              eyebrow={sua("home.talksEyebrow", dict.home.talksEyebrow)}
              title={sua("nav.talks", dict.nav.talks)}
              description={sua("home.talksDesc2", dict.home.talksDesc2)}
              action={
                <Button variant="link" asChild>
                  <Link href="/bai-giang">
                    {sua("home.viewAll", dict.home.viewAll)} <ArrowRight />
                  </Link>
                </Button>
              }
            />
            <ContentGrid items={talks.data} columns={2} />
          </section>
        ) : null}

        {categories.length > 0 ? (
          <section className="flex flex-col gap-6">
            <SectionHeading
              eyebrow={sua("home.browseBy", dict.home.browseBy)}
              title={sua("home.categories", dict.home.categories)}
            />
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

        {/* Lời cầu nguyện là mục cuối cùng của trang chủ. */}
        <section className="flex flex-col gap-6">
          <SectionHeading
            eyebrow={sua("prayers.eyebrow", dict.prayers.eyebrow)}
            title={sua("prayers.title", dict.prayers.title)}
            description={sua("prayers.description", dict.prayers.description)}
          />
          <PrayerWall nhan={dict.prayers} />
        </section>
      </Container>

      <ContactDock
        zaloKenh={settings?.zalosupportinfo}
        facebook={settings?.supportfacebook}
        tiktok={settings?.supporttiktok}
        zaloAdmin={settings?.zaloadminsupportinfo}
        nhan={dict.contact}
      />
    </>
  );
}
