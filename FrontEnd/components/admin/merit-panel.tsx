"use client";

import * as React from "react";
import { Check, RotateCcw, Trash2, Upload } from "lucide-react";
import { Badge, Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Field, Input } from "@/components/ui/form";
import { HopLoi, chuLoi, useLocale } from "@/components/admin/admin-shell";
import { urlApi } from "@/lib/auth";
import {
  layCongDucQT,
  luuLoiNhan,
  luuQuyTacCongDuc,
  luuUngHo,
  nhanVaiTro,
  type CongDucQT,
  type QuyTacCongDucQT,
  type UngHoQT,
} from "@/lib/admin-api";

const QR_TOI_DA = 1.5 * 1024 * 1024;

/** /admin/merit: bảng điểm công đức (sửa điểm, trần mỗi ngày, bật/tắt), bảng xếp hạng, thông tin ủng hộ. */
export function MeritPanel() {
  const locale = useLocale();
  const [dl, setDl] = React.useState<CongDucQT | null>(null);
  const [loi, setLoi] = React.useState("");

  const nap = React.useCallback(() => {
    setLoi("");
    layCongDucQT(locale)
      .then(setDl)
      .catch((e) => setLoi(chuLoi(e, "Không tải được dữ liệu công đức.")));
  }, [locale]);
  React.useEffect(nap, [nap]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="font-serif text-2xl font-bold tracking-tight">Công đức</h1>
        <p className="max-w-3xl text-sm text-muted">
          Điểm công đức người dùng nhận khi điểm danh, bình luận, có bài được duyệt, bài đạt lượt xem, tu tập, viết lời
          nguyện. Đổi điểm có hiệu lực trong khoảng một phút, chỉ áp cho các lần cộng sau đó.
        </p>
      </div>
      <HopLoi loi={loi} thuLai={nap} />
      {dl ? (
        <>
          <BangDiem rules={dl.rules} onLuu={(rules) => setDl({ ...dl, rules })} />
          <LoiNhan
            ds={dl.greetings}
            macDinh={dl.greetingsDefault}
            onLuu={(greetings, greetingsDefault) => setDl({ ...dl, greetings, greetingsDefault })}
          />
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <UngHo donate={dl.donate} onLuu={(donate) => setDl({ ...dl, donate })} />
            <Card className="flex flex-col gap-3 p-5">
              <h2 className="font-serif text-lg font-bold">Xếp hạng công đức</h2>
              {dl.top.length === 0 ? (
                <p className="text-sm text-muted">Chưa có ai được cộng công đức.</p>
              ) : (
                <ol className="flex flex-col divide-y divide-line">
                  {dl.top.map((u, i) => (
                    <li key={u.userId} className="flex items-center gap-3 py-2 text-sm">
                      <span className="w-6 text-right tabular-nums text-muted">{i + 1}</span>
                      <Avatar src={u.avatarUrl} name={u.name} size={28} />
                      <span className="flex-1 truncate font-medium text-ink">{u.name || "—"}</span>
                      {u.role ? <Badge tone="neutral">{nhanVaiTro[u.role] ?? u.role}</Badge> : null}
                      <span className="w-16 text-right font-semibold tabular-nums text-accent">{u.points.toLocaleString()}</span>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          </div>
        </>
      ) : !loi ? (
        <p className="text-sm text-muted">Đang tải…</p>
      ) : null}
    </div>
  );
}

function BangDiem({ rules, onLuu }: { rules: QuyTacCongDucQT[]; onLuu: (r: QuyTacCongDucQT[]) => void }) {
  const locale = useLocale();
  const [ban, setBan] = React.useState(rules);
  const [dang, setDang] = React.useState(false);
  const [bao, setBao] = React.useState("");
  React.useEffect(() => setBan(rules), [rules]);

  const doi = (a: string, thay: Partial<QuyTacCongDucQT>) => setBan((cu) => cu.map((r) => (r.action === a ? { ...r, ...thay } : r)));
  const daDoi = JSON.stringify(ban) !== JSON.stringify(rules);

  async function luu() {
    setDang(true);
    setBao("");
    try {
      const kq = await luuQuyTacCongDuc(
        Object.fromEntries(ban.map((r) => [r.action, { points: r.points, dailyCap: r.dailyCap, enabled: r.enabled }])),
        locale,
      );
      onLuu(kq.rules);
      setBao("Đã lưu bảng điểm.");
    } catch (e) {
      setBao(chuLoi(e));
    } finally {
      setDang(false);
    }
  }

  const oSo = "h-9 w-24 rounded-md border border-line bg-surface px-2 text-right text-sm tabular-nums focus:border-accent focus:outline-none";

  return (
    <Card className="flex flex-col gap-4 p-5">
      <h2 className="font-serif text-lg font-bold">Bảng điểm</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <th className="py-2 pr-3 font-medium">Hành động</th>
              <th className="py-2 pr-3 font-medium">Điểm mỗi lần</th>
              <th className="py-2 pr-3 font-medium">Tối đa mỗi ngày</th>
              <th className="py-2 pr-3 font-medium">Bật</th>
              <th className="py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {ban.map((r) => (
              <tr key={r.action} className="border-b border-line last:border-0">
                <td className="py-2.5 pr-3">
                  <span className="font-medium text-ink">{r.label}</span>
                  <span className="block text-xs text-muted">
                    Mặc định: {r.defaultPoints} điểm{r.defaultDailyCap ? `, tối đa ${r.defaultDailyCap}/ngày` : ""}
                  </span>
                </td>
                <td className="py-2.5 pr-3">
                  <input
                    type="number"
                    min={0}
                    max={1000}
                    value={r.points}
                    onChange={(e) => doi(r.action, { points: Math.max(0, Number(e.target.value) || 0) })}
                    aria-label={`Điểm: ${r.label}`}
                    className={oSo}
                  />
                </td>
                <td className="py-2.5 pr-3">
                  <input
                    type="number"
                    min={0}
                    value={r.dailyCap}
                    onChange={(e) => doi(r.action, { dailyCap: Math.max(0, Number(e.target.value) || 0) })}
                    aria-label={`Tối đa mỗi ngày: ${r.label}`}
                    className={oSo}
                  />
                  <span className="ml-2 text-xs text-muted">{r.dailyCap === 0 ? "không giới hạn" : ""}</span>
                </td>
                <td className="py-2.5 pr-3">
                  <input
                    type="checkbox"
                    checked={r.enabled}
                    onChange={(e) => doi(r.action, { enabled: e.target.checked })}
                    aria-label={`Bật: ${r.label}`}
                    className="size-4 accent-accent"
                  />
                </td>
                <td className="py-2.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    title="Về mặc định"
                    aria-label={`Về mặc định: ${r.label}`}
                    onClick={() => doi(r.action, { points: r.defaultPoints, dailyCap: r.defaultDailyCap, enabled: true })}
                  >
                    <RotateCcw aria-hidden />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={luu} disabled={dang || !daDoi}>
          <Check aria-hidden /> Lưu bảng điểm
        </Button>
        {bao ? <span className="text-sm text-muted">{bao}</span> : null}
      </div>
    </Card>
  );
}

function UngHo({ donate, onLuu }: { donate: UngHoQT; onLuu: (d: UngHoQT) => void }) {
  const locale = useLocale();
  const [f, setF] = React.useState(donate);
  const [qr, setQr] = React.useState(""); // data URL mới / "remove"
  const [dang, setDang] = React.useState(false);
  const [bao, setBao] = React.useState("");
  const ref = React.useRef<HTMLInputElement>(null);

  const xemQr = qr === "remove" ? "" : qr || (donate.qrUrl ? urlApi(donate.qrUrl) : "");

  function chonQr(tep: File | undefined) {
    if (!tep) return;
    if (!/^image\/(png|jpeg|webp)$/.test(tep.type)) return setBao("Ảnh QR phải là PNG, JPG hoặc WEBP.");
    if (tep.size > QR_TOI_DA) return setBao("Ảnh QR tối đa 1,5 MB.");
    const r = new FileReader();
    r.onload = () => setQr(String(r.result));
    r.readAsDataURL(tep);
  }

  async function luu(e: React.FormEvent) {
    e.preventDefault();
    setDang(true);
    setBao("");
    try {
      const kq = await luuUngHo(
        {
          title: f.title,
          description: f.description,
          accountName: f.accountName,
          accountNumber: f.accountNumber,
          bank: f.bank,
          link: f.link,
          qr,
        },
        locale,
      );
      onLuu(kq.donate);
      setQr("");
      setBao("Đã lưu thông tin ủng hộ.");
    } catch (err) {
      setBao(chuLoi(err));
    } finally {
      setDang(false);
    }
  }

  const o = (k: keyof UngHoQT, label: string, hint?: string) => (
    <Field id={`ung-ho-${k}`} label={label} hint={hint}>
      {(p) => <Input {...p} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />}
    </Field>
  );

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex flex-col gap-1">
        <h2 className="font-serif text-lg font-bold">Thông tin ủng hộ</h2>
        <p className="text-xs text-muted">
          Hiện ở trang Thống kê &amp; công đức của người dùng. Hãy dùng đúng thông tin và mã QR chính thức của quỹ (ví dụ
          tài khoản tiếp nhận ủng hộ của Ủy ban Trung ương MTTQ Việt Nam) - đối chiếu với trang công bố chính thức trước
          khi đăng.
        </p>
      </div>
      <form onSubmit={luu} className="flex flex-col gap-4">
        {o("title", "Tên quỹ / chương trình")}
        <Field id="ung-ho-description" label="Mô tả">
          {(p) => (
            <textarea
              id={p.id}
              value={f.description}
              onChange={(e) => setF({ ...f, description: e.target.value })}
              rows={3}
              className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          )}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          {o("accountName", "Chủ tài khoản")}
          {o("accountNumber", "Số tài khoản")}
          {o("bank", "Ngân hàng")}
          {o("link", "Trang thông tin chính thức", "https://…")}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {xemQr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={xemQr} alt="Mã QR ủng hộ" className="size-32 rounded-md border border-line bg-white object-contain p-1.5" />
          ) : (
            <span className="grid size-32 place-items-center rounded-md border border-dashed border-line text-xs text-muted">
              Chưa có mã QR
            </span>
          )}
          <div className="flex flex-col gap-2">
            <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => chonQr(e.target.files?.[0])} />
            <Button type="button" variant="outline" size="sm" onClick={() => ref.current?.click()}>
              <Upload aria-hidden /> Chọn ảnh QR
            </Button>
            {xemQr ? (
              <Button type="button" variant="ghost" size="sm" className="hover:text-lacquer" onClick={() => setQr("remove")}>
                <Trash2 aria-hidden /> Bỏ mã QR
              </Button>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={dang}>
            <Check aria-hidden /> Lưu
          </Button>
          {bao ? <span className="text-sm text-muted">{bao}</span> : null}
        </div>
      </form>
    </Card>
  );
}

/**
 * Lời nhắn an lành: mỗi dòng một câu. Popup "Chào ngày mới" (khi người dùng tự
 * điểm danh lần đầu trong ngày) hiện ngẫu nhiên một câu. Để trống = dùng mặc định.
 */
function LoiNhan({
  ds,
  macDinh,
  onLuu,
}: {
  ds: string[];
  macDinh: boolean;
  onLuu: (ds: string[], macDinh: boolean) => void;
}) {
  const locale = useLocale();
  const [chu, setChu] = React.useState(ds.join("\n"));
  const [dang, setDang] = React.useState(false);
  const [bao, setBao] = React.useState("");
  const daDoi = chu.trim() !== ds.join("\n").trim();

  async function luu(danhSach: string[]) {
    setDang(true);
    setBao("");
    try {
      const kq = await luuLoiNhan(danhSach, locale);
      onLuu(kq.greetings, kq.greetingsDefault);
      setChu(kq.greetings.join("\n"));
      setBao("Đã lưu lời nhắn.");
    } catch (e) {
      setBao(chuLoi(e));
    } finally {
      setDang(false);
    }
  }

  const soCau = chu.split("\n").filter((d) => d.trim()).length;

  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex flex-col gap-1">
        <h2 className="font-serif text-lg font-bold">Lời nhắn chào ngày mới</h2>
        <p className="text-sm text-muted">
          Khi người dùng vào site lần đầu trong ngày, hệ thống tự điểm danh và hiện popup góc trên phải: “+N công đức” kèm
          MỘT câu chọn ngẫu nhiên dưới đây. Mỗi dòng một câu (tối đa 100 câu, mỗi câu 200 ký tự). Tài khoản Admin được cộng
          điểm và thấy popup ở MỌI lần tải trang để tiện kiểm thử.
          {macDinh ? " Đang dùng danh sách mặc định." : ""}
        </p>
      </div>
      <textarea
        value={chu}
        onChange={(e) => setChu(e.target.value)}
        rows={8}
        className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm leading-relaxed focus:border-accent focus:outline-none"
        aria-label="Lời nhắn, mỗi dòng một câu"
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={() => luu(chu.split("\n").map((d) => d.trim()).filter(Boolean))}
          disabled={dang || !daDoi}
        >
          <Check aria-hidden /> Lưu lời nhắn
        </Button>
        <Button variant="ghost" onClick={() => luu([])} disabled={dang || macDinh}>
          <RotateCcw aria-hidden /> Về danh sách mặc định
        </Button>
        <span className="text-xs text-muted">{soCau} câu</span>
        {bao ? <span className="text-sm text-muted">{bao}</span> : null}
      </div>
    </Card>
  );
}
