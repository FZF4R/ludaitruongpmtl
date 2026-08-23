import type { Metadata } from "next";
import { ComingSoonPage, comingSoonMetadata } from "@/components/content/coming-soon";

const HREF = "/ve-chung-toi";

export function generateMetadata(): Promise<Metadata> {
  return comingSoonMetadata("about", HREF);
}

export default function Page() {
  return <ComingSoonPage navKey="about" href={HREF} />;
}
