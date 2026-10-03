"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, Flame, HandHeart, MessageSquare, PenLine, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { useCheDoSua } from "@/components/layout/inline-edit";
import { urlApi } from "@/lib/auth";
import { localePath, splitLocale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/dictionary";
import { diemDanh, layThongKeCaNhan, layUngHo, type ThongKeCaNhan, type ThongTinUngHo } from "@/lib/my-content";

type Nhan = Dictionary["stats"];
type NhanTuTap = Dictionary["practiceTools"]["journey"];

const THU_TU = ["checkin", "comment", "reply-received", "content-approved", "views-100", "practice", "prayer"];
const LOAI_TU_TAP = ["tung-kinh", "niem-phat", "thien", "go-mo", "chuoi-hat"] as const;

/** Trang /tai-khoan/thong-ke: công đức (điểm danh, cách tích), tu tập, bài viết, bình luận, ủng hộ. */
export function UserStats({ nhan, nhanTuTap, nhanBai }: { nhan: Nhan; nhanTuTap: NhanTuTap; nhanBai: Dictionary["myContent"] }) {
  const { locale } = splitLocale(usePathname());
  const { nguoiDungId, daBiet } = useCheDoSua();
  const [tk, setTk] = React.useState<ThongKeCaNhan | null>(null);
  const [ungHo, setUngHo] = React.useState<ThongTinUngHo | null>(null);
  const [dangDiemDanh, setDangDiemDanh] = React.useState(false);
  const [vuaCong, setVuaCong] = React.useState(0);

  const nap = React.useCallback(() => {
    layThongKeCaNhan(locale).then(setTk).catch(() => {});
  }, [locale]);

  React.useEffect(() => {
    layUngHo(locale).then(setUngHo).catch(() => setUngHo(null));
  }, [locale]);
  React.useEffect(() => {
    if (daBiet && nguoiDungId) nap();
  }, [daBiet, nguoiDungId, nap]);

  if (!daBiet) return null;
  const dl = locale === "vi" ? "vi-VN" : locale;

  async function bamDiemDanh() {
    setDangDiemDanh(true);
    try {
      const kq = await diemDanh(locale);
      setVuaCong(kq.points);
      nap();
    } finally {
      setDangDiemDanh(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {!nguoiDungId ? (
        <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
          <span className="text-sm text-muted">{nhan.signIn}</span>
          <Button size="sm" asChild>
            <Link href={localePath(locale, "/dang-nhap")}>{nhan.signIn}</Link>
          </Button>
        </Card>
      ) : !tk ? (
        <div className="h-64 animate-pulse rounded-lg bg-surface-2" />
      ) : (
        <>
          {/* Công đức + điểm danh */}
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <Card className="flex flex-col gap-4 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted">
                <Sparkles className="size-4 text-brass" aria-hidden /> {nhan.merit}
              </div>
              <div className="flex items-end gap-6">
                <div className="flex flex-col">
                  <span className="text-xs text-muted">{nhan.total}</span>
                  <span className="font-serif text-5xl font-bold tabular-nums text-accent">{tk.merit.total.toLocaleString()}</span>
                </div>
                <div className="flex flex-col pb-1">
                  <span className="text-xs text-muted">{nhan.today}</span>
                  <span className="text-2xl font-bold tabular-nums text-ink">+{tk.merit.today}</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
                {tk.checkin.today ? (
                  <span className="flex items-center gap-2 rounded-full bg-accent-soft px-4 py-2 text-sm font-medium text-accent">
                    <CalendarCheck className="size-4" aria-hidden /> {nhan.checkedIn}
                    {vuaCong > 0 ? <span className="font-bold">· {nhan.earned.replace("{n}", String(vuaCong))}</span> : null}
                  </span>
                ) : (
                  <Button onClick={bamDiemDanh} disabled={dangDiemDanh}>
                    <CalendarCheck aria-hidden /> {nhan.checkin}
                  </Button>
                )}
                <span className="flex items-center gap-1.5 text-sm text-muted">
                  <Flame className="size-4 text-lacquer" aria-hidden /> {nhan.streak.replace("{n}", String(tk.checkin.streak))}
                </span>
              </div>
            </Card>

            <Card className="flex flex-col gap-3 p-5">
              <h2 className="font-serif text-lg font-bold">{nhan.rulesTitle}</h2>
              <ul className="flex flex-col divide-y divide-line text-sm">
                {THU_TU.filter((a) => tk.merit.rules[a]?.enabled !== false && (tk.merit.rules[a]?.points ?? 0) > 0).map((a) => {
                  const r = tk.merit.rules[a];
                  const da = tk.merit.byAction[a]?.points ?? 0;
                  return (
                    <li key={a} className="flex flex-wrap items-baseline gap-x-3 py-2">
                      <span className="flex-1 text-body">{nhan.actions[a as keyof Nhan["actions"]] ?? r.label}</span>
                      <span className="text-xs text-muted">
                        {nhan.perTime.replace("{p}", String(r.points))}
                        {r.dailyCap > 0 ? ` · ${nhan.capDay.replace("{c}", String(r.dailyCap))}` : ""}
                      </span>
                      <span className="w-14 text-right font-semibold tabular-nums text-accent">{da}</span>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </div>

          {/* Tu tập */}
          <Card className="flex flex-col gap-3 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-serif text-lg font-bold">{nhan.practice}</h2>
              <Link href={localePath(locale, "/qua-trinh-tu-tap")} className="text-sm text-accent hover:underline">
                {nhanTuTap.title} →
              </Link>
            </div>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {LOAI_TU_TAP.map((l) => {
                const v = tk.practice[l] ?? { amount: 0, sessions: 0 };
                const soLuong = l === "thien" ? Math.round(v.amount / 60) : v.amount;
                return (
                  <div key={l} className="rounded-md bg-surface-2 p-3">
                    <dt className="text-xs text-muted">{nhanTuTap.types[l]}</dt>
                    <dd className="text-xl font-bold tabular-nums text-ink">
                      {soLuong.toLocaleString()} <span className="text-xs font-normal text-muted">{nhanTuTap.units[l]}</span>
                    </dd>
                    <dd className="text-[11px] text-muted">{nhan.practiceSessions.replace("{n}", String(v.sessions))}</dd>
                  </div>
                );
              })}
            </dl>
          </Card>

          {/* Bài viết, đóng góp, bình luận */}
          <Card className="flex flex-col gap-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-serif text-lg font-bold">{nhan.content}</h2>
              <Link href={localePath(locale, "/tai-khoan/bai-viet")} className="flex items-center gap-1 text-sm text-accent hover:underline">
                <PenLine className="size-3.5" aria-hidden /> {nhanBai.title} →
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {(["article", "library"] as const).map((loai) => (
                <div key={loai} className="rounded-md bg-surface-2 p-3">
                  <span className="text-xs text-muted">{loai === "article" ? nhan.articles : nhan.library}</span>
                  <p className="text-xl font-bold tabular-nums text-ink">{tk.content[loai].published}</p>
                  <p className="text-[11px] text-muted">
                    {nhan.pending}: {tk.content[loai].pending} · {nhan.draft}: {tk.content[loai].draft}
                  </p>
                </div>
              ))}
              <div className="rounded-md bg-surface-2 p-3">
                <span className="text-xs text-muted">{nhan.views}</span>
                <p className="text-xl font-bold tabular-nums text-ink">{tk.content.views.toLocaleString()}</p>
              </div>
              <div className="rounded-md bg-surface-2 p-3">
                <span className="flex items-center gap-1 text-xs text-muted">
                  <MessageSquare className="size-3" aria-hidden /> {nhan.comments} · {nhan.prayers}
                </span>
                <p className="text-xl font-bold tabular-nums text-ink">
                  {tk.comments.total} · {tk.prayers}
                </p>
                {tk.comments.deleted ? (
                  <p className="text-[11px] text-muted">{nhan.commentsDeleted.replace("{n}", String(tk.comments.deleted))}</p>
                ) : null}
              </div>
            </div>
            {tk.joinedAt ? (
              <p className="text-xs text-muted">
                {nhan.joined}: {new Date(tk.joinedAt).toLocaleDateString(dl)}
              </p>
            ) : null}
          </Card>

          {tk.merit.recent.length ? (
            <Card className="flex flex-col gap-2 p-5">
              <h2 className="font-serif text-lg font-bold">{nhan.recent}</h2>
              <ul className="divide-y divide-line text-sm">
                {tk.merit.recent.map((m, i) => (
                  <li key={i} className="flex items-baseline gap-3 py-2">
                    <span className="flex-1 text-body">{nhan.actions[m.action as keyof Nhan["actions"]] ?? m.action}</span>
                    <span className="font-semibold tabular-nums text-accent">+{m.points}</span>
                    <time className="w-32 text-right text-xs text-muted" dateTime={m.createdAt}>
                      {new Date(m.createdAt).toLocaleString(dl, { dateStyle: "short", timeStyle: "short" })}
                    </time>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </>
      )}

      {/* Ủng hộ: ai cũng thấy, kể cả chưa đăng nhập. */}
      <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
        <div className="flex flex-1 flex-col gap-2">
          <h2 className="flex items-center gap-2 font-serif text-lg font-bold">
            <HandHeart className="size-5 text-lacquer" aria-hidden /> {nhan.donate}
          </h2>
          {ungHo && (ungHo.title || ungHo.qrUrl || ungHo.accountNumber) ? (
            <>
              <p className="font-semibold text-ink">{ungHo.title || nhan.donateDefault}</p>
              {ungHo.description ? <p className="whitespace-pre-line text-sm text-body">{ungHo.description}</p> : null}
              <dl className="grid gap-1 text-sm">
                {ungHo.accountName ? (
                  <div className="flex gap-2">
                    <dt className="text-muted">{nhan.accountName}:</dt>
                    <dd className="font-medium text-ink">{ungHo.accountName}</dd>
                  </div>
                ) : null}
                {ungHo.accountNumber ? (
                  <div className="flex gap-2">
                    <dt className="text-muted">{nhan.accountNumber}:</dt>
                    <dd className="font-mono font-medium text-ink">{ungHo.accountNumber}</dd>
                  </div>
                ) : null}
                {ungHo.bank ? (
                  <div className="flex gap-2">
                    <dt className="text-muted">{nhan.bank}:</dt>
                    <dd className="font-medium text-ink">{ungHo.bank}</dd>
                  </div>
                ) : null}
              </dl>
              {ungHo.link ? (
                <a href={ungHo.link} target="_blank" rel="noopener noreferrer" className="w-fit text-sm text-accent hover:underline">
                  {nhan.donateLink} ↗
                </a>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-muted">{nhan.noDonate}</p>
          )}
        </div>
        {ungHo?.qrUrl ? (
          <figure className="flex flex-col items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={urlApi(ungHo.qrUrl)} alt={nhan.scan} className="size-48 rounded-md border border-line bg-white object-contain p-2" />
            <figcaption className="text-xs text-muted">{nhan.scan}</figcaption>
          </figure>
        ) : null}
      </Card>
    </div>
  );
}
