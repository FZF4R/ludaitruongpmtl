import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import { LocaleLink as Link } from "@/components/ui/locale-link";
import { Button } from "@/components/ui/button";
import { Card, Container } from "@/components/ui/primitives";
import { getDictionary } from "@/lib/dictionary";
import { getSiteSettings } from "@/lib/api";

/**
 * Trang thông báo tài khoản bị khoá do vi phạm.
 *
 * lib/auth.ts goiApi chuyển tới đây (sau khi đã đăng xuất) mỗi khi API trả
 * 423 - đăng nhập bằng tài khoản đã khoá, hoặc đang dùng dở thì bị khoá.
 * Trang tĩnh, không cần biết ai đang xem.
 */
export const metadata: Metadata = {
  title: "Tài khoản bị khoá",
  robots: { index: false, follow: false },
};

export default async function BannedPage() {
  const [dict, settings] = await Promise.all([getDictionary(), getSiteSettings()]);
  const b = dict.banned;
  // Kênh hỗ trợ admin nhập ở /admin/dashboard; chưa nhập thì chỉ hiện câu mời liên hệ.
  const dienThoai = settings?.supportphonenumber?.trim();
  const facebook = settings?.supportfacebook?.trim();

  return (
    <Container className="flex justify-center py-20">
      <Card className="flex max-w-lg flex-col items-center gap-5 p-8 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-lacquer/10 text-lacquer">
          <ShieldAlert className="size-7" aria-hidden />
        </span>
        <h1 className="font-serif text-2xl font-bold">{b.title}</h1>
        <p className="leading-relaxed text-body">{b.body}</p>
        <p className="text-sm text-muted">{b.contact}</p>
        {dienThoai || facebook ? (
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm">
            {dienThoai ? (
              <a href={`tel:${dienThoai.replace(/\s+/g, "")}`} className="font-medium text-accent hover:underline">
                {dienThoai}
              </a>
            ) : null}
            {facebook ? (
              <a
                href={facebook.startsWith("http") ? facebook : `https://${facebook}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-accent hover:underline"
              >
                Facebook
              </a>
            ) : null}
          </div>
        ) : null}
        <Button variant="outline" asChild>
          <Link href="/">{b.home}</Link>
        </Button>
      </Card>
    </Container>
  );
}
