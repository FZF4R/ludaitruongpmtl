import type { Metadata } from "next";
import { ComingSoonPage, comingSoonMetadata } from "@/components/content/coming-soon";

const HREF = "/tu-tap/cau-an-cau-sieu";

export function generateMetadata(): Promise<Metadata> {
  return comingSoonMetadata("prayers", HREF);
}

export default function Page() {
  return <ComingSoonPage navKey="prayers" href={HREF} />;
}
