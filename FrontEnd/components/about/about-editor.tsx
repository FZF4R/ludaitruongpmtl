"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Code2, Eye, Pencil, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import { useCheDoSua } from "@/components/layout/inline-edit";
import { docToken, LoiApi } from "@/lib/auth";
import { layCauHinh, luuCauHinh } from "@/lib/admin-api";
import { lamMoiCauHinh } from "@/lib/settings-action";
import { MAU_GIOI_THIEU } from "@/lib/about-template";
import { localeNames, locales, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Trình sửa trang Về chúng tôi - chỉ hiện với người có `system.settings`.
 * Sửa TOÀN BỘ nội dung dạng HTML, từng ngôn ngữ một (ngôn ngữ nào để trống
 * thì trang dùng bản tiếng Việt, tiếng Việt cũng trống thì dùng mẫu).
 *
 * Xem trước trong iframe sandbox (không chạy script) để HTML đang gõ không
 * đụng tới trang thật; trang công khai luôn lọc lại HTML ở server trước khi hiện.
 */
export function AboutEditor({ locale }: { locale: Locale }) {
  const { quyen } = useCheDoSua();
  const router = useRouter();
  const [mo, setMo] = React.useState(false);
  const [ban, setBan] = React.useState<Record<string, string> | null>(null);
  const [lang, setLang] = React.useState<Locale>(locale);
  const [xemTruoc, setXemTruoc] = React.useState(false);
  const [dang, setDang] = React.useState(false);
  const [bao, setBao] = React.useState("");

  React.useEffect(() => {
    if (!mo || ban) return;
    layCauHinh(locale)
      .then((c) => setBan({ ...(c.aboutHtml ?? {}) }))
      .catch((e) => setBao((e instanceof LoiApi && e.thongDiep) || "Không tải được nội dung."));
  }, [mo, ban, locale]);

  if (!quyen.includes("system.settings")) return null;

  if (!mo) {
    return (
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => setMo(true)}>
          <Pencil aria-hidden /> Sửa trang giới thiệu
        </Button>
      </div>
    );
  }

  const html = ban?.[lang] ?? "";
  const doi = (v: string) => setBan((cu) => ({ ...(cu ?? {}), [lang]: v }));

  async function luu() {
    if (!ban) return;
    setDang(true);
    setBao("");
    try {
      await luuCauHinh({ aboutHtml: ban }, locale);
      const token = docToken();
      if (token) await lamMoiCauHinh(token);
      setBao("Đã lưu.");
      router.refresh();
    } catch (e) {
      setBao((e instanceof LoiApi && e.thongDiep) || "Không lưu được, vui lòng thử lại.");
    } finally {
      setDang(false);
    }
  }

  return (
    <Card className="flex flex-col gap-4 border-accent/40 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="mr-auto font-serif text-lg font-bold">Sửa trang giới thiệu</h2>
        <Button variant="ghost" size="sm" onClick={() => setMo(false)}>
          <X aria-hidden /> Đóng
        </Button>
      </div>
      <p className="text-sm text-muted">
        Soạn bằng HTML. Thẻ được phép: đoạn văn, tiêu đề h2–h6, danh sách, ảnh, liên kết, bảng, trích dẫn, div/span kèm
        class. Script, style, iframe bị lọc bỏ khi hiển thị. Giữ các class <code>gt-*</code> của mẫu để giữ bố cục. Ngôn ngữ
        để trống sẽ dùng bản tiếng Việt.
      </p>

      <div className="flex flex-wrap items-center gap-1.5">
        {locales.map((l) => (
          <Button key={l} size="sm" variant={lang === l ? "solid" : "outline"} onClick={() => setLang(l)}>
            {localeNames[l]}
            {ban?.[l] ? <span className="opacity-70">●</span> : null}
          </Button>
        ))}
        <span className="mx-1 h-5 w-px bg-line" aria-hidden />
        <Button size="sm" variant={xemTruoc ? "outline" : "solid"} onClick={() => setXemTruoc(false)}>
          <Code2 aria-hidden /> HTML
        </Button>
        <Button size="sm" variant={xemTruoc ? "solid" : "outline"} onClick={() => setXemTruoc(true)}>
          <Eye aria-hidden /> Xem trước
        </Button>
      </div>

      {!ban ? (
        <p className="text-sm text-muted">Đang tải…</p>
      ) : xemTruoc ? (
        <iframe
          title="Xem trước"
          sandbox=""
          srcDoc={`<!doctype html><meta charset="utf-8"><style>body{font-family:Georgia,serif;line-height:1.7;max-width:56rem;margin:1.5rem auto;padding:0 1rem;color:#2b2420}.gt-hero,.gt-contact{background:#f3ead9;border-radius:12px;padding:1.5rem}.gt-hero{text-align:center}.gt-grid{display:grid;gap:1rem;grid-template-columns:repeat(auto-fit,minmax(13rem,1fr))}.gt-card{border:1px solid #e3d8c6;border-radius:10px;padding:1rem}.gt-quote{border-left:4px solid #8a6414;padding:.5rem 1rem}img{max-width:100%;border-radius:10px}a{color:#8a6414}</style>${html || MAU_GIOI_THIEU}`}
          className="h-[32rem] w-full rounded-md border border-line bg-white"
        />
      ) : (
        <textarea
          value={html}
          onChange={(e) => doi(e.target.value)}
          rows={22}
          spellCheck={false}
          placeholder="Để trống = dùng bản tiếng Việt (hoặc mẫu). Bấm “Dùng mẫu” để bắt đầu từ mẫu có sẵn."
          aria-label={`Nội dung HTML (${localeNames[lang]})`}
          className={cn(
            "w-full rounded-md border border-line bg-surface px-3 py-2 font-mono text-xs leading-relaxed text-ink focus:border-accent focus:outline-none",
          )}
        />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={luu} disabled={dang || !ban}>
          <Check aria-hidden /> {dang ? "Đang lưu…" : "Lưu tất cả ngôn ngữ"}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            if (!html || window.confirm("Thay nội dung đang soạn bằng mẫu có sẵn?")) doi(MAU_GIOI_THIEU);
          }}
        >
          <RotateCcw aria-hidden /> Dùng mẫu
        </Button>
        {html ? (
          <Button variant="ghost" onClick={() => doi("")}>
            Để trống ngôn ngữ này
          </Button>
        ) : null}
        {bao ? <span className="text-sm text-muted">{bao}</span> : null}
      </div>
    </Card>
  );
}
