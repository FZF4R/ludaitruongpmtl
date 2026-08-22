import "server-only";
import sanitizeHtml from "sanitize-html";

/**
 * Làm sạch HTML trước khi đưa vào dangerouslySetInnerHTML.
 *
 * Đây là lớp phòng thủ THỨ HAI. Lớp thứ nhất phải nằm ở Sails, làm sạch
 * lúc GHI vào MongoDB — nếu chỉ lọc ở frontend thì app mobile và mọi
 * client khác sau này đều nhận nguyên payload độc.
 *
 * "server-only" đảm bảo module này không bao giờ lọt vào bundle client:
 * lọc ở client là vô nghĩa vì kẻ tấn công kiểm soát client.
 */

const allowedTags = [
  "p", "br", "hr",
  "h2", "h3", "h4", "h5", "h6",
  "strong", "b", "em", "i", "u", "s", "sup", "sub", "mark", "small",
  "ul", "ol", "li",
  "blockquote", "q", "cite",
  "a",
  "img", "figure", "figcaption",
  "table", "thead", "tbody", "tr", "th", "td",
  "pre", "code",
  "span", "div",
];

const config: sanitizeHtml.IOptions = {
  allowedTags,
  allowedAttributes: {
    a: ["href", "title", "rel", "target"],
    img: ["src", "alt", "title", "width", "height", "loading"],
    // Cho phép class để giữ các kiểu trình bày riêng như .ke (câu kệ).
    "*": ["class", "id", "lang", "dir"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesAppliedToAttributes: ["href", "src"],
  // Không cho phép style inline: đây là đường vào phổ biến của XSS
  // dựng bằng url() và expression().
  allowedStyles: {},
  transformTags: {
    // Mọi liên kết ra ngoài đều mở tab mới và cắt quan hệ opener.
    a: (tagName, attribs) => {
      const href = attribs.href ?? "";
      const external = /^https?:\/\//i.test(href);
      return {
        tagName,
        attribs: external
          ? { ...attribs, target: "_blank", rel: "noopener noreferrer nofollow" }
          : attribs,
      };
    },
    // Ảnh trong nội dung luôn tải lười, tránh kéo LCP xuống.
    img: (tagName, attribs) => ({
      tagName,
      attribs: { ...attribs, loading: "lazy", decoding: "async" },
    }),
  },
};

export function sanitize(html: string): string {
  return sanitizeHtml(html, config);
}

/** Bản thuần chữ, dùng cho meta description và đếm phút đọc. */
export function toPlainText(html: string, maxLength = 0): string {
  const text = sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();
  if (maxLength > 0 && text.length > maxLength) {
    return `${text.slice(0, maxLength - 1).trimEnd()}…`;
  }
  return text;
}
