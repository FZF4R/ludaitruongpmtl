import { LocaleLink as Link } from "@/components/ui/locale-link";
import { Container } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Container className="flex flex-col items-center gap-6 py-32 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
        Lỗi 404
      </p>
      <h1 className="max-w-lg text-3xl font-bold leading-tight">
        Không tìm thấy trang bạn cần
      </h1>
      <p className="max-w-md text-sm text-muted">
        Trang có thể đã được đổi đường dẫn hoặc gỡ xuống. Thử tìm lại theo từ
        khoá, hoặc quay về trang chủ.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/">Về trang chủ</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/bai-viet/tim-kiem">Tìm kiếm</Link>
        </Button>
      </div>
    </Container>
  );
}
