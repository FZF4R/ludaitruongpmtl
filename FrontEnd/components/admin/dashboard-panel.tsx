"use client";

import * as React from "react";
import {
  Trash2,
  Plus,
  Check,
  X,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { HopLoi, chuLoi, useLocale } from "@/components/admin/admin-shell";
import { themeTokens, isHexColor } from "@/lib/theme";
import { docToken } from "@/lib/auth";
import { lamMoiCauHinh } from "@/lib/settings-action";
import {
  layAnhTrangChu,
  sapXepAnhTrangChu,
  themAnhTrangChu,
  urlAnh,
  xoaAnhTrangChu,
  type AnhTrangChu,
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

type Khoi = "chung" | "thongBao" | "mau" | "hienThi";

/** Xoá cache cấu hình + ảnh trang chủ của Next sau khi lưu, để trang công khai đổi ngay. */
async function lamMoiTrangCongKhai() {
  const token = docToken();
  if (token) await lamMoiCauHinh(token);
}

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

  /**
   * Lưu một phần cấu hình rồi xoá cache của Next, để trang công khai đổi ngay
   * chứ không chờ hết chu kỳ ISR (trang chi tiết tới 1 giờ).
   */
  const luu = async (khoi: Khoi, phan: Record<string, unknown>): Promise<boolean> => {
    setDangLuu(khoi);
    setLoi("");
    try {
      await luuCauHinh(phan, locale);
      await lamMoiTrangCongKhai();
      setCauHinh((cu) => (cu ? ({ ...cu, ...phan } as CauHinh) : cu));
      bao(khoi);
      return true;
    } catch (err) {
      setLoi(chuLoi(err));
      return false;
    } finally {
      setDangLuu(null);
    }
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
        onLuu={(phan) => luu("chung", phan)}
      />

      <KhoiHienThi
        giaTri={cauHinh.articleLayout === "list" ? "list" : "card"}
        dangLuu={dangLuu === "hienThi"}
        daLuu={daLuu === "hienThi"}
        onLuu={(articleLayout) => luu("hienThi", { articleLayout })}
      />

      <KhoiAnhTrangChu onLoi={setLoi} />

      <KhoiThongBao
        danhSach={cauHinh.notify}
        onDoi={(notify) => setCauHinh((cu) => (cu ? { ...cu, notify } : cu))}
        onLoi={setLoi}
      />

      <KhoiMau
        cauHinh={cauHinh}
        dangLuu={dangLuu === "mau"}
        daLuu={daLuu === "mau"}
        onLuu={(phan) => luu("mau", phan)}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */

const KIEU_HIEN_THI = [
  { id: "card", nhan: "Dạng thẻ", moTa: "Lưới thẻ có ảnh lớn, hợp khi bài có ảnh bìa đẹp." },
  { id: "list", nhan: "Dạng danh sách", moTa: "Mỗi bài một hàng, ảnh nhỏ bên trái; đọc lướt nhanh hơn." },
] as const;

function KhoiHienThi({
  giaTri,
  dangLuu,
  daLuu,
  onLuu,
}: {
  giaTri: "card" | "list";
  dangLuu: boolean;
  daLuu: boolean;
  onLuu: (kieu: "card" | "list") => Promise<boolean>;
}) {
  // Hiện ngay lựa chọn mới trong lúc đang lưu; lưu hỏng thì trả về giá trị cũ.
  const [chon, setChon] = React.useState(giaTri);

  const doi = async (kieu: "card" | "list") => {
    if (kieu === giaTri) return;
    setChon(kieu);
    if (!(await onLuu(kieu))) setChon(giaTri);
  };

  return (
    <Card className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="font-serif text-lg font-bold">Hiển thị trang Bài viết</h2>
          <p className="text-sm text-muted">
            Cách danh sách bài hiện cho người đọc; chọn là lưu ngay. Bài không có ảnh bìa sẽ dùng
            một ảnh trong bộ sưu tập của site.
          </p>
        </div>
        <span aria-live="polite" className="flex h-6 items-center gap-1.5 text-sm">
          {dangLuu ? (
            <span className="text-muted">Đang lưu…</span>
          ) : daLuu ? (
            <span className="flex items-center gap-1.5 text-accent">
              <Check className="size-4" aria-hidden /> Đã lưu
            </span>
          ) : null}
        </span>
      </div>

      <fieldset className="grid gap-3 sm:grid-cols-2" disabled={dangLuu}>
        <legend className="sr-only">Kiểu hiển thị</legend>
        {KIEU_HIEN_THI.map((k) => (
          <label
            key={k.id}
            className={
              "flex cursor-pointer gap-3 rounded-md border p-4 text-sm transition-colors " +
              (chon === k.id ? "border-accent bg-accent-soft/50" : "border-line hover:border-line-strong")
            }
          >
            <input
              type="radio"
              name="kieu-hien-thi"
              checked={chon === k.id}
              onChange={() => void doi(k.id)}
              className="mt-0.5 size-4 accent-accent"
            />
            <span className="flex flex-col gap-0.5">
              <span className="font-medium text-ink">{k.nhan}</span>
              <span className="text-muted">{k.moTa}</span>
            </span>
          </label>
        ))}
      </fieldset>
    </Card>
  );
}

/* ------------------------------------------------------------------ */

const TOI_DA_ANH = 12;
/** Số mục hiện sẵn trước khi bấm "Xem thêm". */
const HIEN_ANH = 6;
const HIEN_THONG_BAO = 5;
/** Rộng tối đa sau khi thu nhỏ: đủ nét trên màn hình 2K, Next tự sinh bản nhỏ hơn cho máy khác. */
const RONG_TOI_DA = 2560;
/** Ảnh gốc nhỏ hơn mức này (và không rộng quá RONG_TOI_DA) được gửi nguyên, không nén lại. */
const GIU_NGUYEN_BYTE = 4 * 1024 * 1024;
/** Trần backend chấp nhận sau khi giải base64 (HeroImageController.TOI_DA_BYTE). */
const TRAN_BYTE = 5 * 1024 * 1024;

const docDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const doc = new FileReader();
    doc.onload = () => resolve(String(doc.result));
    doc.onerror = () => reject(doc.error);
    doc.readAsDataURL(blob);
  });

const sangBlob = (canvas: HTMLCanvasElement, loai: string, chatLuong: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, loai, chatLuong));

/**
 * Chuẩn bị ảnh trước khi gửi, ưu tiên GIỮ CHẤT LƯỢNG:
 *  - Ảnh vốn đã vừa (≤ 2560px, ≤ 4MB): gửi nguyên tệp gốc, không nén lại lần nào.
 *  - Ảnh lớn hơn (ảnh chụp điện thoại 4000px, vài chục MB): thu nhỏ với chế độ
 *    làm mượt chất lượng cao rồi nén 92%; chỉ hạ dần chất lượng khi vẫn vượt
 *    trần của backend.
 * Ảnh này còn được Next nén thêm một lần khi hiển thị (quality 90), nên mỗi
 * lần nén bớt ở đây đều cộng dồn - tránh được thì tránh.
 */
async function chuanBiAnh(tep: File): Promise<{ image: string; width: number; height: number }> {
  const bitmap = await createImageBitmap(tep);
  const { width: rongGoc, height: caoGoc } = bitmap;

  const dinhDangNhan = ["image/jpeg", "image/png", "image/webp"].includes(tep.type);
  if (dinhDangNhan && rongGoc <= RONG_TOI_DA && tep.size <= GIU_NGUYEN_BYTE) {
    bitmap.close();
    return { image: await docDataUrl(tep), width: rongGoc, height: caoGoc };
  }

  const tiLe = Math.min(1, RONG_TOI_DA / rongGoc);
  const width = Math.round(rongGoc * tiLe);
  const height = Math.round(caoGoc * tiLe);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  // Mặc định trình duyệt thu nhỏ ở chất lượng "low" - ảnh bị răng cưa, nhoè.
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  // WebP giữ chi tiết tốt hơn JPEG ở cùng dung lượng; trình duyệt không hỗ
  // trợ thì toBlob trả về PNG, khi đó dùng JPEG.
  const loai = (await sangBlob(canvas, "image/webp", 0.92))?.type === "image/webp" ? "image/webp" : "image/jpeg";
  for (const chatLuong of [0.92, 0.88, 0.82]) {
    const blob = await sangBlob(canvas, loai, chatLuong);
    if (blob && blob.size <= TRAN_BYTE) return { image: await docDataUrl(blob), width, height };
  }
  throw new Error("Ảnh quá lớn, hãy chọn ảnh nhỏ hơn.");
}

function KhoiAnhTrangChu({ onLoi }: { onLoi: (loi: string) => void }) {
  const locale = useLocale();
  const [ds, setDs] = React.useState<AnhTrangChu[] | null>(null);
  const [ban, setBan] = React.useState("");
  const [moRong, setMoRong] = React.useState(false);
  const chonTep = React.useRef<HTMLInputElement>(null);

  const nap = React.useCallback(() => {
    layAnhTrangChu(locale)
      .then(setDs)
      .catch((err) => onLoi(chuLoi(err, "Không tải được danh sách ảnh.")));
  }, [locale, onLoi]);

  React.useEffect(nap, [nap]);

  /** Chạy một thao tác rồi làm mới trang chủ, để ảnh đổi ngay. */
  const chay = async (nhan: string, viec: () => Promise<unknown>) => {
    setBan(nhan);
    onLoi("");
    try {
      await viec();
      await lamMoiTrangCongKhai();
    } catch (err) {
      onLoi(chuLoi(err));
    } finally {
      setBan("");
      nap();
    }
  };

  const themTep = (tepList: FileList | null) => {
    const teps = Array.from(tepList ?? []).filter((t) => t.type.startsWith("image/"));
    if (!teps.length || !ds) return;
    const conCho = TOI_DA_ANH - ds.length;
    if (teps.length > conCho) {
      onLoi(`Chỉ thêm được ${conCho} ảnh nữa (tối đa ${TOI_DA_ANH}).`);
      return;
    }
    void chay("Đang tải ảnh lên…", async () => {
      for (const tep of teps) {
        const anh = await chuanBiAnh(tep);
        await themAnhTrangChu({ ...anh, alt: tep.name.replace(/\.[^.]+$/, "") }, locale);
      }
    });
  };

  const doiCho = (i: number, j: number) => {
    if (!ds || j < 0 || j >= ds.length) return;
    const moi = [...ds];
    [moi[i], moi[j]] = [moi[j], moi[i]];
    setDs(moi);
    void chay("Đang sắp xếp…", () => sapXepAnhTrangChu(moi.map((a) => a.id), locale));
  };

  return (
    <Card className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="font-serif text-lg font-bold">Ảnh xoay vòng trang chủ</h2>
          <p className="max-w-2xl text-sm text-muted">
            Ảnh nền khối mở đầu, tự chuyển sau mỗi 7 giây theo thứ tự dưới đây. Chưa có ảnh nào thì
            trang chủ dùng bộ ảnh sẵn có. Nên chọn ảnh ngang, tối đa {TOI_DA_ANH} ảnh; ảnh lớn được
            tự thu nhỏ trước khi tải lên.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {ban ? <span className="text-sm text-muted">{ban}</span> : null}
          <input
            ref={chonTep}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            hidden
            onChange={(e) => {
              themTep(e.target.files);
              e.target.value = "";
            }}
          />
          <Button
            disabled={!!ban || !ds || ds.length >= TOI_DA_ANH}
            onClick={() => chonTep.current?.click()}
          >
            <Plus aria-hidden /> Thêm ảnh
          </Button>
        </div>
      </div>

      {ds === null ? (
        <p className="text-sm text-muted">Đang tải…</p>
      ) : ds.length === 0 ? (
        <p className="rounded-md border border-dashed border-line p-6 text-center text-sm text-muted">
          Chưa có ảnh nào — trang chủ đang dùng bộ ảnh sẵn có.
        </p>
      ) : (
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(moRong ? ds : ds.slice(0, HIEN_ANH)).map((anh, i) => (
            <li key={anh.id} className="flex flex-col overflow-hidden rounded-md border border-line">
              {/* Ảnh xem trước trong trang quản trị: không cần qua bộ tối ưu của Next. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={urlAnh(anh)}
                alt={anh.alt}
                loading="lazy"
                className="aspect-[16/9] w-full bg-surface-2 object-cover"
              />
              <div className="flex items-center gap-1 p-2 text-xs text-muted">
                <span className="mr-auto tabular-nums">
                  #{i + 1}
                  {anh.width ? ` · ${anh.width}×${anh.height}` : ""}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label="Lên trước"
                  disabled={!!ban || i === 0}
                  onClick={() => doiCho(i, i - 1)}
                >
                  <ArrowLeft aria-hidden />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label="Ra sau"
                  disabled={!!ban || i === ds.length - 1}
                  onClick={() => doiCho(i, i + 1)}
                >
                  <ArrowRight aria-hidden />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label="Xoá ảnh"
                  disabled={!!ban}
                  onClick={() => {
                    if (confirm("Xoá ảnh này khỏi trang chủ?")) {
                      void chay("Đang xoá…", () => xoaAnhTrangChu(anh.id, locale));
                    }
                  }}
                >
                  <Trash2 aria-hidden />
                </Button>
              </div>
            </li>
          ))}
        </ol>
      )}

      {ds ? (
        <NutXemThem tong={ds.length} gioiHan={HIEN_ANH} moRong={moRong} onDoi={setMoRong} />
      ) : null}
    </Card>
  );
}

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
  const [moRong, setMoRong] = React.useState(false);
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
          {(moRong ? danhSach : danhSach.slice(0, HIEN_THONG_BAO)).map((cau, i) => (
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

      <NutXemThem
        tong={danhSach.length}
        gioiHan={HIEN_THONG_BAO}
        moRong={moRong}
        onDoi={setMoRong}
      />
    </Card>
  );
}

/* ------------------------------------------------------------------ */

/**
 * "Xem thêm (còn N)" / "Thu gọn" cho danh sách dài trên trang Tổng quan.
 * Không in gì khi danh sách chưa vượt `gioiHan`.
 */
function NutXemThem({
  tong,
  gioiHan,
  moRong,
  onDoi,
}: {
  tong: number;
  gioiHan: number;
  moRong: boolean;
  onDoi: (moRong: boolean) => void;
}) {
  if (tong <= gioiHan) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      className="self-center"
      aria-expanded={moRong}
      onClick={() => onDoi(!moRong)}
    >
      {moRong ? (
        <>
          <ChevronUp aria-hidden /> Thu gọn
        </>
      ) : (
        <>
          <ChevronDown aria-hidden /> Xem thêm (còn {tong - gioiHan})
        </>
      )}
    </Button>
  );
}

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
