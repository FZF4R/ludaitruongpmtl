"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Search, Check, Activity } from "lucide-react";
import { localePath } from "@/lib/i18n";
import { Badge, Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { HopLoi, chuLoi, useLocale, useQuyen } from "@/components/admin/admin-shell";
import { DisciplinePanel } from "@/components/admin/discipline-panel";
import {
  coQuyen,
  layDanhSachNguoiDung,
  layNguoiDung,
  luuNguoiDung,
  nhanVaiTro,
  type NguoiDungChiTiet,
  type NguoiDungTomTat,
} from "@/lib/admin-api";

/**
 * Trang /admin/user — danh sách tài khoản bên trái, chi tiết + sửa bên phải.
 *
 * Vai trò gán được KHÔNG viết cứng ở đây: backend trả `assignableRoles` theo
 * đúng bậc của người đang thao tác. Tự dựng danh sách ở trình duyệt sẽ bày ra
 * những lựa chọn mà API từ chối ngay sau khi bấm lưu.
 */

const MOI_TRANG = 20;

const ngay = (ms?: number) =>
  ms ? new Date(ms).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

/** getListDataNative trả `_id` của Mongo chứ không phải `id` của Waterline. */
const layId = (u: NguoiDungTomTat) => String(u.id ?? u._id ?? "");

export function UserPanel() {
  const locale = useLocale();
  // Danh sách chỉ cần `user.list`; mở chi tiết (lộ email, khảo sát) cần thêm `user.manage`.
  const xemChiTiet = coQuyen(useQuyen(), "user.manage");

  const [tuKhoa, setTuKhoa] = React.useState("");
  const [daGui, setDaGui] = React.useState("");
  const [trang, setTrang] = React.useState(1);

  const [danhSach, setDanhSach] = React.useState<NguoiDungTomTat[]>([]);
  const [tong, setTong] = React.useState(0);
  const [dangTai, setDangTai] = React.useState(true);
  const [loi, setLoi] = React.useState("");

  // ?xem=<id> (vd: bấm vào bình luận vi phạm ở trang bài viết) mở thẳng người đó;
  // ?binhLuan=<id> làm nổi bình luận vi phạm tương ứng trong khối Kỷ luật.
  const thamSo = useSearchParams();
  const binhLuanId = thamSo.get("binhLuan");
  const [dangChon, setDangChon] = React.useState<string | null>(thamSo.get("xem"));

  const nap = React.useCallback(() => {
    setDangTai(true);
    setLoi("");
    layDanhSachNguoiDung({ search: daGui, page: trang, limit: MOI_TRANG }, locale)
      .then((kq) => {
        setDanhSach(kq.data ?? []);
        setTong(kq.total ?? 0);
      })
      .catch((err) => setLoi(chuLoi(err, "Không tải được danh sách tài khoản.")))
      .finally(() => setDangTai(false));
  }, [daGui, trang, locale]);

  React.useEffect(nap, [nap]);

  const soTrang = Math.max(1, Math.ceil(tong / MOI_TRANG));

  return (
    <div className="flex flex-col gap-5">
      <HopLoi loi={loi} thuLai={nap} />

      <form
        className="flex max-w-md gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setTrang(1);
          setDaGui(tuKhoa.trim());
        }}
      >
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <Input
            value={tuKhoa}
            onChange={(e) => setTuKhoa(e.target.value)}
            placeholder="Tìm theo tên tài khoản, email, họ tên…"
            aria-label="Tìm tài khoản"
            className="pl-9"
          />
        </div>
        <Button type="submit">Tìm</Button>
      </form>

      <div
        className={
          "grid gap-5 " + (xemChiTiet ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]" : "")
        }
      >
        <Card className="flex flex-col overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-2 text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-2.5 font-medium">Tài khoản</th>
                  <th className="px-4 py-2.5 font-medium">Vai trò</th>
                  <th className="px-4 py-2.5 font-medium">Tạo ngày</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {dangTai ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted">
                      Đang tải…
                    </td>
                  </tr>
                ) : danhSach.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted">
                      Không có tài khoản nào khớp.
                    </td>
                  </tr>
                ) : (
                  danhSach.map((u) => {
                    const id = layId(u);

                    return (
                      <tr
                        key={id}
                        // Bấm cả dòng để mở chi tiết (nút / link bên trong tự chặn lan sự kiện).
                        onClick={xemChiTiet ? () => setDangChon(id) : undefined}
                        className={
                          "border-b border-line last:border-0 " +
                          (xemChiTiet ? "cursor-pointer hover:bg-surface-2/60 " : "") +
                          (dangChon === id ? "bg-accent-soft/50" : "")
                        }
                      >
                        <td className="px-4 py-2.5">
                          <div className="flex flex-col">
                            <span className="font-medium text-ink">{u.username}</span>
                            <span className="text-xs text-muted">
                              {u.fullName || "—"}
                              {u.email ? ` · ${u.email}` : ""}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="flex flex-wrap gap-1">
                            <Badge tone={u.role === "Admin" ? "accent" : "neutral"}>
                              {nhanVaiTro[u.role ?? ""] ?? u.role ?? "—"}
                            </Badge>
                            {u.status === 2 ? (
                              <Badge className="bg-lacquer/15 text-lacquer">Đã khoá</Badge>
                            ) : null}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 tabular-nums text-muted">{ngay(u.createdAt)}</td>
                        <td className="px-4 py-2.5 text-right">
                          <span className="inline-flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                            {xemChiTiet ? (
                              <Button size="sm" variant="outline" onClick={() => setDangChon(id)}>
                                Xem
                              </Button>
                            ) : null}
                            {/* Toàn bộ hoạt động: mở tab mới để vẫn giữ danh sách. */}
                            <Button size="sm" variant="ghost" asChild>
                              <a
                                href={`${localePath(locale, "/admin/user/hoat-dong")}?id=${encodeURIComponent(id)}`}
                                target="_blank"
                                rel="noopener"
                              >
                                <Activity aria-hidden /> Hoạt động
                              </a>
                            </Button>
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {soTrang > 1 ? (
            <div className="flex items-center justify-between border-t border-line px-4 py-3 text-sm">
              <span className="text-muted">
                Trang {trang}/{soTrang} · {tong} tài khoản
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={trang <= 1}
                  onClick={() => setTrang((t) => t - 1)}
                >
                  Trước
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={trang >= soTrang}
                  onClick={() => setTrang((t) => t + 1)}
                >
                  Sau
                </Button>
              </div>
            </div>
          ) : null}
        </Card>

        {xemChiTiet ? <ChiTiet id={dangChon} binhLuanId={binhLuanId} onLuuXong={nap} /> : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ChiTiet({
  id,
  binhLuanId,
  onLuuXong,
}: {
  id: string | null;
  binhLuanId: string | null;
  onLuuXong: () => void;
}) {
  const locale = useLocale();
  const xuLyViPham = coQuyen(useQuyen(), "moderation.manage");

  const [nd, setNd] = React.useState<NguoiDungChiTiet | null>(null);
  const [dangTai, setDangTai] = React.useState(false);
  const [loi, setLoi] = React.useState("");
  const [dangLuu, setDangLuu] = React.useState(false);
  const [daLuu, setDaLuu] = React.useState(false);

  const [email, setEmail] = React.useState("");
  const [hoTen, setHoTen] = React.useState("");
  const [vaiTro, setVaiTro] = React.useState("");
  const [lyDo, setLyDo] = React.useState("");

  React.useEffect(() => {
    if (!id) {
      setNd(null);
      return;
    }

    let conSong = true;
    setDangTai(true);
    setLoi("");
    layNguoiDung(id, locale)
      .then((kq) => {
        if (!conSong) return;
        setNd(kq);
        setEmail(kq.email);
        setHoTen(kq.fullName);
        setVaiTro(kq.role);
        setLyDo("");
      })
      .catch((err) => conSong && setLoi(chuLoi(err, "Không tải được tài khoản.")))
      .finally(() => conSong && setDangTai(false));

    return () => {
      conSong = false;
    };
  }, [id, locale]);

  if (!id) {
    return (
      <Card className="flex items-center justify-center p-8 text-center text-sm text-muted">
        Chọn một tài khoản ở danh sách để xem chi tiết.
      </Card>
    );
  }

  if (dangTai) return <Card className="p-6 text-sm text-muted">Đang tải…</Card>;
  if (!nd) return <HopLoi loi={loi || "Không tải được tài khoản."} />;

  const doiVaiTro = vaiTro !== nd.role;
  // Vai trò hiện tại luôn nằm trong ô chọn dù backend không cho gán lại nó,
  // nếu không thì ô chọn hiện sai vai trò của người đang xem.
  const luaChonVaiTro = Array.from(new Set([nd.role, ...nd.assignableRoles]));

  const ks = (nd.profile?.survey ?? {}) as Record<string, unknown>;
  const queQuan = [nd.profile?.hometown?.detail, nd.profile?.hometown?.province]
    .filter(Boolean)
    .join(", ");

  return (
    <Card className="flex flex-col gap-5 p-6">
      <div className="flex flex-col gap-0.5">
        <h2 className="font-serif text-lg font-bold">{nd.username}</h2>
        <p className="text-xs text-muted">
          Tạo {ngay(nd.createdAt)} · {nd.status === 1 ? "đang hoạt động" : "đã khoá"}
          {nd.googleId ? " · Google" : ""}
          {nd.facebookId ? " · Facebook" : ""}
          {nd.isNotVerified ? " · Chưa xác minh (tự đăng ký)" : ""}
        </p>
        <a
          href={`${localePath(locale, "/admin/user/hoat-dong")}?id=${encodeURIComponent(nd.id)}`}
          target="_blank"
          rel="noopener"
          className="mt-1 flex w-fit items-center gap-1.5 text-sm font-medium text-accent hover:underline"
        >
          <Activity className="size-4" aria-hidden /> Xem toàn bộ hoạt động (tu tập, bài viết, bình luận) ↗
        </a>
      </div>

      <HopLoi loi={loi} />

      <form
        className="flex flex-col gap-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setDangLuu(true);
          setLoi("");
          try {
            await luuNguoiDung(
              { id: nd.id, email, fullName: hoTen, role: vaiTro, reason: lyDo },
              locale,
            );
            setDaLuu(true);
            setTimeout(() => setDaLuu(false), 2500);
            onLuuXong();
          } catch (err) {
            setLoi(chuLoi(err));
          } finally {
            setDangLuu(false);
          }
        }}
      >
        <Field id="u-email" label="Email">
          {(p) => (
            <Input
              {...p}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={160}
            />
          )}
        </Field>

        <Field id="u-name" label="Họ và tên">
          {(p) => (
            <Input {...p} value={hoTen} onChange={(e) => setHoTen(e.target.value)} maxLength={80} />
          )}
        </Field>

        <Field
          id="u-role"
          label="Vai trò"
          hint="Chỉ hiện những vai trò bạn được phép gán. Không ai tự đổi vai trò của chính mình."
        >
          {(p) => (
            <Select {...p} value={vaiTro} onChange={(e) => setVaiTro(e.target.value)}>
              {luaChonVaiTro.map((r) => (
                <option key={r} value={r}>
                  {nhanVaiTro[r] ?? r}
                </option>
              ))}
            </Select>
          )}
        </Field>

        {doiVaiTro ? (
          <Field id="u-reason" label="Lý do đổi vai trò" hint="Ghi vào nhật ký, để tra lại sau này">
            {(p) => (
              <Input {...p} value={lyDo} onChange={(e) => setLyDo(e.target.value)} maxLength={200} />
            )}
          </Field>
        ) : null}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={dangLuu}>
            {dangLuu ? "Đang lưu…" : "Lưu thay đổi"}
          </Button>
          {daLuu ? (
            <span className="flex items-center gap-1.5 text-sm text-accent">
              <Check className="size-4" aria-hidden /> Đã lưu
            </span>
          ) : null}
        </div>
      </form>

      <div className="flex flex-col gap-2 border-t border-line pt-4">
        <h3 className="text-sm font-semibold text-ink">Hồ sơ Phật tử</h3>
        {nd.profile ? (
          <dl className="flex flex-col gap-1.5 text-sm">
            <Dong nhan="Pháp danh" giaTri={nd.profile.dharmaName} />
            <Dong nhan="Biệt danh" giaTri={nd.profile.nickname} />
            <Dong nhan="Quê quán" giaTri={queQuan} />
            <Dong nhan="Đã quy y" giaTri={String(ks.refuge ?? "")} />
            <Dong nhan="Pháp môn" giaTri={(ks.practices as string[] | undefined)?.join(", ") ?? ""} />
            <Dong nhan="Tần suất" giaTri={String(ks.frequency ?? "")} />
          </dl>
        ) : (
          <p className="text-sm text-muted">Người này chưa khai hồ sơ.</p>
        )}
      </div>

      {xuLyViPham ? <DisciplinePanel key={nd.id} userId={nd.id} binhLuanId={binhLuanId} /> : null}
    </Card>
  );
}

function Dong({ nhan, giaTri }: { nhan: string; giaTri: string }) {
  return (
    <div className="flex gap-3">
      <dt className="w-24 shrink-0 text-muted">{nhan}</dt>
      <dd className="text-ink">{giaTri || "—"}</dd>
    </div>
  );
}
