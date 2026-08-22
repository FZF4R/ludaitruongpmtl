import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { listLunarEvents } from "@/lib/api";
import { buddhistYear, canChiYear, solarToLunar } from "@/lib/lunar";
import {
  Container,
  SectionHeading,
  JsonLd,
  Badge,
  Separator,
} from "@/components/ui/primitives";
import { Breadcrumbs } from "@/components/content/navigation";
import { LunarMonth, EventList } from "@/components/calendar/lunar-month";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";

export const revalidate = 86400;

/**
 * Sinh tĩnh 12 tháng của năm nay và năm sau. Tháng ngoài khoảng đó vẫn
 * render được theo yêu cầu rồi cache lại — lịch âm tính bằng thuật toán
 * nên không phụ thuộc dữ liệu nào.
 */
export async function generateStaticParams() {
  const year = new Date().getUTCFullYear();
  return [year, year + 1].flatMap((nam) =>
    Array.from({ length: 12 }, (_, i) => ({
      nam: String(nam),
      thang: String(i + 1),
    })),
  );
}

function parseParams(nam: string, thang: string) {
  const year = Number(nam);
  const month = Number(thang);
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    year < 1900 ||
    year > 2100 ||
    month < 1 ||
    month > 12
  ) {
    return null;
  }
  return { year, month };
}

export async function generateMetadata(props: {
  params: Promise<{ nam: string; thang: string }>;
}): Promise<Metadata> {
  const { nam, thang } = await props.params;
  const parsed = parseParams(nam, thang);
  if (!parsed) return { title: "Không tìm thấy tháng" };

  const title = `Phật lịch tháng ${parsed.month}/${parsed.year}`;
  return {
    title,
    description: `Lịch âm dương tháng ${parsed.month}/${parsed.year} theo múi giờ Việt Nam, kèm ngày rằm, mùng một và các ngày vía trong tháng.`,
    alternates: {
      canonical: absoluteUrl(`/phat-lich/${parsed.year}/${parsed.month}`),
    },
  };
}

export default async function CalendarMonthPage(props: {
  params: Promise<{ nam: string; thang: string }>;
}) {
  const { nam, thang } = await props.params;
  const parsed = parseParams(nam, thang);
  if (!parsed) notFound();

  const { year, month } = parsed;
  const events = await listLunarEvents();

  // Tháng dương lịch trải trên hai tháng âm lịch, nên lấy sự kiện của cả hai.
  const startLunar = solarToLunar(1, month, year);
  const endLunar = solarToLunar(28, month, year);
  const monthEvents = events.filter(
    (e) =>
      (e.lunarMonth === startLunar.month || e.lunarMonth === endLunar.month) &&
      (e.solarYear === null || e.solarYear === year),
  );

  const prev = month === 1 ? { y: year - 1, m: 12 } : { y: year, m: month - 1 };
  const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };

  const trail = [
    { name: "Trang chủ", href: "/" },
    { name: "Phật lịch", href: "/phat-lich" },
    { name: `Tháng ${month}/${year}`, href: `/phat-lich/${year}/${month}` },
  ];

  return (
    <Container className="flex flex-col gap-8 py-12">
      <Breadcrumbs trail={trail} />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading
          eyebrow={`Phật lịch ${buddhistYear(new Date(Date.UTC(year, month - 1, 15)))}`}
          title={`Tháng ${month} năm ${year}`}
          description={`Nhằm tháng ${startLunar.month} năm ${canChiYear(startLunar.year)} âm lịch.`}
        />
        <nav className="flex items-center gap-2" aria-label="Chuyển tháng">
          <Link
            href={`/phat-lich/${prev.y}/${prev.m}`}
            rel="prev"
            className="flex items-center gap-1 rounded-md border border-line px-3 py-2 text-sm hover:bg-surface-2"
          >
            <ChevronLeft className="size-4" aria-hidden />
            Tháng {prev.m}
          </Link>
          <Link
            href={`/phat-lich/${next.y}/${next.m}`}
            rel="next"
            className="flex items-center gap-1 rounded-md border border-line px-3 py-2 text-sm hover:bg-surface-2"
          >
            Tháng {next.m}
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        </nav>
      </div>

      <LunarMonth year={year} month={month} events={events} />

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
        <Badge tone="accent">Ngày rằm và mùng một</Badge>
        <Badge tone="brass">Ngày vía, đại lễ</Badge>
        <span>Lịch âm tính theo múi giờ Việt Nam (UTC+7).</span>
      </div>

      <Separator />

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">Ngày vía và đại lễ trong tháng</h2>
        <EventList events={monthEvents} />
      </section>

      <p className="max-w-2xl text-xs leading-relaxed text-muted">
        Năm Phật lịch được tính bằng năm dương lịch cộng 544, chuyển sang năm
        mới sau đại lễ Phật Đản (rằm tháng Tư âm lịch) theo truyền thống Nam
        tông.
      </p>

      <JsonLd data={breadcrumbJsonLd(trail)} />
    </Container>
  );
}
