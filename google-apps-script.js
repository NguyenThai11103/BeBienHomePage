// Thay đổi các thông số cấu hình dưới đây của bạn
const TELEGRAM_TOKEN = "ĐIỀN_TOKEN_BOT_VÀO_ĐÂY"; // Ví dụ: "123456789:ABCdefGhIJK..."
const TELEGRAM_CHAT_ID = "ĐIỀN_CHAT_ID_VÀO_ĐÂY"; // Ví dụ: "987654321" (hoặc ID nhóm âm: "-100123456789")

function doPost(e) {
  try {
    // Nhận dữ liệu gửi từ Web
    const data = JSON.parse(e.postData.contents);
    
    // Ghi dữ liệu vào Google Sheet
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const timestamp = new Date();
    
    // Thêm dòng mới vào sheet tương ứng với thứ tự cột đã thiết lập
    sheet.appendRow([
      timestamp,
      data.bookingCode,
      data.name,
      data.phone,
      data.guests,
      data.date,
      data.time,
      data.note || ""
    ]);
    
    // Chuẩn bị nội dung tin nhắn Telegram dạng Markdown
    const message = 
      "🔔 *THÔNG BÁO ĐẶT BÀN MỚI*\n\n" +
      "📌 *Mã đặt bàn:* " + data.bookingCode + "\n" +
      "👤 *Khách hàng:* " + data.name + "\n" +
      "📞 *Số điện thoại:* `" + data.phone + "` (nhấn để copy)\n" +
      "👥 *Số lượng:* " + data.guests + " người\n" +
      "📅 *Ngày:* " + formatDate(data.date) + "\n" +
      "⏰ *Giờ:* " + data.time + "\n" +
      "📝 *Ghi chú:* " + (data.note ? "_" + data.note + "_" : "_Không có_") + "\n\n" +
      "🕒 *Thời gian đặt:* " + Utilities.formatDate(timestamp, "GMT+7", "dd/MM/yyyy HH:mm:ss");
      
    // Gửi tin nhắn qua Telegram
    sendTelegramMessage(message);
    
    // Phản hồi về cho website
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Đặt bàn thành công!"
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    // Trả về lỗi nếu có sự cố
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function sendTelegramMessage(text) {
  const url = "https://api.telegram.org/bot" + TELEGRAM_TOKEN + "/sendMessage";
  const payload = {
    chat_id: TELEGRAM_CHAT_ID,
    text: text,
    parse_mode: "Markdown"
  };
  
  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  UrlFetchApp.fetch(url, options);
}

// Hàm định dạng ngày từ YYYY-MM-DD sang DD/MM/YYYY
function formatDate(dateStr) {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return parts[2] + "/" + parts[1] + "/" + parts[0];
  }
  return dateStr;
}
