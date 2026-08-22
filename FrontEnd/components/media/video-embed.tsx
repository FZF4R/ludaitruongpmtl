/**
 * Nhúng video.
 *
 * YouTube dùng domain youtube-nocookie để không đặt cookie theo dõi
 * trước khi người xem bấm phát. Đây là Server Component: khung nhúng
 * là HTML tĩnh, không cần JavaScript nào của mình.
 */
export function VideoEmbed({
  provider,
  url,
  title,
}: {
  provider: "self" | "youtube";
  url: string;
  title: string;
}) {
  if (provider === "youtube") {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-card border border-line bg-surface-2">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${url}`}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          className="size-full border-0"
        />
      </div>
    );
  }

  return (
    <video
      controls
      preload="metadata"
      className="aspect-video w-full rounded-card border border-line bg-black"
      title={title}
    >
      <source src={url} />
      <track kind="captions" />
      Trình duyệt của bạn không phát được video này.
    </video>
  );
}
