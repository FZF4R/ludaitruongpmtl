import Link from "next/link";
import { getLocale } from "@/lib/dictionary";
import { localePath } from "@/lib/i18n";

type Props = Omit<React.ComponentProps<typeof Link>, "href"> & {
  href: string;
};

/**
 * <Link> tự gắn tiền tố ngôn ngữ đang xem.
 *
 * Không có nó thì mọi liên kết nội bộ viết "/bai-viet" sẽ ném người đang đọc
 * bản tiếng Anh về bản tiếng Việt — lỗi âm thầm và rất dễ sót, vì ở tiếng
 * Việt (không tiền tố) mọi thứ trông vẫn đúng.
 *
 * Là Server Component nên đọc thẳng được ngôn ngữ từ next/root-params, không
 * phải truyền `locale` xuống từng tầng. Liên kết ra ngoài và neo trong trang
 * (#, http, mailto) được giữ nguyên.
 */
export async function LocaleLink({ href, ...props }: Props) {
  const noiBo = href.startsWith("/") && !href.startsWith("//");
  const dich = noiBo ? localePath(await getLocale(), href) : href;

  return <Link href={dich} {...props} />;
}
