"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Link2, Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/primitives";
import { HopLoi, chuLoi, useLocale } from "@/components/admin/admin-shell";
import {
  layAmThanhQuanTri,
  sapXepAmThanh,
  suaAmThanh,
  themAmThanh,
  xoaAmThanh,
  type AmThanhQuanTri,
} from "@/lib/admin-api";
import { urlApi } from "@/lib/auth";
import { localePath } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Muc = AmThanhQuanTri["category"];
type Loai = AmThanhQuanTri["kind"];

/** Mỗi mục chỉ dùng vài loại âm thanh - form thêm chỉ cho chọn những loại công cụ của mục đó thật sự phát. */
const MUC: { key: Muc; ten: string; trang: string; loai: { key: Loai; dung: string }[] }[] = [
  {
    key: "tung-kinh",
    ten: "Tụng kinh / Niệm Phật",
    trang: "/tu-tap/tung-kinh-niem-phat",
    loai: [
      { key: "mo", dung: "tiếng mõ mỗi lần đếm niệm Phật và mõ giữ nhịp khi tụng" },
      { key: "chuong", dung: "chuông mở đầu buổi tụng, chuông khi đủ số câu niệm" },
      { key: "tung-mau", dung: "bài tụng mẫu để nghe tụng theo, chọn được làm \"kinh phát âm thanh\" khi thiền" },
    ],
  },
  {
    key: "thien-dinh",
    ten: "Thiền định",
    trang: "/tu-tap/thien-dinh",
    loai: [
      { key: "chuong", dung: "chuông bắt đầu, nhắc giữa giờ và kết thúc" },
      { key: "am-nen", dung: "âm nền phát lặp trong lúc thiền" },
      { key: "huong-dan", dung: "bài thiền có giọng hướng dẫn" },
    ],
  },
  {
    key: "go-mo",
    ten: "Gõ mõ / Tràng hạt",
    trang: "/tu-tap/go-mo-chuoi-hat",
    loai: [
      { key: "mo", dung: "tiếng mõ ảo (cả mõ gõ theo nhịp khi thiền)" },
      { key: "chuong", dung: "chuông khi lần hết một vòng chuỗi" },
      { key: "hat", dung: "tiếng mỗi lần lần một hạt chuỗi (cả khi thiền)" },
    ],
  },
  {
    key: "cau-an",
    ten: "Cầu an / Cầu siêu",
    trang: "/tu-tap/cau-an-cau-sieu",
    loai: [
      { key: "chuong", dung: "chuông cầu nguyện" },
      { key: "am-nen", dung: "âm nền khi đọc, viết lời nguyện" },
    ],
  },
];

const TEN_LOAI: Record<Loai, string> = {
  chuong: "Chuông",
  mo: "Mõ",
  "am-nen": "Âm nền",
  "tung-mau": "Tụng mẫu",
  "huong-dan": "Có hướng dẫn",
  hat: "Tiếng hạt",
};

const TOI_DA_BYTE = 5.5 * 1024 * 1024;

const kb = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
const nguon = (a: AmThanhQuanTri) => (/^https?:\/\//i.test(a.src) ? a.src : urlApi(a.src));

export function SoundsPanel() {
  const locale = useLocale();
  const [ds, setDs] = React.useState<AmThanhQuanTri[]>([]);
  const [dangTai, setDangTai] = React.useState(true);
  const [loi, setLoi] = React.useState("");
  const [mucMo, setMucMo] = React.useState<Muc>("tung-kinh");

  const nap = React.useCallback(() => {
    setDangTai(true);
    setLoi("");
    layAmThanhQuanTri(locale)
      .then(setDs)
      .catch((e) => setLoi(chuLoi(e, "Không tải được danh sách âm thanh.")))
      .finally(() => setDangTai(false));
  }, [locale]);
  React.useEffect(nap, [nap]);

  async function sua(a: AmThanhQuanTri, thay: Partial<AmThanhQuanTri>) {
    setDs((cu) => cu.map((x) => (x.id === a.id ? { ...x, ...thay } : x)));
    try {
      const moi = await suaAmThanh({ id: a.id, ...thay }, locale);
      setDs((cu) => cu.map((x) => (x.id === a.id ? moi : x)));
    } catch (e) {
      setDs((cu) => cu.map((x) => (x.id === a.id ? a : x)));
      window.alert(chuLoi(e));
    }
  }

  async function xoa(a: AmThanhQuanTri) {
    if (!window.confirm(`Xoá âm thanh “${a.title}”? Người dùng đang chọn âm thanh này sẽ tự chuyển sang âm thanh đầu tiên cùng loại.`)) return;
    try {
      await xoaAmThanh(a.id, locale);
      setDs((cu) => cu.filter((x) => x.id !== a.id));
    } catch (e) {
      window.alert(chuLoi(e));
    }
  }

  /** Đổi chỗ với âm thanh liền trên / dưới CÙNG LOẠI (danh sách hiện theo loại). */
  async function doiCho(muc: Muc, id: string, huong: -1 | 1) {
    const trongMuc = ds.filter((x) => x.category === muc).sort((a, b) => a.order - b.order);
    const i = trongMuc.findIndex((x) => x.id === id);
    if (i < 0) return;
    const cungLoai = trongMuc.map((x, k) => (x.kind === trongMuc[i].kind ? k : -1)).filter((k) => k >= 0);
    const j = cungLoai[cungLoai.indexOf(i) + huong];
    if (j === undefined) return;
    const moi = [...trongMuc];
    [moi[i], moi[j]] = [moi[j], moi[i]];
    const truoc = ds;
    setDs([...ds.filter((x) => x.category !== muc), ...moi.map((x, k) => ({ ...x, order: k }))]);
    try {
      await sapXepAmThanh(
        moi.map((x) => x.id),
        locale,
      );
    } catch (e) {
      setDs(truoc);
      window.alert(chuLoi(e));
    }
  }

  const muc = MUC.find((m) => m.key === mucMo)!;
  const trongMuc = ds.filter((x) => x.category === mucMo).sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="font-serif text-2xl font-bold tracking-tight">Âm thanh tu tập</h1>
        <p className="max-w-3xl text-sm text-muted">
          Danh sách người dùng được chọn trong từng công cụ ở mục Tu tập. Âm thanh xếp đầu mỗi loại là lựa chọn mặc định.
          Tải tệp MP3, WAV, OGG, M4A (tối đa 5,5 MB) hoặc dán link ngoài cho bài dài. Tắt “Hiện” để ẩn mà không xoá.
        </p>
      </div>

      <HopLoi loi={loi} thuLai={nap} />

      <div role="tablist" aria-label="Mục tu tập" className="flex flex-wrap gap-1.5">
        {MUC.map((m) => {
          const so = ds.filter((x) => x.category === m.key).length;
          return (
            <Button key={m.key} role="tab" aria-selected={mucMo === m.key} size="sm" variant={mucMo === m.key ? "solid" : "outline"} onClick={() => setMucMo(m.key)}>
              {m.ten} <span className="opacity-70">({so})</span>
            </Button>
          );
        })}
      </div>

      <Card className="flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-serif text-lg font-bold">{muc.ten}</h2>
          <a href={localePath(locale, muc.trang)} target="_blank" rel="noreferrer" className="text-sm text-accent hover:underline">
            Mở trang công cụ ↗
          </a>
        </div>
        <ul className="flex flex-col gap-1 text-xs text-muted">
          {muc.loai.map((l) => (
            <li key={l.key}>
              <span className="font-medium text-ink">{TEN_LOAI[l.key]}</span>: {l.dung}
            </li>
          ))}
        </ul>

        {dangTai ? <p className="text-sm text-muted">Đang tải…</p> : null}
        {!dangTai && trongMuc.length === 0 ? <p className="text-sm text-muted">Mục này chưa có âm thanh nào.</p> : null}

        {muc.loai.map((l) => {
          const nhom = trongMuc.filter((x) => x.kind === l.key);
          if (nhom.length === 0) return null;
          return (
            <section key={l.key} className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-ink">{TEN_LOAI[l.key]}</h3>
              <ol className="flex flex-col gap-2">
                {nhom.map((a, k) => (
                  <DongAmThanh
                    key={a.id}
                    a={a}
                    loaiChon={muc.loai.map((x) => x.key)}
                    macDinh={k === 0 && a.active}
                    lenDuoc={k > 0}
                    xuongDuoc={k < nhom.length - 1}
                    onSua={(thay) => sua(a, thay)}
                    onXoa={() => xoa(a)}
                    onDoiCho={(h) => doiCho(mucMo, a.id, h)}
                  />
                ))}
              </ol>
            </section>
          );
        })}

        {/* Âm thanh loại không còn dùng cho mục này (đổi loại / dữ liệu cũ) - vẫn hiện để sửa hoặc xoá. */}
        {trongMuc.some((x) => !muc.loai.some((l) => l.key === x.kind)) ? (
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-lacquer">Loại mục này không dùng</h3>
            <ol className="flex flex-col gap-2">
              {trongMuc
                .filter((x) => !muc.loai.some((l) => l.key === x.kind))
                .map((a) => (
                  <DongAmThanh
                    key={a.id}
                    a={a}
                    loaiChon={muc.loai.map((x) => x.key)}
                    macDinh={false}
                    lenDuoc={false}
                    xuongDuoc={false}
                    onSua={(thay) => sua(a, thay)}
                    onXoa={() => xoa(a)}
                    onDoiCho={() => {}}
                  />
                ))}
            </ol>
          </section>
        ) : null}

        <FormThem
          key={mucMo}
          muc={mucMo}
          loaiChon={muc.loai.map((x) => x.key)}
          onDaThem={(moi) => setDs((cu) => [...cu, moi])}
        />
      </Card>
    </div>
  );
}

function DongAmThanh({
  a,
  loaiChon,
  macDinh,
  lenDuoc,
  xuongDuoc,
  onSua,
  onXoa,
  onDoiCho,
}: {
  a: AmThanhQuanTri;
  loaiChon: Loai[];
  macDinh: boolean;
  lenDuoc: boolean;
  xuongDuoc: boolean;
  onSua: (thay: Partial<AmThanhQuanTri>) => void;
  onXoa: () => void;
  onDoiCho: (h: -1 | 1) => void;
}) {
  const [ten, setTen] = React.useState(a.title);
  React.useEffect(() => setTen(a.title), [a.title]);

  return (
    <li className={cn("flex flex-col gap-3 rounded-md border border-line p-3 lg:flex-row lg:items-center", !a.active && "opacity-60")}>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <input
            value={ten}
            onChange={(e) => setTen(e.target.value)}
            onBlur={() => ten.trim() && ten.trim() !== a.title && onSua({ title: ten.trim() })}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
            maxLength={120}
            aria-label="Tên âm thanh"
            className="h-8 min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1.5 text-sm font-medium text-ink hover:border-line focus:border-accent focus:outline-none"
          />
          {macDinh ? <Badge tone="accent">Mặc định</Badge> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2 px-1.5 text-xs text-muted">
          <Badge tone="neutral">{a.source === "url" ? "Link ngoài" : `Tải lên · ${kb(a.sizeBytes)}`}</Badge>
          {a.source === "url" ? (
            <span className="max-w-[18rem] truncate" title={a.url}>
              {a.url}
            </span>
          ) : null}
        </div>
      </div>

      <audio controls preload="none" src={nguon(a)} className="h-9 w-full lg:w-64" />

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={a.kind}
          onChange={(e) => onSua({ kind: e.target.value as Loai, ...(e.target.value === "am-nen" ? { loop: true } : {}) })}
          aria-label="Loại"
          className="h-8 rounded-md border border-line bg-surface px-2 text-sm"
        >
          {(loaiChon.includes(a.kind) ? loaiChon : [a.kind, ...loaiChon]).map((k) => (
            <option key={k} value={k}>
              {TEN_LOAI[k]}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-sm">
          <input type="checkbox" checked={a.active} onChange={(e) => onSua({ active: e.target.checked })} className="size-4 accent-accent" />
          Hiện
        </label>
        <label className="flex items-center gap-1.5 text-sm" title="Phát lặp lại liên tục">
          <input type="checkbox" checked={a.loop} onChange={(e) => onSua({ loop: e.target.checked })} className="size-4 accent-accent" />
          Lặp
        </label>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="size-8" aria-label="Lên trên" disabled={!lenDuoc} onClick={() => onDoiCho(-1)}>
            <ArrowUp className="size-4" aria-hidden />
          </Button>
          <Button variant="ghost" size="icon" className="size-8" aria-label="Xuống dưới" disabled={!xuongDuoc} onClick={() => onDoiCho(1)}>
            <ArrowDown className="size-4" aria-hidden />
          </Button>
          <Button variant="ghost" size="icon" className="size-8 hover:text-lacquer" aria-label="Xoá" onClick={onXoa}>
            <Trash2 className="size-4" aria-hidden />
          </Button>
        </div>
      </div>
    </li>
  );
}

function FormThem({ muc, loaiChon, onDaThem }: { muc: Muc; loaiChon: Loai[]; onDaThem: (a: AmThanhQuanTri) => void }) {
  const locale = useLocale();
  const [moForm, setMoForm] = React.useState(false);
  const [kieu, setKieu] = React.useState<"tep" | "link">("tep");
  const [loai, setLoai] = React.useState<Loai>(loaiChon[0]);
  const [ten, setTen] = React.useState("");
  const [tep, setTep] = React.useState<File | null>(null);
  const [link, setLink] = React.useState("");
  const [dangGui, setDangGui] = React.useState(false);
  const [loi, setLoi] = React.useState("");
  const inputTep = React.useRef<HTMLInputElement>(null);
  const [nghe, setNghe] = React.useState("");
  React.useEffect(() => {
    if (!tep) return setNghe("");
    const u = URL.createObjectURL(tep);
    setNghe(u);
    return () => URL.revokeObjectURL(u);
  }, [tep]);

  function chonTep(f: File | null) {
    setLoi("");
    if (!f) return setTep(null);
    if (!f.type.startsWith("audio/")) return setLoi("Tệp không phải âm thanh.");
    if (f.size > TOI_DA_BYTE) return setLoi(`Tệp ${kb(f.size)} - vượt quá 5,5 MB. Dùng link ngoài cho bài dài.`);
    setTep(f);
    if (!ten.trim()) setTen(f.name.replace(/\.[^.]+$/, "").slice(0, 120));
  }

  async function gui(e: React.FormEvent) {
    e.preventDefault();
    setLoi("");
    if (!ten.trim()) return setLoi("Nhập tên âm thanh.");
    if (kieu === "tep" && !tep) return setLoi("Chọn tệp âm thanh.");
    if (kieu === "link" && !/^https?:\/\/\S+$/i.test(link.trim())) return setLoi("Link phải bắt đầu bằng http:// hoặc https://");
    setDangGui(true);
    try {
      const file =
        kieu === "tep" && tep
          ? await new Promise<string>((ok, hong) => {
              const r = new FileReader();
              r.onload = () => ok(String(r.result));
              r.onerror = () => hong(r.error);
              r.readAsDataURL(tep);
            })
          : "";
      const moi = await themAmThanh(
        { category: muc, kind: loai, title: ten.trim(), file, url: kieu === "link" ? link.trim() : "", loop: loai === "am-nen" },
        locale,
      );
      onDaThem(moi);
      setTen("");
      setTep(null);
      setLink("");
      if (inputTep.current) inputTep.current.value = "";
      setMoForm(false);
    } catch (err) {
      setLoi(chuLoi(err, "Không thêm được âm thanh."));
    } finally {
      setDangGui(false);
    }
  }

  if (!moForm) {
    return (
      <div className="border-t border-line pt-4">
        <Button size="sm" onClick={() => setMoForm(true)}>
          <Plus className="size-4" aria-hidden /> Thêm âm thanh
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={gui} className="flex flex-col gap-4 border-t border-line pt-4">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Tên hiển thị</span>
          <input
            value={ten}
            onChange={(e) => setTen(e.target.value)}
            maxLength={120}
            placeholder="Ví dụ: Chuông chùa Bái Đính"
            className="h-9 rounded-md border border-line bg-surface px-2.5 text-sm focus:border-accent focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Loại</span>
          <select value={loai} onChange={(e) => setLoai(e.target.value as Loai)} className="h-9 rounded-md border border-line bg-surface px-2.5 text-sm">
            {loaiChon.map((k) => (
              <option key={k} value={k}>
                {TEN_LOAI[k]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex gap-1.5">
        <Button type="button" size="sm" variant={kieu === "tep" ? "solid" : "outline"} onClick={() => setKieu("tep")}>
          <Upload className="size-4" aria-hidden /> Tải tệp lên
        </Button>
        <Button type="button" size="sm" variant={kieu === "link" ? "solid" : "outline"} onClick={() => setKieu("link")}>
          <Link2 className="size-4" aria-hidden /> Link ngoài
        </Button>
      </div>

      {kieu === "tep" ? (
        <div className="flex flex-col gap-2">
          <input
            ref={inputTep}
            type="file"
            accept="audio/*"
            onChange={(e) => chonTep(e.target.files?.[0] ?? null)}
            className="text-sm file:mr-3 file:rounded-md file:border file:border-line file:bg-surface-2 file:px-3 file:py-1.5 file:text-sm"
          />
          {nghe ? <audio controls src={nghe} className="h-9 w-full max-w-md" /> : null}
        </div>
      ) : (
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Link tệp âm thanh (MP3, OGG...) - nên dùng cho bài tụng, bài thiền dài</span>
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://..."
            className="h-9 rounded-md border border-line bg-surface px-2.5 text-sm focus:border-accent focus:outline-none"
          />
        </label>
      )}

      {loi ? (
        <p role="alert" className="text-sm text-lacquer">
          {loi}
        </p>
      ) : null}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={dangGui}>
          {dangGui ? "Đang lưu…" : "Lưu"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setMoForm(false)}>
          Huỷ
        </Button>
      </div>
    </form>
  );
}
