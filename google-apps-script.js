// ============================================================
// CẤU HÌNH — Chỉ cần điền TOKEN vào đây
// ============================================================
const TELEGRAM_TOKEN = "8220126426:AAHmGZUzttek52mSpz4WejadJtDeg2J9S8Q";

// ============================================================
// doGet — Kiểm tra server còn sống
// ============================================================
function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({ ok: true, message: "Bot đặt bàn Bé Biển đang hoạt động!" })
  ).setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// doPost — Chỉ nhận đặt bàn từ website (không dùng webhook Telegram)
// ============================================================
function doPost(e) {
  try {
    var body = e && e.postData && e.postData.contents ? e.postData.contents : "{}";
    var data = JSON.parse(body);

    if (isTelegramUpdate_(data)) {
      handleTelegramUpdate_(data);
    } else if (data.bookingCode) {
      handleBooking(data);
    } else {
      Logger.log("doPost ignored unknown payload: " + body);
    }
  } catch (error) {
    Logger.log("doPost error: " + error.toString());
  }

  return jsonOutput_({ ok: true });
}

// ============================================================
// POLLING — Trigger 1 phút, nhưng loop bên trong mỗi 10 giây
// → Bot phản hồi tối đa sau 10 giây
// ============================================================
function pollTelegramUpdates() {
  // Dùng lock để tránh 2 trigger chạy song song
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(2000)) return;

  try {
    var deadline = new Date().getTime() + 50000; // chạy 50 giây
    while (new Date().getTime() < deadline) {
      fetchUpdates_();
      Utilities.sleep(10000); // đợi 10 giây rồi poll tiếp
    }
  } finally {
    lock.releaseLock();
  }
}

// Hàm nội bộ: gọi getUpdates và xử lý từng tin nhắn
function fetchUpdates_() {
  var props  = PropertiesService.getScriptProperties();
  var offset = parseInt(props.getProperty("POLL_OFFSET") || "0", 10);

  var url = "https://api.telegram.org/bot" + getTelegramToken_() +
            "/getUpdates?timeout=0&offset=" + offset;

  var res  = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  var json = JSON.parse(res.getContentText());

  if (!json.ok) {
    Logger.log("getUpdates error: " + res.getContentText());
    return;
  }
  if (!json.result || json.result.length === 0) return;

  json.result.forEach(function(update) {
    handleTelegramUpdate_(update);
    props.setProperty("POLL_OFFSET", String(update.update_id + 1));
  });
}

function isTelegramUpdate_(data) {
  return data && (
    typeof data.update_id !== "undefined" ||
    data.message ||
    data.edited_message ||
    data.channel_post
  );
}

function handleTelegramUpdate_(update) {
  var message = update.message || update.edited_message || update.channel_post;
  if (!message) {
    Logger.log("Telegram update ignored: " + JSON.stringify(update));
    return;
  }
  handleTelegramCommand(message);
}

// ============================================================
// CÀI TIME TRIGGER — Chạy 1 lần duy nhất để bật tính năng polling
// ============================================================
function setupPollingTrigger() {
  // Xoá trigger cũ nếu có
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === "pollTelegramUpdates") {
      ScriptApp.deleteTrigger(t);
    }
  });
  // Tạo trigger chạy mỗi 1 phút (bên trong loop mỗi 10 giây)
  ScriptApp.newTrigger("pollTelegramUpdates")
    .timeBased()
    .everyMinutes(1)
    .create();
  Logger.log("✅ Trigger đã cài. Bot phản hồi trong tối đa 10 giây.");
}

// Hàm tắt polling (khi không dùng nữa)
function removePollingTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === "pollTelegramUpdates") {
      ScriptApp.deleteTrigger(t);
    }
  });
  Logger.log("Đã tắt trigger polling.");
}

// ============================================================
// WEBHOOK TELEGRAM — Chạy setupWebhook sau khi deploy Web App
// ============================================================
function setupWebhook() {
  var webAppUrl = ScriptApp.getService().getUrl();
  if (!webAppUrl) {
    throw new Error("Chưa tìm thấy Web App URL. Hãy deploy Apps Script thành Web App trước.");
  }

  removePollingTrigger();

  var url = "https://api.telegram.org/bot" + getTelegramToken_() + "/setWebhook";
  var payload = {
    url: webAppUrl,
    allowed_updates: ["message", "edited_message", "channel_post"]
  };
  var res = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
  Logger.log("setWebhook response: " + res.getContentText());
}

function removeWebhook() {
  var url = "https://api.telegram.org/bot" + getTelegramToken_() + "/deleteWebhook";
  var res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  Logger.log("deleteWebhook response: " + res.getContentText());
}

function checkTelegramWebhook() {
  var url = "https://api.telegram.org/bot" + getTelegramToken_() + "/getWebhookInfo";
  var res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  Logger.log("getWebhookInfo response: " + res.getContentText());
}

// ============================================================
// XỬ LÝ ĐẶT BÀN TỪ WEBSITE
// ============================================================
function handleBooking(data) {
  var sheet     = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var timestamp = new Date();

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

  var message =
    "🔔 *THÔNG BÁO ĐẶT BÀN MỚI*\n\n" +
    "📌 *Mã đặt bàn:* " + data.bookingCode + "\n" +
    "👤 *Khách hàng:* " + data.name + "\n" +
    "📞 *Số điện thoại:* `" + data.phone + "` (nhấn để copy)\n" +
    "👥 *Số lượng:* " + data.guests + " người\n" +
    "📅 *Ngày:* " + formatDate(data.date) + "\n" +
    "⏰ *Giờ:* " + data.time + "\n" +
    "📝 *Ghi chú:* " + (data.note ? "_" + data.note + "_" : "_Không có_") + "\n\n" +
    "🕒 *Thời gian đặt:* " + Utilities.formatDate(timestamp, "GMT+7", "dd/MM/yyyy HH:mm:ss");

  var subscribers = getSubscribers();
  subscribers.forEach(function(sub) {
    sendTelegramMessage(sub.chatId, message);
  });
}

// ============================================================
// XỬ LÝ LỆNH TỪ TELEGRAM (/subscribe, /unsubscribe, /status)
// ============================================================
function handleTelegramCommand(message) {
  var chatId    = String(message.chat.id);
  var text      = (message.text || "").trim().toLowerCase();
  var firstName = message.chat.first_name || "Bạn";
  var username  = message.chat.username ? "@" + message.chat.username : firstName;

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
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
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
  var url     = "https://api.telegram.org/bot" + getTelegramToken_() + "/sendMessage";
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
  var res = UrlFetchApp.fetch(url, options);
  var body = res.getContentText();
  var json = JSON.parse(body);
  if (!json.ok) {
    Logger.log("sendMessage error: " + body);
    delete payload.parse_mode;
    options.payload = JSON.stringify(payload);
    res = UrlFetchApp.fetch(url, options);
    Logger.log("sendMessage fallback response: " + res.getContentText());
  }
}

// ============================================================
// TIỆN ÍCH
// ============================================================
function getTelegramToken_() {
  var token = PropertiesService.getScriptProperties().getProperty(TELEGRAM_TOKEN_PROPERTY) || TELEGRAM_TOKEN;
  token = (token || "").trim();
  if (!token || token.indexOf("ĐIỀN_TOKEN") !== -1) {
    throw new Error("Chưa cấu hình TELEGRAM_TOKEN. Hãy điền token trong code hoặc Script Properties.");
  }
  return token;
}

function jsonOutput_(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  var parts = dateStr.split("-");
  if (parts.length === 3) {
    return parts[2] + "/" + parts[1] + "/" + parts[0];
  }
  return dateStr;
}
