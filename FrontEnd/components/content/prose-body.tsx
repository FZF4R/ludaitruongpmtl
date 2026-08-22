import { sanitize } from "@/lib/sanitize";
import { cn } from "@/lib/utils";

/**
 * Thân bài. Chạy trên server, làm sạch HTML rồi mới render — client
 * không bao giờ nhận HTML thô chưa lọc.
 */
export function ProseBody({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  return (
    <div
      className={cn("prose prose-dharma max-w-none", className)}
      dangerouslySetInnerHTML={{ __html: sanitize(html) }}
    />
  );
}
