/**
 * Mẫu trang "Về chúng tôi" - dùng khi admin chưa soạn nội dung, và là điểm
 * xuất phát khi bấm "Dùng mẫu" trong trình sửa.
 *
 * Chỉ dùng thẻ mà lib/sanitize.ts cho phép (div, h2, h3, p, ul, li, img,
 * figure, blockquote, a, strong...). Bố cục nhờ các class `gt-*` định nghĩa
 * trong app/globals.css - giữ nguyên class khi sửa thì giữ được bố cục.
 */
export const MAU_GIOI_THIEU = `<div class="gt-hero">
  <p class="gt-eyebrow">Về chúng tôi</p>
  <h2>Sen Việt — nơi gieo duyên lành với Phật pháp</h2>
  <p class="gt-lead">Sen Việt là trang Phật pháp phi lợi nhuận, chia sẻ kinh sách, bài giảng và công cụ tu tập hằng ngày cho Phật tử và những ai muốn tìm hiểu đạo Phật.</p>
</div>

<div class="gt-section">
  <h2>Sứ mệnh</h2>
  <p>Chúng tôi mong muốn mang lời dạy của Đức Phật đến gần hơn với đời sống hằng ngày: dễ đọc, dễ tìm, dễ thực hành — dù bạn ở đâu, bận rộn đến mức nào.</p>
  <div class="gt-grid">
    <div class="gt-card">
      <h3>Kinh sách</h3>
      <p>Kinh, luật, luận được trình bày theo chương, ghi rõ nguồn và dịch giả.</p>
    </div>
    <div class="gt-card">
      <h3>Tu tập</h3>
      <p>Tụng kinh, niệm Phật, thiền định, gõ mõ, lần chuỗi và nhật ký tu tập cá nhân.</p>
    </div>
    <div class="gt-card">
      <h3>Cộng đồng</h3>
      <p>Bài viết, lời nguyện cầu an – cầu siêu và thư viện do cộng đồng cùng đóng góp.</p>
    </div>
  </div>
</div>

<blockquote class="gt-quote">
  <p>“Không làm các điều ác, siêng làm các điều lành, giữ tâm ý trong sạch — đó là lời chư Phật dạy.”</p>
  <cite>Kinh Pháp Cú, kệ 183</cite>
</blockquote>

<div class="gt-section">
  <h2>Ban biên tập</h2>
  <p>Nội dung do ban biên tập gồm các Phật tử tình nguyện tuyển chọn, biên tập và kiểm duyệt. Mỗi bài đều ghi nguồn tham khảo; nếu phát hiện sai sót, xin liên hệ để chúng tôi sửa ngay.</p>
  <ul>
    <li><strong>Biên tập nội dung:</strong> tuyển chọn kinh sách, bài giảng.</li>
    <li><strong>Kiểm duyệt:</strong> duyệt bài viết, bình luận và lời nguyện.</li>
    <li><strong>Kỹ thuật:</strong> phát triển và vận hành trang.</li>
  </ul>
</div>

<div class="gt-section gt-contact">
  <h2>Liên hệ</h2>
  <p>Mọi góp ý, đề xuất hợp tác hay đóng góp nội dung, xin gửi về:</p>
  <ul>
    <li>Email: <a href="mailto:lienhe@example.com">lienhe@example.com</a></li>
    <li>Fanpage: <a href="https://facebook.com/">facebook.com/…</a></li>
  </ul>
  <p class="gt-note">Nam Mô Bổn Sư Thích Ca Mâu Ni Phật.</p>
</div>
`;
