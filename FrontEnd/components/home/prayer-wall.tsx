"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flower2, Star, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import { useCheDoSua } from "@/components/layout/inline-edit";
import { LoiApi } from "@/lib/auth";
import { localePath, splitLocale } from "@/lib/i18n";
import {
  datNoiBat,
  guiLoiNguyen,
  layLoiNguyen,
  layLoiNguyenNoiBat,
  xoaLoiNguyen,
  type LoiNguyen,
} from "@/lib/prayers";
import { PrayerSlideshow } from "@/components/home/prayer-slideshow";
import { cn } from "@/lib/utils";

/**
 * Mục "Viết một lời ước nguyện mỗi ngày" trang chủ: slideshow lời nguyện nổi bật
 * (người kiểm duyệt bấm ngôi sao để chọn), một ô nội dung (mỗi người tối đa 3 lời mỗi ngày - backend chặn) và dòng lời nguyện
 * gần đây của đại chúng. Không còn chọn cầu an / cầu siêu hay nhập tên người
 * được cầu - lời cũ có tên người được cầu vẫn hiện như trước.
 *
 * Tải ở trình duyệt vì trang chủ là ISR, còn lời nguyện cần hiện ngay sau khi gửi.
 */

export type NhanLoiNguyen = {
  flaggedNotice: string;
  kindCauAn: string;
  kindCauSieu: string;
  forName: string;
  forNamePlaceholder: string;
  placeholder: string;
  anonymous: string;
  submit: string;
  sending: string;
  wroteToday: string;
  signInPrompt: string;
  noPermission: string;
  todayCount: string;
  remainingToday: string;
  featuredTitle: string;
  prev: string;
  next: string;
  feature: string;
  unfeature: string;
  reviewTitle: string;
  empty: string;
  anonymousName: string;
  for: string;
  delete: string;
  confirmDelete: string;
  loadMore: string;
  loadError: string;
  sendError: string;
  all: string;
};

const DAI_TOI_DA = 500;

export function PrayerWall({ nhan }: { nhan: NhanLoiNguyen }) {
  const { locale } = splitLocale(usePathname());
  const { quyen, nguoiDungId, daBiet } = useCheDoSua();
  const daDangNhap = !!nguoiDungId;
  const duocViet = quyen.includes("prayer.write");
  const duocKiemDuyet = quyen.includes("comment.moderate");

  // Không còn chọn loại khi viết nên cũng không lọc theo loại khi xem.
  const loc = "" as const;
  const [ds, setDs] = React.useState<LoiNguyen[]>([]);
  const [tong, setTong] = React.useState(0);
  const [homNay, setHomNay] = React.useState(0);
  const [daViet, setDaViet] = React.useState(false);
  /** Số lời còn được viết hôm nay (backend: tối đa 3 lời mỗi ngày). */
  const [conLai, setConLai] = React.useState<number | null>(null);
  const [trang, setTrang] = React.useState(1);
  const [dangTai, setDangTai] = React.useState(true);
  const [loiTai, setLoiTai] = React.useState("");

  // Slideshow lời nguyện nổi bật phía trên ô viết - ai cũng thấy.
  const [noiBat, setNoiBat] = React.useState<LoiNguyen[]>([]);
  const napNoiBat = React.useCallback(() => {
    layLoiNguyenNoiBat(locale)
      .then(setNoiBat)
      .catch(() => setNoiBat([]));
  }, [locale]);
  React.useEffect(napNoiBat, [napNoiBat]);

  async function doiNoiBat(ln: LoiNguyen) {
    try {
      await datNoiBat(ln.id, !ln.featured, locale);
      setDs((cu) => cu.map((x) => (x.id === ln.id ? { ...x, featured: !ln.featured } : x)));
      napNoiBat();
    } catch (err) {
      window.alert((err instanceof LoiApi && err.thongDiep) || nhan.sendError);
    }
  }
  const [noiDung, setNoiDung] = React.useState("");
  const [anDanh, setAnDanh] = React.useState(false);
  const [dangGui, setDangGui] = React.useState(false);
  const [loiGui, setLoiGui] = React.useState("");
  const [biGiu, setBiGiu] = React.useState(false);

  const nap = React.useCallback(
    (soTrang: number) => {
      setDangTai(true);
      setLoiTai("");
      layLoiNguyen({ page: soTrang, kind: loc, daDangNhap }, locale)
        .then((kq) => {
          setDs((cu) =>
            soTrang === 1 ? kq.data : [...cu, ...kq.data.filter((x) => !cu.some((c) => c.id === x.id))],
          );
          setTong(kq.total);
          setHomNay(kq.today);
          if (kq.wroteToday !== undefined) setDaViet(kq.wroteToday);
          if (kq.remainingToday !== undefined) setConLai(kq.remainingToday);
          setTrang(soTrang);
        })
        .catch(() => setLoiTai(nhan.loadError))
        .finally(() => setDangTai(false));
    },
    [loc, daDangNhap, locale, nhan.loadError],
  );

  // Đợi biết chắc đã đăng nhập hay chưa rồi mới tải, để gọi đúng một lần đúng bản.
  React.useEffect(() => {
    if (daBiet) nap(1);
  }, [daBiet, nap]);

  async function gui(e: React.FormEvent) {
    e.preventDefault();
    if (noiDung.trim().length < 2) return;
    setDangGui(true);
    setLoiGui("");
    try {
      const moi = await guiLoiNguyen(
        // Chỉ còn ô nội dung: loại mặc định "cầu an", không ghi người được cầu.
        { kind: "cau-an", forName: "", body: noiDung.trim(), anonymous: anDanh },
        locale,
      );
      // Chứa từ cấm: đã lưu nhưng chờ duyệt ở tab Phê duyệt - không chèn vào danh sách.
      setBiGiu(!!moi.flagged);
      if (!moi.flagged) {
        setDs((cu) => [moi, ...cu]);
        setTong((t) => t + 1);
        setHomNay((n) => n + 1);
      }
      // Còn lượt thì vẫn giữ ô viết; hết lượt mới đổi sang câu "hẹn ngày mai".
      setConLai((n) => {
        const moiCon = Math.max(0, (n ?? 1) - 1);
        if (moiCon === 0) setDaViet(true);
        return moiCon;
      });
      setNoiDung("");
    } catch (err) {
      setLoiGui((err instanceof LoiApi && err.thongDiep) || nhan.sendError);
    } finally {
      setDangGui(false);
    }
  }

  async function xoa(ln: LoiNguyen) {
    if (!window.confirm(nhan.confirmDelete)) return;
    try {
      await xoaLoiNguyen(ln.id, locale);
      setDs((cu) => cu.filter((x) => x.id !== ln.id));
      setTong((t) => Math.max(0, t - 1));
    } catch (err) {
      window.alert((err instanceof LoiApi && err.thongDiep) || nhan.sendError);
    }
  }


  return (
    <Card className="flex flex-col gap-4 p-5">
      <PrayerSlideshow ds={noiBat} nhan={nhan} locale={locale} />

      {/* Ô viết */}
      {!daBiet ? null : !daDangNhap ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-surface-2 p-4 text-sm">
          <span className="text-muted">{nhan.placeholder}</span>
          <Button size="sm" asChild>
            <Link href={localePath(locale, "/dang-nhap")}>{nhan.signInPrompt}</Link>
          </Button>
        </div>
      ) : !duocViet ? (
        <p className="text-sm text-muted">{nhan.noPermission}</p>
      ) : daViet ? (
        <p className="flex items-center gap-2 rounded-md bg-accent-soft/60 p-4 text-sm text-accent">
          <Flower2 className="size-4 shrink-0" aria-hidden /> {nhan.wroteToday}
        </p>
      ) : (
        <form onSubmit={gui} className="flex flex-col gap-3">
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
            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={anDanh}
                onChange={(e) => setAnDanh(e.target.checked)}
                className="size-4 accent-accent"
              />
              {nhan.anonymous}
            </label>
            <span className="ml-auto flex gap-3 text-xs tabular-nums text-muted">
              {conLai !== null ? <span>{nhan.remainingToday.replace("{n}", String(conLai))}</span> : null}
              <span>
                {noiDung.length}/{DAI_TOI_DA}
              </span>
            </span>
          </div>
          {loiGui ? (
            <p role="alert" className="text-sm text-lacquer">
              {loiGui}
            </p>
          ) : null}
        </form>
      )}

      {/* Ngoài form: lời cuối trong ngày bị giữ lại thì form đã đổi sang câu hết lượt. */}
      {biGiu ? <p className="text-sm text-brass">{nhan.flaggedNotice}</p> : null}

      {/*
        Danh sách lời nguyện KHÔNG hiện công khai (chỉ slideshow nổi bật ở trên).
        Người kiểm duyệt vẫn cần chỗ để chọn lời nổi bật (ngôi sao) và xoá lời không
        phù hợp, nên với họ danh sách nằm trong một mục thu gọn.
      */}
      {duocKiemDuyet ? (
        <details className="group rounded-md border border-dashed border-line">
          <summary className="cursor-pointer select-none px-3 py-2 text-xs font-medium text-muted hover:text-ink">
            {nhan.reviewTitle} ({tong})
          </summary>
          <div className="flex flex-col gap-3 px-3 pb-3">
          {/* Số lời nguyện hôm nay */}
          {homNay > 0 ? (
            <div className="flex border-t border-line pt-4">
              <span className="text-xs text-muted">{nhan.todayCount.replace("{n}", String(homNay))}</span>
            </div>
          ) : (
            <div className="border-t border-line" />
          )}

          {loiTai ? (
            <p role="alert" className="text-sm text-lacquer">
              {loiTai}
            </p>
          ) : null}
          {!dangTai && !loiTai && ds.length === 0 ? <p className="text-sm text-muted">{nhan.empty}</p> : null}

          <ol className="flex max-h-[30rem] flex-col gap-3 overflow-y-auto">
            {ds.map((ln) => (
              <li key={ln.id} className="flex gap-3 rounded-md bg-surface-2/60 p-3">
                <Avatar
                  src={ln.author.avatarUrl}
                  name={ln.anonymous ? "" : ln.author.name}
                  size={32}
                  className="mt-0.5"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                    <span className="font-semibold text-ink">
                      {ln.anonymous || !ln.author.name ? nhan.anonymousName : ln.author.name}
                    </span>
                    {!ln.anonymous && ln.author.dharmaName ? (
                      <span className="text-accent">{ln.author.dharmaName}</span>
                    ) : null}
                    <time dateTime={ln.createdAt} className="text-muted">
                      {new Date(ln.createdAt).toLocaleDateString(locale === "vi" ? "vi-VN" : locale)}
                    </time>
                    {duocKiemDuyet ? (
                      <button
                        type="button"
                        onClick={() => doiNoiBat(ln)}
                        title={ln.featured ? nhan.unfeature : nhan.feature}
                        aria-label={ln.featured ? nhan.unfeature : nhan.feature}
                        aria-pressed={ln.featured}
                        className={cn("ml-auto", ln.featured ? "text-brass" : "text-muted hover:text-brass")}
                      >
                        <Star className={cn("size-3.5", ln.featured && "fill-current")} aria-hidden />
                      </button>
                    ) : null}
                    {ln.mine || duocKiemDuyet ? (
                      <button
                        type="button"
                        onClick={() => xoa(ln)}
                        aria-label={nhan.delete}
                        className="ml-auto text-muted hover:text-lacquer"
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </button>
                    ) : null}
                  </div>
                  {ln.forName ? (
                    <span className="text-xs text-muted">
                      {nhan.for}: <span className="font-medium text-ink">{ln.forName}</span>
                    </span>
                  ) : null}
                  <p className="whitespace-pre-line text-sm leading-relaxed text-body">{ln.body}</p>
                </div>
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
          </div>
        </details>
      ) : null}
    </Card>
  );
}
