"use client";

import * as React from "react";
import { Check, Lock, RotateCcw } from "lucide-react";
import { Badge, Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { HopLoi, chuLoi, useLocale } from "@/components/admin/admin-shell";
import {
  khoiPhucPhanQuyen,
  layPhanQuyen,
  luuPhanQuyen,
  type BangPhanQuyen,
  type MucQuyen,
} from "@/lib/admin-api";
import { cn } from "@/lib/utils";

/**
 * Trang /admin/roles — ma trận quyền × vai trò, tick ô nào vai trò có quyền đó.
 *
 * Mọi thay đổi chỉ là bản nháp trên trình duyệt cho tới khi bấm Lưu; lúc đó
 * mỗi vai trò có thay đổi được gửi một lần. Ô nào bị khoá là do BACKEND nói
 * vậy (`editable`, `actorPermissions`) — tự suy luật ở đây sẽ lệch với luật
 * thật trong Backend/api/controllers/System/Admin/RolesController.js.
 */

type Nhap = Record<string, string[]>;

const ngayGio = (ms?: number) =>
  ms
    ? new Date(ms).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const giongNhau = (a: string[], b: string[]) =>
  a.length === b.length && a.every((x) => b.includes(x));

export function RolesPanel() {
  const locale = useLocale();

  const [bang, setBang] = React.useState<BangPhanQuyen | null>(null);
  const [nhap, setNhap] = React.useState<Nhap>({});
  const [lyDo, setLyDo] = React.useState("");
  const [dangTai, setDangTai] = React.useState(true);
  const [dangLuu, setDangLuu] = React.useState(false);
  const [loi, setLoi] = React.useState("");
  const [daLuu, setDaLuu] = React.useState(false);

  const nhanBang = React.useCallback((kq: BangPhanQuyen) => {
    setBang(kq);
    setNhap(kq.grants);
  }, []);

  const nap = React.useCallback(() => {
    setDangTai(true);
    setLoi("");
    layPhanQuyen(locale)
      .then(nhanBang)
      .catch((err) => setLoi(chuLoi(err, "Không tải được bảng phân quyền.")))
      .finally(() => setDangTai(false));
  }, [locale, nhanBang]);

  React.useEffect(nap, [nap]);

  if (dangTai && !bang) return <p className="py-8 text-sm text-muted">Đang tải…</p>;
  if (!bang) return <HopLoi loi={loi || "Không tải được bảng phân quyền."} thuLai={nap} />;

  const coTheCap = new Set(bang.actorPermissions);
  const nhanQuyen = Object.fromEntries(bang.catalog.map((m) => [m.key, m.label]));
  const nhanVaiTro = Object.fromEntries(bang.roles.map((r) => [r.key, r.label]));

  const vaiTroDoi = bang.roles.filter(
    (r) => r.editable && !giongNhau(nhap[r.key] ?? [], bang.grants[r.key] ?? []),
  );

  const nhom: { ten: string; muc: MucQuyen[] }[] = [];
  for (const muc of bang.catalog) {
    const cuoi = nhom[nhom.length - 1];
    if (cuoi?.ten === muc.group) cuoi.muc.push(muc);
    else nhom.push({ ten: muc.group, muc: [muc] });
  }

  function bat(role: string, quyen: string, co: boolean) {
    setNhap((cu) => {
      const ds = cu[role] ?? [];
      return { ...cu, [role]: co ? [...ds, quyen] : ds.filter((q) => q !== quyen) };
    });
  }

  async function luu() {
    setDangLuu(true);
    setLoi("");
    try {
      let moiNhat: BangPhanQuyen | null = null;
      // Lần lượt từng vai trò: lỗi ở vai trò sau không làm mất phần đã lưu
      // của vai trò trước, và bảng nạp lại vẫn đúng với CSDL.
      for (const r of vaiTroDoi) {
        moiNhat = await luuPhanQuyen(
          { role: r.key, permissions: nhap[r.key] ?? [], reason: lyDo },
          locale,
        );
      }
      if (moiNhat) nhanBang(moiNhat);
      setLyDo("");
      setDaLuu(true);
      setTimeout(() => setDaLuu(false), 2500);
    } catch (err) {
      setLoi(chuLoi(err));
      nap();
    } finally {
      setDangLuu(false);
    }
  }

  async function khoiPhuc(role: string) {
    if (!window.confirm(`Đưa quyền của “${nhanVaiTro[role]}” về mặc định?`)) return;

    setDangLuu(true);
    setLoi("");
    try {
      nhanBang(await khoiPhucPhanQuyen({ role, reason: lyDo }, locale));
    } catch (err) {
      setLoi(chuLoi(err));
    } finally {
      setDangLuu(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <HopLoi loi={loi} />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[46rem] text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-2 align-bottom text-xs text-muted">
                <th className="px-4 py-3 text-left font-medium uppercase tracking-wide">Quyền</th>
                {bang.roles.map((r) => (
                  <th key={r.key} className="w-28 px-2 py-3 text-center font-medium">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[13px] font-semibold text-ink">{r.label}</span>
                      {r.locked ? (
                        <Badge tone="accent" title="Luôn đủ mọi quyền">
                          <Lock className="mr-1 size-3" aria-hidden /> Khoá
                        </Badge>
                      ) : r.custom ? (
                        <Badge
                          tone="brass"
                          title={`Chỉnh bởi ${r.updatedBy || "—"} lúc ${ngayGio(r.updatedAt)}`}
                        >
                          Đã chỉnh
                        </Badge>
                      ) : (
                        <Badge>Mặc định</Badge>
                      )}
                      {r.custom && r.editable ? (
                        <button
                          type="button"
                          onClick={() => khoiPhuc(r.key)}
                          disabled={dangLuu}
                          className="flex items-center gap-1 text-[11px] text-muted underline-offset-2 hover:text-ink hover:underline disabled:opacity-50"
                        >
                          <RotateCcw className="size-3" aria-hidden /> Mặc định
                        </button>
                      ) : null}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {nhom.map((g) => (
              <tbody key={g.ten}>
                <tr className="border-b border-line">
                  <th
                    colSpan={bang.roles.length + 1}
                    className="bg-surface-2/50 px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-accent"
                  >
                    {g.ten}
                  </th>
                </tr>
                {g.muc.map((muc) => (
                  <tr key={muc.key} className="border-b border-line last:border-0">
                    <td className="px-4 py-2.5">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-ink">{muc.label}</span>
                        <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
                          <code title={muc.endpoints.join("\n") || undefined}>{muc.key}</code>
                          {muc.endpoints.length === 0 ? (
                            <Badge title="Chưa có API nào kiểm tra quyền này — tick cũng chưa có tác dụng">
                              chưa dùng
                            </Badge>
                          ) : null}
                        </span>
                      </div>
                    </td>

                    {bang.roles.map((r) => {
                      const daLuuCo = (bang.grants[r.key] ?? []).includes(muc.key);
                      const dangCo = (nhap[r.key] ?? []).includes(muc.key);
                      // Bỏ tick thì luôn được; tick thêm chỉ khi chính mình có quyền đó.
                      const khoa = !r.editable || (!dangCo && !coTheCap.has(muc.key));

                      return (
                        <td
                          key={r.key}
                          className={cn(
                            "px-2 py-2.5 text-center",
                            dangCo !== daLuuCo && "bg-accent-soft/60",
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={dangCo}
                            disabled={khoa || dangLuu}
                            onChange={(e) => bat(r.key, muc.key, e.target.checked)}
                            aria-label={`${r.label}: ${muc.label}`}
                            className="size-4 accent-accent disabled:opacity-40"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
      </Card>

      <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-end">
        <Field
          id="pq-reason"
          label="Lý do thay đổi"
          hint="Ghi vào nhật ký bên dưới, kèm người thao tác và địa chỉ IP"
          className="flex-1"
        >
          {(p) => (
            <Input {...p} value={lyDo} onChange={(e) => setLyDo(e.target.value)} maxLength={200} />
          )}
        </Field>

        <div className="flex items-center gap-2 sm:pb-6">
          {daLuu ? (
            <span className="flex items-center gap-1.5 text-sm text-accent">
              <Check className="size-4" aria-hidden /> Đã lưu
            </span>
          ) : null}
          <Button
            variant="outline"
            disabled={!vaiTroDoi.length || dangLuu}
            onClick={() => setNhap(bang.grants)}
          >
            Huỷ
          </Button>
          <Button disabled={!vaiTroDoi.length || dangLuu} onClick={luu}>
            {dangLuu
              ? "Đang lưu…"
              : vaiTroDoi.length
                ? `Lưu ${vaiTroDoi.length} vai trò`
                : "Lưu thay đổi"}
          </Button>
        </div>
      </Card>

      <Card className="flex flex-col gap-3 p-5">
        <h2 className="font-serif text-lg font-bold">Nhật ký phân quyền</h2>
        {bang.log.length === 0 ? (
          <p className="text-sm text-muted">Chưa có lần chỉnh nào.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line text-sm">
            {bang.log.map((dong) => (
              <li key={dong.id} className="flex flex-col gap-1 py-2.5">
                <span className="text-xs text-muted">
                  {ngayGio(dong.createdAt)} · <b className="text-ink">{dong.actorUsername}</b>
                  {" → "}
                  {nhanVaiTro[dong.role] ?? dong.role}
                  {dong.reset ? " · khôi phục mặc định" : ""}
                </span>
                {dong.added.length ? (
                  <span className="text-accent">
                    + {dong.added.map((q) => nhanQuyen[q] ?? q).join(", ")}
                  </span>
                ) : null}
                {dong.removed.length ? (
                  <span className="text-lacquer">
                    − {dong.removed.map((q) => nhanQuyen[q] ?? q).join(", ")}
                  </span>
                ) : null}
                {dong.reason ? <span className="text-muted">“{dong.reason}”</span> : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
