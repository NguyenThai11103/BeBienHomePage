# HƯỚNG DẪN CẤU HÌNH THÔNG BÁO ĐẶT BÀN QUA TELEGRAM & GOOGLE SHEETS

Tài liệu này hướng dẫn chi tiết từng bước để tích hợp hệ thống lưu trữ thông tin đặt bàn vào **Google Sheets** và gửi thông báo trực tiếp qua **Telegram** cho chủ quán hoàn toàn miễn phí, bảo mật.

---

## BƯỚC 1: TẠO TELEGRAM BOT & LẤY THÔNG TIN KẾT NỐI

### 1.1. Tạo Telegram Bot mới
1. Mở ứng dụng Telegram trên điện thoại hoặc máy tính.
2. Tìm kiếm tài khoản chính thức của Telegram Bot: `@BotFather` (có tích xanh).
3. Gửi tin nhắn: `/newbot`
4. BotFather sẽ yêu cầu bạn nhập tên cho Bot (Ví dụ: `Bé Biển Booking Bot`). Nhập xong gửi đi.
5. BotFather sẽ yêu cầu nhập tiếp username cho bot (phải kết thúc bằng chữ `bot`, ví dụ: `be_bien_booking_bot`). Nhập xong gửi đi.
6. Sau khi thành công, bạn sẽ nhận được một đoạn tin nhắn chứa **API Token**. 
   * *Định dạng Token có dạng:* `1234567890:ABCdefGhIJKlmNoPQRsTUVwxyZ`
   * **Lưu ý:** Giữ bí mật mã Token này.

### 1.2. Kích hoạt Bot
* Tìm kiếm username của bot bạn vừa tạo trên Telegram (ví dụ: `@be_bien_booking_bot`).
* Nhấn nút **Start** (hoặc gửi tin nhắn bất kỳ) để cho phép Bot gửi tin nhắn cho bạn sau này.

### 1.3. Lấy Telegram Chat ID (ID tài khoản của bạn)
Để Bot biết gửi tin nhắn về cho ai (bạn), bạn cần lấy ID tài khoản Telegram cá nhân của mình:
1. Tìm kiếm tài khoản: `@userinfobot` trên Telegram.
2. Nhấn nút **Start**.
3. Bot sẽ phản hồi thông tin cá nhân của bạn, hãy copy dòng **Id** (Ví dụ: `987654321` - đây là một chuỗi số).
*(Nếu bạn muốn gửi tin nhắn vào một Nhóm Telegram của quán, bạn cần thêm Bot vào Nhóm, cấp quyền Admin gửi tin nhắn và lấy Chat ID của Nhóm đó)*.

---

## BƯỚC 2: CẤU HÌNH GOOGLE SHEETS & GOOGLE APPS SCRIPT

### 2.1. Chuẩn bị file Google Sheet
1. Truy cập [Google Sheets](https://sheets.google.com) và tạo một Trang tính (Spreadsheet) mới.
2. Đổi tên trang tính thành: `Quản lý Đặt bàn Bé Biển`.
3. Tại hàng số `1` (Header), hãy điền tiêu đề cho các cột đúng theo thứ tự sau để tránh lệch cột khi ghi dữ liệu:
   * **Cột A:** `Thời gian đặt`
   * **Cột B:** `Mã đặt bàn`
   * **Cột C:** `Họ tên`
   * **Cột D:** `Số điện thoại`
   * **Cột E:** `Số khách`
   * **Cột F:** `Ngày`
   * **Cột G:** `Giờ`
   * **Cột H:** `Ghi chú`

### 2.2. Dán mã nguồn Apps Script
1. Trên thanh công cụ của Google Sheet, chọn **Tiện ích mở rộng (Extensions)** -> **Apps Script**.
2. Xóa toàn bộ đoạn code mặc định đang có trong khung soạn thảo.
3. Mở file [google-apps-script.js](file:///d:/Projects/OnePageBeBien/google-apps-script.js) trong thư mục dự án của bạn, copy toàn bộ nội dung mã nguồn đó và dán vào Apps Script.
4. Chỉnh sửa dòng số **4** bằng thông tin bạn đã lấy ở Bước 1:
   ```javascript
   const TELEGRAM_TOKEN = "Điền_Token_Bot_Của_Bạn_Vào_Đây";
   ```
5. Nhấn biểu tượng 💾 **Lưu dự án (Save project)** (phím tắt `Ctrl + S`).

---

## BƯỚC 3: TRIỂN KHAI (DEPLOY) GOOGLE APPS SCRIPT THÀNH WEB APP

Để website có thể gửi dữ liệu lên Google Sheet, bạn cần xuất bản đoạn Script vừa viết thành một ứng dụng web công khai.

1. Ở góc trên bên phải trang Apps Script, nhấp vào nút **Triển khai (Deploy)** -> Chọn **Triển khai mới (New deployment)**.
2. Nhấp vào biểu tượng bánh răng ở mục **Chọn loại (Select type)** -> Chọn **Ứng dụng web (Web app)**.
3. Điền thông tin cấu hình như sau:
   * **Mô tả (Description):** `Bé Biển Booking API`
   * **Thực thi dưới dạng (Execute as):** Chọn **Tôi (Email của bạn)**
   * **Ai có quyền truy cập (Who has access):** Chọn **Bất kỳ ai (Anyone)** *(Bắt buộc phải chọn mục này để Frontend gửi dữ liệu lên được)*.
4. Nhấp nút **Triển khai (Deploy)**.
5. Google sẽ hiện một hộp thoại yêu cầu cấp quyền truy cập tài khoản (Authorize Access):
   * Nhấp vào **Ủy quyền truy cập (Authorize access)**.
   * Chọn tài khoản Google của bạn.
   * Google sẽ cảnh báo "Google chưa xác minh ứng dụng này" (vì đây là script tự viết), bạn hãy nhấp vào chữ **Nâng cao (Advanced)** ở phía dưới bên trái.
   * Nhấp tiếp vào đường link **Đi tới Dự án chưa có tên (không an toàn)** hoặc **Go to Untitled project (unsafe)**.
   * Nhấp nút **Cho phép (Allow)**.
6. Sau khi hoàn tất triển khai, bạn sẽ nhận được một đường link ở mục **Ứng dụng web (Web app)**.
   * Nó có dạng: `https://script.google.com/macros/s/AKfycb.../exec`
   * **Hãy copy đường dẫn Web App URL này.**

---

## BƯỚC 4: KÍCH HOẠT WEBHOOK CHO TELEGRAM BOT (QUAN TRỌNG NHẤT)

Để Telegram Bot có thể hiểu các lệnh như `/subscribe`, `/unsubscribe`, `/status` và gửi tin nhắn phản hồi, bạn bắt buộc phải đăng ký Web App URL với Telegram:

1. Quay lại giao diện **Apps Script** trên trình duyệt.
2. Trên thanh công cụ phía trên (cạnh nút **Chạy / Run**), nhấp vào ô chọn tên hàm (mặc định đang hiển thị `doGet` hoặc `doPost`).
3. Chọn hàm **`setupWebhook`** từ danh sách.
4. Nhấn nút **▶ Chạy (Run)**.
5. Xem ô **Nhật ký thực thi (Execution log)** bên dưới. Nếu có dòng chữ kết quả thành công (`"ok": true`) là đã hoàn tất!
*(Nếu Apps Script yêu cầu cấp quyền truy cập mạng để gửi yêu cầu đến Telegram, hãy nhấn Cho phép/Ủy quyền tương tự như Bước 3).*

---

## BƯỚC 5: KẾT NỐI VÀO MÃ NGUỒN WEBSITE (FRONTEND)

Sau khi có đường dẫn Web App URL ở Bước 3:
1. Bạn gửi đường dẫn đó cho tôi.
2. Tôi sẽ cập nhật file [script.js](file:///d:/Projects/OnePageBeBien/script.js) để gửi dữ liệu trực tiếp đến đường dẫn đó khi khách hàng nhấn nút "Đăng ký đặt bàn".
3. Mọi công đoạn gửi dữ liệu, ghi file Sheet và bắn thông báo Telegram sẽ hoàn toàn tự động!

---
*Chúc bạn cấu hình thành công! Nếu gặp khó khăn ở bước nào, hãy chụp màn hình hoặc gửi tin nhắn để tôi hỗ trợ bạn ngay.*

