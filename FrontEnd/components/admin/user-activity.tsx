"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, BookOpen, ExternalLink, Flame, MessageSquare, Sparkles, Wind } from "lucide-react";
import { Badge, Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { HopLoi, chuLoi, useLocale, useQuyen } from "@/components/admin/admin-shell";
import { DisciplinePanel } from "@/components/admin/discipline-panel";
import {
  layHoatDongNguoiDung,
  nhanDanhMucThuVien,
  nhanLoai,
  nhanTrangThai,
  nhanVaiTro,
  type HoatDongNguoiDung,
} from "@/lib/admin-api";
import { localePath } from "@/lib/i18n";
import { contentTypeBase } from "@/lib/site";
import { cn } from "@/lib/utils";

const TEN_TU_TAP: Record<string, { ten: string; donVi: string }> = {
  "tung-kinh": { ten: "Tụng kinh", donVi: "lần" },
  "niem-phat": { ten: "Niệm Phật", donVi: "câu" },
  thien: { ten: "Thiền định", donVi: "phút" },
  "go-mo": { ten: "Gõ mõ", donVi: "tiếng" },
  "chuoi-hat": { ten: "Lần tràng hạt", donVi: "hạt" },
};
const TEN_CONG_DUC: Record<string, string> = {
  checkin: "Điểm danh",
  comment: "Bình luận",
  "reply-received": "Được trả lời",
  "content-approved": "Bài được duyệt",
  "views-100": "Mốc 100 lượt xem",
  practice: "Tu tập",
  prayer: "Lời nguyện",
};
const TT_BINH_LUAN: Record<string, { ten: string; tone: "neutral" | "accent" | "brass" }> = {
  visible: { ten: "Đang hiện", tone: "accent" },
  hidden: { ten: "Đã xoá / ẩn", tone: "neutral" },
  flagged: { ten: "Bị giữ (từ cấm)", tone: "brass" },
};

const soTuTap = (type: string, n: number) => (type === "thien" ? Math.round(n / 60) : n);
const ngayGio = (iso: string) =>
  iso ? new Date(iso).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
const ngay = (iso: string) => (iso ? new Date(iso).toLocaleDateString("vi-VN") : "—");

/**
 * /admin/user/hoat-dong?id=... - mọi thứ về một tài khoản trên một trang: hồ
 * sơ, công đức, quá trình tu tập, bài viết đóng góp, bình luận (mới đến cũ,
 * mọi trạng thái, phân trang), lời nguyện; kèm khối Kỷ luật nếu có quyền.
 */
export function UserActivity() {
  const locale = useLocale();
  const quyen = useQuyen();
  const id = useSearchParams().get("id") ?? "";
  const [trangBl, setTrangBl] = React.useState(1);
  const [dl, setDl] = React.useState<HoatDongNguoiDung | null>(null);
  const [loi, setLoi] = React.useState("");

  const nap = React.useCallback(() => {
    if (!id) return setLoi("Thiếu id tài khoản.");
    setLoi("");
    layHoatDongNguoiDung(id, trangBl, locale)
      .then(setDl)
      .catch((e) => setLoi(chuLoi(e, "Không tải được hoạt động của tài khoản.")));
  }, [id, trangBl, locale]);
  React.useEffect(nap, [nap]);

  if (loi) return <HopLoi loi={loi} thuLai={nap} />;
  if (!dl) return <p className="text-sm text-muted">Đang tải…</p>;

  const u = dl.user;
  const lp = (p: string) => localePath(locale, p);
  const soTrangBl = Math.max(1, Math.ceil(dl.comments.total / dl.comments.limit));
  const queQuan = [u.profile?.hometown?.detail, u.profile?.hometown?.province].filter(Boolean).join(", ");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`${lp("/admin/user")}?xem=${encodeURIComponent(u.id)}`}>
            <ArrowLeft aria-hidden /> Danh sách người dùng
          </Link>
        </Button>
      </div>

      {/* Hồ sơ */}
      <Card className="flex flex-wrap items-center gap-4 p-5">
        <Avatar src={u.avatarUrl} name={u.name} size={64} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-serif text-2xl font-bold text-ink">{u.name || u.username}</h1>
            <Badge tone={u.role === "Admin" ? "accent" : "neutral"}>{nhanVaiTro[u.role] ?? u.role}</Badge>
            {u.banned ? <Badge className="bg-lacquer/15 text-lacquer">Đã khoá</Badge> : null}
            {u.warningCount ? <Badge tone="brass">Cảnh cáo {u.warningCount}/5</Badge> : null}
          </div>
          <p className="text-sm text-muted">
            @{u.username}
            {u.email ? ` · ${u.email}` : ""}
            {u.dharmaName ? ` · Pháp danh: ${u.dharmaName}` : ""}
            {u.profile?.nickname ? ` · Biệt danh: ${u.profile.nickname}` : ""}
            {queQuan ? ` · ${queQuan}` : ""}
          </p>
          <p className="text-xs text-muted">
            Tham gia {ngay(u.createdAt)}
            {u.lastLogin ? ` · Đăng nhập gần nhất ${ngayGio(u.lastLogin)}` : ""}
          </p>
        </div>
      </Card>

      {/* Số liệu nhanh */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {(
          [
            [Sparkles, "Công đức", dl.merit.total],
            [Flame, "Ngày điểm danh", dl.checkinDays],
            [Wind, "Buổi tu tập", dl.practice.totals.reduce((s, t) => s + t.sessions, 0)],
            [BookOpen, "Bài đóng góp", dl.contents.length],
            [MessageSquare, "Bình luận", dl.comments.total],
          ] as const
        ).map(([Icon, nhan, so]) => (
          <Card key={nhan} className="flex flex-col gap-1 p-4">
            <span className="flex items-center gap-1.5 text-xs text-muted">
              <Icon className="size-3.5" aria-hidden /> {nhan}
            </span>
            <span className="font-serif text-2xl font-bold tabular-nums text-ink">{so.toLocaleString("vi-VN")}</span>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Quá trình tu tập */}
        <Card className="flex flex-col gap-3 p-5">
          <h2 className="font-serif text-lg font-bold">Quá trình tu tập</h2>
          {dl.practice.totals.length ? (
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {dl.practice.totals.map((t) => (
                <div key={t.type} className="rounded-md bg-surface-2 p-3">
                  <dt className="text-xs text-muted">{TEN_TU_TAP[t.type]?.ten ?? t.type}</dt>
                  <dd className="text-lg font-bold tabular-nums text-ink">
                    {soTuTap(t.type, t.amount).toLocaleString("vi-VN")}{" "}
                    <span className="text-xs font-normal text-muted">{TEN_TU_TAP[t.type]?.donVi}</span>
                  </dd>
                  <dd className="text-[11px] text-muted">
                    {t.sessions} buổi · gần nhất {ngay(t.last)}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-muted">Chưa có buổi tu tập nào được lưu.</p>
          )}
          {dl.practice.recent.length ? (
            <details className="text-sm">
              <summary className="cursor-pointer text-accent">Nhật ký gần đây ({dl.practice.recent.length})</summary>
              <ul className="mt-2 flex max-h-72 flex-col divide-y divide-line overflow-y-auto">
                {dl.practice.recent.map((l) => (
                  <li key={l.id} className="flex flex-wrap gap-x-2 py-1.5">
                    <span className="font-medium text-ink">{TEN_TU_TAP[l.type]?.ten ?? l.type}</span>
                    <span className="tabular-nums text-accent">
                      {soTuTap(l.type, l.amount).toLocaleString("vi-VN")} {TEN_TU_TAP[l.type]?.donVi}
                    </span>
                    {l.note ? <span className="text-muted">· {l.note}</span> : null}
                    <span className="ml-auto text-xs text-muted">{ngayGio(l.createdAt)}</span>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </Card>

        {/* Công đức */}
        <Card className="flex flex-col gap-3 p-5">
          <h2 className="font-serif text-lg font-bold">
            Công đức <span className="text-accent">{dl.merit.total.toLocaleString("vi-VN")}</span>
            <span className="ml-2 text-sm font-normal text-muted">(hôm nay +{dl.merit.today})</span>
          </h2>
          {Object.keys(dl.merit.byAction).length ? (
            <ul className="flex flex-col divide-y divide-line text-sm">
              {Object.entries(dl.merit.byAction).map(([a, v]) => (
                <li key={a} className="flex justify-between py-1.5">
                  <span className="text-body">
                    {TEN_CONG_DUC[a] ?? a} <span className="text-xs text-muted">×{v.times}</span>
                  </span>
                  <span className="font-semibold tabular-nums text-accent">+{v.points}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Chưa có công đức.</p>
          )}
        </Card>
      </div>

      {/* Bài viết đóng góp */}
      <Card className="flex flex-col gap-3 p-5">
        <h2 className="font-serif text-lg font-bold">Bài viết & nội dung đóng góp ({dl.contents.length})</h2>
        {dl.contents.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                  <th className="py-2 pr-3 font-medium">Tiêu đề</th>
                  <th className="py-2 pr-3 font-medium">Trạng thái</th>
                  <th className="py-2 pr-3 text-right font-medium">Lượt xem</th>
                  <th className="py-2 pr-3 font-medium">Gửi</th>
                  <th className="py-2 font-medium">Duyệt</th>
                </tr>
              </thead>
              <tbody>
                {dl.contents.map((b) => (
                  <tr key={b.id} className="border-b border-line last:border-0">
                    <td className="py-2 pr-3">
                      {b.status === "published" ? (
                        <a
                          href={lp(`${contentTypeBase[b.type]}/${b.slug}`)}
                          target="_blank"
                          rel="noopener"
                          className="font-medium text-ink hover:text-accent hover:underline"
                        >
                          {b.title}
                        </a>
                      ) : (
                        <span className="font-medium text-ink">{b.title}</span>
                      )}
                      <span className="block text-xs text-muted">
                        {b.type === "library" ? `Thư viện · ${nhanDanhMucThuVien[b.libraryKind] ?? ""}` : nhanLoai[b.type] ?? b.type}
                      </span>
                    </td>
                    <td className="py-2 pr-3">
                      <Badge tone={b.status === "published" ? "accent" : b.status === "pending" ? "brass" : "neutral"}>
                        {nhanTrangThai[b.status]}
                      </Badge>
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">{b.viewCount.toLocaleString("vi-VN")}</td>
                    <td className="py-2 pr-3 text-xs tabular-nums text-muted">{ngay(b.createdAt)}</td>
                    <td className="py-2 text-xs text-muted">
                      {b.approvedAt ? `${ngay(b.approvedAt)}${b.approvedByName ? ` · ${b.approvedByName}` : ""}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted">Chưa đóng góp bài nào.</p>
        )}
      </Card>

      {/* Bình luận mới đến cũ */}
      <Card className="flex flex-col gap-3 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-serif text-lg font-bold">Bình luận ({dl.comments.total})</h2>
          <span className="text-xs text-muted">
            Đang hiện {dl.comments.byStatus.visible} · đã xoá {dl.comments.byStatus.hidden} · bị giữ{" "}
            {dl.comments.byStatus.flagged}
          </span>
        </div>
        {dl.comments.data.length ? (
          <ul className="flex flex-col divide-y divide-line">
            {dl.comments.data.map((c) => {
              const tt = TT_BINH_LUAN[c.status] ?? TT_BINH_LUAN.visible;
              const linkBai = c.content.slug
                ? `${lp(`${contentTypeBase[(c.content.type || "article") as keyof typeof contentTypeBase] ?? "/bai-viet"}/${c.content.slug}`)}#binh-luan-${c.id}`
                : "";
              return (
                <li key={c.id} className="flex flex-col gap-1 py-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                    <Badge tone={tt.tone}>{tt.ten}</Badge>
                    <span>{c.parentId ? "Trả lời ở" : "Bình luận ở"}</span>
                    {linkBai ? (
                      <a href={linkBai} target="_blank" rel="noopener" className="flex items-center gap-1 font-medium text-accent hover:underline">
                        {c.content.title || "—"} <ExternalLink className="size-3" aria-hidden />
                      </a>
                    ) : (
                      <span>(bài đã xoá)</span>
                    )}
                    <span className="ml-auto">{ngayGio(c.createdAt)}</span>
                  </div>
                  <p className={cn("whitespace-pre-line text-sm", c.status === "visible" ? "text-body" : "text-muted")}>{c.body}</p>
                  {c.flaggedWords.length ? (
                    <span className="text-xs text-lacquer">Từ cấm: {c.flaggedWords.join(", ")}</span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted">Chưa có bình luận nào.</p>
        )}
        {soTrangBl > 1 ? (
          <div className="flex items-center justify-center gap-3 text-sm">
            <Button size="sm" variant="outline" disabled={trangBl <= 1} onClick={() => setTrangBl((t) => t - 1)}>
              Mới hơn
            </Button>
            <span className="text-muted">
              {trangBl}/{soTrangBl}
            </span>
            <Button size="sm" variant="outline" disabled={trangBl >= soTrangBl} onClick={() => setTrangBl((t) => t + 1)}>
              Cũ hơn
            </Button>
          </div>
        ) : null}
      </Card>

      {/* Lời nguyện */}
      {dl.prayers.length ? (
        <Card className="flex flex-col gap-3 p-5">
          <h2 className="font-serif text-lg font-bold">Lời nguyện gần đây ({dl.prayers.length})</h2>
          <ul className="flex flex-col divide-y divide-line text-sm">
            {dl.prayers.map((p) => (
              <li key={p.id} className="flex flex-col gap-0.5 py-2">
                <span className="flex flex-wrap items-center gap-2 text-xs text-muted">
                  <Badge tone={p.status === "visible" ? "accent" : p.status === "flagged" ? "brass" : "neutral"}>
                    {p.status === "visible" ? "Đang hiện" : p.status === "flagged" ? "Bị giữ" : "Đã ẩn"}
                  </Badge>
                  {p.anonymous ? <span>Ẩn danh</span> : null}
                  {p.forName ? <span>Cho: {p.forName}</span> : null}
                  <span className="ml-auto">{ngayGio(p.createdAt)}</span>
                </span>
                <p className="whitespace-pre-line text-body">{p.body}</p>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {quyen.includes("moderation.manage") ? <DisciplinePanel userId={u.id} /> : null}
    </div>
  );
}
