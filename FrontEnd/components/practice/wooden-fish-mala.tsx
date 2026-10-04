"use client";

import * as React from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import { useAmThanhNgan, useLuaChonNho } from "@/components/practice/use-sound";
import {
  ChonAmThanh,
  CongTac,
  NutLuuNhatKy,
  ThanhTruot,
  VongLan,
  dien,
  rung,
  useAmThanhDaChon,
  useDsAmThanh,
  useNhipToiThieu,
  useNhipTuDong,
  usePhien,
  usePhimCach,
  usePhimTat,
  useLocaleHienTai,
  type NhanTuTap,
  type Phien,
} from "@/components/practice/common";
import Link from "next/link";
import { Check } from "lucide-react";
import { useCheDoSua } from "@/components/layout/inline-edit";
import { LoiApi } from "@/lib/auth";
import { localePath } from "@/lib/i18n";
import { ghiNhatKy, type LoaiNhatKy } from "@/lib/practice";

/** Khoảng tối thiểu giữa hai lần: mõ 0,4 giây (tối đa 150 nhịp/phút), hạt 0,6 giây. Máy chủ kiểm lại theo phiên. */
export const MO_TOI_THIEU_MS = 400;
export const HAT_TOI_THIEU_MS = 600;
/** Tự gõ theo nhịp: tối đa 120 nhịp/phút (gõ tay vẫn được tới 0,4 giây/tiếng). */
const BPM_TOI_DA = 120;
import { cn } from "@/lib/utils";

/** Số liệu một công cụ gửi lên khung cha để lưu chung (trang Gõ mõ / Chuỗi hạt). */
type MucLuu = { type: LoaiNhatKy; amount: number; note?: string; phien: Phien; lamLai: () => void };

/**
 * Trang "Gõ mõ / Chuỗi hạt": mõ ảo bên trái, chuỗi hạt bên phải (hai khung cao
 * bằng nhau, nút "Làm lại" sát đáy mỗi khung) và dải trạng thái TỰ LƯU bên dưới
 * (ngừng gõ / lần hạt 3 giây là lưu vào nhật ký).
 */
export function WoodenFishMala({ nhan }: { nhan: NhanTuTap }) {
  const { ds } = useDsAmThanh("go-mo");
  const am = useAmThanhNgan();
  const [mo, setMo] = React.useState<MucLuu | null>(null);
  const [hat, setHat] = React.useState<MucLuu | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-6 lg:grid-cols-2">
        <GoMo nhan={nhan} ds={ds} am={am} luuChung={setMo} />
        <ChuoiHat nhan={nhan} ds={ds} am={am} luuChung={setHat} />
      </div>
      <TuDongLuu nhan={nhan} muc={[mo, hat].filter((x): x is MucLuu => !!x)} />
    </div>
  );
}

/** Ngừng gõ / lần hạt quá chừng này thì tự lưu phần mới vào nhật ký. */
const TU_LUU_SAU_MS = 3000;

/**
 * Tự lưu vào nhật ký: mỗi khi một công cụ NGỪNG quá 3 giây (không gõ mõ / lần
 * hạt thêm), lưu phần tăng thêm kể từ lần lưu trước - bộ đếm trên màn hình vẫn
 * giữ nguyên để đếm tiếp. Mỗi lần lưu dùng phiên riêng do máy chủ mở (lần chạm
 * kế tiếp mở phiên mới), nên máy chủ vẫn hạ được số liệu vượt thời gian thật.
 * Ẩn tab / rời trang thì lưu ngay phần còn lại. Chưa đăng nhập: chỉ nhắc đăng nhập.
 */
function TuDongLuu({ nhan, muc }: { nhan: NhanTuTap; muc: MucLuu[] }) {
  const locale = useLocaleHienTai();
  const { nguoiDungId, daBiet } = useCheDoSua();
  // Số đã lưu của từng công cụ (mốc để tính phần tăng thêm) và tổng đã lưu trong lần mở trang này.
  const daLuu = React.useRef<Record<string, number>>({});
  const [tongDaLuu, setTongDaLuu] = React.useState<Record<string, number>>({});
  const [dangLuu, setDangLuu] = React.useState(false);
  const [loi, setLoi] = React.useState("");
  const mucRef = React.useRef(muc);
  mucRef.current = muc;

  const luu = React.useCallback(
    async (m: MucLuu) => {
      if (!nguoiDungId) return;
      const moc = daLuu.current[m.type] ?? 0;
      const them = m.amount - moc;
      if (them <= 0) return;
      daLuu.current[m.type] = m.amount; // giữ chỗ trước: tránh lưu trùng khi hai lượt chạy gần nhau
      setDangLuu(true);
      try {
        const sessionId = await m.phien.lay();
        m.phien.xong();
        const kq = await ghiNhatKy({ type: m.type, amount: them, note: m.note, sessionId }, locale);
        setTongDaLuu((cu) => ({ ...cu, [m.type]: (cu[m.type] ?? 0) + kq.amount }));
        setLoi("");
      } catch (err) {
        daLuu.current[m.type] = moc; // lưu hỏng: lần sau thử lại phần này
        m.phien.xong();
        setLoi((err instanceof LoiApi && err.thongDiep) || nhan.saveError);
      } finally {
        setDangLuu(false);
      }
    },
    [nguoiDungId, locale, nhan.saveError],
  );

  // Hẹn giờ 3 giây cho từng công cụ mỗi khi số đếm đổi; đếm tiếp thì hẹn lại.
  const mo = muc.find((m) => m.type === "go-mo");
  const hat = muc.find((m) => m.type === "chuoi-hat");
  for (const m of [mo, hat]) {
    // Làm lại (số đếm về thấp hơn mốc): mốc theo về số mới.
    if (m && m.amount < (daLuu.current[m.type] ?? 0)) daLuu.current[m.type] = m.amount;
  }
  React.useEffect(() => {
    if (!mo || !nguoiDungId) return;
    const t = window.setTimeout(() => void luu(mo), TU_LUU_SAU_MS);
    return () => window.clearTimeout(t);
  }, [mo?.amount, nguoiDungId]); // eslint-disable-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    if (!hat || !nguoiDungId) return;
    const t = window.setTimeout(() => void luu(hat), TU_LUU_SAU_MS);
    return () => window.clearTimeout(t);
  }, [hat?.amount, nguoiDungId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ẩn tab / chuyển trang: lưu ngay phần chưa lưu.
  React.useEffect(() => {
    const xa = () => {
      if (document.visibilityState === "hidden") for (const m of mucRef.current) void luu(m);
    };
    document.addEventListener("visibilitychange", xa);
    return () => {
      document.removeEventListener("visibilitychange", xa);
      for (const m of mucRef.current) void luu(m);
    };
  }, [luu]);

  if (!daBiet) return null;

  const dong = [
    tongDaLuu["go-mo"] ? `${nhan.woodenFish.title}: ${dien(nhan.woodenFish.strikes, { n: tongDaLuu["go-mo"] })}` : "",
    tongDaLuu["chuoi-hat"] ? `${nhan.mala.title}: ${dien(nhan.mala.total, { n: tongDaLuu["chuoi-hat"] })}` : "",
  ].filter(Boolean);

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 rounded-card border border-line bg-surface px-4 py-3 text-sm">
      {!nguoiDungId ? (
        <Button variant="outline" size="sm" asChild>
          <Link href={localePath(locale, "/dang-nhap")}>{nhan.signInToSave}</Link>
        </Button>
      ) : (
        <>
          <span className="text-muted">{dangLuu ? nhan.autoSaving : nhan.autoSaveHint}</span>
          {dong.length ? (
            <span className="flex items-center gap-1.5 text-accent">
              <Check className="size-4" aria-hidden /> {nhan.saved}: {dong.join(" · ")}
            </span>
          ) : null}
          {dong.length ? (
            <Link href={localePath(locale, "/qua-trinh-tu-tap")} className="text-xs text-muted underline-offset-2 hover:text-accent hover:underline">
              {nhan.viewJourney}
            </Link>
          ) : null}
        </>
      )}
      {loi ? (
        <span role="alert" className="w-full text-center text-xs text-lacquer">
          {loi}
        </span>
      ) : null}
    </div>
  );
}

export type Am = ReturnType<typeof useAmThanhNgan>;
export type Ds = ReturnType<typeof useDsAmThanh>["ds"];

/** Dòng nhắc nhỏ khi bấm nhanh hơn nhịp tối thiểu (lần bấm đó không được tính). */
function NhacCham({ hien, nhan }: { hien: boolean; nhan: NhanTuTap }) {
  return (
    <p aria-live="polite" className={cn("h-4 text-center text-xs text-lacquer transition-opacity", hien ? "opacity-100" : "opacity-0")}>
      {hien ? nhan.tooFast : ""}
    </p>
  );
}

/** Mõ ảo - dùng ở trang Gõ mõ / Chuỗi hạt và trong bộ đếm của trang Tụng kinh. Âm thanh lấy ở mục go-mo. */
export function GoMo({
  nhan,
  ds,
  am,
  luuChung,
}: {
  nhan: NhanTuTap;
  ds: Ds;
  am: Am;
  /** Có thì không hiện nút lưu riêng - báo số liệu lên để khung cha lưu chung. */
  luuChung?: (m: MucLuu) => void;
}) {
  const mo = useAmThanhDaChon("go-mo", "mo", ds);
  const [dem, setDem] = React.useState(0);
  const [tuGo, setTuGo] = React.useState(false);
  const [bpmLuu, setBpm] = useLuaChonNho("go-mo_bpm", 60);
  const bpm = Math.min(BPM_TOI_DA, bpmLuu);
  const [nhan_, setNhan] = React.useState(false);
  const nhip = useNhipToiThieu(MO_TOI_THIEU_MS);
  const phien = usePhien("go-mo");

  // Giải mã sẵn để tiếng gõ đầu tiên không trễ.
  React.useEffect(() => {
    if (mo.amThanh) void am.nap(mo.amThanh.src);
  }, [mo.amThanh, am]);

  const go = React.useCallback((e?: { nativeEvent?: Event }) => {
    if (!nhip.cho(e)) return;
    phien.batDau();
    setDem((n) => n + 1);
    if (mo.amThanh) void am.phat(mo.amThanh.src);
    rung(10);
    setNhan(true);
    window.setTimeout(() => setNhan(false), 90);
  }, [mo.amThanh, am, nhip, phien]);

  usePhimCach(() => go());
  React.useEffect(() => {
    luuChung?.({ type: "go-mo", amount: dem, phien, lamLai: () => setDem(0) });
  }, [dem, phien, luuChung]);
  useNhipTuDong(tuGo, bpm, () => go());

  return (
    <Card className="flex h-full flex-col gap-5 p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-xl font-bold text-ink">{nhan.woodenFish.title}</h2>
        <span className="text-2xl font-bold tabular-nums text-accent">{dien(nhan.woodenFish.strikes, { n: dem })}</span>
      </div>

      <button
        type="button"
        onClick={(e) => go(e)}
        data-phim-tat
        aria-label={nhan.woodenFish.tapHint}
        className="relative mx-auto grid aspect-square w-full max-w-[16rem] touch-manipulation select-none place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
      >
        <VongLan lan={dem} />
        <svg
          viewBox="0 0 200 170"
          className={cn("w-[82%] drop-shadow-md transition-transform duration-75", nhan_ && "scale-[0.94]")}
          aria-hidden
        >
          <defs>
            <radialGradient id="tt-go" cx="38%" cy="32%" r="75%">
              <stop offset="0%" stopColor="#d08a4a" />
              <stop offset="55%" stopColor="#a3561f" />
              <stop offset="100%" stopColor="#5f2c0e" />
            </radialGradient>
          </defs>
          {/* thân mõ */}
          <path d="M100 18 C158 18 190 58 186 104 C182 146 146 162 100 162 C54 162 18 146 14 104 C10 58 42 18 100 18 Z" fill="url(#tt-go)" />
          {/* miệng mõ */}
          <path d="M30 106 C62 128 138 128 170 106" fill="none" stroke="#3a1906" strokeWidth="9" strokeLinecap="round" />
          {/* quai cầm hình đầu cá */}
          <path d="M78 22 C82 6 118 6 122 22" fill="none" stroke="#7a3a14" strokeWidth="8" strokeLinecap="round" />
          {/* vân gỗ, ánh sáng */}
          <path d="M52 62 C70 48 92 44 112 46" fill="none" stroke="#f0c48c" strokeOpacity="0.35" strokeWidth="5" strokeLinecap="round" />
          <circle cx="62" cy="86" r="5" fill="#3a1906" fillOpacity="0.55" />
          <circle cx="138" cy="86" r="5" fill="#3a1906" fillOpacity="0.55" />
        </svg>
      </button>
      <p className="text-center text-xs text-muted">{nhan.woodenFish.tapHint}</p>
      <NhacCham hien={nhip.nhanh} nhan={nhan} />

      <div className="grid gap-4 sm:grid-cols-2">
        <ChonAmThanh
          nhan={nhan}
          label={nhan.woodenFish.moSound}
          cungLoai={mo.cungLoai}
          value={mo.id}
          onChange={mo.chon}
          onNghe={mo.amThanh ? () => void am.phat(mo.amThanh!.src) : undefined}
        />
        <div className="flex flex-col gap-3">
          <CongTac checked={tuGo} onChange={setTuGo}>
            {nhan.woodenFish.auto}
          </CongTac>
          <ThanhTruot
            label={nhan.woodenFish.auto}
            hienThi={dien(nhan.woodenFish.bpm, { n: bpm })}
            giaTri={bpm}
            min={30}
            max={BPM_TOI_DA}
            onChange={setBpm}
          />
        </div>
      </div>

      {/* mt-auto: hàng nút luôn sát đáy khung (hai khung cao bằng nhau). */}
      <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-line pt-4">
        {luuChung ? null : <NutLuuNhatKy nhan={nhan} type="go-mo" amount={dem} phien={phien} onDaLuu={() => setDem(0)} />}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setDem(0);
            phien.xong();
          }}
          disabled={dem === 0}
          className="ml-auto"
        >
          <RotateCcw className="size-4" aria-hidden /> {nhan.reset}
        </Button>
      </div>
    </Card>
  );
}

const LOAI_CHUOI = [108, 54, 27, 21] as const;

/** Chuỗi hạt - dùng ở trang Gõ mõ / Chuỗi hạt và trong bộ đếm của trang Tụng kinh. */
export function ChuoiHat({
  nhan,
  ds,
  am,
  luuChung,
}: {
  nhan: NhanTuTap;
  ds: Ds;
  am: Am;
  /** Có thì không hiện nút lưu riêng - báo số liệu lên để khung cha lưu chung. */
  luuChung?: (m: MucLuu) => void;
}) {
  const [soHat, setSoHat] = useLuaChonNho<number>("chuoi-hat_so", 108);
  const chuong = useAmThanhDaChon("go-mo", "chuong", ds, "chuong-vong");
  const tiengHat = useAmThanhDaChon("go-mo", "hat", ds);
  const nhip = useNhipToiThieu(HAT_TOI_THIEU_MS);
  const phien = usePhien("chuoi-hat");
  React.useEffect(() => {
    if (tiengHat.amThanh) void am.nap(tiengHat.amThanh.src);
  }, [tiengHat.amThanh, am]);
  const [hat, setHat] = React.useState(0);
  const [vong, setVong] = React.useState(0);
  const [lan, setLan] = React.useState(0);

  function lanHat(e?: { nativeEvent?: Event }) {
    if (!nhip.cho(e)) return;
    phien.batDau();
    setLan((n) => n + 1);
    if (tiengHat.amThanh) void am.phat(tiengHat.amThanh.src);
    if (hat + 1 >= soHat) {
      // Hết vòng: về hạt đầu, ngân chuông.
      setHat(0);
      setVong((v) => v + 1);
      if (chuong.amThanh) void am.phat(chuong.amThanh.src);
      rung([30, 60, 30]);
    } else {
      setHat(hat + 1);
      rung(8);
    }
  }

  function lamLai() {
    setHat(0);
    setVong(0);
    phien.xong();
  }

  // Máy tính: phím "+" để lần hạt (phím Cách dành cho mõ) - gõ mõ và lần chuỗi cùng lúc được.
  usePhimTat("Plus", () => lanHat());

  const tongHat = vong * soHat + hat;
  React.useEffect(() => {
    luuChung?.({
      type: "chuoi-hat",
      amount: tongHat,
      note: dien(nhan.mala.beadsOf, { n: soHat }),
      phien,
      lamLai: () => {
        setHat(0);
        setVong(0);
      },
    });
  }, [tongHat, soHat, phien, luuChung, nhan.mala.beadsOf]);

  const tong = vong * soHat + hat;

  // Toạ độ hạt trên vòng tròn: hạt mẫu (hạt lớn) ở trên cùng, đếm theo chiều kim đồng hồ.
  const R = 128;
  const C = 150;
  const banKinh = Math.min(9, ((Math.PI * 2 * R) / soHat) * 0.42);
  const toaDo = (i: number) => {
    const goc = -Math.PI / 2 + ((i + 1) / (soHat + 1)) * Math.PI * 2;
    return [C + R * Math.cos(goc), C + R * Math.sin(goc)] as const;
  };

  return (
    <Card className="flex h-full flex-col gap-5 p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-xl font-bold text-ink">{nhan.mala.title}</h2>
        <span className="text-2xl font-bold tabular-nums text-accent">{dien(nhan.mala.rounds, { n: vong })}</span>
      </div>

      <button
        type="button"
        onClick={(e) => lanHat(e)}
        data-phim-tat
        aria-label={nhan.mala.tap}
        className="relative mx-auto grid aspect-square w-full max-w-[16rem] touch-manipulation select-none place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
      >
        <svg viewBox="0 0 300 300" className="size-full" aria-hidden>
          <circle cx={C} cy={C} r={R} fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="1.5" className="text-muted" />
          {/* hạt mẫu + tua */}
          <circle cx={C} cy={C - R} r={banKinh + 5} className="fill-brass" />
          <path d={`M${C} ${C - R + banKinh + 5} l-6 22 h12 z`} className="fill-brass" opacity="0.7" />
          {Array.from({ length: soHat }, (_, i) => {
            const [x, y] = toaDo(i);
            const daLan = i < hat;
            const dangO = i === hat;
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={dangO ? banKinh + 2.5 : banKinh}
                className={cn(dangO ? "fill-accent" : daLan ? "fill-[#8a4b1d]" : "fill-[#d9b98f]")}
                stroke="#5f2c0e"
                strokeOpacity="0.35"
                strokeWidth="1"
              />
            );
          })}
        </svg>
        <span className="absolute inset-0 grid place-items-center">
          <span className="relative grid size-28 place-items-center rounded-full bg-surface-2">
            <VongLan lan={lan} />
            <span className="flex flex-col items-center leading-tight">
              <span className="text-3xl font-bold tabular-nums text-ink">{hat}</span>
              <span className="text-xs text-muted">/ {soHat}</span>
            </span>
          </span>
        </span>
      </button>
      <p className="text-center text-xs text-muted">
        {nhan.mala.tap} · {dien(nhan.mala.total, { n: tong })}
      </p>
      <NhacCham hien={nhip.nhanh} nhan={nhan} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">{nhan.mala.beads}</span>
          <div className="flex flex-wrap gap-1.5">
            {LOAI_CHUOI.map((n) => (
              <Button
                key={n}
                type="button"
                size="sm"
                variant={soHat === n ? "solid" : "outline"}
                onClick={() => {
                  setSoHat(n);
                  lamLai();
                }}
              >
                {n}
              </Button>
            ))}
          </div>
        </div>
        <ChonAmThanh
          nhan={nhan}
          label={nhan.mala.lapBell}
          cungLoai={chuong.cungLoai}
          value={chuong.id}
          onChange={chuong.chon}
          onNghe={chuong.amThanh ? () => void am.phat(chuong.amThanh!.src) : undefined}
        />
        <ChonAmThanh
          nhan={nhan}
          label={nhan.beadSound}
          cungLoai={tiengHat.cungLoai}
          value={tiengHat.id}
          onChange={tiengHat.chon}
          onNghe={tiengHat.amThanh ? () => void am.phat(tiengHat.amThanh!.src) : undefined}
        />
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-line pt-4">
        {luuChung ? null : (
          <NutLuuNhatKy
            nhan={nhan}
            type="chuoi-hat"
            amount={tong}
            note={dien(nhan.mala.beadsOf, { n: soHat })}
            phien={phien}
            onDaLuu={() => {
              setHat(0);
              setVong(0);
            }}
          />
        )}
        <Button variant="ghost" size="sm" onClick={lamLai} disabled={tong === 0} className="ml-auto">
          <RotateCcw className="size-4" aria-hidden /> {nhan.reset}
        </Button>
      </div>
    </Card>
  );
}
