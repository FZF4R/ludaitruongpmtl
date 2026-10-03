"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCheDoSua } from "@/components/layout/inline-edit";
import { localePath, splitLocale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/dictionary";
import { LoiApi } from "@/lib/auth";
import { ghiNhatKy, layAmThanh, moPhien, type AmThanh, type LoaiAmThanh, type LoaiNhatKy, type MucTuTap } from "@/lib/practice";
import { useLuaChonNho } from "@/components/practice/use-sound";
import { cn } from "@/lib/utils";

export type NhanTuTap = Dictionary["practiceTools"];

/** Điền {n}, {i}... vào câu trong từ điển. */
export function dien(cau: string, gt: Record<string, string | number>) {
  return cau.replace(/\{(\w+)\}/g, (_, k: string) => String(gt[k] ?? ""));
}

export function useLocaleHienTai() {
  return splitLocale(usePathname()).locale;
}

/** Danh sách âm thanh của một mục (admin quản lý ở /admin/practice). */
export function useDsAmThanh(muc: MucTuTap) {
  const locale = useLocaleHienTai();
  const [ds, setDs] = React.useState<AmThanh[]>([]);
  const [dangTai, setDangTai] = React.useState(true);
  React.useEffect(() => {
    let huy = false;
    layAmThanh(muc, locale)
      .then((kq) => !huy && setDs(kq))
      .catch(() => !huy && setDs([]))
      .finally(() => !huy && setDangTai(false));
    return () => {
      huy = true;
    };
  }, [muc, locale]);
  return { ds, dangTai };
}

/**
 * Âm thanh người dùng chọn cho một vai trò (vd. tiếng mõ), nhớ ở trình duyệt.
 * "auto" = âm thanh đầu tiên cùng loại (admin sắp thứ tự); "" = tắt.
 */
export function useAmThanhDaChon(muc: MucTuTap, loai: LoaiAmThanh, ds: AmThanh[], vaiTro: string = loai) {
  const [id, setId] = useLuaChonNho<string>(`${muc}_${vaiTro}`, "auto");
  const cungLoai = ds.filter((a) => a.kind === loai);
  const daChon = id === "" ? null : (cungLoai.find((a) => a.id === id) ?? cungLoai[0] ?? null);
  return { id: daChon?.id ?? "", amThanh: daChon, cungLoai, chon: setId };
}

export function ChonAmThanh({
  nhan,
  label,
  cungLoai,
  value,
  onChange,
  coTat = true,
  onNghe,
  className,
}: {
  nhan: NhanTuTap;
  label: string;
  cungLoai: AmThanh[];
  value: string;
  onChange: (id: string) => void;
  coTat?: boolean;
  /** Có thì hiện nút nghe thử. */
  onNghe?: () => void;
  className?: string;
}) {
  const maId = React.useId();
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={maId} className="text-xs font-medium text-muted">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <select
          id={maId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={cungLoai.length === 0}
          className="h-9 min-w-0 flex-1 rounded-md border border-line bg-surface px-2.5 text-sm text-ink focus:border-accent focus:outline-none disabled:opacity-60"
        >
          {cungLoai.length === 0 ? <option value="">{nhan.noSounds}</option> : null}
          {coTat && cungLoai.length > 0 ? <option value="">{nhan.soundOff}</option> : null}
          {cungLoai.map((a) => (
            <option key={a.id} value={a.id}>
              {a.title}
            </option>
          ))}
        </select>
        {onNghe ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onNghe}
            disabled={!value}
            aria-label={label}
            title={label}
            className="size-9 shrink-0"
          >
            <Volume2 className="size-4" aria-hidden />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

/** Thanh trượt nhỏ có nhãn (nhịp gõ, tốc độ, âm lượng...). */
export function ThanhTruot({
  label,
  giaTri,
  hienThi,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  giaTri: number;
  hienThi?: string;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  const maId = React.useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={maId} className="flex justify-between text-xs font-medium text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-ink">{hienThi ?? giaTri}</span>
      </label>
      <input
        id={maId}
        type="range"
        min={min}
        max={max}
        step={step}
        value={giaTri}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer accent-accent"
      />
    </div>
  );
}

export function CongTac({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-body">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-accent" />
      {children}
    </label>
  );
}

/**
 * Lưu một buổi tu vào nhật ký. Chưa đăng nhập thì thành nút dẫn tới trang
 * đăng nhập - công cụ vẫn dùng được, chỉ không lưu.
 */
export function NutLuuNhatKy({
  nhan,
  type,
  amount,
  note,
  onDaLuu,
  phien,
  className,
}: {
  nhan: NhanTuTap;
  type: LoaiNhatKy;
  amount: number;
  note?: string;
  onDaLuu?: () => void;
  /** Gõ mõ / lần chuỗi / thiền: phiên do máy chủ mở (usePhien). */
  phien?: Phien;
  className?: string;
}) {
  const locale = useLocaleHienTai();
  const { nguoiDungId, daBiet } = useCheDoSua();
  const [trangThai, setTrangThai] = React.useState<"" | "dang" | "xong" | "loi">("");
  const [daDieuChinh, setDaDieuChinh] = React.useState<number | null>(null);
  const [loiApi, setLoiApi] = React.useState("");

  // Số liệu đổi (tu tiếp) thì cho lưu lại lần nữa.
  React.useEffect(() => {
    if (amount > 0) setTrangThai((t) => (t === "xong" ? "" : t));
  }, [amount]);

  if (!daBiet) return null;
  if (!nguoiDungId) {
    return (
      <Button variant="outline" size="sm" asChild className={className}>
        <Link href={localePath(locale, "/dang-nhap")}>{nhan.signInToSave}</Link>
      </Button>
    );
  }

  async function luu() {
    setTrangThai("dang");
    setLoiApi("");
    try {
      const sessionId = phien ? await phien.lay() : undefined;
      const kq = await ghiNhatKy({ type, amount: Math.round(amount), note, sessionId }, locale);
      // Máy chủ hạ số liệu vượt thời gian thật: báo đúng số đã lưu.
      setDaDieuChinh(kq.adjusted ? kq.amount : null);
      phien?.xong();
      setTrangThai("xong");
      onDaLuu?.();
    } catch (err) {
      setLoiApi((err instanceof LoiApi && err.thongDiep) || "");
      setTrangThai("loi");
      // Phiên hỏng (đã dùng / hết hạn): bỏ để lần bấm sau mở phiên mới.
      phien?.xong();
    }
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-1", className)}>
      {trangThai === "xong" ? (
        <>
          <span className="flex items-center gap-1.5 text-sm text-accent">
            <Check className="size-4" aria-hidden />{" "}
            {daDieuChinh !== null ? dien(nhan.savedAdjusted, { n: daDieuChinh }) : nhan.saved}
          </span>
          <Link href={localePath(locale, "/qua-trinh-tu-tap")} className="text-sm text-muted underline-offset-2 hover:text-accent hover:underline">
            {nhan.viewJourney}
          </Link>
        </>
      ) : (
        <Button size="sm" onClick={luu} disabled={amount <= 0 || trangThai === "dang"}>
          {nhan.saveLog}
        </Button>
      )}
      {trangThai === "loi" ? (
        <span role="alert" className="text-sm text-lacquer">
          {loiApi || nhan.saveError}
        </span>
      ) : null}
    </div>
  );
}

/** Danh sách bài nghe dài (tụng mẫu, thiền có hướng dẫn): thẻ <audio> phát dần, không tải trước. */
export function DanhSachBaiNghe({ ds, rong }: { ds: AmThanh[]; rong: string }) {
  if (ds.length === 0) return <p className="text-sm text-muted">{rong}</p>;
  return (
    <ul className="flex flex-col gap-3">
      {ds.map((a) => (
        <li key={a.id} className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">{a.title}</span>
          <audio controls preload="none" src={a.src} className="h-9 w-full" />
        </li>
      ))}
    </ul>
  );
}

/** Âm nền (mưa, suối...) - thẻ <audio>, phát khi `chay`. `lap = false`: phát một lượt (bài kinh). */
export function AmNen({ src, chay, amLuong, lap = true }: { src: string | null; chay: boolean; amLuong: number; lap?: boolean }) {
  const ref = React.useRef<HTMLAudioElement>(null);
  React.useEffect(() => {
    const a = ref.current;
    if (!a) return;
    if (chay && src) void a.play().catch(() => {});
    else a.pause();
  }, [chay, src]);
  React.useEffect(() => {
    if (ref.current) ref.current.volume = amLuong;
  }, [amLuong, src]);
  if (!src) return null;
  return <audio ref={ref} src={src} loop={lap} preload="none" className="hidden" />;
}

/** Phím Cách để gõ / đếm - bỏ qua khi đang gõ chữ hay đang ở một nút khác (nút tự xử lý phím Cách). */
export function usePhimCach(fn: () => void, bat = true) {
  const ref = React.useRef(fn);
  React.useEffect(() => {
    ref.current = fn;
  });
  React.useEffect(() => {
    if (!bat) return;
    function nghe(e: KeyboardEvent) {
      // isTrusted = false: sự kiện do script tạo ra (tool tự bấm) - không tính.
      if (e.code !== "Space" || e.repeat || !e.isTrusted || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.closest("input, textarea, select, button, a, [contenteditable=true]") || t.isContentEditable)) return;
      e.preventDefault();
      ref.current();
    }
    window.addEventListener("keydown", nghe);
    return () => window.removeEventListener("keydown", nghe);
  }, [bat]);
}

/**
 * Chặn nhịp nhanh hơn mức tối thiểu (mõ 0,4 giây, hạt 0,6 giây). Trả hàm kiểm:
 * `true` = được tính. Bỏ qua cả sự kiện do script tạo (isTrusted = false).
 * Dùng performance.now() (đồng hồ đơn điệu - đổi giờ máy không ảnh hưởng).
 * Đây là lớp giao diện; máy chủ kiểm lại theo phiên (usePhien) nên sửa code
 * trình duyệt cũng không làm số liệu đã lưu vượt thời gian thật.
 */
export function useNhipToiThieu(toiThieuMs: number) {
  const truoc = React.useRef(-Infinity);
  const [nhanh, setNhanh] = React.useState(false);
  const hen = React.useRef<number | undefined>(undefined);
  const cho = React.useCallback(
    (e?: { nativeEvent?: Event } | Event) => {
      const goc = e && "nativeEvent" in e ? e.nativeEvent : (e as Event | undefined);
      if (goc && goc.isTrusted === false) return false;
      const bay = performance.now();
      if (bay - truoc.current < toiThieuMs) {
        setNhanh(true);
        window.clearTimeout(hen.current);
        hen.current = window.setTimeout(() => setNhanh(false), 900);
        return false;
      }
      truoc.current = bay;
      return true;
    },
    [toiThieuMs],
  );
  return { cho, nhanh };
}

export type Phien = { batDau: () => void; lay: () => Promise<string | undefined>; xong: () => void };

/**
 * Phiên tu tập do máy chủ mở, gọi `batDau()` ở lần chạm đầu tiên. Máy chủ
 * lấy giờ của nó làm mốc nên số tiếng / hạt / giây lưu được không vượt thời
 * gian thật. Chưa đăng nhập thì không mở (lưu cũng cần đăng nhập).
 */
export function usePhien(type: LoaiNhatKy): Phien {
  const locale = useLocaleHienTai();
  const { nguoiDungId } = useCheDoSua();
  const hua = React.useRef<Promise<string | undefined> | null>(null);
  return React.useMemo(
    () => ({
      batDau: () => {
        if (hua.current || !nguoiDungId) return;
        hua.current = moPhien(type, locale)
          .then((kq) => kq.sessionId)
          .catch(() => {
            hua.current = null;
            return undefined;
          });
      },
      lay: async () => (hua.current ? hua.current : undefined),
      xong: () => {
        hua.current = null;
      },
    }),
    [type, locale, nguoiDungId],
  );
}

/** Gọi `fn` đều đặn `bpm` lần mỗi phút khi `bat`. */
export function useNhipTuDong(bat: boolean, bpm: number, fn: () => void) {
  const ref = React.useRef(fn);
  React.useEffect(() => {
    ref.current = fn;
  });
  React.useEffect(() => {
    if (!bat) return;
    const t = window.setInterval(() => ref.current(), 60000 / Math.max(20, bpm));
    return () => window.clearInterval(t);
  }, [bat, bpm]);
}

export function rung(ms: number | number[] = 12) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    // trình duyệt không hỗ trợ
  }
}

/** Vòng sáng lan ra mỗi lần chạm (đặt trong khối `relative`). `lan` đổi là bật một vòng mới. */
export function VongLan({ lan, className }: { lan: number; className?: string }) {
  if (lan === 0) return null;
  return (
    <span
      key={lan}
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 rounded-full border-2 border-accent", className)}
      style={{ animation: "tt-gon 0.6s ease-out forwards" }}
    />
  );
}

/** Mục hướng dẫn ngắn dưới mỗi công cụ. */
export function HuongDan({ tieuDe, muc }: { tieuDe: string; muc: { title: string; body: string }[] }) {
  return (
    <section aria-label={tieuDe} className="flex flex-col gap-4">
      <h2 className="font-serif text-xl font-bold text-ink">{tieuDe}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {muc.map((m) => (
          <div key={m.title} className="rounded-lg border border-line bg-surface p-4">
            <h3 className="font-semibold text-ink">{m.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-body">{m.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
