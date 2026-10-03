"use client";

import * as React from "react";

/**
 * Phát âm thanh cho công cụ tu tập.
 *
 * - `phat(src)`: tiếng ngắn (mõ, chuông). Dùng Web Audio với bộ đệm đã giải
 *   mã sẵn: gõ mõ nhanh liên tục vẫn kêu đúng nhịp, các tiếng chồng lên nhau
 *   tự nhiên - thẻ <audio> thì phải tua về đầu nên nuốt mất tiếng.
 * - `nap(src)`: giải mã trước, để tiếng đầu tiên không trễ.
 * - Âm nền / bài dài: dùng thẻ <audio> (component AmNen bên dưới) để phát dần
 *   mà không phải tải hết.
 *
 * AudioContext chỉ tạo khi có thao tác đầu tiên của người dùng (trình duyệt
 * chặn phát âm thanh tự động).
 */
export function useAmThanhNgan() {
  const ctx = React.useRef<AudioContext | null>(null);
  const boDem = React.useRef(new Map<string, Promise<AudioBuffer | null>>());

  const layCtx = React.useCallback(() => {
    if (!ctx.current || ctx.current.state === "closed") {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx.current = new Ctx();
    }
    if (ctx.current.state === "suspended") void ctx.current.resume();
    return ctx.current;
  }, []);

  const nap = React.useCallback(
    (src: string) => {
      if (!src) return Promise.resolve(null);
      let p = boDem.current.get(src);
      if (!p) {
        p = fetch(src)
          .then((r) => r.arrayBuffer())
          .then((b) => layCtx().decodeAudioData(b))
          .catch(() => null);
        boDem.current.set(src, p);
      }
      return p;
    },
    [layCtx],
  );

  const phat = React.useCallback(
    async (src: string, amLuong = 1) => {
      if (!src) return;
      const c = layCtx();
      const b = await nap(src);
      if (!b) return;
      const nguon = c.createBufferSource();
      const g = c.createGain();
      g.gain.value = amLuong;
      nguon.buffer = b;
      nguon.connect(g).connect(c.destination);
      nguon.start();
    },
    [layCtx, nap],
  );

  // AudioBuffer dùng được với context mới nên giữ bộ đệm; chỉ bỏ context đã đóng.
  React.useEffect(
    () => () => {
      void ctx.current?.close().catch(() => {});
      ctx.current = null;
    },
    [],
  );

  return React.useMemo(() => ({ phat, nap }), [phat, nap]);
}

/** Giữ màn hình không tắt khi đang thiền / tụng (Wake Lock API, nếu trình duyệt hỗ trợ). */
export function useGiuManHinh(bat: boolean) {
  React.useEffect(() => {
    if (!bat || !("wakeLock" in navigator)) return;
    let khoa: { release: () => Promise<void> } | null = null;
    const nav = navigator as unknown as { wakeLock: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } };
    nav.wakeLock
      .request("screen")
      .then((k) => (khoa = k))
      .catch(() => {});
    return () => void khoa?.release().catch(() => {});
  }, [bat]);
}

/** Lựa chọn lưu ở trình duyệt (âm thanh đã chọn, nhịp gõ...) - lỗi bộ nhớ thì bỏ qua. */
export function useLuaChonNho<T>(khoa: string, macDinh: T): [T, (v: T) => void] {
  const [gt, setGt] = React.useState<T>(macDinh);
  React.useEffect(() => {
    try {
      const s = window.localStorage.getItem(`sv_tt_${khoa}`);
      if (s !== null) setGt(JSON.parse(s) as T);
    } catch {
      // bỏ qua
    }
  }, [khoa]);
  const dat = React.useCallback(
    (v: T) => {
      setGt(v);
      try {
        window.localStorage.setItem(`sv_tt_${khoa}`, JSON.stringify(v));
      } catch {
        // bỏ qua
      }
    },
    [khoa],
  );
  return [gt, dat];
}
