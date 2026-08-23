import type { Metadata } from "next";
import { ComingSoonPage, comingSoonMetadata } from "@/components/content/coming-soon";

const HREF = "/tu-tap/niem-phat";

export function generateMetadata(): Promise<Metadata> {
  return comingSoonMetadata("recitation", HREF);
}

export default function Page() {
  return <ComingSoonPage navKey="recitation" href={HREF} />;
}
