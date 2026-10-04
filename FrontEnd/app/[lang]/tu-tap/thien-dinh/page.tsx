import { Container } from "@/components/ui/primitives";
import { HuongDanSuaDuoc, PracticeHeader, practiceMetadata } from "@/components/practice/practice-page";
import { MeditationTimer } from "@/components/practice/meditation-timer";
import { getDictionary } from "@/lib/dictionary";

export const revalidate = 3600;

const HREF = "/tu-tap/thien-dinh";

export function generateMetadata() {
  return practiceMetadata("meditation", HREF);
}

export default async function Page() {
  const dict = await getDictionary();
  return (
    <Container className="flex flex-col gap-8 py-12">
      <PracticeHeader navKey="meditation" href={HREF} />
      <MeditationTimer nhan={dict.practiceTools} />
      <HuongDanSuaDuoc nhom="meditation" />
    </Container>
  );
}
