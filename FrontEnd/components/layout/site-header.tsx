"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { mainNav, site } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/primitives";
import { ThemeToggle } from "@/components/layout/theme";

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

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  // Đóng menu khi điều hướng sang trang khác.
  React.useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-sm">
      <Container className="flex h-16 items-center gap-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-ink"
          aria-label={`${site.name} — trang chủ`}
        >
          <Lotus className="size-7 text-accent" />
          <span className="font-serif text-lg font-bold tracking-tight">
            {site.name}
          </span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label="Chính">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-accent-soft text-accent"
                  : "text-body hover:bg-surface-2 hover:text-ink",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/tim-kiem" aria-label="Tìm kiếm">
              <Search />
            </Link>
          </Button>
          <ThemeToggle />
          <Button variant="outline" size="sm" className="hidden sm:inline-flex" asChild>
            <Link href="/tai-khoan">Tài khoản</Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? "Đóng menu" : "Mở menu"}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </Container>

      {open ? (
        <div id="menu-mobile" className="border-t border-line bg-surface md:hidden">
          <Container className="flex flex-col py-2">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col gap-0.5 rounded-md px-3 py-3 hover:bg-surface-2"
              >
                <span className="font-medium text-ink">{item.label}</span>
                {item.hint ? (
                  <span className="text-xs text-muted">{item.hint}</span>
                ) : null}
              </Link>
            ))}
            <Link
              href="/tai-khoan"
              className="rounded-md px-3 py-3 font-medium text-ink hover:bg-surface-2 sm:hidden"
            >
              Tài khoản
            </Link>
          </Container>
        </div>
      ) : null}
    </header>
  );
}
