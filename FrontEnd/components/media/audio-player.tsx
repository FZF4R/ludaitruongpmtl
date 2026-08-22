"use client";

import * as React from "react";
import { Pause, Play, RotateCcw, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import { formatClock } from "@/lib/format";

/**
 * Trình phát bài giảng.
 *
 * Đây là một trong số rất ít Client Component của site — nó cần state
 * và sự kiện của thẻ <audio>. Phần chữ quan trọng với SEO (tiêu đề,
 * toàn văn) nằm ở Server Component bao ngoài, không ở đây.
 *
 * Vị trí nghe dở lưu vào localStorage: Phật tử thường nghe một bài
 * giảng 45 phút qua nhiều lần, mất chỗ đang nghe là mất luôn thói quen.
 */
export function AudioPlayer({
  src,
  title,
  storageKey,
}: {
  src: string;
  title: string;
  storageKey: string;
}) {
  const ref = React.useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = React.useState(false);
  const [current, setCurrent] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [rate, setRate] = React.useState(1);

  const key = `nghe:${storageKey}`;

  // Khôi phục vị trí đã nghe khi metadata sẵn sàng.
  const onLoadedMetadata = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setDuration(el.duration || 0);
    try {
      const saved = Number(window.localStorage.getItem(key));
      // Bỏ qua nếu gần hết bài — người nghe hẳn muốn bắt đầu lại.
      if (saved > 0 && el.duration && saved < el.duration - 15) {
        el.currentTime = saved;
        setCurrent(saved);
      }
    } catch {
      // Trình duyệt chặn localStorage (chế độ riêng tư): bỏ qua.
    }
  }, [key]);

  const onTimeUpdate = () => {
    const el = ref.current;
    if (!el) return;
    setCurrent(el.currentTime);
  };

  // Ghi vị trí mỗi 5 giây thay vì mỗi lần timeupdate (4 lần/giây).
  React.useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      try {
        if (ref.current) {
          window.localStorage.setItem(key, String(ref.current.currentTime));
        }
      } catch {
        /* bỏ qua */
      }
    }, 5000);
    return () => window.clearInterval(id);
  }, [playing, key]);

  const toggle = () => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) void el.play();
    else el.pause();
  };

  const skip = (seconds: number) => {
    const el = ref.current;
    if (!el) return;
    el.currentTime = Math.min(Math.max(el.currentTime + seconds, 0), el.duration || 0);
  };

  const seek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const el = ref.current;
    if (!el) return;
    const value = Number(event.target.value);
    el.currentTime = value;
    setCurrent(value);
  };

  const changeRate = () => {
    const rates = [1, 1.25, 1.5, 0.75];
    const next = rates[(rates.indexOf(rate) + 1) % rates.length];
    setRate(next);
    if (ref.current) ref.current.playbackRate = next;
  };

  const progress = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <Card className="flex flex-col gap-4 p-5">
      <audio
        ref={ref}
        src={src}
        preload="metadata"
        onLoadedMetadata={onLoadedMetadata}
        onTimeUpdate={onTimeUpdate}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          try {
            window.localStorage.removeItem(key);
          } catch {
            /* bỏ qua */
          }
        }}
      >
        <track kind="captions" />
      </audio>

      <div className="flex items-center gap-3">
        <Button
          size="icon"
          onClick={toggle}
          aria-label={playing ? `Tạm dừng ${title}` : `Phát ${title}`}
        >
          {playing ? <Pause /> : <Play />}
        </Button>
        <Button variant="ghost" size="icon" onClick={() => skip(-15)} aria-label="Lùi 15 giây">
          <RotateCcw />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => skip(30)} aria-label="Tiến 30 giây">
          <RotateCw />
        </Button>
        <button
          type="button"
          onClick={changeRate}
          className="ml-auto rounded-md border border-line px-2.5 py-1 text-xs font-medium tabular-nums text-body hover:bg-surface-2"
          aria-label={`Tốc độ phát ${rate}x, bấm để đổi`}
        >
          {rate}×
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={1}
          value={current}
          onChange={seek}
          aria-label="Vị trí phát"
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-surface-2 accent-accent"
          style={{
            background: `linear-gradient(to right, var(--accent) ${progress}%, var(--surface-2) ${progress}%)`,
          }}
        />
        <div className="flex justify-between text-xs tabular-nums text-muted">
          <span>{formatClock(current)}</span>
          <span>{formatClock(duration)}</span>
        </div>
      </div>
    </Card>
  );
}
