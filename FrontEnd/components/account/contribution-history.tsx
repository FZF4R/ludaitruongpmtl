"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckCircle2, FileText, ImageIcon, PenLine } from "lucide-react";
import { Badge, Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { useCheDoSua } from "@/components/layout/inline-edit";
import { localePath, splitLocale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/dictionary";
import { contentTypeBase } from "@/lib/site";
import { layBaiCuaToi, type BaiCuaToi, type TrangThaiBai } from "@/lib/my-content";
import { cn } from "@/lib/utils";

const mauTT: Record<TrangThaiBai, "neutral" | "accent" | "brass"> = {
  draft: "neutral",
  pending: "brass",
  published: "accent",
  archived: "neutral",
};

/**
 * Khu vực cá nhân → "Lịch sử đóng góp": bài viết / nội dung thư viện mình đã
 * gửi (mọi trạng thái) và những bài đã được duyệt đăng (ngày duyệt, người duyệt).
 * Chỉ hiện khi đã đăng nhập và có quyền viết bài.
 */
export function ContributionHistory({
  nhan,
  nhanBai,
  nhanThuVien,
}: {
  nhan: Dictionary["account"];
  nhanBai: Dictionary["myContent"];
  nhanThuVien: Dictionary["library"];
}) {
  const { locale } = splitLocale(usePathname());
  const { nguoiDungId, daBiet } = useCheDoSua();
  const [tab, setTab] = React.useState<"all" | "published">("all");
  const [ds, setDs] = React.useState<BaiCuaToi[] | null>(null);
  const [tong, setTong] = React.useState<{ all: number; published: number }>({ all: 0, published: 0 });
  const [anDi, setAnDi] = React.useState(false);

  React.useEffect(() => {
    if (!daBiet || !nguoiDungId) return;
    let song = true;
    setDs(null);
    layBaiCuaToi({ status: tab === "published" ? "published" : undefined }, locale)
      .then((kq) => {
        if (!song) return;
        setDs(kq.data);
        const s = kq.stats;
        setTong({ all: s.draft + s.pending + s.published + s.archived, published: s.published });
      })
      // Không có quyền viết bài (403): ẩn cả khối.
      .catch(() => song && setAnDi(true));
    return () => {
      song = false;
    };
  }, [daBiet, nguoiDungId, tab, locale]);

  if (!daBiet || !nguoiDungId || anDi) return null;

  const dl = locale === "vi" ? "vi-VN" : locale;
  const ngay = (iso: string) => (iso ? new Date(iso).toLocaleDateString(dl) : "");

  return (
    <Card className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-xl font-bold">{nhan.contribTitle}</h2>
        <Button variant="outline" size="sm" asChild>
          <Link href={localePath(locale, "/tai-khoan/bai-viet")}>
            <PenLine aria-hidden /> {nhan.manage}
          </Link>
        </Button>
      </div>

      <div role="tablist" className="flex flex-wrap gap-1.5">
        {(
          [
            ["all", nhan.contribAll, tong.all],
            ["published", nhan.contribApproved, tong.published],
          ] as const
        ).map(([k, ten, so]) => (
          <Button key={k} role="tab" aria-selected={tab === k} size="sm" variant={tab === k ? "solid" : "outline"} onClick={() => setTab(k)}>
            {ten} <span className="opacity-70">({so})</span>
          </Button>
        ))}
      </div>

      {!ds ? (
        <div className="h-24 animate-pulse rounded-md bg-surface-2" />
      ) : ds.length === 0 ? (
        <p className="text-sm text-muted">{nhan.contribEmpty}</p>
      ) : (
        <ol className="relative flex flex-col gap-4 border-l-2 border-line pl-5">
          {ds.map((b) => {
            const Icon = b.type === "library" ? ImageIcon : FileText;
            const loai =
              b.type === "library"
                ? (nhanThuVien.kinds[b.libraryKind as keyof Dictionary["library"]["kinds"]] ?? nhanBai.typeLibrary)
                : nhanBai.typeArticle;
            const href =
              b.status === "published"
                ? localePath(locale, `${contentTypeBase[b.type]}/${b.slug}`)
                : `${localePath(locale, "/tai-khoan/bai-viet")}?id=${b.id}`;
            return (
              <li key={b.id} className="relative">
                {/* Chấm mốc trên đường thời gian */}
                <span
                  className={cn(
                    "absolute -left-[1.6rem] top-1.5 flex size-3 rounded-full ring-4 ring-surface",
                    b.status === "published" ? "bg-accent" : b.status === "pending" ? "bg-brass" : "bg-line-strong",
                  )}
                  aria-hidden
                />
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                  <Icon className="size-3.5" aria-hidden />
                  <span>{loai}</span>
                  <Badge tone={mauTT[b.status]}>{nhanBai.statuses[b.status]}</Badge>
                  <span>{nhan.createdOn.replace("{date}", ngay(b.createdAt))}</span>
                </div>
                <Link href={href} className="mt-0.5 block font-medium text-ink hover:text-accent hover:underline">
                  {b.title}
                </Link>
                {b.status === "published" && b.approvedAt ? (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-accent">
                    <CheckCircle2 className="size-3.5" aria-hidden />
                    {nhan.approvedOn.replace("{date}", ngay(b.approvedAt))}
                    {b.approvedByName ? ` ${nhan.approvedBy.replace("{name}", b.approvedByName)}` : ""}
                    {b.viewCount ? ` · ${nhanBai.views.replace("{n}", String(b.viewCount))}` : ""}
                  </p>
                ) : b.status === "draft" && b.reviewNote ? (
                  <p className="mt-0.5 text-xs text-lacquer">
                    {nhanBai.reviewNote}: {b.reviewNote}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}
