import type { Metadata } from "next";
import { ComingSoonPage, comingSoonMetadata } from "@/components/content/coming-soon";

const HREF = "/qua-trinh-tu-tap";

export function generateMetadata(): Promise<Metadata> {
  return comingSoonMetadata("journey", HREF);
}

export default function Page() {
  return <ComingSoonPage navKey="journey" href={HREF} />;
}
