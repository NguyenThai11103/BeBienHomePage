
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, message: "Bot đặt bàn Bé Biển đang hoạt động!" }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// HÀM CHÍNH — Nhận tất cả POST request
// ============================================================
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (data.message) {
      // Request đến từ Telegram (lệnh /subscribe, /unsubscribe...)
      handleTelegramCommand(data.message);
    } else if (data.bookingCode) {
      // Request đến từ website đặt bàn
      handleBooking(data);
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================
// XỬ LÝ ĐẶT BÀN TỪ WEBSITE
// ============================================================
function handleBooking(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const timestamp = new Date();

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

  const subscribers = getSubscribers();
  if (subscribers.length > 0) {
    subscribers.forEach(function(sub) {
      sendTelegramMessage(sub.chatId, message);
    });
  }
}

// ============================================================
// XỬ LÝ LỆNH TỪ TELEGRAM (/subscribe, /unsubscribe, /status)
// ============================================================
function handleTelegramCommand(message) {
  const chatId    = String(message.chat.id);
  const text      = (message.text || "").trim().toLowerCase();
  const firstName = message.chat.first_name || "Bạn";
  const username  = message.chat.username ? "@" + message.chat.username : firstName;

  if (text === "/subscribe" || text === "/start") {
    if (isSubscribed(chatId)) {
      sendTelegramMessage(chatId,
        "ℹ️ *" + firstName + "* ơi, bạn đã đăng ký rồi!\n\n" +
        "Gõ /status để xem danh sách.\n" +
        "Gõ /unsubscribe để huỷ."
      );
    } else {
      addSubscriber(chatId, firstName, username);
      sendTelegramMessage(chatId,
        "✅ *Đăng ký thành công!*\n\n" +
        "🔔 *" + firstName + "* sẽ nhận thông báo mỗi khi có khách đặt bàn tại *Hải Sản Bé Biển*.\n\n" +
        "Gõ /unsubscribe để huỷ đăng ký."
      );
    }

  } else if (text === "/unsubscribe") {
    if (isSubscribed(chatId)) {
      removeSubscriber(chatId);
      sendTelegramMessage(chatId,
        "❌ Đã huỷ đăng ký thành công.\n\n" +
        "Gõ /subscribe để đăng ký lại."
      );
    } else {
      sendTelegramMessage(chatId, "ℹ️ Bạn chưa đăng ký. Gõ /subscribe để đăng ký.");
    }

  } else if (text === "/status") {
    var subs = getSubscribers();
    if (subs.length === 0) {
      sendTelegramMessage(chatId, "📋 Chưa có ai đăng ký nhận thông báo.");
    } else {
      var list = subs.map(function(s, i) {
        return (i + 1) + ". " + s.name + " (" + s.username + ")";
      }).join("\n");
      sendTelegramMessage(chatId,
        "📋 *Danh sách người nhận thông báo:*\n\n" + list + "\n\nTổng: *" + subs.length + " người*"
      );
    }

  } else {
    sendTelegramMessage(chatId,
      "👋 Xin chào *" + firstName + "*!\n\n" +
      "Tôi là bot thông báo đặt bàn của *Hải Sản Bé Biển*.\n\n" +
      "📌 *Các lệnh:*\n" +
      "/subscribe - Đăng ký nhận thông báo\n" +
      "/unsubscribe - Huỷ đăng ký\n" +
      "/status - Xem danh sách người nhận"
    );
  }
}

// ============================================================
// QUẢN LÝ SUBSCRIBERS — Lưu vào sheet "Subscribers"
// ============================================================
function getSubscribersSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Subscribers");
  if (!sheet) {
    sheet = ss.insertSheet("Subscribers");
    sheet.appendRow(["Chat ID", "Tên", "Username", "Ngày đăng ký"]);
    sheet.getRange(1, 1, 1, 4).setFontWeight("bold").setBackground("#4CAF50").setFontColor("#ffffff");
  }
  return sheet;
}

function getSubscribers() {
  var sheet = getSubscribersSheet();
  var data  = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  return data.slice(1).map(function(row) {
    return { chatId: String(row[0]), name: row[1], username: row[2] };
  });
}

function isSubscribed(chatId) {
  return getSubscribers().some(function(s) { return s.chatId === String(chatId); });
}

function addSubscriber(chatId, name, username) {
  getSubscribersSheet().appendRow([String(chatId), name, username, new Date()]);
}

function removeSubscriber(chatId) {
  var sheet = getSubscribersSheet();
  var data  = sheet.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][0]) === String(chatId)) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
}

// ============================================================
// GỬI TIN NHẮN TELEGRAM
// ============================================================
function sendTelegramMessage(chatId, text) {
  var url     = "https://api.telegram.org/bot" + TELEGRAM_TOKEN + "/sendMessage";
  var payload = {
    chat_id:    chatId,
    text:       text,
    parse_mode: "Markdown"
  };
  var options = {
    method:             "post",
    contentType:        "application/json",
    payload:            JSON.stringify(payload),
    muteHttpExceptions: true
  };
  UrlFetchApp.fetch(url, options);
}

// ============================================================
// CÀI WEBHOOK — Chạy 1 lần duy nhất sau khi deploy
// ============================================================
function setupWebhook() {
  var webAppUrl = ScriptApp.getService().getUrl();
  var url = "https://api.telegram.org/bot" + TELEGRAM_TOKEN + "/setWebhook?url=" + encodeURIComponent(webAppUrl);
  var res = UrlFetchApp.fetch(url);
  Logger.log("Kết quả cài webhook: " + res.getContentText());
}

// ============================================================
// TIỆN ÍCH
// ============================================================
function formatDate(dateStr) {
  if (!dateStr) return "";
  var parts = dateStr.split("-");
  if (parts.length === 3) {
    return parts[2] + "/" + parts[1] + "/" + parts[0];
  }
  return dateStr;
}
