import type { Metadata } from "next";
import { ComingSoonPage, comingSoonMetadata } from "@/components/content/coming-soon";

const HREF = "/tu-tap/go-mo";

export function generateMetadata(): Promise<Metadata> {
  return comingSoonMetadata("woodenFish", HREF);
}

export default function Page() {
  return <ComingSoonPage navKey="woodenFish" href={HREF} />;
}
