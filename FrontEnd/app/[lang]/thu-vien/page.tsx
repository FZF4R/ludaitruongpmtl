import type { Metadata } from "next";
import { ComingSoonPage, comingSoonMetadata } from "@/components/content/coming-soon";

const HREF = "/thu-vien";

export function generateMetadata(): Promise<Metadata> {
  return comingSoonMetadata("library", HREF);
}

export default function Page() {
  return <ComingSoonPage navKey="library" href={HREF} />;
}
