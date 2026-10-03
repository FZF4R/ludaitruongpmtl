import { CalendarDays } from "lucide-react";
import { Container, SectionHeading } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { LocaleLink } from "@/components/ui/locale-link";
import { PracticeHeader, practiceMetadata } from "@/components/practice/practice-page";
import { PrayerWall } from "@/components/home/prayer-wall";
import { PrayerSounds } from "@/components/practice/prayer-sounds";
import { HuongDan } from "@/components/practice/common";
import { getDictionary } from "@/lib/dictionary";

export const revalidate = 3600;

const HREF = "/tu-tap/cau-an-cau-sieu";

export function generateMetadata() {
  return practiceMetadata("prayers", HREF);
}

/** Cầu an / Cầu siêu: nơi viết lời nguyện (trước nằm ở trang chủ), kèm âm nền và hướng dẫn. */
export default async function Page() {
  const dict = await getDictionary();
  return (
    <Container className="flex flex-col gap-8 py-12">
      <PracticeHeader navKey="prayers" href={HREF} />

      <section className="flex flex-col gap-5">
        <SectionHeading title={dict.prayers.title} description={dict.prayers.description} />
        <PrayerSounds nhan={dict.practiceTools} />
        <PrayerWall nhan={dict.prayers} />
      </section>

      <HuongDan tieuDe={dict.practiceTools.guideTitle} muc={dict.practiceTools.guides.prayers} />

      <div>
        <Button variant="outline" asChild>
          <LocaleLink href="/phat-lich">
            <CalendarDays className="size-4" aria-hidden /> {dict.practiceTools.prayersPage.calendarLink}
          </LocaleLink>
        </Button>
      </div>
    </Container>
  );
}
