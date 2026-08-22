import Link from "next/link";
import { footerNav, site } from "@/lib/site";
import { Container } from "@/components/ui/primitives";
import { buddhistYear, canChiYear, solarToLunar } from "@/lib/lunar";

/**
 * Footer là Server Component: nó tính năm Phật lịch một lần lúc render
 * rồi nằm trong HTML tĩnh, không tốn JavaScript nào ở client.
 */
export function SiteFooter() {
  const now = new Date();
  const lunar = solarToLunar(
    now.getUTCDate(),
    now.getUTCMonth() + 1,
    now.getUTCFullYear(),
  );

  return (
    <footer className="mt-20 border-t border-line bg-surface">
      <Container className="py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-3">
            <p className="font-serif text-lg font-bold text-ink">{site.name}</p>
            <p className="max-w-xs text-sm text-muted">{site.description}</p>
          </div>

          {footerNav.map((group) => (
            <nav key={group.title} className="flex flex-col gap-3" aria-label={group.title}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                {group.title}
              </p>
              <ul className="flex flex-col gap-2">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-body transition-colors hover:text-accent"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-line pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            Phật lịch {buddhistYear(now)} · năm {canChiYear(lunar.year)}
          </p>
          <p>
            Nội dung được chia sẻ vì mục đích tu học, phi lợi nhuận. Xin ghi rõ
            nguồn khi sao chép.
          </p>
        </div>
      </Container>
    </footer>
  );
}
