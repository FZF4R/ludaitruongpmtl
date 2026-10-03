"use client";

import * as React from "react";
import { Trash2, Plus, Check, X } from "lucide-react";
import { Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { HopLoi, chuLoi, useLocale } from "@/components/admin/admin-shell";
import { themeTokens, isHexColor } from "@/lib/theme";
import {
  layCauHinh,
  luuCauHinh,
  suaThongBao,
  themThongBao,
  xoaThongBao,
  type CauHinh,
} from "@/lib/admin-api";

/**
 * Trang /admin/dashboard — sửa những gì hiện ra trên giao diện công khai.
 *
 * Ba khối, theo đúng ba thứ người xem nhìn thấy đầu tiên: tiêu đề và thông tin
 * liên hệ, dải thiền ngữ đầu trang chủ, và bảng màu.
 *
 * Dải thiền ngữ dùng ba endpoint riêng (add/update/delete theo chỉ số) chứ
 * không gửi cả mảng: hai người cùng mở trang này thì gửi cả mảng nghĩa là
 * người lưu sau xoá sạch việc của người lưu trước.
 */

type Khoi = "chung" | "thongBao" | "mau";

export function DashboardPanel() {
  const locale = useLocale();

  const [cauHinh, setCauHinh] = React.useState<CauHinh | null>(null);
  const [loi, setLoi] = React.useState("");
  const [dangTai, setDangTai] = React.useState(true);
  const [dangLuu, setDangLuu] = React.useState<Khoi | null>(null);
  const [daLuu, setDaLuu] = React.useState<Khoi | null>(null);

  const nap = React.useCallback(() => {
    setDangTai(true);
    setLoi("");
    layCauHinh(locale)
      .then(setCauHinh)
      .catch((err) => setLoi(chuLoi(err, "Không tải được cấu hình.")))
      .finally(() => setDangTai(false));
  }, [locale]);

  React.useEffect(nap, [nap]);

  /** Báo "đã lưu" rồi tự tắt, để người dùng biết cú bấm có tác dụng. */
  const bao = (khoi: Khoi) => {
    setDaLuu(khoi);
    setTimeout(() => setDaLuu((cu) => (cu === khoi ? null : cu)), 2500);
  };

  if (dangTai) return <p className="text-sm text-muted">Đang tải…</p>;
  if (!cauHinh) return <HopLoi loi={loi || "Không tải được cấu hình."} thuLai={nap} />;

  return (
    <div className="flex flex-col gap-6">
      <HopLoi loi={loi} />

      <KhoiChung
        cauHinh={cauHinh}
        dangLuu={dangLuu === "chung"}
        daLuu={daLuu === "chung"}
        onLuu={async (phan) => {
          setDangLuu("chung");
          setLoi("");
          try {
            await luuCauHinh(phan, locale);
            setCauHinh((cu) => (cu ? { ...cu, ...phan } as CauHinh : cu));
            bao("chung");
          } catch (err) {
            setLoi(chuLoi(err));
          } finally {
            setDangLuu(null);
          }
        }}
      />

      <KhoiThongBao
        danhSach={cauHinh.notify}
        onDoi={(notify) => setCauHinh((cu) => (cu ? { ...cu, notify } : cu))}
        onLoi={setLoi}
      />

      <KhoiMau
        cauHinh={cauHinh}
        dangLuu={dangLuu === "mau"}
        daLuu={daLuu === "mau"}
        onLuu={async (phan) => {
          setDangLuu("mau");
          setLoi("");
          try {
            await luuCauHinh(phan, locale);
            setCauHinh((cu) => (cu ? { ...cu, ...phan } as CauHinh : cu));
            bao("mau");
          } catch (err) {
            setLoi(chuLoi(err));
          } finally {
            setDangLuu(null);
          }
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */

function KhoiChung({
  cauHinh,
  dangLuu,
  daLuu,
  onLuu,
}: {
  cauHinh: CauHinh;
  dangLuu: boolean;
  daLuu: boolean;
  onLuu: (phan: Record<string, unknown>) => void;
}) {
  const [title, setTitle] = React.useState(cauHinh.title ?? "");
  const [warning, setWarning] = React.useState(cauHinh.warning ?? "");
  const [phone, setPhone] = React.useState(cauHinh.supportphonenumber ?? "");
  const [facebook, setFacebook] = React.useState(cauHinh.supportfacebook ?? "");
  const [baoTri, setBaoTri] = React.useState(!!cauHinh.isMaintaning);

  return (
    <Card className="flex flex-col gap-5 p-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-serif text-xl font-bold">Thông tin chung</h2>
        <p className="text-sm text-muted">Tiêu đề site và thông tin liên hệ.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="cf-title" label="Tiêu đề site">
          {(p) => (
            <Input {...p} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
          )}
        </Field>

        <Field id="cf-phone" label="Số điện thoại hỗ trợ">
          {(p) => (
            <Input {...p} value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={40} />
          )}
        </Field>

        <Field id="cf-fb" label="Trang Facebook hỗ trợ">
          {(p) => (
            <Input
              {...p}
              value={facebook}
              onChange={(e) => setFacebook(e.target.value)}
              maxLength={200}
            />
          )}
        </Field>

        <Field
          id="cf-warning"
          label="Cảnh báo"
          hint="Để trống nếu không có gì cần cảnh báo người xem"
        >
          {(p) => (
            <Input
              {...p}
              value={warning}
              onChange={(e) => setWarning(e.target.value)}
              maxLength={300}
            />
          )}
        </Field>
      </div>

      <label className="flex w-fit cursor-pointer items-center gap-2.5 text-sm">
        <input
          type="checkbox"
          checked={baoTri}
          onChange={(e) => setBaoTri(e.target.checked)}
          className="size-4 accent-accent"
        />
        <span className="text-ink">Bật chế độ bảo trì</span>
      </label>

      <div className="flex items-center gap-3">
        <Button
          disabled={dangLuu}
          onClick={() =>
            onLuu({
              title,
              warning,
              supportphonenumber: phone,
              supportfacebook: facebook,
              isMaintaning: baoTri,
            })
          }
        >
          {dangLuu ? "Đang lưu…" : "Lưu thông tin chung"}
        </Button>
        {daLuu ? (
          <span className="flex items-center gap-1.5 text-sm text-accent">
            <Check className="size-4" aria-hidden /> Đã lưu
          </span>
        ) : null}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */

function KhoiThongBao({
  danhSach,
  onDoi,
  onLoi,
}: {
  danhSach: string[];
  onDoi: (moi: string[]) => void;
  onLoi: (loi: string) => void;
}) {
  const locale = useLocale();

  const [themMoi, setThemMoi] = React.useState("");
  const [dangSua, setDangSua] = React.useState<number | null>(null);
  const [banNhap, setBanNhap] = React.useState("");
  const [ban, setBan] = React.useState(false);

  const chay = async (viec: () => Promise<{ notify: string[] }>) => {
    setBan(true);
    onLoi("");
    try {
      const kq = await viec();
      onDoi(kq.notify);
      return true;
    } catch (err) {
      onLoi(chuLoi(err));
      return false;
    } finally {
      setBan(false);
    }
  };

  return (
    <Card className="flex flex-col gap-5 p-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-serif text-xl font-bold">Dải thông báo trang chủ</h2>
        <p className="text-sm text-muted">
          Mỗi lượt sinh lại trang chủ hiện ngẫu nhiên một câu trong danh sách này. Hiện có{" "}
          {danhSach.length} câu.
        </p>
      </div>

      <div className="flex gap-2">
        <Input
          value={themMoi}
          onChange={(e) => setThemMoi(e.target.value)}
          placeholder="Thêm một câu mới…"
          maxLength={500}
          aria-label="Câu mới"
        />
        <Button
          disabled={ban || !themMoi.trim()}
          onClick={async () => {
            if (await chay(() => themThongBao(themMoi.trim(), locale))) setThemMoi("");
          }}
        >
          <Plus aria-hidden /> Thêm
        </Button>
      </div>

      {danhSach.length === 0 ? (
        <p className="text-sm text-muted">
          Chưa có câu nào — dải thông báo sẽ không hiện trên trang chủ.
        </p>
      ) : (
        <ol className="flex flex-col divide-y divide-line">
          {danhSach.map((cau, i) => (
            <li key={`${i}-${cau.slice(0, 24)}`} className="flex items-start gap-3 py-3">
              <span className="w-6 shrink-0 pt-1.5 text-right text-xs tabular-nums text-muted">
                {i + 1}
              </span>

              {dangSua === i ? (
                <>
                  <Input
                    value={banNhap}
                    onChange={(e) => setBanNhap(e.target.value)}
                    maxLength={500}
                    aria-label={`Sửa câu ${i + 1}`}
                    autoFocus
                  />
                  <Button
                    size="sm"
                    disabled={ban || !banNhap.trim()}
                    onClick={async () => {
                      if (await chay(() => suaThongBao(i, banNhap.trim(), locale))) setDangSua(null);
                    }}
                  >
                    <Check aria-hidden /> Lưu
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setDangSua(null)}>
                    <X aria-hidden />
                  </Button>
                </>
              ) : (
                <>
                  <p className="flex-1 pt-1 text-sm leading-relaxed text-body">{cau}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setDangSua(i);
                      setBanNhap(cau);
                    }}
                  >
                    Sửa
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={ban}
                    aria-label={`Xoá câu ${i + 1}`}
                    onClick={() => {
                      if (confirm(`Xoá câu này?\n\n${cau}`)) void chay(() => xoaThongBao(i, locale));
                    }}
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </>
              )}
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ */

function KhoiMau({
  cauHinh,
  dangLuu,
  daLuu,
  onLuu,
}: {
  cauHinh: CauHinh;
  dangLuu: boolean;
  daLuu: boolean;
  onLuu: (phan: Record<string, unknown>) => void;
}) {
  const [sang, setSang] = React.useState<Record<string, string>>(cauHinh.theme ?? {});
  const [toi, setToi] = React.useState<Record<string, string>>(cauHinh.themeDark ?? {});

  // Ô nào bỏ trống nghĩa là "dùng mặc định của lib/theme.ts", nên chỉ gửi lên
  // những mã hex hợp lệ; gửi chuỗi rỗng sẽ ghi đè thành màu trống.
  const gom = (bang: Record<string, string>) => {
    const kq: Record<string, string> = {};
    for (const [khoa, giaTri] of Object.entries(bang)) {
      if (isHexColor(giaTri)) kq[khoa] = giaTri.trim();
    }
    return kq;
  };

  const soSang = Object.keys(gom(sang)).length;
  const soToi = Object.keys(gom(toi)).length;

  return (
    <Card className="flex flex-col gap-5 p-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-serif text-xl font-bold">Bảng màu</h2>
        <p className="text-sm text-muted">
          Bỏ trống một ô là dùng màu mặc định trong mã nguồn. Chỉ nhận mã hex dạng
          <code className="mx-1 rounded bg-surface-2 px-1 py-0.5 text-xs">#8a5a14</code>; giá trị
          khác bị bỏ qua khi hiển thị.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {(
          [
            ["Chế độ sáng", sang, setSang, soSang],
            ["Chế độ tối", toi, setToi, soToi],
          ] as const
        ).map(([nhan, bang, dat, dem]) => (
          <div key={nhan} className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-ink">
              {nhan}{" "}
              <span className="font-normal text-muted">
                ({dem}/{themeTokens.length} ô đã đặt)
              </span>
            </h3>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {themeTokens.map((token) => {
                const giaTri = bang[token] ?? "";
                const hopLe = !giaTri || isHexColor(giaTri);

                return (
                  <label key={token} className="flex items-center gap-2 text-xs">
                    <span
                      aria-hidden
                      className="size-5 shrink-0 rounded border border-line"
                      style={hopLe && giaTri ? { background: giaTri } : undefined}
                    />
                    <span className="w-24 shrink-0 truncate text-muted">{token}</span>
                    <input
                      value={giaTri}
                      onChange={(e) => dat({ ...bang, [token]: e.target.value })}
                      placeholder="mặc định"
                      maxLength={9}
                      aria-label={`${nhan} — ${token}`}
                      className={cnO(hopLe)}
                    />
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Button
          disabled={dangLuu}
          onClick={() => onLuu({ theme: gom(sang), themeDark: gom(toi) })}
        >
          {dangLuu ? "Đang lưu…" : "Lưu bảng màu"}
        </Button>
        {daLuu ? (
          <span className="flex items-center gap-1.5 text-sm text-accent">
            <Check className="size-4" aria-hidden /> Đã lưu
          </span>
        ) : null}
      </div>
    </Card>
  );
}

/** Ô mã màu; viền đỏ khi chuỗi không phải hex hợp lệ. */
function cnO(hopLe: boolean) {
  return [
    "h-8 w-full rounded border bg-surface px-2 font-mono text-xs text-ink placeholder:text-muted",
    hopLe ? "border-line" : "border-lacquer",
  ].join(" ");
}
