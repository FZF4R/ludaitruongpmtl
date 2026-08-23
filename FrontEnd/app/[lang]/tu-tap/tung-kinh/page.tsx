import type { Metadata } from "next";
import { ComingSoonPage, comingSoonMetadata } from "@/components/content/coming-soon";

const HREF = "/tu-tap/tung-kinh";

export function generateMetadata(): Promise<Metadata> {
  return comingSoonMetadata("chanting", HREF);
}

export default function Page() {
  return <ComingSoonPage navKey="chanting" href={HREF} />;
}
