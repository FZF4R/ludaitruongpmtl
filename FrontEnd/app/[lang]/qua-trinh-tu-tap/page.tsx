import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/primitives";
import { Breadcrumbs } from "@/components/content/navigation";
import { Journey } from "@/components/practice/journey";
import { JourneyCalendar } from "@/components/practice/journey-calendar";
import { listLunarEvents } from "@/lib/api";
import { getDictionary } from "@/lib/dictionary";
import { i18nAlternates } from "@/lib/seo";

const HREF = "/qua-trinh-tu-tap";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return {
    title: dict.nav.journey,
    alternates: await i18nAlternates(HREF),
    // Nhật ký riêng của từng người: không có gì để lập chỉ mục.
    robots: { index: false, follow: true },
  };
}

/**
 * Quá trình tu tập - bố cục toàn chiều ngang màn hình:
 *   - trái: tiêu đề + lịch (ngày vía, sự kiện, công đức theo ngày), sát mép
 *     trái, đứng yên khi cuộn (sticky dưới header cao 4rem);
 *   - phải: thống kê tu tập, sát mép phải. Cả trang cuộn; cột thống kê luôn
 *     cao ít nhất bằng màn hình (cao hơn cột lịch) nên lịch đứng yên suốt lúc cuộn.
 * Màn hình hẹp: xếp dọc như bình thường (lịch trên, thống kê dưới).
 */
export default async function Page() {
  const [dict, suKien] = await Promise.all([getDictionary(), listLunarEvents().catch(() => [])]);
  return (
    <div className="flex w-full flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <Breadcrumbs
        trail={[
          { name: dict.nav.home, href: "/" },
          { name: dict.nav.journey, href: HREF },
        ]}
      />
      <div className="grid gap-8 lg:grid-cols-[minmax(22rem,28rem)_minmax(0,1fr)]">
        <aside
          aria-label={dict.practiceTools.journeyCal.title}
          className="flex flex-col gap-4 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:self-start lg:overflow-y-auto lg:[scrollbar-width:thin]"
        >
          <SectionHeading title={dict.practiceTools.journey.title} description={dict.nav.journeyHint} />
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <span className="rounded bg-accent-soft px-1 text-[10px] font-bold text-accent">+N</span>
              {dict.practiceTools.journeyCal.meritLegend}
            </span>
          </p>
          <JourneyCalendar
            suKien={suKien}
            nhan={{ ...dict.homeCalendar, eventKind: dict.calendar.eventKind }}
            nhanCongDuc={dict.stats.actions}
            nhanTuTap={dict.practiceTools}
          />
        </aside>
        <section className="min-w-0 lg:min-h-[calc(100dvh-5rem)]">
          <Journey nhan={dict.practiceTools} />
        </section>
      </div>
    </div>
  );
}
