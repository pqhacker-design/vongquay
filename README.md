# Vòng Quay May Mắn - Gọi Tên Học Sinh Lớp Học 🎉

Ứng dụng vòng quay may mắn chuyên dụng cho lớp học, giảng dạy và thuyết trình:
- 🎡 **Vòng quay Canvas mượt mà:** Hiệu ứng vật lý chân thực, đèn LED viền nhấp nháy, kim chỉ động.
- 🔊 **Âm thanh sống động 100% Web Audio:** Tiếng cạch cạch theo tốc độ kim quay, hồi hộp tăng dần, kèn chiến thắng game-show, tiếng vỗ tay reo hò và giọng đọc tên tiếng Việt (TTS).
- 👥 **Thêm & Xóa học sinh hàng loạt:** Dán danh sách từ Zalo/Word/Excel, chọn nhiều học sinh để xóa hoặc bật/tắt chỉ với 1 cú click.
- 📊 **Nhập & Xuất File Excel (.xlsx, .csv) & Word (.docx):**
  - Tự động nhận diện cột Họ và Tên trong bảng tính Excel.
  - Đọc danh sách từ văn bản và bảng Word (.docx).
  - Xuất bảng danh sách ra file Excel và văn bản Word chuẩn có tiêu đề trường lớp để in.
  - Tải sẵn tệp mẫu Excel và Word.
- 🏆 **Chúc mừng chiến thắng:** Pháo hoa confetti rực rỡ, hiển thị tên cỡ lớn cho cả lớp dễ nhìn từ xa hoặc qua máy chiếu / tivi thông minh.
- 🏫 **Quản lý nhiều lớp:** Chuyển đổi giữa các lớp học, lưu lịch sử lượt quay, tự động ghi nhớ trên trình duyệt (LocalStorage).

---

## Hướng dẫn Triển Khai Lên Vercel (Deploy to Vercel)

Dự án được xây dựng dưới dạng **Single Page Application (SPA)** với **Vite + React + Tailwind CSS**, không phụ thuộc server nội bộ, sẵn sàng đưa lên Vercel hoàn toàn miễn phí:

1. **Đẩy mã nguồn lên GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Vòng quay may mắn"
   git branch -M main
   git remote add origin https://github.com/TÊN_BẠN/vong-quay-may-man.git
   git push -u origin main
   ```

2. **Triển khai trên Vercel:**
   - Truy cập [vercel.com](https://vercel.com) và đăng nhập.
   - Nhấp vào **Add New Project** -> Chọn repository GitHub vừa đẩy lên.
   - Vercel sẽ tự động nhận diện framework **Vite** và file cấu hình `vercel.json`.
   - Nhấp nút **Deploy**. Chỉ mất khoảng 30 giây để trang web của bạn hoạt động trực tuyến với tên miền miễn phí dạng `*.vercel.app`.

---

## Bổ sung file âm thanh quay số & trúng thưởng riêng khi đưa lên Vercel 🎵

Bạn có **2 cách** cực kỳ thuận tiện để thêm âm thanh riêng:

### Cách 1: Đặt file trực tiếp vào thư mục mã nguồn trước khi đẩy lên Vercel (Khuyên dùng)
Đặt 2 file âm thanh định dạng `.mp3` hoặc `.wav` vào thư mục:
- `public/sounds/spin.mp3` : Âm thanh khi vòng quay đang quay
- `public/sounds/win.mp3`  : Âm thanh khi chọn trúng học sinh (nhạc chiến thắng, vỗ tay...)

Khi triển khai lên Vercel, Vite sẽ tự động đưa các file này vào thư mục gốc của trang web và ứng dụng sẽ tự động phát các file này!

### Cách 2: Tải file trực tiếp trên giao diện ứng dụng
- Mở ứng dụng, vào mục **Cài đặt** (biểu tượng bánh răng).
- Tại mục **Tùy biến file âm thanh**, bấm nút **Tải MP3** để chọn file từ máy tính và bấm **Thử** để nghe trước.
- Âm thanh sẽ được lưu bền vững trên trình duyệt của bạn mà không cần đụng vào mã nguồn.
