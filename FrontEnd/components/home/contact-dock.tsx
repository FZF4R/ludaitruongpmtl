"use client";

import * as React from "react";
import { Mail, MessageCircle, UserRound, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Khung liên hệ nổi ở góc dưới bên phải trang chủ. Admin nhập ở
 * /admin/dashboard (Thông tin chung); mục nào để trống thì không hiện.
 *   - Kênh Zalo, Facebook, Zalo admin: trong khung xổ ra từ nút tròn chính.
 *   - Email và TikTok: LUÔN HIỆN thành nút riêng cạnh nút chính (hàng dưới cùng).
 *
 * Màn hình rộng mở sẵn; điện thoại thu gọn thành một nút để khỏi che nội
 * dung, bấm mới bung ra. Mọi liên kết mở tab mới.
 */

export type NhanLienHe = {
  title: string;
  open: string;
  close: string;
  zaloChannel: string;
  facebook: string;
  tiktok: string;
  zaloAdmin: string;
  email: string;
};

/** Giá trị admin nhập (link đầy đủ hoặc dạng rút gọn) -> URL mở được. */
const chuanLink = {
  zalo: (v: string) => {
    if (/^https?:\/\//i.test(v)) return v;
    const so = v.replace(/[^\d+]/g, "");
    return `https://zalo.me/${so && so.length >= 8 ? so : v.replace(/^zalo\.me\//i, "")}`;
  },
  facebook: (v: string) =>
    /^https?:\/\//i.test(v) ? v : /facebook\.com|fb\.com/i.test(v) ? `https://${v}` : `https://facebook.com/${v}`,
  tiktok: (v: string) =>
    /^https?:\/\//i.test(v)
      ? v
      : /tiktok\.com/i.test(v)
        ? `https://${v}`
        : `https://www.tiktok.com/@${v.replace(/^@/, "")}`,
};

function ChuZalo() {
  return <span className="text-[11px] font-black tracking-tight">Zalo</span>;
}

function IconFacebook() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
      <path d="M14 8h3V4h-3c-2.76 0-5 2.24-5 5v2H7v4h2v9h4v-9h3l1-4h-4V9c0-.55.45-1 1-1z" />
    </svg>
  );
}

function IconTiktok() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" fill="currentColor" aria-hidden>
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

export function ContactDock({
  zaloKenh,
  facebook,
  tiktok,
  zaloAdmin,
  email,
  nhan,
}: {
  zaloKenh?: string;
  facebook?: string;
  tiktok?: string;
  zaloAdmin?: string;
  email?: string;
  nhan: NhanLienHe;
}) {
  const thuDien = email?.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? email.trim() : "";
  const linkTiktok = tiktok?.trim() ? chuanLink.tiktok(tiktok.trim()) : "";
  const muc = [
    zaloKenh?.trim() && {
      key: "zalo",
      nhan: nhan.zaloChannel,
      href: chuanLink.zalo(zaloKenh.trim()),
      mau: "bg-[#0068FF] text-white",
      icon: <ChuZalo />,
    },
    facebook?.trim() && {
      key: "facebook",
      nhan: nhan.facebook,
      href: chuanLink.facebook(facebook.trim()),
      mau: "bg-[#1877F2] text-white",
      icon: <IconFacebook />,
    },
    zaloAdmin?.trim() && {
      key: "zalo-admin",
      nhan: nhan.zaloAdmin,
      href: chuanLink.zalo(zaloAdmin.trim()),
      mau: "bg-[#0068FF] text-white",
      icon: (
        <span className="relative">
          <ChuZalo />
          <UserRound className="absolute -bottom-2.5 -right-3 size-3.5 rounded-full bg-white p-0.5 text-[#0068FF]" aria-hidden />
        </span>
      ),
    },
  ].filter(Boolean) as { key: string; nhan: string; href: string; mau: string; icon: React.ReactNode }[];

  // Mở sẵn trên màn hình rộng, thu gọn trên điện thoại (quyết định sau khi gắn
  // vào trang để HTML server và client khớp nhau).
  const [mo, setMo] = React.useState(false);
  React.useEffect(() => {
    setMo(window.matchMedia("(min-width: 640px)").matches);
  }, []);

  if (!muc.length && !thuDien && !linkTiktok) return null;

  return (
    <aside
      aria-label={nhan.title}
      className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2.5 sm:bottom-6 sm:right-6"
    >
      {mo && muc.length ? (
        <ul className="flex flex-col items-end gap-2.5">
          {muc.map((m) => (
            <li key={m.key}>
              <a
                href={m.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2"
                aria-label={m.nhan}
              >
                {/* Nhãn chữ: luôn hiện trên màn hình rộng, để người xem biết ngay đó là kênh gì. */}
                <span className="hidden rounded-full bg-surface px-3 py-1 text-xs font-medium text-ink shadow-card transition-colors group-hover:text-accent sm:inline">
                  {m.nhan}
                </span>
                <span
                  className={cn(
                    "flex size-11 items-center justify-center rounded-full shadow-card-lift transition-transform group-hover:scale-110",
                    m.mau,
                  )}
                >
                  {m.icon}
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : null}

      {/* Hàng dưới cùng: email, TikTok (luôn hiện) + nút mở khung liên hệ. */}
      <div className="flex items-center gap-2.5">
        {thuDien ? (
          <a
            href={`mailto:${thuDien}`}
            aria-label={`${nhan.email}: ${thuDien}`}
            title={thuDien}
            className="group flex h-11 items-center gap-2 rounded-full bg-surface pl-1 pr-1 shadow-card-lift ring-1 ring-line transition-colors hover:ring-accent sm:pr-4"
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-lacquer text-white transition-transform group-hover:scale-110">
              <Mail className="size-[18px]" aria-hidden />
            </span>
            {/* Địa chỉ email: hiện trên màn hình rộng, điện thoại chỉ còn biểu tượng. */}
            <span className="hidden max-w-[14rem] truncate text-xs font-medium text-ink group-hover:text-accent sm:inline">
              {thuDien}
            </span>
          </a>
        ) : null}
        {linkTiktok ? (
          <a
            href={linkTiktok}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={nhan.tiktok}
            title={nhan.tiktok}
            className="flex size-11 items-center justify-center rounded-full bg-black text-white shadow-card-lift ring-1 ring-white/20 transition-transform hover:scale-110"
          >
            <IconTiktok />
          </a>
        ) : null}
        {muc.length ? (
          <button
            type="button"
            onClick={() => setMo((x) => !x)}
            aria-expanded={mo}
            aria-label={mo ? nhan.close : nhan.open}
            className="flex size-12 items-center justify-center rounded-full bg-accent text-paper shadow-card-lift transition-transform hover:scale-105"
          >
            {mo ? <X className="size-5" aria-hidden /> : <MessageCircle className="size-5" aria-hidden />}
          </button>
        ) : null}
      </div>
    </aside>
  );
}
