import { Container } from "@/components/ui/primitives";
import { HuongDanSuaDuoc, PracticeHeader, practiceMetadata } from "@/components/practice/practice-page";
import { Chanting } from "@/components/practice/chanting";
import { listContent } from "@/lib/api";
import { getDictionary } from "@/lib/dictionary";
import { docKinh } from "./actions";

export const revalidate = 3600;

const HREF = "/tu-tap/tung-kinh-niem-phat";

export function generateMetadata() {
  return practiceMetadata("chantingRecitation", HREF);
}

export default async function Page() {
  const dict = await getDictionary();
  const kinh = await listContent({ type: "sutra", limit: 50, sort: "popular" })
    .then((kq) => kq.data.map((k) => ({ slug: k.slug, title: k.title })))
    .catch(() => []);

  return (
    <Container className="flex flex-col gap-8 py-12">
      <PracticeHeader navKey="chantingRecitation" href={HREF} />
      <Chanting nhan={dict.practiceTools} kinh={kinh} docKinh={docKinh} />
      <HuongDanSuaDuoc nhom="chanting" />
    </Container>
  );
}
