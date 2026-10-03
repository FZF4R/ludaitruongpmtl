"use client";

import * as React from "react";
import { Camera } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { LoiApi, taiAvatar } from "@/lib/auth";
import type { Locale } from "@/lib/i18n";

/**
 * Avatar ở trang tài khoản, bấm để đổi ảnh.
 *
 * Ảnh được cắt vuông giữa ảnh và thu về 256px ngay trên trình duyệt trước khi
 * gửi: avatar chỉ hiện tối đa vài chục pixel cạnh bài viết, bình luận, nên
 * gửi ảnh chụp điện thoại vài MB là phí và vượt trần 1MB của backend.
 */

const CANH = 256;

async function catVuong(tep: File): Promise<string> {
  const bitmap = await createImageBitmap(tep);
  const canh = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = CANH;
  canvas.height = CANH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    bitmap,
    (bitmap.width - canh) / 2,
    (bitmap.height - canh) / 2,
    canh,
    canh,
    0,
    0,
    CANH,
    CANH,
  );
  bitmap.close();

  return canvas.toDataURL("image/jpeg", 0.9);
}

export function AvatarPicker({
  src,
  name,
  locale,
  nhan,
  onDoi,
}: {
  src?: string;
  name: string;
  locale: Locale;
  nhan: { changeAvatar: string; avatarUploading: string; avatarError: string };
  onDoi: (avatarUrl: string) => void;
}) {
  const chonTep = React.useRef<HTMLInputElement>(null);
  const [dangTai, setDangTai] = React.useState(false);
  const [loi, setLoi] = React.useState("");

  async function doi(tep: File | undefined) {
    if (!tep || !tep.type.startsWith("image/")) return;
    setDangTai(true);
    setLoi("");
    try {
      const kq = await taiAvatar(await catVuong(tep), locale);
      onDoi(kq.avatarUrl);
    } catch (err) {
      setLoi((err instanceof LoiApi && err.thongDiep) || nhan.avatarError);
    } finally {
      setDangTai(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={() => chonTep.current?.click()}
        disabled={dangTai}
        title={nhan.changeAvatar}
        aria-label={nhan.changeAvatar}
        className="group relative rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
      >
        <Avatar src={src} name={name} size={72} />
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <Camera className="size-5" aria-hidden />
        </span>
      </button>
      <input
        ref={chonTep}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => {
          void doi(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {dangTai ? <span className="text-xs text-muted">{nhan.avatarUploading}</span> : null}
      {loi ? (
        <span role="alert" className="max-w-[12rem] text-xs text-lacquer">
          {loi}
        </span>
      ) : null}
    </div>
  );
}
