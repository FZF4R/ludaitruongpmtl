"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CheckCheck, Megaphone, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { useCheDoSua } from "@/components/layout/inline-edit";
import { localePath, splitLocale } from "@/lib/i18n";
import { danhDauDaDoc, layThongBao, type ThongBao } from "@/lib/notifications";
import { cn } from "@/lib/utils";

/**
 * Chuông thông báo trên đầu trang: bình luận mới ở bài của mình, có người
 * trả lời bình luận của mình.
 *
 * Chỉ hiện khi đã đăng nhập. Hỏi số chưa đọc mỗi phút (chỉ khi tab đang mở),
 * danh sách đầy đủ chỉ tải khi bấm mở. Bấm một thông báo là đánh dấu đã đọc
 * và nhảy tới đúng bình luận (#binh-luan-<id>).
 */

export type NhanThongBao = {
  title: string;
  empty: string;
  markAll: string;
  comment: string;
  reply: string;
  someone: string;
  warning: string;
  warningNoReason: string;
  published: string;
  rejected: string;
  editProposal: string;
  editAccepted: string;
  editRejected: string;
  broadcast: string;
};

const CHU_KY_MS = 60_000;

export function NotificationBell({ nhan }: { nhan: NhanThongBao }) {
  const pathname = usePathname();
  const { locale } = splitLocale(pathname);
  const { nguoiDungId } = useCheDoSua();
  const [chuaDoc, setChuaDoc] = React.useState(0);
  const [mo, setMo] = React.useState(false);
  const [ds, setDs] = React.useState<ThongBao[] | null>(null);
  const khung = React.useRef<HTMLDivElement>(null);

  // Đếm chưa đọc định kỳ.
  React.useEffect(() => {
    if (!nguoiDungId) return;
    let conSong = true;
    const dem = () => {
      if (document.visibilityState !== "visible") return;
      layThongBao(locale, true)
        .then((kq) => conSong && setChuaDoc(kq.unread))
        .catch(() => {});
    };
    dem();
    const hen = window.setInterval(dem, CHU_KY_MS);
    return () => {
      conSong = false;
      window.clearInterval(hen);
    };
  }, [nguoiDungId, locale]);

  // Bấm ra ngoài hoặc Esc thì đóng.
  React.useEffect(() => {
    if (!mo) return;
    const ngoai = (e: MouseEvent) => {
      if (khung.current && !khung.current.contains(e.target as Node)) setMo(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setMo(false);
    document.addEventListener("mousedown", ngoai);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", ngoai);
      document.removeEventListener("keydown", esc);
    };
  }, [mo]);

  if (!nguoiDungId) return null;

  function moDong() {
    const moi = !mo;
    setMo(moi);
    if (moi) {
      layThongBao(locale)
        .then((kq) => {
          setDs(kq.data);
          setChuaDoc(kq.unread);
        })
        .catch(() => setDs([]));
    }
  }

  function docHet() {
    danhDauDaDoc(locale)
      .then((kq) => {
        setChuaDoc(kq.unread);
        setDs((cu) => cu?.map((t) => ({ ...t, read: true })) ?? cu);
      })
      .catch(() => {});
  }

  function bamVao(t: ThongBao) {
    setMo(false);
    if (!t.read) {
      setChuaDoc((n) => Math.max(0, n - 1));
      setDs((cu) => cu?.map((x) => (x.id === t.id ? { ...x, read: true } : x)) ?? cu);
      danhDauDaDoc(locale, [t.id]).catch(() => {});
    }
  }

  const cau = (t: ThongBao) => {
    if (t.type === "warning") {
      return t.excerpt
        ? nhan.warning.replace("{n}", t.contentTitle).replace("{reason}", t.excerpt)
        : nhan.warningNoReason.replace("{n}", t.contentTitle);
    }
    const mau: Record<string, string> = {
      reply: nhan.reply,
      comment: nhan.comment,
      published: nhan.published,
      rejected: nhan.rejected,
      "edit-proposal": nhan.editProposal,
      "edit-accepted": nhan.editAccepted,
      "edit-rejected": nhan.editRejected,
      broadcast: nhan.broadcast,
    };
    return (mau[t.type] ?? nhan.comment)
      .replace("{name}", t.actor.name || nhan.someone)
      .replace("{title}", t.contentTitle);
  };

  // Cảnh cáo không gắn với bài nào: dẫn về trang tài khoản. Thông báo về bài
  // (duyệt, trả lại, đề xuất sửa) mang sẵn đường dẫn từ backend.
  const duongDan = (t: ThongBao) =>
    t.link
      ? /^https?:\/\//i.test(t.link)
        ? t.link
        : localePath(locale, t.link)
      : t.type === "broadcast"
        ? pathname
        : t.type === "warning"
          ? localePath(locale, "/tai-khoan")
          : t.type === "comment" || t.type === "reply"
            ? `${localePath(locale, `/bai-viet/${t.contentSlug}`)}#binh-luan-${t.commentId}`
            : localePath(locale, "/tai-khoan/bai-viet");

  return (
    <div ref={khung} className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={moDong}
        aria-label={chuaDoc ? `${nhan.title} (${chuaDoc})` : nhan.title}
        aria-expanded={mo}
        className="relative"
      >
        <Bell />
        {chuaDoc > 0 ? (
          <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-lacquer px-1 text-[10px] font-bold leading-4 text-white">
            {chuaDoc > 9 ? "9+" : chuaDoc}
          </span>
        ) : null}
      </Button>

      {mo ? (
        <div className="absolute right-0 top-full z-50 mt-2 flex w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card-lift">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="font-serif font-bold">{nhan.title}</span>
            {chuaDoc > 0 ? (
              <button
                type="button"
                onClick={docHet}
                className="flex items-center gap-1 text-xs font-medium text-accent hover:underline"
              >
                <CheckCheck className="size-3.5" aria-hidden /> {nhan.markAll}
              </button>
            ) : null}
          </div>

          <div className="max-h-[24rem] overflow-y-auto">
            {ds === null ? (
              <p className="p-4 text-sm text-muted">…</p>
            ) : ds.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted">{nhan.empty}</p>
            ) : (
              <ul className="flex flex-col divide-y divide-line">
                {ds.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={duongDan(t)}
                      onClick={() => bamVao(t)}
                      className={cn(
                        "flex gap-3 px-4 py-3 text-sm transition-colors hover:bg-surface-2",
                        !t.read && "bg-accent-soft/40",
                      )}
                    >
                      {t.type === "broadcast" ? (
                        <span className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-brass/15 text-brass">
                          <Megaphone className="size-4" aria-hidden />
                        </span>
                      ) : t.type === "warning" ? (
                        <span className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-lacquer/15 text-lacquer">
                          <ShieldAlert className="size-4" aria-hidden />
                        </span>
                      ) : (
                        <Avatar src={t.actor.avatarUrl} name={t.actor.name} size={34} />
                      )}
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className={cn("leading-snug", t.read ? "text-body" : "font-medium text-ink")}>
                          {cau(t)}
                        </span>
                        {t.excerpt && t.type === "broadcast" ? (
                          <span className="line-clamp-4 whitespace-pre-line text-xs text-body">{t.excerpt}</span>
                        ) : t.excerpt && t.type !== "warning" ? (
                          <span className="truncate text-xs text-muted">“{t.excerpt}”</span>
                        ) : null}
                        <time dateTime={t.createdAt} className="text-[11px] text-muted">
                          {new Date(t.createdAt).toLocaleString(locale === "vi" ? "vi-VN" : locale, {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </time>
                      </span>
                      {!t.read ? <span className="mt-1.5 size-2 shrink-0 rounded-full bg-accent" aria-hidden /> : null}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
