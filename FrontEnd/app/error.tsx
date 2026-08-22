"use client";

import * as React from "react";
import { Container } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Chỗ này thay bằng Sentry hoặc dịch vụ log khi lên production.
    console.error(error);
  }, [error]);

  return (
    <Container className="flex flex-col items-center gap-6 py-32 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-lacquer">
        Sự cố
      </p>
      <h1 className="max-w-lg text-3xl font-bold leading-tight">
        Không tải được nội dung
      </h1>
      <p className="max-w-md text-sm text-muted">
        Máy chủ nội dung đang không phản hồi. Thử tải lại sau ít phút.
      </p>
      {error.digest ? (
        <p className="font-mono text-xs text-muted">Mã lỗi: {error.digest}</p>
      ) : null}
      <Button onClick={reset}>Thử lại</Button>
    </Container>
  );
}
