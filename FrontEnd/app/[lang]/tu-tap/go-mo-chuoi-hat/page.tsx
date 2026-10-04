import { Container } from "@/components/ui/primitives";
import { HuongDanSuaDuoc, PracticeHeader, practiceMetadata } from "@/components/practice/practice-page";
import { WoodenFishMala } from "@/components/practice/wooden-fish-mala";
import { getDictionary } from "@/lib/dictionary";

export const revalidate = 3600;

const HREF = "/tu-tap/go-mo-chuoi-hat";

export function generateMetadata() {
  return practiceMetadata("woodenFishMala", HREF);
}

export default async function Page() {
  const dict = await getDictionary();
  return (
    <Container className="flex flex-col gap-8 py-12">
      <PracticeHeader navKey="woodenFishMala" href={HREF} />
      <WoodenFishMala nhan={dict.practiceTools} />
      <HuongDanSuaDuoc nhom="woodenFish" />
    </Container>
  );
}
