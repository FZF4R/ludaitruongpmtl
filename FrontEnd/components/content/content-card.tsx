import { LocaleLink as Link } from "@/components/ui/locale-link";
import { Headphones, PlayCircle, BookOpen, FileText } from "lucide-react";
import type { ContentSummary } from "@/lib/schema";
import { contentHref } from "@/lib/seo";
import { getDictionary } from "@/lib/dictionary";
import { formatDate, formatDuration, readingTime } from "@/lib/format";
import { Badge, Card } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { ContentThumb } from "@/components/content/content-thumb";

const typeIcon = {
  article: FileText,
  blog: FileText,
  sutra: BookOpen,
  audio: Headphones,
  video: PlayCircle,
} as const;

export async function ContentCard({
  item,
  featured = false,
  thumbnail = false,
}: {
  item: ContentSummary;
  featured?: boolean;
  /** Hiện ảnh bìa (hoặc ảnh mặc định) ở đầu thẻ. */
  thumbnail?: boolean;
}) {
  const dict = await getDictionary();
  const Icon = typeIcon[item.type];
  const href = contentHref(item);
  const duration =
    item.type === "audio" || item.type === "video"
      ? formatDuration(item.media?.durationSec)
      : readingTime(item.readingMinutes);

  return (
    <Card
      className={cn(
        // Thẻ bài viết là item được bấm nhiều nhất nên nhấc hẳn lên khi rê
        // chuột, không chỉ đổi viền. Người dùng prefers-reduced-motion vẫn
        // thấy bóng đậm lên, chỉ mất phần trượt (globals.css tắt transition).
        // h-full: kéo thẻ cao bằng ô lưới, để mọi thẻ trong một hàng bằng nhau
        // và phần chân (ngày, chuyên mục) luôn nằm sát đáy nhờ mt-auto.
        "group flex h-full flex-col gap-3 p-5 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card-lift",
        featured && "sm:p-7",
        thumbnail && "overflow-hidden pt-0 sm:pt-0",
      )}
    >
      {thumbnail ? (
        // Tràn ra mép thẻ: bù lại phần đệm p-5 của Card bằng lề âm.
        <ContentThumb
          slug={item.slug}
          coverUrl={item.coverUrl}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className={cn("-mx-5 aspect-[16/9]", featured && "sm:-mx-7")}
        />
      ) : null}

      <div className="flex items-center gap-2 text-muted">
        <Icon className="size-4 shrink-0" aria-hidden />
        <span className="text-[11px] font-medium uppercase tracking-[0.1em]">
          {dict.contentType[item.type]}
        </span>
        {/*
          Chuyên mục ở dòng đầu chứ không ở chân thẻ: ở chân, tên chuyên mục
          dài bị đẩy xuống dòng riêng ở thẻ này mà không ở thẻ kia, làm phần
          chân các thẻ cùng hàng lệch nhau.
        */}
        {item.categories[0] ? (
          <Badge tone="accent" className="ml-auto max-w-[60%] truncate">
            {item.categories[0].name}
          </Badge>
        ) : null}
      </div>

      <h3
        className={cn(
          "font-serif font-bold leading-snug tracking-tight",
          featured ? "text-2xl" : "text-lg",
        )}
      >
        <Link href={href} className="transition-colors group-hover:text-accent">
          {/* Phủ toàn thẻ để cả card bấm được, nhưng liên kết thật vẫn là chữ. */}
          <span className="absolute inset-0" aria-hidden />
          {item.title}
        </Link>
      </h3>

      {item.summary ? (
        <p
          className={cn(
            "text-sm leading-relaxed text-muted",
            featured ? "line-clamp-4" : "line-clamp-3",
          )}
        >
          {item.summary}
        </p>
      ) : null}

      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 pt-2 text-xs text-muted">
        <time dateTime={item.publishedAt}>{formatDate(item.publishedAt)}</time>
        {duration ? (
          <>
            <span aria-hidden>·</span>
            <span>{duration}</span>
          </>
        ) : null}
      </div>
    </Card>
  );
}

export function ContentGrid({
  items,
  columns = 3,
  thumbnail = false,
}: {
  items: ContentSummary[];
  columns?: 2 | 3;
  thumbnail?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid gap-5",
        columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3",
      )}
    >
      {items.map((item) => (
        <div key={item.id} className="relative">
          <ContentCard item={item} thumbnail={thumbnail} />
        </div>
      ))}
    </div>
  );
}

/**
 * Dạng danh sách: mỗi bài một hàng, ảnh nhỏ bên trái. Đọc lướt được nhiều
 * tiêu đề hơn dạng thẻ trên cùng một màn hình.
 */
export async function ContentList({ items }: { items: ContentSummary[] }) {
  const dict = await getDictionary();

  return (
    <Card className="flex flex-col divide-y divide-line overflow-hidden">
      {items.map((item) => (
        <article
          key={item.id}
          className="group relative flex gap-4 p-4 transition-colors hover:bg-surface-2/60 sm:gap-5 sm:p-5"
        >
          <ContentThumb
            slug={item.slug}
            coverUrl={item.coverUrl}
            sizes="(min-width: 640px) 192px, 112px"
            className="aspect-[4/3] w-28 shrink-0 rounded-md sm:w-48"
          />

          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <h3 className="font-serif text-base font-bold leading-snug tracking-tight sm:text-lg">
              <Link href={contentHref(item)} className="transition-colors group-hover:text-accent">
                <span className="absolute inset-0" aria-hidden />
                {item.title}
              </Link>
            </h3>
            {item.summary ? (
              <p className="line-clamp-2 text-sm leading-relaxed text-muted">{item.summary}</p>
            ) : null}
            <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs text-muted">
              <span>{dict.contentType[item.type]}</span>
              <span aria-hidden>·</span>
              <time dateTime={item.publishedAt}>{formatDate(item.publishedAt)}</time>
              {readingTime(item.readingMinutes) ? (
                <>
                  <span aria-hidden>·</span>
                  <span>{readingTime(item.readingMinutes)}</span>
                </>
              ) : null}
              {item.categories[0] ? (
                <Badge tone="accent" className="ml-auto hidden sm:inline-flex">
                  {item.categories[0].name}
                </Badge>
              ) : null}
            </div>
          </div>
        </article>
      ))}
    </Card>
  );
}
