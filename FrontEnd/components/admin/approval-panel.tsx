"use client";

import * as React from "react";
import Link from "next/link";
import { Check, ExternalLink, ShieldMinus, UserRound, X } from "lucide-react";
import { Badge, Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { HopLoi, chuLoi, useLocale, useQuyen } from "@/components/admin/admin-shell";
import {
  duyetMuc,
  giamCanhCao,
  layBaoCao,
  layChoDuyet,
  nhanVaiTro,
  tuChoiMuc,
  xuLyBaoCao,
  type BinhLuanBiBaoCao,
  type DanhSachChoDuyet,
  type MucChoDuyet,
} from "@/lib/admin-api";
import { localePath } from "@/lib/i18n";
import { contentTypeBase } from "@/lib/site";
import { cn } from "@/lib/utils";

type Loai = "comment" | "prayer" | "report";
const MOI_TRANG = 30;
const CANH_CAO_TOI_DA = 5;

/** Tô đậm những từ cấm đã khớp trong nội dung. */
function ToTuCam({ text, tu }: { text: string; tu: string[] }) {
  const mau = tu
    .filter(Boolean)
    .map((w) => w.normalize("NFC").replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .sort((a, b) => b.length - a.length);
  if (!mau.length) return <>{text}</>;
  const re = new RegExp(`(${mau.join("|")})`, "giu");
  return (
    <>
      {text.normalize("NFC").split(re).map((phan, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="rounded bg-lacquer/20 px-0.5 text-lacquer">
            {phan}
          </mark>
        ) : (
          <React.Fragment key={i}>{phan}</React.Fragment>
        ),
      )}
    </>
  );
}

/**
 * Tab "Phê duyệt": bình luận và lời nguyện bị giữ lại vì chứa từ cấm, toàn
 * site. Kiểm duyệt viên trở lên duyệt (cho hiện) hoặc từ chối (ẩn, vẫn lưu).
 * Bấm tên người viết để sang trang tài khoản (cảnh cáo / khoá); người có
 * `moderation.manage` giảm được một mức cảnh cáo ngay tại đây.
 */
export function ApprovalPanel() {
  const locale = useLocale();
  const quyen = useQuyen();
  const xemTaiKhoan = quyen.includes("user.list");
  const xuLyCanhCao = quyen.includes("moderation.manage");

  const [loai, setLoai] = React.useState<Loai>("comment");
  const [trang, setTrang] = React.useState(1);
  const [dl, setDl] = React.useState<DanhSachChoDuyet | null>(null);
  const [loi, setLoi] = React.useState("");
  const [ban, setBan] = React.useState<string | null>(null);

  const [baoCao, setBaoCao] = React.useState<{ total: number; data: BinhLuanBiBaoCao[] } | null>(null);

  const nap = React.useCallback(() => {
    setLoi("");
    if (loai === "report") {
      setBaoCao(null);
      // Số trên các tab lấy từ danh sách chờ duyệt.
      Promise.all([layBaoCao(trang, locale), layChoDuyet("comment", 1, locale)])
        .then(([bc, cd]) => {
          setBaoCao(bc);
          setDl(cd);
        })
        .catch((e) => setLoi(chuLoi(e, "Không tải được danh sách báo cáo.")));
      return;
    }
    layChoDuyet(loai, trang, locale)
      .then(setDl)
      .catch((e) => setLoi(chuLoi(e, "Không tải được danh sách chờ duyệt.")));
  }, [loai, trang, locale]);
  React.useEffect(nap, [nap]);

  async function xuLy(b: BinhLuanBiBaoCao, action: "hide" | "dismiss") {
    if (action === "hide" && !window.confirm("Ẩn bình luận này? (Vẫn lưu lại, xem được ở trang tài khoản người viết.)")) return;
    setBan(b.id);
    try {
      await xuLyBaoCao(b.id, action, locale);
      setBaoCao((cu) => (cu ? { total: cu.total - 1, data: cu.data.filter((x) => x.id !== b.id) } : cu));
      setDl((cu) => (cu ? { ...cu, counts: { ...cu.counts, report: Math.max(0, (cu.counts.report ?? 1) - 1) } } : cu));
    } catch (e) {
      window.alert(chuLoi(e));
    } finally {
      setBan(null);
    }
  }

  async function lam(m: MucChoDuyet, viec: "duyet" | "tuChoi") {
    setBan(m.id);
    try {
      if (viec === "duyet") await duyetMuc(m.type, m.id, locale);
      else await tuChoiMuc(m.type, m.id, locale);
      setDl((cu) =>
        cu
          ? {
              ...cu,
              data: cu.data.filter((x) => x.id !== m.id),
              total: cu.total - 1,
              counts: { ...cu.counts, [m.type]: Math.max(0, cu.counts[m.type] - 1) },
            }
          : cu,
      );
    } catch (e) {
      window.alert(chuLoi(e));
    } finally {
      setBan(null);
    }
  }

  async function giam(m: MucChoDuyet) {
    const lyDo = window.prompt(`Giảm một mức cảnh cáo cho ${m.author.name || m.author.username}? Lý do (tuỳ chọn):`, "");
    if (lyDo === null) return;
    try {
      const kq = await giamCanhCao(m.author.userId, lyDo, locale);
      // Cập nhật mọi mục của cùng người viết.
      setDl((cu) =>
        cu
          ? {
              ...cu,
              data: cu.data.map((x) =>
                x.author.userId === m.author.userId ? { ...x, author: { ...x.author, warningCount: kq.warningCount } } : x,
              ),
            }
          : cu,
      );
    } catch (e) {
      window.alert(chuLoi(e));
    }
  }

  const tongDangXem = loai === "report" ? (baoCao?.total ?? 0) : (dl?.total ?? 0);
  const soTrang = Math.max(1, Math.ceil(tongDangXem / MOI_TRANG));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="font-serif text-2xl font-bold tracking-tight">Phê duyệt</h1>
        <p className="max-w-3xl text-sm text-muted">
          Bình luận và lời nguyện chứa từ ngữ trong danh sách từ cấm được giữ lại, chưa hiện công khai. Duyệt để cho hiện,
          hoặc từ chối để ẩn (vẫn lưu lại, xem được ở trang tài khoản người viết). Từ đã khớp được tô đỏ. Tab “Báo cáo”:
          bình luận đang hiện bị người dùng báo cáo là không phù hợp.
        </p>
      </div>

      <HopLoi loi={loi} thuLai={nap} />

      <div role="tablist" className="flex flex-wrap gap-1.5">
        {(
          [
            ["comment", "Bình luận"],
            ["prayer", "Lời nguyện"],
            ["report", "Báo cáo"],
          ] as const
        ).map(([k, ten]) => (
          <Button
            key={k}
            role="tab"
            aria-selected={loai === k}
            size="sm"
            variant={loai === k ? "solid" : "outline"}
            onClick={() => {
              setLoai(k);
              setTrang(1);
            }}
          >
            {ten}
            {dl ? (
              <span className={cn("rounded-full px-1.5 text-xs", dl.counts[k] ? "bg-lacquer text-white" : "opacity-70")}>
                {dl.counts[k] ?? 0}
              </span>
            ) : null}
          </Button>
        ))}
      </div>

      {loai === "report" ? (
        !baoCao ? (
          <p className="text-sm text-muted">Đang tải…</p>
        ) : baoCao.data.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted">Không có bình luận nào bị báo cáo.</Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {baoCao.data.map((b) => {
              const a = b.author;
              const linkTaiKhoan = `${localePath(locale, "/admin/user")}?xem=${encodeURIComponent(a.userId)}&binhLuan=${encodeURIComponent(b.id)}`;
              const linkBai = b.content.slug
                ? `${localePath(locale, `${contentTypeBase[(b.content.type || "article") as keyof typeof contentTypeBase] ?? "/bai-viet"}/${b.content.slug}`)}#binh-luan-${b.id}`
                : "";
              return (
                <li key={b.id}>
                  <Card className="flex flex-col gap-3 p-4">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <Avatar src={a.avatarUrl} name={a.name} size={32} />
                      {xemTaiKhoan ? (
                        <Link href={linkTaiKhoan} className="font-semibold text-ink hover:text-accent hover:underline">
                          {a.name || a.username || "—"}
                        </Link>
                      ) : (
                        <span className="font-semibold text-ink">{a.name || a.username || "—"}</span>
                      )}
                      <Badge tone="neutral">{nhanVaiTro[a.role] ?? a.role}</Badge>
                      <Badge tone={a.warningCount ? "brass" : "neutral"}>
                        Cảnh cáo {a.warningCount}/{CANH_CAO_TOI_DA}
                      </Badge>
                      <Badge tone="accent">{b.reports.length} báo cáo</Badge>
                      <time className="ml-auto text-xs text-muted" dateTime={b.createdAt}>
                        {new Date(b.createdAt).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}
                      </time>
                    </div>
                    <p className="text-xs text-muted">
                      Bình luận ở bài{" "}
                      {linkBai ? (
                        <a href={linkBai} target="_blank" rel="noopener" className="font-medium text-accent hover:underline">
                          {b.content.title || "—"}
                        </a>
                      ) : (
                        <span className="font-medium">(bài đã xoá)</span>
                      )}
                      {b.status !== "visible" ? " · (bình luận đã bị ẩn)" : ""}
                    </p>
                    <p className="whitespace-pre-line rounded-md bg-surface-2 p-3 text-sm leading-relaxed text-body">{b.body}</p>
                    <ul className="flex flex-col gap-1 text-xs">
                      {b.reports.map((r, i) => (
                        <li key={i} className="text-muted">
                          <span className="font-medium text-ink">{r.reporterName || "—"}</span>
                          {r.reason ? <>: “{r.reason}”</> : " (không ghi lý do)"} ·{" "}
                          {new Date(r.createdAt).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}
                        </li>
                      ))}
                    </ul>
                    <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
                      <Button size="sm" className="bg-lacquer text-white hover:bg-lacquer/90" disabled={ban === b.id} onClick={() => xuLy(b, "hide")}>
                        <X aria-hidden /> Ẩn bình luận
                      </Button>
                      <Button size="sm" variant="outline" disabled={ban === b.id} onClick={() => xuLy(b, "dismiss")}>
                        <Check aria-hidden /> Bỏ qua báo cáo
                      </Button>
                      {linkBai ? (
                        <Button size="sm" variant="ghost" asChild>
                          <a href={linkBai} target="_blank" rel="noopener">
                            <ExternalLink aria-hidden /> Mở bài viết
                          </a>
                        </Button>
                      ) : null}
                      {xemTaiKhoan ? (
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={linkTaiKhoan}>
                            <UserRound aria-hidden /> Thông tin tài khoản
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )
      ) : !dl ? (
        <p className="text-sm text-muted">Đang tải…</p>
      ) : dl.data.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted">Không có mục nào chờ duyệt.</Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {dl.data.map((m) => {
            const a = m.author;
            const linkTaiKhoan = `${localePath(locale, "/admin/user")}?xem=${encodeURIComponent(a.userId)}${m.type === "comment" ? `&binhLuan=${encodeURIComponent(m.id)}` : ""}`;
            const linkBai =
              m.type === "comment" && m.content?.slug
                ? `${localePath(locale, `${contentTypeBase[(m.content.type || "article") as keyof typeof contentTypeBase] ?? "/bai-viet"}/${m.content.slug}`)}#binh-luan`
                : m.type === "prayer"
                  ? localePath(locale, "/tu-tap/cau-an-cau-sieu")
                  : "";
            return (
              <li key={m.id}>
                <Card className="flex flex-col gap-3 p-4">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <Avatar src={a.avatarUrl} name={a.name} size={32} />
                    {xemTaiKhoan ? (
                      <Link href={linkTaiKhoan} className="font-semibold text-ink hover:text-accent hover:underline">
                        {a.name || a.username || "—"}
                      </Link>
                    ) : (
                      <span className="font-semibold text-ink">{a.name || a.username || "—"}</span>
                    )}
                    <Badge tone="neutral">{nhanVaiTro[a.role] ?? a.role}</Badge>
                    <Badge tone={a.warningCount ? "brass" : "neutral"}>
                      Cảnh cáo {a.warningCount}/{CANH_CAO_TOI_DA}
                    </Badge>
                    {a.banned ? <Badge tone="accent">Đã khoá</Badge> : null}
                    <time className="ml-auto text-xs text-muted" dateTime={m.createdAt}>
                      {new Date(m.createdAt).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}
                    </time>
                  </div>

                  {m.type === "comment" ? (
                    <p className="text-xs text-muted">
                      {m.parentId ? "Trả lời bình luận ở bài " : "Bình luận ở bài "}
                      {linkBai ? (
                        <a href={linkBai} target="_blank" rel="noopener" className="font-medium text-accent hover:underline">
                          {m.content?.title || "—"}
                        </a>
                      ) : (
                        <span className="font-medium">{m.content?.title || "(bài đã xoá)"}</span>
                      )}
                    </p>
                  ) : m.forName ? (
                    <p className="text-xs text-muted">
                      Lời nguyện cho: <ToTuCam text={m.forName} tu={m.flaggedWords} />
                    </p>
                  ) : (
                    <p className="text-xs text-muted">Lời nguyện</p>
                  )}

                  <p className="whitespace-pre-line rounded-md bg-surface-2 p-3 text-sm leading-relaxed text-body">
                    <ToTuCam text={m.body} tu={m.flaggedWords} />
                  </p>
                  <p className="text-xs text-muted">
                    Từ đã khớp: <span className="font-medium text-lacquer">{m.flaggedWords.join(", ") || "—"}</span>
                  </p>

                  <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
                    <Button size="sm" disabled={ban === m.id} onClick={() => lam(m, "duyet")}>
                      <Check aria-hidden /> Duyệt, cho hiện
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="hover:text-lacquer"
                      disabled={ban === m.id}
                      onClick={() => lam(m, "tuChoi")}
                    >
                      <X aria-hidden /> Từ chối
                    </Button>
                    {linkBai ? (
                      <Button size="sm" variant="ghost" asChild>
                        <a href={linkBai} target="_blank" rel="noopener">
                          <ExternalLink aria-hidden /> {m.type === "comment" ? "Mở bài viết" : "Mở trang lời nguyện"}
                        </a>
                      </Button>
                    ) : null}
                    {xemTaiKhoan ? (
                      <Button size="sm" variant="ghost" asChild>
                        <Link href={linkTaiKhoan}>
                          <UserRound aria-hidden /> Thông tin tài khoản
                        </Link>
                      </Button>
                    ) : null}
                    {xuLyCanhCao && a.warningCount > 0 ? (
                      <Button size="sm" variant="ghost" className="ml-auto" onClick={() => giam(m)}>
                        <ShieldMinus aria-hidden /> Giảm cảnh cáo
                      </Button>
                    ) : null}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {soTrang > 1 ? (
        <div className="flex items-center justify-center gap-3 text-sm">
          <Button size="sm" variant="outline" disabled={trang <= 1} onClick={() => setTrang((t) => t - 1)}>
            Trước
          </Button>
          <span className="text-muted">
            {trang}/{soTrang}
          </span>
          <Button size="sm" variant="outline" disabled={trang >= soTrang} onClick={() => setTrang((t) => t + 1)}>
            Sau
          </Button>
        </div>
      ) : null}
    </div>
  );
}
