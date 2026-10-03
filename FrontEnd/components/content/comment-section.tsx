"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import { useCheDoSua } from "@/components/layout/inline-edit";
import { LoiApi } from "@/lib/auth";
import { guiBinhLuan, layBinhLuan, xoaBinhLuan, type BinhLuan } from "@/lib/comments";
import { localePath, splitLocale } from "@/lib/i18n";

/**
 * Bình luận dưới bài viết.
 *
 * Tải ở trình duyệt sau khi trang hiện (trang bài là ISR). Ai cũng đọc được;
 * viết cần đăng nhập và quyền `comment.write`. Nút xoá hiện với bình luận của
 * chính mình, hoặc với mọi bình luận nếu có `comment.moderate` - backend kiểm
 * tra lại cả hai.
 */

export type NhanBinhLuan = {
  title: string;
  count: string;
  empty: string;
  placeholder: string;
  submit: string;
  sending: string;
  signInPrompt: string;
  noPermission: string;
  delete: string;
  confirmDelete: string;
  loadMore: string;
  loadError: string;
  sendError: string;
  dharmaName: string;
};

const DAI_TOI_DA = 2000;

export function CommentSection({ slug, nhan }: { slug: string; nhan: NhanBinhLuan }) {
  const { locale } = splitLocale(usePathname());
  const { quyen, nguoiDungId, daBiet } = useCheDoSua();

  const [ds, setDs] = React.useState<BinhLuan[]>([]);
  const [tong, setTong] = React.useState(0);
  const [trang, setTrang] = React.useState(1);
  const [dangTai, setDangTai] = React.useState(true);
  const [loiTai, setLoiTai] = React.useState("");

  const [noiDung, setNoiDung] = React.useState("");
  const [dangGui, setDangGui] = React.useState(false);
  const [loiGui, setLoiGui] = React.useState("");

  const nap = React.useCallback(
    (soTrang: number) => {
      setDangTai(true);
      setLoiTai("");
      layBinhLuan(slug, soTrang, locale)
        .then((kq) => {
          // Lọc trùng: vừa gửi/xoá bình luận thì phân trang theo vị trí bị lệch,
          // trang sau có thể trả lại một bình luận đã đang hiện.
          setDs((cu) =>
            soTrang === 1 ? kq.data : [...cu, ...kq.data.filter((x) => !cu.some((c) => c.id === x.id))],
          );
          setTong(kq.total);
          setTrang(soTrang);
        })
        .catch(() => setLoiTai(nhan.loadError))
        .finally(() => setDangTai(false));
    },
    [slug, locale, nhan.loadError],
  );

  React.useEffect(() => nap(1), [nap]);

  const duocViet = quyen.includes("comment.write");
  const duocKiemDuyet = quyen.includes("comment.moderate");

  async function gui(e: React.FormEvent) {
    e.preventDefault();
    const body = noiDung.trim();
    if (!body) return;
    setDangGui(true);
    setLoiGui("");
    try {
      const moi = await guiBinhLuan(slug, body, locale);
      setDs((cu) => [moi, ...cu]);
      setTong((t) => t + 1);
      setNoiDung("");
    } catch (err) {
      setLoiGui((err instanceof LoiApi && err.thongDiep) || nhan.sendError);
    } finally {
      setDangGui(false);
    }
  }

  async function xoa(bl: BinhLuan) {
    if (!window.confirm(nhan.confirmDelete)) return;
    try {
      await xoaBinhLuan(bl.id, locale);
      setDs((cu) => cu.filter((x) => x.id !== bl.id));
      setTong((t) => Math.max(0, t - 1));
    } catch (err) {
      window.alert((err instanceof LoiApi && err.thongDiep) || nhan.sendError);
    }
  }

  return (
    <section aria-labelledby="binh-luan" className="flex flex-col gap-5 border-t border-line pt-8">
      <h2 id="binh-luan" className="flex items-center gap-2 font-serif text-xl font-bold">
        <MessageCircle className="size-5 text-accent" aria-hidden />
        {nhan.title}
        {tong > 0 ? (
          <span className="text-sm font-normal text-muted">
            · {nhan.count.replace("{n}", String(tong))}
          </span>
        ) : null}
      </h2>

      {/* Ô viết: chỉ hiện khi đã biết chắc trạng thái đăng nhập, tránh nháy nút. */}
      {!daBiet ? null : !nguoiDungId ? (
        <Card className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
          <span className="text-muted">{nhan.placeholder}</span>
          <Button size="sm" asChild>
            <Link href={localePath(locale, "/dang-nhap")}>{nhan.signInPrompt}</Link>
          </Button>
        </Card>
      ) : !duocViet ? (
        <p className="text-sm text-muted">{nhan.noPermission}</p>
      ) : (
        <form onSubmit={gui} className="flex flex-col gap-2">
          <textarea
            value={noiDung}
            onChange={(e) => setNoiDung(e.target.value)}
            placeholder={nhan.placeholder}
            aria-label={nhan.placeholder}
            maxLength={DAI_TOI_DA}
            rows={3}
            className="w-full rounded-md border border-line bg-surface px-3 py-2.5 text-sm leading-relaxed text-ink placeholder:text-muted focus:border-accent focus:outline-none"
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" size="sm" disabled={dangGui || noiDung.trim().length < 2}>
              {dangGui ? nhan.sending : nhan.submit}
            </Button>
            <span className="text-xs tabular-nums text-muted">
              {noiDung.length}/{DAI_TOI_DA}
            </span>
            {loiGui ? (
              <span role="alert" className="text-sm text-lacquer">
                {loiGui}
              </span>
            ) : null}
          </div>
        </form>
      )}

      {loiTai ? (
        <p role="alert" className="text-sm text-lacquer">
          {loiTai}
        </p>
      ) : null}

      {!dangTai && !loiTai && ds.length === 0 ? (
        <p className="text-sm text-muted">{nhan.empty}</p>
      ) : null}

      <ol className="flex flex-col divide-y divide-line">
        {ds.map((bl) => (
          <li key={bl.id} className="flex flex-col gap-1.5 py-4">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm">
              <span className="font-semibold text-ink">{bl.author.name || "—"}</span>
              {bl.author.dharmaName ? (
                <span className="text-accent">
                  {nhan.dharmaName}: {bl.author.dharmaName}
                </span>
              ) : null}
              <time dateTime={bl.createdAt} className="text-xs text-muted">
                {new Date(bl.createdAt).toLocaleString(locale === "vi" ? "vi-VN" : locale, {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
              {bl.userId === nguoiDungId || duocKiemDuyet ? (
                <button
                  type="button"
                  onClick={() => xoa(bl)}
                  className="ml-auto flex items-center gap-1 text-xs text-muted hover:text-lacquer"
                >
                  <Trash2 className="size-3.5" aria-hidden /> {nhan.delete}
                </button>
              ) : null}
            </div>
            {/* Chữ thuần, giữ xuống dòng người viết gõ; React tự escape HTML. */}
            <p className="whitespace-pre-line text-sm leading-relaxed text-body">{bl.body}</p>
          </li>
        ))}
      </ol>

      {ds.length < tong ? (
        <Button
          variant="outline"
          size="sm"
          className="self-center"
          disabled={dangTai}
          onClick={() => nap(trang + 1)}
        >
          {nhan.loadMore}
        </Button>
      ) : null}
    </section>
  );
}
