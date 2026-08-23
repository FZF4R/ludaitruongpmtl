import type { Metadata } from "next";
import { ComingSoonPage, comingSoonMetadata } from "@/components/content/coming-soon";

const HREF = "/tu-tap/thien-dinh";

export function generateMetadata(): Promise<Metadata> {
  return comingSoonMetadata("meditation", HREF);
}

export default function Page() {
  return <ComingSoonPage navKey="meditation" href={HREF} />;
}
