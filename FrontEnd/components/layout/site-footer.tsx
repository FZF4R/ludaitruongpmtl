import { footerNav, site } from "@/lib/site";
import { Container } from "@/components/ui/primitives";
import { LocaleLink } from "@/components/ui/locale-link";
import { buddhistYear, canChiYear, solarToLunar } from "@/lib/lunar";
import { getDictionary } from "@/lib/dictionary";
import { EditableText } from "@/components/layout/inline-edit";

/**
 * Footer là Server Component: nó tính năm Phật lịch một lần lúc render rồi
 * nằm trong HTML tĩnh, không tốn JavaScript nào ở client. Vì là server nên
 * nó đọc thẳng ngôn ngữ qua getI18n, không cần truyền props từ layout.
 */
export async function SiteFooter() {
  const dict = await getDictionary();
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
            <p className="max-w-xs text-sm text-muted">
              <EditableText k="site.description" value={dict.site.description} />
            </p>
          </div>

          {footerNav.map((group) => {
            const tieuDe = dict.footer[group.titleKey];

            return (
              <nav key={group.titleKey} className="flex flex-col gap-3" aria-label={tieuDe}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                  {tieuDe}
                </p>
                <ul className="flex flex-col gap-2">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <LocaleLink
                        href={item.href}
                        className="text-sm text-body transition-colors hover:text-accent"
                      >
                        {item.key ? dict.nav[item.key] : item.label}
                      </LocaleLink>
                    </li>
                  ))}
                </ul>
              </nav>
            );
          })}
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-line pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p lang="vi">
            {/* Can chi va Phat lich la khai niem lich Viet, giu nguyen o moi ngon ngu */}
            Phật lịch {buddhistYear(now)} · năm {canChiYear(lunar.year)}
          </p>
          <p>
            <EditableText k="footer.rights" value={dict.footer.rights} />
          </p>
        </div>
      </Container>
    </footer>
  );
}
