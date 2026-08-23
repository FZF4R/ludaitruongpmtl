import { LocaleLink as Link } from "@/components/ui/locale-link";
import { Headphones, PlayCircle, BookOpen, FileText } from "lucide-react";
import type { ContentSummary } from "@/lib/schema";
import { contentHref } from "@/lib/seo";
import { getDictionary } from "@/lib/dictionary";
import { formatDate, formatDuration, readingTime } from "@/lib/format";
import { Badge, Card } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

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
}: {
  item: ContentSummary;
  featured?: boolean;
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
        "group flex flex-col gap-3 p-5 hover:border-line-strong",
        featured && "sm:p-7",
      )}
    >
      <div className="flex items-center gap-2 text-muted">
        <Icon className="size-4 shrink-0" aria-hidden />
        <span className="text-[11px] font-medium uppercase tracking-[0.1em]">
          {dict.contentType[item.type]}
        </span>
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
        {item.categories[0] ? (
          <Badge tone="accent" className="ml-auto">
            {item.categories[0].name}
          </Badge>
        ) : null}
      </div>
    </Card>
  );
}

export function ContentGrid({
  items,
  columns = 3,
}: {
  items: ContentSummary[];
  columns?: 2 | 3;
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
          <ContentCard item={item} />
        </div>
      ))}
    </div>
  );
}
