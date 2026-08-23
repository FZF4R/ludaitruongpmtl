import type { Metadata } from "next";
import { ComingSoonPage, comingSoonMetadata } from "@/components/content/coming-soon";

const HREF = "/tu-tap/lan-chuoi-hat";

export function generateMetadata(): Promise<Metadata> {
  return comingSoonMetadata("mala", HREF);
}

export default function Page() {
  return <ComingSoonPage navKey="mala" href={HREF} />;
}
