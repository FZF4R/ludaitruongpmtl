"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, Search, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { mainNav, site, type NavItem } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/primitives";
import { ThemeToggle } from "@/components/layout/theme";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { localePath, splitLocale } from "@/lib/i18n";
import { NotificationBell, type NhanThongBao } from "@/components/layout/notification-bell";
import { useCheDoSua } from "@/components/layout/inline-edit";
import { Avatar } from "@/components/ui/avatar";
import Image from "next/image";
import { anhMucTuTap, type AnhTuTap } from "@/lib/practice-images";

/**
 * Header là Client Component (menu mobile và menu thả xuống đều có state) nên
 * không đọc được next/root-params. Chuỗi đã dịch truyền xuống từ layout, còn
 * ngôn ngữ hiện tại suy ra từ đường dẫn — usePathname trả về URL người dùng
 * thấy trên thanh địa chỉ, tức là đã có sẵn tiền tố (hoặc không, với tiếng Việt).
 */
type NavDict = Record<string, string>;

function Lotus({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <path
        d="M12 20c-4.4 0-8-2.7-8-6 0-1 .3-1.9.9-2.7 1.1.9 2.4 1.6 3.8 2C7.6 11.6 7 9.6 7 7.5 7 5.4 9.2 3.4 12 2c2.8 1.4 5 3.4 5 5.5 0 2.1-.6 4.1-1.7 5.8 1.4-.4 2.7-1.1 3.8-2 .6.8.9 1.7.9 2.7 0 3.3-3.6 6-8 6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Một mục menu có nhóm con.
 *
 * Mở bằng cả di chuột LẪN bàn phím: chỉ dùng :hover thì người đi bằng Tab
 * không bao giờ tới được sáu mục con. Nút cha vẫn bấm được để vào trang tổng
 * quan, nên người dùng chạm (không có hover) cũng không bị kẹt.
 */
function NavWithSubmenu({
  item,
  dict,
  lp,
  isActive,
  anhTuTap,
}: {
  item: NavItem & { children: NonNullable<NavItem["children"]> };
  dict: NavDict;
  lp: (href: string) => string;
  isActive: (href: string) => boolean;
  anhTuTap?: AnhTuTap;
}) {
  const [mo, setMo] = React.useState(false);
  const boc = React.useRef<HTMLDivElement>(null);
  const dongTre = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Trễ một nhịp khi rời chuột: đi chéo từ nút cha xuống menu con sẽ lướt ra
  // ngoài vùng phủ trong khoảnh khắc, đóng ngay lập tức thì menu chớp tắt.
  const moNgay = () => {
    if (dongTre.current) clearTimeout(dongTre.current);
    setMo(true);
  };
  const dongSau = () => {
    if (dongTre.current) clearTimeout(dongTre.current);
    dongTre.current = setTimeout(() => setMo(false), 120);
  };

  React.useEffect(() => () => {
    if (dongTre.current) clearTimeout(dongTre.current);
  }, []);

  return (
    <div
      ref={boc}
      className="relative"
      onMouseEnter={moNgay}
      onMouseLeave={dongSau}
      onFocus={moNgay}
      onBlur={(e) => {
        if (!boc.current?.contains(e.relatedTarget as Node)) setMo(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") setMo(false);
      }}
    >
      <Link
        href={lp(item.href)}
        aria-current={isActive(item.href) ? "page" : undefined}
        aria-expanded={mo}
        className={cn(
          "flex items-center gap-1 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
          isActive(item.href)
            ? "bg-accent-soft text-accent"
            : "text-body hover:bg-surface-2 hover:text-ink",
        )}
      >
        {dict[item.key]}
        <ChevronDown
          className={cn("size-3.5 transition-transform", mo && "rotate-180")}
          aria-hidden
        />
      </Link>

      {mo ? (
        <div className="absolute left-0 top-full z-50 pt-1">
          {/* Mỗi mục một ảnh riêng (admin đổi ở Tổng quan) + dòng mô tả ngắn. */}
          <ul className="grid w-[30rem] grid-cols-2 gap-1 overflow-hidden rounded-md border border-line bg-surface p-2 shadow-lg">
            {item.children.map((con) => {
              const anh = anhMucTuTap(con.key, anhTuTap);
              return (
                <li key={con.href}>
                  <Link
                    href={lp(con.href)}
                    onClick={() => setMo(false)}
                    aria-current={isActive(con.href) ? "page" : undefined}
                    className={cn(
                      "group flex flex-col gap-2 rounded-md p-2 transition-colors",
                      isActive(con.href) ? "bg-accent-soft" : "hover:bg-surface-2",
                    )}
                  >
                    <span className="relative block aspect-[16/9] overflow-hidden rounded bg-surface-2">
                      <Image
                        src={anh}
                        alt=""
                        fill
                        sizes="14rem"
                        unoptimized={typeof anh === "string"}
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </span>
                    <span className={cn("text-sm font-semibold", isActive(con.href) ? "text-accent" : "text-ink")}>
                      {dict[con.key]}
                    </span>
                    {dict[`${con.key}Hint`] ? (
                      <span className="line-clamp-2 text-xs leading-snug text-muted">{dict[`${con.key}Hint`]}</span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function SiteHeader({
  dict,
  anhTuTap,
  language,
  thongBao,
}: {
  dict: NavDict;
  language: { label: string; choose: string };
  thongBao: NhanThongBao;
  /** Ảnh từng mục Tu tập (cấu hình site). */
  anhTuTap?: AnhTuTap;
}) {
  const { nguoiDung } = useCheDoSua();
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  // Đóng menu khi điều hướng sang trang khác.
  React.useEffect(() => setOpen(false), [pathname]);

  const { locale, path } = splitLocale(pathname);
  const lp = (href: string) => localePath(locale, href);

  // So khớp trên đường dẫn ĐÃ bỏ tiền tố, nếu không thì ở /en/... không mục
  // nào được đánh dấu đang xem.
  const isActive = (href: string) => path === href || path.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-sm">
      <Container className="flex h-16 items-center gap-3">
        <Link
          href={lp("/")}
          className="flex shrink-0 items-center gap-2.5 text-ink"
          aria-label={`${site.name} — ${dict.homeAria}`}
        >
          <Lotus className="size-7 text-accent" />
          <span className="font-serif text-lg font-bold tracking-tight">
            {site.name}
          </span>
        </Link>

        {/*
          Bảy mục là nhiều cho một hàng ngang, nên thanh ngang chỉ hiện từ
          breakpoint lg trở lên; dưới đó dùng menu mở rộng để không bị chen chúc.
        */}
        <nav className="ml-2 hidden items-center gap-0.5 lg:flex" aria-label={dict.mainLabel}>
          {mainNav.map((item) =>
            item.children ? (
              <NavWithSubmenu
                anhTuTap={anhTuTap}
                key={item.href}
                item={item as NavItem & { children: NonNullable<NavItem["children"]> }}
                dict={dict}
                lp={lp}
                isActive={isActive}
              />
            ) : (
              <Link
                key={item.href}
                href={lp(item.href)}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-accent-soft text-accent"
                    : "text-body hover:bg-surface-2 hover:text-ink",
                )}
              >
                {dict[item.key]}
              </Link>
            ),
          )}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="icon" asChild>
            <Link href={lp("/tim-kiem")} aria-label={dict.search}>
              <Search />
            </Link>
          </Button>
          <NotificationBell nhan={thongBao} />
          <ThemeToggle />
          <LanguageSwitcher label={language.label} chooseLabel={language.choose} />
          <NutTaiKhoan href={lp("/tai-khoan")} nhan={dict.account} />
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? dict.closeMenu : dict.openMenu}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </Container>

      {open ? (
        <div
          id="menu-mobile"
          className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-line bg-surface lg:hidden"
        >
          <Container className="flex flex-col py-2">
            {mainNav.map((item) => (
              <div key={item.href} className="flex flex-col">
                <Link
                  href={lp(item.href)}
                  className="flex flex-col gap-0.5 rounded-md px-3 py-3 hover:bg-surface-2"
                >
                  <span className="font-medium text-ink">{dict[item.key]}</span>
                  <span className="text-xs text-muted">{dict[`${item.key}Hint`]}</span>
                </Link>

                {/*
                  Trên màn hình cảm ứng không có hover, nên mục con hiện luôn
                  chứ không giấu sau một cú chạm nữa.
                */}
                {item.children ? (
                  <ul className="mb-1 ml-3 flex flex-col border-l border-line pl-3">
                    {item.children.map((con) => (
                      <li key={con.href}>
                        <Link
                          href={lp(con.href)}
                          className="block rounded-md px-3 py-2 text-sm text-body hover:bg-surface-2 hover:text-ink"
                        >
                          {dict[con.key]}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}

            <Link
              href={lp("/tai-khoan")}
              className="flex items-center gap-2.5 rounded-md px-3 py-3 font-medium text-ink hover:bg-surface-2 sm:hidden"
            >
              {nguoiDung ? <Avatar src={nguoiDung.avatarUrl} name={nguoiDung.name} size={28} /> : null}
              {nguoiDung?.name || dict.account}
            </Link>
          </Container>
        </div>
      ) : null}
    </header>
  );
}

/**
 * Đã đăng nhập: ảnh đại diện + tên tài khoản thay cho chữ "Tài khoản". Lúc
 * chưa biết (đang đọc token) và chưa đăng nhập thì giữ nút chữ như cũ.
 */
function NutTaiKhoan({ href, nhan }: { href: string; nhan: string }) {
  const { nguoiDung, congDucMoi, xoaCongDucMoi } = useCheDoSua();
  // Hiệu ứng "+N công đức" bay lên khi vừa tự điểm danh ngày mới; tự tắt sau 4 giây.
  React.useEffect(() => {
    if (!congDucMoi) return;
    const t = window.setTimeout(xoaCongDucMoi, 8000);
    return () => window.clearTimeout(t);
  }, [congDucMoi, xoaCongDucMoi]);
  if (!nguoiDung) {
    return (
      <Button variant="outline" size="sm" className="hidden sm:inline-flex" asChild>
        <Link href={href}>{nhan}</Link>
      </Button>
    );
  }
  return (
    <Link
      href={href}
      title={nguoiDung.name || nhan}
      className={cn(
        "relative hidden items-center gap-2 rounded-full border py-0.5 pl-0.5 pr-3 text-sm font-medium text-ink transition-colors hover:border-line-strong hover:bg-surface-2 sm:inline-flex",
        congDucMoi ? "border-brass shadow-[0_0_0_3px_rgba(197,139,74,0.25)]" : "border-line",
      )}
    >
      <Avatar src={nguoiDung.avatarUrl} name={nguoiDung.name} size={28} />
      <span className="max-w-[9rem] truncate">{nguoiDung.name || nhan}</span>
      {congDucMoi ? (
        <span
          role="status"
          className="pointer-events-none absolute -top-1 right-1 flex items-center gap-0.5 rounded-full bg-brass px-2 py-0.5 text-xs font-bold text-white shadow-md"
          style={{ animation: "cd-bay 4s ease-out forwards" }}
        >
          <Sparkles className="size-3" aria-hidden /> +{congDucMoi}
        </span>
      ) : null}
    </Link>
  );
}
