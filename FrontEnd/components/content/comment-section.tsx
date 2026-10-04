"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CornerDownRight, Flag, MessageCircle, Reply, ShieldAlert, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { useCheDoSua } from "@/components/layout/inline-edit";
import { LoiApi } from "@/lib/auth";
import { baoCaoBinhLuan, guiBinhLuan, layBinhLuan, layBinhLuanDaXoa, xoaBinhLuan, type BinhLuan } from "@/lib/comments";
import { layBinhLuanViPham, xoaHanBinhLuan, type BinhLuanViPham } from "@/lib/admin-api";
import { localePath, splitLocale, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Bình luận dưới bài viết.
 *
 * Bố cục: khung riêng nổi bật -> danh sách bình luận -> ô viết ở CUỐI (đọc
 * xong những gì mọi người đã nói rồi mới viết). Trả lời một cấp: mỗi bình
 * luận gốc có nút "Trả lời", câu trả lời thụt vào dưới bình luận gốc; trả lời
 * một câu trả lời thì vẫn nằm cùng mạch đó, kèm "@tên" người được trả lời.
 *
 * Tải ở trình duyệt sau khi trang hiện (trang bài là ISR). Ai cũng đọc được;
 * viết cần đăng nhập và quyền `comment.write`. Nút xoá hiện với bình luận
 * của mình, hoặc mọi bình luận nếu có `comment.moderate` - backend kiểm lại.
 *
 * Mở từ thông báo (/bai-viet/x#binh-luan-<id>): tải xong thì cuộn tới đúng
 * bình luận đó và làm nổi một nhịp.
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
  reply: string;
  replyPlaceholder: string;
  cancel: string;
  writeTitle: string;
  suggestions: string[];
  suggestionsLabel: string;
  flaggedNotice: string;
  deletedBySelf: string;
  deletedByModerator: string;
  viewDeleted: string;
  hideDeleted: string;
  deletedBy: string;
  report: string;
  reportPrompt: string;
  reportSent: string;
  reportReasons: string[];
};

const DAI_TOI_DA = 2000;

export function CommentSection({ slug, nhan }: { slug: string; nhan: NhanBinhLuan }) {
  const { locale } = splitLocale(usePathname());
  const { quyen, nguoiDungId, nguoiDung, daBiet } = useCheDoSua();

  const [ds, setDs] = React.useState<BinhLuan[]>([]);
  const [tongGoc, setTongGoc] = React.useState(0);
  const [tongTatCa, setTongTatCa] = React.useState(0);
  const [trang, setTrang] = React.useState(1);
  const [dangTai, setDangTai] = React.useState(true);
  const [loiTai, setLoiTai] = React.useState("");
  /** id bình luận đang mở ô trả lời. */
  const [dangTraLoi, setDangTraLoi] = React.useState<string | null>(null);
  const [noiBat, setNoiBat] = React.useState<string | null>(null);

  const nap = React.useCallback(
    (soTrang: number) => {
      setDangTai(true);
      setLoiTai("");
      layBinhLuan(slug, soTrang, locale)
        .then((kq) => {
          // Lọc trùng: vừa gửi/xoá bình luận thì phân trang theo vị trí bị lệch.
          setDs((cu) =>
            soTrang === 1 ? kq.data : [...cu, ...kq.data.filter((x) => !cu.some((c) => c.id === x.id))],
          );
          setTongGoc(kq.total);
          setTongTatCa(kq.totalAll ?? kq.total);
          setTrang(soTrang);
        })
        .catch(() => setLoiTai(nhan.loadError))
        .finally(() => setDangTai(false));
    },
    [slug, locale, nhan.loadError],
  );

  React.useEffect(() => nap(1), [nap]);

  // Mở từ thông báo: cuộn tới bình luận trong #binh-luan-<id> sau lần tải đầu.
  const daCuon = React.useRef(false);
  React.useEffect(() => {
    if (daCuon.current || dangTai || !ds.length) return;
    const khop = window.location.hash.match(/^#binh-luan-(.+)$/);
    if (!khop) return;
    daCuon.current = true;
    const phanTu = document.getElementById(`binh-luan-${khop[1]}`);
    if (!phanTu) return;
    phanTu.scrollIntoView({ behavior: "smooth", block: "center" });
    setNoiBat(khop[1]);
    window.setTimeout(() => setNoiBat(null), 2500);
  }, [dangTai, ds]);

  const duocViet = quyen.includes("comment.write");
  const duocKiemDuyet = quyen.includes("comment.moderate");
  const duocXuLyViPham = quyen.includes("moderation.manage");

  // Bình luận chứa từ cấm: chỉ người có `moderation.manage` tải và thấy.
  const [viPham, setViPham] = React.useState<BinhLuanViPham[]>([]);
  const napViPham = React.useCallback(() => {
    if (!duocXuLyViPham) return;
    layBinhLuanViPham(slug, locale)
      .then(setViPham)
      .catch(() => setViPham([]));
  }, [duocXuLyViPham, slug, locale]);
  React.useEffect(napViPham, [napViPham]);

  async function xoaHan(bl: BinhLuanViPham) {
    if (!window.confirm("Xoá hẳn bình luận này khỏi hệ thống? Không khôi phục được.")) return;
    try {
      await xoaHanBinhLuan(bl.id, locale);
      setViPham((cu) => cu.filter((x) => x.id !== bl.id));
    } catch (err) {
      window.alert((err instanceof LoiApi && err.thongDiep) || nhan.sendError);
    }
  }

  /** Gửi bình luận gốc hoặc câu trả lời; trả về true nếu thành công. */
  async function gui(body: string, traLoi?: BinhLuan): Promise<string> {
    try {
      const moi = await guiBinhLuan(slug, body, locale, traLoi?.id);
      // Chứa từ cấm: backend đã lưu nhưng không hiện - không thêm vào danh sách,
      // báo cho người viết ngay dưới ô nhập (trả về như một "lỗi" để ô giữ chữ).
      if (moi.flagged) {
        napViPham();
        return nhan.flaggedNotice;
      }
      if (moi.parentId) {
        setDs((cu) =>
          cu.map((g) => (g.id === moi.parentId ? { ...g, replies: [...(g.replies ?? []), moi] } : g)),
        );
        setDangTraLoi(null);
      } else {
        setDs((cu) => [{ ...moi, replies: [] }, ...cu]);
        setTongGoc((t) => t + 1);
      }
      setTongTatCa((t) => t + 1);
      return "";
    } catch (err) {
      return (err instanceof LoiApi && err.thongDiep) || nhan.sendError;
    }
  }

  async function xoa(bl: BinhLuan) {
    if (!window.confirm(nhan.confirmDelete)) return;
    try {
      await xoaBinhLuan(bl.id, locale);
      // Xoá mềm: bình luận ở nguyên chỗ, thành dòng "đã xoá" (mạch trả lời giữ nguyên).
      const chinhChu = bl.userId === nguoiDungId;
      const daXoa = { byModerator: !chinhChu, byName: chinhChu ? nguoiDung?.name || bl.author.name : "" };
      const danDau = (x: BinhLuan): BinhLuan => (x.id === bl.id ? { ...x, body: "", deleted: daXoa } : x);
      setDs((cu) => cu.map((g) => ({ ...danDau(g), replies: g.replies?.map(danDau) })));
      setTongTatCa((t) => Math.max(0, t - 1));
    } catch (err) {
      window.alert((err instanceof LoiApi && err.thongDiep) || nhan.sendError);
    }
  }

  const coTheXoa = (bl: BinhLuan) => !bl.deleted && (bl.userId === nguoiDungId || duocKiemDuyet);
  // Báo cáo: người đã đăng nhập, bình luận của người khác, chưa bị xoá.
  const coTheBaoCao = (bl: BinhLuan) => !!nguoiDungId && !bl.deleted && bl.userId !== nguoiDungId;

  // Popup báo cáo: chọn / nhập lý do rồi gửi.
  const [baoCaoMuc, setBaoCaoMuc] = React.useState<BinhLuan | null>(null);
  const baoCao = (bl: BinhLuan) => setBaoCaoMuc(bl);
  const coTheTraLoi = !!nguoiDungId && duocViet;

  return (
    <section
      id="binh-luan"
      aria-labelledby="binh-luan-tieu-de"
      className="flex flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card"
    >
      <header className="flex items-center gap-2.5 border-b border-line bg-accent-soft/50 px-5 py-4">
        <MessageCircle className="size-5 text-accent" aria-hidden />
        <h2 id="binh-luan-tieu-de" className="font-serif text-xl font-bold">
          {nhan.title}
        </h2>
        {tongTatCa > 0 ? (
          <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold tabular-nums text-paper">
            {tongTatCa}
          </span>
        ) : null}
      </header>

      {duocXuLyViPham && viPham.length > 0 ? (
        <KhoiViPham ds={viPham} locale={locale} onXoa={xoaHan} />
      ) : null}

      <div className="flex flex-col px-5">
        {loiTai ? (
          <p role="alert" className="py-4 text-sm text-lacquer">
            {loiTai}
          </p>
        ) : null}

        {!dangTai && !loiTai && ds.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">{nhan.empty}</p>
        ) : null}

        <ol className="flex flex-col divide-y divide-line">
          {ds.map((goc) => {
            // Bình luận đã xoá: chỉ người kiểm duyệt thấy dòng "đã xoá". Người đọc
            // thường không thấy gì; gốc đã xoá nhưng còn câu trả lời thì vẫn hiện
            // các câu trả lời (không hiện dòng gốc).
            const traLoi = (goc.replies ?? []).filter((r) => duocKiemDuyet || !r.deleted);
            const hienGoc = duocKiemDuyet || !goc.deleted;
            if (!hienGoc && traLoi.length === 0) return null;
            return (
            <li key={goc.id} className="flex flex-col gap-3 py-5">
              {hienGoc ? (
              <MotBinhLuan
                bl={goc}
                nhan={nhan}
                locale={locale}
                noiBat={noiBat === goc.id}
                coTheXoa={coTheXoa(goc)}
                coTheTraLoi={coTheTraLoi && !goc.deleted}
                xemLai={duocKiemDuyet}
                onBaoCao={coTheBaoCao(goc) ? () => baoCao(goc) : undefined}
                onTraLoi={() => setDangTraLoi(dangTraLoi === goc.id ? null : goc.id)}
                onXoa={() => xoa(goc)}
              />
              ) : null}

              {(traLoi.length || dangTraLoi === goc.id || traLoi.some((r) => r.id === dangTraLoi)) ? (
                <div className="ml-6 flex flex-col gap-3 border-l-2 border-accent-soft pl-4 sm:ml-12">
                  {traLoi.map((r) => (
                    <React.Fragment key={r.id}>
                      <MotBinhLuan
                        bl={r}
                        nhan={nhan}
                        locale={locale}
                        nho
                        noiBat={noiBat === r.id}
                        coTheXoa={coTheXoa(r)}
                        coTheTraLoi={coTheTraLoi && !r.deleted}
                        xemLai={duocKiemDuyet}
                        onBaoCao={coTheBaoCao(r) ? () => baoCao(r) : undefined}
                        onTraLoi={() => setDangTraLoi(dangTraLoi === r.id ? null : r.id)}
                        onXoa={() => xoa(r)}
                      />
                      {dangTraLoi === r.id ? (
                        <OViet
                          nhan={nhan}
                          traLoiTen={r.author.name}
                          tuDongFocus
                          onGui={(body) => gui(body, r)}
                          onHuy={() => setDangTraLoi(null)}
                        />
                      ) : null}
                    </React.Fragment>
                  ))}
                  {dangTraLoi === goc.id ? (
                    <OViet
                      nhan={nhan}
                      traLoiTen={goc.author.name}
                      tuDongFocus
                      onGui={(body) => gui(body, goc)}
                      onHuy={() => setDangTraLoi(null)}
                    />
                  ) : null}
                </div>
              ) : null}
            </li>
            );
          })}
        </ol>

        {baoCaoMuc ? (
          <HopBaoCao
            nhan={nhan}
            onDong={() => setBaoCaoMuc(null)}
            onGui={async (lyDo) => {
              await baoCaoBinhLuan(baoCaoMuc.id, lyDo, locale);
            }}
          />
        ) : null}

        {ds.length < tongGoc ? (
          <Button
            variant="outline"
            size="sm"
            className="mb-5 self-center"
            disabled={dangTai}
            onClick={() => nap(trang + 1)}
          >
            {nhan.loadMore}
          </Button>
        ) : null}
      </div>

      {/* Ô viết bình luận gốc: ở cuối, sau danh sách. */}
      <div className="border-t border-line bg-surface-2/60 px-5 py-5">
        <h3 className="mb-3 text-sm font-semibold text-ink">{nhan.writeTitle}</h3>
        {!daBiet ? null : !nguoiDungId ? (
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <span className="text-muted">{nhan.placeholder}</span>
            <Button size="sm" asChild>
              <Link href={localePath(locale, "/dang-nhap")}>{nhan.signInPrompt}</Link>
            </Button>
          </div>
        ) : !duocViet ? (
          <p className="text-sm text-muted">{nhan.noPermission}</p>
        ) : (
          <OViet nhan={nhan} onGui={(body) => gui(body)} />
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function MotBinhLuan({
  bl,
  nhan,
  locale,
  nho = false,
  noiBat,
  coTheXoa,
  coTheTraLoi,
  xemLai = false,
  onTraLoi,
  onXoa,
  onBaoCao,
}: {
  bl: BinhLuan;
  /** Có thì hiện nút Báo cáo. */
  onBaoCao?: () => void;
  /** Kiểm duyệt viên: xem lại nội dung bình luận đã xoá. */
  xemLai?: boolean;
  nhan: NhanBinhLuan;
  locale: string;
  /** Câu trả lời: avatar nhỏ hơn. */
  nho?: boolean;
  noiBat: boolean;
  coTheXoa: boolean;
  coTheTraLoi: boolean;
  onTraLoi: () => void;
  onXoa: () => void;
}) {
  if (bl.deleted) return <BinhLuanDaXoa bl={bl} nhan={nhan} locale={locale} nho={nho} xemLai={xemLai} />;

  return (
    <div
      id={`binh-luan-${bl.id}`}
      className={cn(
        "flex scroll-mt-24 gap-3 rounded-md transition-colors duration-700",
        noiBat && "bg-accent-soft/70 ring-4 ring-accent-soft/70",
      )}
    >
      <Avatar src={bl.author.avatarUrl} name={bl.author.name} size={nho ? 30 : 40} className="mt-0.5" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm">
          <span className="font-semibold text-ink">{bl.author.name || "—"}</span>
          {bl.author.dharmaName ? (
            <span className="text-xs text-accent">
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
        </div>

        {/* Chữ thuần, giữ xuống dòng người viết gõ; React tự escape HTML. */}
        <p className="whitespace-pre-line text-[15px] leading-relaxed text-body">
          {bl.replyTo?.name ? (
            <span className="mr-1 font-medium text-accent">@{bl.replyTo.name}</span>
          ) : null}
          {bl.body}
        </p>

        <div className="flex items-center gap-4 pt-0.5 text-xs">
          {coTheTraLoi ? (
            <button
              type="button"
              onClick={onTraLoi}
              className="flex items-center gap-1 font-medium text-muted hover:text-accent"
            >
              <Reply className="size-3.5" aria-hidden /> {nhan.reply}
            </button>
          ) : null}
          {coTheXoa ? (
            <button
              type="button"
              onClick={onXoa}
              className="flex items-center gap-1 text-muted hover:text-lacquer"
            >
              <Trash2 className="size-3.5" aria-hidden /> {nhan.delete}
            </button>
          ) : null}
          {onBaoCao ? (
            <button
              type="button"
              onClick={onBaoCao}
              className="ml-auto flex items-center gap-1 text-muted hover:text-lacquer"
            >
              <Flag className="size-3.5" aria-hidden /> {nhan.report}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Dòng thay cho bình luận đã xoá: ai xoá; kiểm duyệt viên bấm xem lại được nội dung gốc. */
function BinhLuanDaXoa({
  bl,
  nhan,
  locale,
  nho,
  xemLai,
}: {
  bl: BinhLuan;
  nhan: NhanBinhLuan;
  locale: string;
  nho: boolean;
  xemLai: boolean;
}) {
  const [goc, setGoc] = React.useState<{ body: string; deletedBy: string } | null>(null);
  const [mo, setMo] = React.useState(false);
  const cau = bl.deleted?.byModerator
    ? nhan.deletedByModerator
    : nhan.deletedBySelf.replace("{name}", bl.deleted?.byName || bl.author.name || "—");

  async function xem() {
    if (mo) return setMo(false);
    setMo(true);
    if (goc) return;
    try {
      const kq = await layBinhLuanDaXoa(bl.id, locale as Parameters<typeof layBinhLuanDaXoa>[1]);
      setGoc({ body: kq.body, deletedBy: kq.deletedBy });
    } catch (err) {
      setGoc({ body: (err instanceof LoiApi && err.thongDiep) || nhan.loadError, deletedBy: "" });
    }
  }

  return (
    <div id={`binh-luan-${bl.id}`} className="flex scroll-mt-24 gap-3">
      <span
        className={cn("mt-0.5 flex shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted", nho ? "size-[30px]" : "size-10")}
        aria-hidden
      >
        <Trash2 className="size-3.5" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 rounded-md border border-dashed border-line px-3 py-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="italic text-muted">{cau}</span>
          {xemLai ? (
            <button type="button" onClick={xem} className="text-xs font-medium text-accent hover:underline">
              {mo ? nhan.hideDeleted : nhan.viewDeleted}
            </button>
          ) : null}
        </div>
        {mo && goc ? (
          <div className="flex flex-col gap-1 border-t border-line pt-1.5">
            <span className="text-xs text-muted">
              {bl.author.name}
              {goc.deletedBy ? ` · ${nhan.deletedBy.replace("{name}", goc.deletedBy)}` : ""}
            </span>
            <p className="whitespace-pre-line text-sm text-body">{goc.body}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Popup báo cáo bình luận: vài lý do có sẵn để bấm nhanh + ô nhập tự do
 * (không bắt buộc). Gửi xong hiện lời cảm ơn rồi tự đóng.
 */
function HopBaoCao({
  nhan,
  onDong,
  onGui,
}: {
  nhan: NhanBinhLuan;
  onDong: () => void;
  onGui: (lyDo: string) => Promise<void>;
}) {
  const [lyDo, setLyDo] = React.useState("");
  const [dang, setDang] = React.useState(false);
  const [xong, setXong] = React.useState(false);
  const [loi, setLoi] = React.useState("");
  const o = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    o.current?.focus();
    const nghe = (e: KeyboardEvent) => e.key === "Escape" && onDong();
    window.addEventListener("keydown", nghe);
    return () => window.removeEventListener("keydown", nghe);
  }, [onDong]);

  async function gui(e: React.FormEvent) {
    e.preventDefault();
    setDang(true);
    setLoi("");
    try {
      await onGui(lyDo.trim());
      setXong(true);
      window.setTimeout(onDong, 1600);
    } catch (err) {
      setLoi((err instanceof LoiApi && err.thongDiep) || nhan.sendError);
    } finally {
      setDang(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" onClick={onDong}>
      <form
        role="dialog"
        aria-modal
        aria-label={nhan.report}
        onSubmit={gui}
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-md flex-col gap-3 rounded-card border border-line bg-surface p-5 shadow-card-lift"
      >
        <h3 className="flex items-center gap-2 font-serif text-lg font-bold text-ink">
          <Flag className="size-4 text-lacquer" aria-hidden /> {nhan.report}
        </h3>
        {xong ? (
          <p className="text-sm text-accent">{nhan.reportSent}</p>
        ) : (
          <>
            <label htmlFor="ly-do-bao-cao" className="text-sm text-body">
              {nhan.reportPrompt}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {nhan.reportReasons.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setLyDo(r)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs transition-colors",
                    lyDo === r ? "border-lacquer bg-lacquer/10 text-lacquer" : "border-line text-muted hover:border-line-strong hover:text-ink",
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
            <textarea
              id="ly-do-bao-cao"
              ref={o}
              value={lyDo}
              onChange={(e) => setLyDo(e.target.value)}
              maxLength={300}
              rows={3}
              className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
            />
            {loi ? (
              <p role="alert" className="text-sm text-lacquer">
                {loi}
              </p>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={onDong}>
                {nhan.cancel}
              </Button>
              <Button type="submit" size="sm" disabled={dang} className="bg-lacquer text-white hover:bg-lacquer/90">
                <Flag aria-hidden /> {nhan.report}
              </Button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}

/** Ô nhập dùng chung cho bình luận gốc và câu trả lời. */
function OViet({
  nhan,
  traLoiTen,
  tuDongFocus = false,
  onGui,
  onHuy,
}: {
  nhan: NhanBinhLuan;
  /** Có = ô trả lời người này. */
  traLoiTen?: string;
  tuDongFocus?: boolean;
  /** Trả về câu lỗi, hoặc chuỗi rỗng nếu gửi được. */
  onGui: (body: string) => Promise<string>;
  onHuy?: () => void;
}) {
  const [noiDung, setNoiDung] = React.useState("");
  const [dangGui, setDangGui] = React.useState(false);
  const [loi, setLoi] = React.useState("");

  async function gui(e: React.FormEvent) {
    e.preventDefault();
    const body = noiDung.trim();
    if (body.length < 2) return;
    setDangGui(true);
    setLoi("");
    const kq = await onGui(body);
    setDangGui(false);
    if (kq) setLoi(kq);
    else setNoiDung("");
  }

  return (
    <form onSubmit={gui} className="flex flex-col gap-2">
      {traLoiTen ? (
        <span className="flex items-center gap-1 text-xs text-muted">
          <CornerDownRight className="size-3.5" aria-hidden /> {nhan.reply} <b className="text-ink">{traLoiTen}</b>
        </span>
      ) : null}
      {/* Gợi ý nhanh: bấm để chèn; ô đang có chữ thì nối thêm vào cuối. */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted">{nhan.suggestionsLabel}:</span>
        {nhan.suggestions.map((goiY) => (
          <button
            key={goiY}
            type="button"
            onClick={() =>
              setNoiDung((cu) => (cu.trim() ? `${cu.trimEnd()} ${goiY}` : goiY).slice(0, DAI_TOI_DA))
            }
            className="rounded-full border border-line bg-surface px-2.5 py-1 text-xs text-body transition-colors hover:border-accent hover:bg-accent-soft hover:text-accent"
          >
            {goiY}
          </button>
        ))}
      </div>
      <textarea
        value={noiDung}
        onChange={(e) => setNoiDung(e.target.value)}
        placeholder={traLoiTen ? nhan.replyPlaceholder : nhan.placeholder}
        aria-label={traLoiTen ? nhan.replyPlaceholder : nhan.placeholder}
        maxLength={DAI_TOI_DA}
        rows={traLoiTen ? 2 : 4}
        autoFocus={tuDongFocus}
        className="w-full rounded-md border border-line bg-surface px-3 py-2.5 text-sm leading-relaxed text-ink placeholder:text-muted focus:border-accent focus:outline-none"
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" disabled={dangGui || noiDung.trim().length < 2}>
          {dangGui ? nhan.sending : traLoiTen ? nhan.reply : nhan.submit}
        </Button>
        {onHuy ? (
          <Button type="button" size="sm" variant="ghost" onClick={onHuy}>
            {nhan.cancel}
          </Button>
        ) : null}
        <span className="text-xs tabular-nums text-muted">
          {noiDung.length}/{DAI_TOI_DA}
        </span>
        {loi ? (
          <span role="alert" className="text-sm text-lacquer">
            {loi}
          </span>
        ) : null}
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */

/** Thoát ký tự đặc biệt để nhét từ cấm vào RegExp. */
const thoatRegex = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Tô đậm các từ cấm đã khớp trong nội dung (không phân biệt hoa thường). */
function ToTuCam({ text, tu }: { text: string; tu: string[] }) {
  const sach = tu.filter(Boolean).map(thoatRegex);
  if (!sach.length) return <>{text}</>;
  const phan = text.split(new RegExp(`(${sach.join("|")})`, "giu"));

  return (
    <>
      {phan.map((p, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="rounded-sm bg-lacquer/20 px-0.5 text-lacquer">
            {p}
          </mark>
        ) : (
          <React.Fragment key={i}>{p}</React.Fragment>
        ),
      )}
    </>
  );
}

/**
 * Khung CHỈ người có `moderation.manage` thấy: bình luận bị giữ lại vì chứa từ
 * cấm. Bấm tên hoặc nội dung để sang trang người dùng (cảnh cáo / khoá), hoặc
 * xoá hẳn bình luận. Chữ quản trị để tiếng Việt như toàn bộ khu quản trị.
 */
function KhoiViPham({
  ds,
  locale,
  onXoa,
}: {
  ds: BinhLuanViPham[];
  locale: Locale;
  onXoa: (bl: BinhLuanViPham) => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-lacquer/30 bg-lacquer/5 px-5 py-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-lacquer">
        <ShieldAlert className="size-4" aria-hidden />
        {ds.length} bình luận bị ẩn do chứa từ cấm — chỉ Quản lý thấy
      </p>
      <ul className="flex flex-col gap-2">
        {ds.map((bl) => {
          const linkNguoi = `${localePath(locale, "/admin/user")}?xem=${encodeURIComponent(bl.userId)}&binhLuan=${encodeURIComponent(bl.id)}`;
          return (
            <li key={bl.id} className="flex gap-3 rounded-md border border-lacquer/20 bg-surface p-3">
              <Avatar src={bl.author.avatarUrl} name={bl.author.name} size={32} />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-x-2 text-xs">
                  <Link href={linkNguoi} className="font-semibold text-ink hover:text-accent hover:underline">
                    {bl.author.name || "—"}
                  </Link>
                  <span className="text-muted">{new Date(bl.createdAt).toLocaleString("vi-VN")}</span>
                  <span className="text-lacquer">Từ cấm: {bl.flaggedWords.join(", ")}</span>
                </div>
                <Link href={linkNguoi} className="whitespace-pre-line text-sm text-body hover:underline">
                  <ToTuCam text={bl.body} tu={bl.flaggedWords} />
                </Link>
              </div>
              <Button size="sm" variant="ghost" className="self-start text-lacquer" onClick={() => onXoa(bl)}>
                <Trash2 aria-hidden /> Xoá hẳn
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
