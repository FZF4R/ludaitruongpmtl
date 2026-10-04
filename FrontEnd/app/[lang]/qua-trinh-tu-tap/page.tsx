import type { Metadata } from "next";
import { Container, SectionHeading } from "@/components/ui/primitives";
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
 * Quá trình tu tập: tiêu đề bên trái, lịch bên phải (ngày vía, sự kiện, công
 * đức và tu tập theo ngày của người xem); bên dưới là thống kê chi tiết.
 */
export default async function Page() {
  const [dict, suKien] = await Promise.all([getDictionary(), listLunarEvents().catch(() => [])]);
  return (
    <Container className="flex flex-col gap-8 py-12">
      <Breadcrumbs
        trail={[
          { name: dict.nav.home, href: "/" },
          { name: dict.nav.journey, href: HREF },
        ]}
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-start">
        <div className="flex flex-col gap-4">
          <SectionHeading title={dict.practiceTools.journey.title} description={dict.nav.journeyHint} />
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <span className="rounded bg-accent-soft px-1 text-[10px] font-bold text-accent">+N</span>
              {dict.practiceTools.journeyCal.meritLegend}
            </span>
          </p>
        </div>
        <section aria-label={dict.practiceTools.journeyCal.title}>
          <JourneyCalendar
            suKien={suKien}
            nhan={{ ...dict.homeCalendar, eventKind: dict.calendar.eventKind }}
            nhanCongDuc={dict.stats.actions}
            nhanTuTap={dict.practiceTools}
          />
        </section>
      </div>
      <Journey nhan={dict.practiceTools} />
    </Container>
  );
}
