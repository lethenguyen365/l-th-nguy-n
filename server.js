process.on('uncaughtException', err => console.error(err));
const express = require("express");
const session = require("express-session");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const fs = require("fs");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const dataDir = process.env.DATA_DIR
  || process.env.RAILWAY_VOLUME_MOUNT_PATH
  || path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = process.env.DB_PATH || path.join(dataDir, "raovat-v3.db");
const db = new sqlite3.Database(dbPath);

const uploadDir = process.env.UPLOAD_DIR || path.join(dataDir, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

const ADMIN_DEFAULTS = {
  full_name: "Tuan Po",
  username: "tuanpo",
  password: "tuanbo222@",
  email: "tuanpo@gmail.com",
  phone: "0900000000",
  address: "TP.HCM",
  bio: "Tài khoản quản trị hệ thống.",
  avatar: "https://i.pravatar.cc/150?img=12"
};

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
app.use(session({
  secret: "raovat_v3_secret_2026",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }
}));
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(uploadDir));

function maybeRepairMojibake(value) {
  if (typeof value !== "string" || !value) return value;
  const suspicious = /Ã|Ä|Â|Æ|á»|áº|â†|ðŸ|�/.test(value);
  if (!suspicious) return value;
  try {
    const repaired = Buffer.from(value, "latin1").toString("utf8");
    if (!repaired || repaired.includes("\u0000")) return value;
    return repaired;
  } catch {
    return value;
  }
}

function sanitizeJsonPayload(value) {
  if (typeof value === "string") return maybeRepairMojibake(value);
  if (Array.isArray(value)) return value.map(sanitizeJsonPayload);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [key, sanitizeJsonPayload(val)])
    );
  }
  return value;
}

function hasBrokenVietnamese(value = "") {
  return typeof value === "string" && /[�ÃÂÄ\?]/.test(value);
}

function normalizeSettingText(key, value) {
  const cleaned = maybeRepairMojibake(value || "");
  if (key === "site_slogan" && hasBrokenVietnamese(cleaned)) {
    return "Nền tảng đăng tin bất động sản tập trung nhu cầu thật tại Gò Vấp, Quận 12 và TP.HCM.";
  }
  if (key === "announcement" && hasBrokenVietnamese(cleaned)) {
    return "Chào mừng bạn đến với Việc Làm Nhà Đất";
  }
  if (key === "site_name" && hasBrokenVietnamese(cleaned)) {
    return "Việc Làm Nhà Đất";
  }
  return cleaned;
}

function normalizeSettingsRow(row) {
  if (!row) return row;
  return {
    ...row,
    site_name: normalizeSettingText("site_name", row.site_name),
    site_slogan: normalizeSettingText("site_slogan", row.site_slogan),
    announcement: normalizeSettingText("announcement", row.announcement),
  };
}

function normalizePostText(value = "") {
  const cleaned = maybeRepairMojibake(value || "");
  return String(cleaned)
    .replace(/Cho thuc c.n h. mini full n.i th.t Nguy.n Oanh, G. V.p/gi, "Cho thuê căn hộ mini full nội thất Nguyễn Oanh, Gò Vấp")
    .replace(/B.n d.t th. c. g.n Metro Hi.p Th.nh, Qu.n 12/gi, "Bán đất thổ cư gần Metro Hiệp Thành, Quận 12")
    .replace(/Qu.n ?12 ?- ?Hi.p Th.nh/gi, "Quận 12 - Hiệp Thành")
    .replace(/G. V.p ?- ?Ph..ng ?17/gi, "Gò Vấp - Phường 17")
    .replace(/Bđn/gi, "Bán")
    .replace(/nhđ/gi, "nhà")
    .replace(/hdm/gi, "hẻm")
    .replace(/dđng/gi, "đường")
    .replace(/dđt/gi, "đất")
    .replace(/thđ/gi, "thổ")
    .replace(/cđ/gi, "cư")
    .replace(/mđt/gi, "mặt")
    .replace(/tiđn/gi, "tiền")
    .replace(/gđn/gi, "gần")
    .replace(/Phđng/gi, "Phường")
    .replace(/Quđn/gi, "Quận")
    .replace(/Thđnh/gi, "Thạnh")
    .replace(/Hiđp/gi, "Hiệp")
    .replace(/Gđ Vđp/gi, "Gò Vấp")
    .replace(/thuc/gi, "thuê")
    .replace(/c.n/gi, "căn")
    .replace(/hđ/gi, "hộ")
    .replace(/n.i/gi, "nội")
    .replace(/th.t/gi, "thất")
    .replace(/Nguy.n/gi, "Nguyễn")
    .replace(/V.p/gi, "Vấp")
    .replace(/Lđ c/gi, "Lộc")
    .replace(/\s+/g, " ")
    .trim();
}

const DEMO_POST_FALLBACKS = {
  1: {
    title: "Bán nhà hẻm 6m đường Quang Trung, Phường 10, Gò Vấp",
    location: "Gò Vấp - Phường 10"
  },
  2: {
    title: "Bán đất thổ cư gần Metro Hiệp Thành, Quận 12",
    location: "Quận 12 - Hiệp Thành"
  },
  3: {
    title: "Cho thuê căn hộ mini full nội thất Nguyễn Oanh, Gò Vấp",
    location: "Gò Vấp - Phường 17"
  },
  4: {
    title: "Bán nhà mặt tiền Hà Huy Giáp, Thạnh Lộc, Quận 12",
    location: "Quận 12 - Thạnh Lộc"
  },
  5: {
    title: "Cho thuê mặt bằng kinh doanh gần chợ An Phú Đông, Quận 12",
    location: "Quận 12 - An Phú Đông"
  },
  6: {
    title: "Tuyển nhân viên kinh doanh bất động sản khu vực Gò Vấp",
    location: "Gò Vấp - Văn phòng"
  },
  7: {
    title: "Bán nhà hẻm 6m đường Quang Trung, Phường 10, Gò Vấp",
    location: "Gò Vấp - Phường 10"
  },
  8: {
    title: "Bán đất thổ cư gần Metro Hiệp Thành, Quận 12",
    location: "Quận 12 - Hiệp Thành"
  },
  9: {
    title: "Cho thuê căn hộ mini full nội thất Nguyễn Oanh, Gò Vấp",
    location: "Gò Vấp - Phường 17"
  },
  10: {
    title: "Bán nhà mặt tiền Hà Huy Giáp, Thạnh Lộc, Quận 12",
    location: "Quận 12 - Thạnh Lộc"
  },
  11: {
    title: "Cho thuê mặt bằng kinh doanh gần chợ An Phú Đông, Quận 12",
    location: "Quận 12 - An Phú Đông"
  },
  12: {
    title: "Tuyển nhân viên kinh doanh bất động sản khu vực Gò Vấp",
    location: "Gò Vấp - Văn phòng"
  }
};

function hasBrokenPostText(value = "") {
  return /�|đn|đt|đng|thồn|thồnh|Lđ|Nguyđ|Hid|Hid?p|hđ|cđ|thuc|c.n|n.i|th.t/i.test(String(value || ""));
}

function normalizePostRow(row) {
  if (!row) return row;
  const fallback = DEMO_POST_FALLBACKS[Number(row.id)] || null;
  const normalizedTitle = normalizePostText(row.title || "");
  const normalizedLocation = normalizePostText(row.location || "");
  return {
    ...row,
    title: fallback && hasBrokenPostText(normalizedTitle) ? fallback.title : normalizedTitle,
    category: normalizePostText(row.category || ""),
    location: fallback && hasBrokenPostText(normalizedLocation) ? fallback.location : normalizedLocation,
    description: normalizePostText(row.description || ""),
    house_direction: normalizePostText(row.house_direction || ""),
    legal_status: normalizePostText(row.legal_status || ""),
    full_name: normalizePostText(row.full_name || ""),
    username: normalizePostText(row.username || "")
  };
}

function normalizeAdminAiText(value = "") {
  return String(maybeRepairMojibake(value || ""))
    .replace(/AI ch ng spam/gi, "AI chống spam")
    .replace(/AI g.i . VIP/gi, "AI gợi ý VIP")
    .replace(/AI nh.c gia h.n/gi, "AI nhắc gia hạn")
    .replace(/^AI đã xử lý nhắc gia hạn cho\s*(\d+)\s*tài khoản\.?$/i, "AI đã xử lý nhắc gia hạn cho $1 tài khoản.")
    .replace(/^AI đã tạo gợi ý VIP\.?$/i, "AI đã tạo gợi ý VIP.")
    .replace(/^AI đã quét spam\.?$/i, "AI đã quét spam.")
    .replace(/Khng pht hin tin spam r rng\./gi, "Không phát hiện tin spam rõ ràng.")
    .replace(/Kh.ng ph.t hi.n tin spam r. r.ng\./gi, "Không phát hiện tin spam rõ ràng.")
    .replace(/Ch.a c. tin c.n g.i . VIP\./gi, "Chưa có tin cần gợi ý VIP.")
    .replace(/Nh.c n.p ti.n cho/gi, "Nhắc nạp tiền cho")
    .replace(/Nhc np tin cho/gi, "Nhắc nạp tiền cho")
    .replace(/v. s. d. th.p\./gi, "vì số dư thấp.")
    .replace(/\sv\s*d\s*thp\.?/gi, " vì số dư thấp.")
    .replace(/to\/gi\s*\d+\s*nhc\s*nhx\s*np\s*tin\s*hoc\s*gia\s*hn\.?/gi, "Đã tạo/gợi ý nhắc nhở nạp tiền hoặc gia hạn.")
    .replace(/to\/g.i \d+ nh.c nh. n.p ti.n ho.c gia h.n\./gi, "Đã tạo/gợi ý nhắc nhở nạp tiền hoặc gia hạn.")
    .replace(/Qu.n 12/gi, "Quận 12")
    .replace(/G. V.p/gi, "Gò Vấp")
    .replace(/Th.nh L.c/gi, "Thạnh Lộc")
    .replace(/Hi.p Th.nh/gi, "Hiệp Thành")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeAiReportRow(row) {
  if (!row) return row;
  return {
    ...row,
    report_type: normalizeAdminAiText(row.report_type || ""),
    title: normalizeAdminAiText(row.title || ""),
    body: normalizeAdminAiText(row.body || "")
  };
}

function normalizeAiActionRow(row) {
  if (!row) return row;
  const normalizedActionType = normalizeAdminAiText(row.action_type || "");
  const normalizedStatus = normalizeAdminAiText(row.action_status || "");
  const normalizedUserName = normalizePostText(row.full_name || row.username || "");
  let normalizedNote = normalizeAdminAiText(row.note || "");

  if (/renewal_reminder/i.test(normalizedActionType) && normalizedUserName) {
    normalizedNote = `Nhắc nạp tiền cho ${normalizedUserName} vì số dư thấp.`;
  }

  return {
    ...row,
    full_name: normalizedUserName,
    action_type: normalizedActionType,
    action_status: normalizedStatus,
    note: normalizedNote
  };
}

app.use((req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (payload) => originalJson(sanitizeJsonPayload(payload));
  next();
});

async function repairTableText(tableName, idColumn, textColumns) {
  const rows = await all(
    `SELECT ${[idColumn, ...textColumns].join(", ")} FROM ${tableName}`
  );

  for (const row of rows) {
    const updates = [];
    const params = [];

    for (const col of textColumns) {
      const current = row[col];
      const repaired = maybeRepairMojibake(current);
      if (typeof current === "string" && repaired !== current) {
        updates.push(`${col} = ?`);
        params.push(repaired);
      }
    }

    if (updates.length) {
      params.push(row[idColumn]);
      await run(`UPDATE ${tableName} SET ${updates.join(", ")} WHERE ${idColumn} = ?`, params);
    }
  }
}

async function repairDatabaseText() {
  await repairTableText("settings", "id", [
    "site_name",
    "site_slogan",
    "bank_name",
    "bank_account_name",
    "transfer_note_prefix",
    "announcement"
  ]);

  await repairTableText("packages", "id", ["name", "featured_badge", "description"]);
  await repairTableText("pricing_plans", "id", ["category", "name", "feature_type"]);
  await repairTableText("posts", "id", [
    "title",
    "category",
    "location",
    "description",
    "house_direction",
    "legal_status",
    "status"
  ]);
  await repairTableText("ai_reports", "id", ["report_type", "title", "body"]);
  await repairTableText("ai_actions", "id", ["action_type", "action_status", "note"]);
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) { if (err) reject(err); else resolve(this); });
  });
}
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, function(err, row) { if (err) reject(err); else resolve(row); });
  });
}
function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, function(err, rows) { if (err) reject(err); else resolve(rows); });
  });
}


async function ensureDemoData() {
  let settingsRow = await get(`SELECT id FROM settings WHERE id = 1`);
  if (!settingsRow) {
    await run(`INSERT INTO settings (
      id, qr_image, bank_name, bank_account_name, bank_account_number, transfer_note_prefix
    ) VALUES (?, ?, ?, ?, ?, ?)`, [
      1, "/assets/qr-acb.png", "ACB", "NGUYEN TUAN ANH", "214904949", "RAOVAT"
    ]);
  } else {
    await run(`UPDATE settings
      SET qr_image = ?, bank_name = ?, bank_account_name = ?, bank_account_number = ?, transfer_note_prefix = ?
      WHERE id = 1`, ["/assets/qr-acb.png", "ACB", "NGUYEN TUAN ANH", "214904949", "RAOVAT"]);
  }

  let adminUser = await get(`SELECT id FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1`);
  if (!adminUser) {
    await run(`INSERT INTO users (full_name, username, password, email, role, wallet_balance, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)`, [
        ADMIN_DEFAULTS.full_name, ADMIN_DEFAULTS.username, ADMIN_DEFAULTS.password, ADMIN_DEFAULTS.email, "admin", 0, 1
      ]);
    adminUser = await get(`SELECT id FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1`);
  }

  const plans = await get(`SELECT COUNT(*) as c FROM pricing_plans`);
  if (!plans || plans.c < 6) {
    await run(`DELETE FROM pricing_plans`);
    await run(`INSERT INTO pricing_plans (name, price, duration_days, description, badge) VALUES
      (?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?)`,
      [
        "Tin thÆ°á»ng", 0, 7, "Miá»…n phÃ­ hiá»ƒn thá»‹ 7 ngÃ y", "FREE",
        "Äáº©y tin", 10000, 1, "Äáº©y lÃªn Ä‘áº§u 1 láº§n", "BOOST",
        "Tin ná»•i báº­t", 20000, 7, "Ná»•i báº­t 7 ngÃ y", "HOT",
        "VIP 7 ngÃ y", 30000, 7, "Æ¯u tiÃªn hiá»ƒn thá»‹", "VIP",
        "VIP 15 ngÃ y", 50000, 15, "Hiá»ƒn thá»‹ lÃ¢u hÆ¡n", "VIP+",
        "VIP 30 ngÃ y", 80000, 30, "GÃ³i thÆ°Æ¡ng máº¡i", "PRO"
      ]);
  }

  const count = await get(`SELECT COUNT(*) as c FROM posts`);
  if (!count || count.c < 6) {
    await run(`DELETE FROM posts`);
    await run(`INSERT INTO posts (
      title, category, price, location, description, image, area, bedrooms, house_direction, legal_status, user_id, is_featured, views, status
    ) VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 245, 'approved'),
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 192, 'approved'),
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 130, 'approved'),
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 88, 'approved'),
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 76, 'approved'),
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 58, 'approved')`,
      [
        "BÃ¡n nhÃ  háº»m 6m Ä‘Æ°á»ng Quang Trung, PhÆ°á»ng 10, GÃ² Váº¥p",
        "NhÃ  bÃ¡n",
        6850000000,
        "GÃ² Váº¥p - PhÆ°á»ng 10",
        "NhÃ  1 trá»‡t 2 láº§u, háº»m xe hÆ¡i, gáº§n chá»£ Háº¡nh ThÃ´ng TÃ¢y, sá»• há»“ng riÃªng, khu dÃ¢n cÆ° an ninh.",
        "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80",
        68,
        3,
        "ÄÃ´ng Nam",
        "Sá»• há»“ng riÃªng",
        adminUser.id,

        "BÃ¡n Ä‘áº¥t thá»• cÆ° gáº§n Metro Hiá»‡p ThÃ nh, Quáº­n 12",
        "Äáº¥t ná»n",
        3200000000,
        "Quáº­n 12 - Hiá»‡p ThÃ nh",
        "LÃ´ Ä‘áº¥t vuÃ´ng Ä‘áº¹p, háº»m Ã´ tÃ´, khu dÃ¢n cÆ° Ä‘Ã´ng Ä‘Ãºc, phÃ¹ há»£p xÃ¢y á»Ÿ hoáº·c Ä‘áº§u tÆ° dÃ i háº¡n.",
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
        82,
        0,
        "TÃ¢y Báº¯c",
        "Sá»• riÃªng",
        adminUser.id,

        "Cho thuÃª cÄƒn há»™ mini gáº§n Cityland, GÃ² Váº¥p",
        "Cho thuÃª",
        6500000,
        "GÃ² Váº¥p - PhÆ°á»ng 5",
        "CÄƒn há»™ mini Ä‘áº§y Ä‘á»§ ná»™i tháº¥t, gáº§n trÆ°á»ng há»c vÃ  trung tÃ¢m thÆ°Æ¡ng máº¡i, phÃ¹ há»£p á»Ÿ ngay.",
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
        35,
        1,
        "Nam",
        "Há»£p Ä‘á»“ng thuÃª rÃµ rÃ ng",
        adminUser.id,

        "BÃ¡n nhÃ  gÃ³c 2 máº·t tiá»n Ä‘Æ°á»ng Nguyá»…n áº¢nh Thá»§, Quáº­n 12",
        "NhÃ  bÃ¡n",
        12300000000,
        "Quáº­n 12 - TÃ¢n ChÃ¡nh Hiá»‡p",
        "NhÃ  máº·t tiá»n rá»™ng, thuáº­n tiá»‡n kinh doanh hoáº·c má»Ÿ vÄƒn phÃ²ng, káº¿t ná»‘i giao thÃ´ng thuáº­n lá»£i.",
        "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1200&q=80",
        120,
        4,
        "ÄÃ´ng",
        "Sá»• há»“ng hoÃ n cÃ´ng",
        adminUser.id,

        "Cho thuÃª máº·t báº±ng táº§ng trá»‡t Ä‘Æ°á»ng LÃª Äá»©c Thá», GÃ² Váº¥p",
        "Máº·t báº±ng",
        18000000,
        "GÃ² Váº¥p - PhÆ°á»ng 17",
        "Máº·t báº±ng Ä‘áº¹p, Ä‘Ã´ng dÃ¢n cÆ°, phÃ¹ há»£p má»Ÿ shop, spa hoáº·c vÄƒn phÃ²ng Ä‘áº¡i diá»‡n.",
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
        90,
        0,
        "Báº¯c",
        "Há»£p Ä‘á»“ng cho thuÃª",
        adminUser.id,

        "Tuyá»ƒn nhÃ¢n viÃªn kinh doanh báº¥t Ä‘á»™ng sáº£n khu vá»±c GÃ² Váº¥p",
        "Viá»‡c lÃ m",
        18000000,
        "GÃ² Váº¥p - VÄƒn phÃ²ng",
        "CÃ´ng ty cáº§n tuyá»ƒn nhÃ¢n viÃªn kinh doanh báº¥t Ä‘á»™ng sáº£n. KhÃ´ng yÃªu cáº§u kinh nghiá»‡m, Ä‘Æ°á»£c Ä‘Ã o táº¡o tá»« Ä‘áº§u, cÃ³ lÆ°Æ¡ng cá»©ng vÃ  hoa há»“ng. LÃ m viá»‡c táº¡i GÃ² Váº¥p.",
        "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
        0,
        0,
        "",
        "Tin tuyá»ƒn dá»¥ng",
        adminUser.id
      ]);
    await run(`INSERT INTO posts (
      title, category, price, location, description, image, area, bedrooms, house_direction, legal_status, user_id, is_featured, views, status
    ) VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 214, 'approved'),
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 168, 'approved'),
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 156, 'approved'),
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 142, 'approved'),
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 126, 'approved'),
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 118, 'approved')`,
      [
        "BÃ¡n nhÃ  3 táº§ng Ä‘Æ°á»ng LÃª VÄƒn Thá», GÃ² Váº¥p, háº»m xe hÆ¡i",
        "NhÃ  bÃ¡n",
        7250000000,
        "GÃ² Váº¥p - PhÆ°á»ng 14",
        "NhÃ  má»›i hoÃ n thiá»‡n, 4 phÃ²ng ngá»§, khu dÃ¢n cÆ° an ninh, cÃ¡ch máº·t tiá»n chÃ­nh chá»‰ vÃ i phÃºt di chuyá»ƒn.",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
        74,
        4,
        "ÄÃ´ng Báº¯c",
        "Sá»• há»“ng riÃªng",
        adminUser.id,

        "BÃ¡n Ä‘áº¥t ná»n khu dÃ¢n cÆ° An PhÃº ÄÃ´ng, Quáº­n 12",
        "Äáº¥t ná»n",
        2850000000,
        "Q12 - An PhÃº ÄÃ´ng",
        "LÃ´ Ä‘áº¥t vuÃ´ng Ä‘áº¹p, Ä‘Æ°á»ng ná»™i bá»™ rá»™ng, phÃ¹ há»£p xÃ¢y nhÃ  á»Ÿ hoáº·c Ä‘áº§u tÆ° tÃ­ch lÅ©y trung háº¡n.",
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
        72,
        0,
        "TÃ¢y Nam",
        "Sá»• riÃªng",
        adminUser.id,

        "Cho thuÃª cÄƒn há»™ 2PN full ná»™i tháº¥t gáº§n Emart, GÃ² Váº¥p",
        "Cho thuÃª",
        9800000,
        "GÃ² Váº¥p - PhÆ°á»ng 7",
        "CÄƒn há»™ sáº¡ch Ä‘áº¹p, Ä‘áº§y Ä‘á»§ ná»™i tháº¥t, phÃ¹ há»£p gia Ä‘Ã¬nh tráº» hoáº·c nhÃ¢n viÃªn vÄƒn phÃ²ng cáº§n á»Ÿ ngay.",
        "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
        58,
        2,
        "Nam",
        "Há»£p Ä‘á»“ng rÃµ rÃ ng",
        adminUser.id,

        "BÃ¡n nhÃ  máº·t tiá»n kinh doanh Ä‘Æ°á»ng Nguyá»…n Oanh, GÃ² Váº¥p",
        "NhÃ  bÃ¡n",
        14800000000,
        "GÃ² Váº¥p - PhÆ°á»ng 17",
        "NhÃ  máº·t tiá»n lá»›n, thÃ­ch há»£p vá»«a á»Ÿ vá»«a kinh doanh, khu dÃ¢n cÆ° Ä‘Ã´ng Ä‘Ãºc vÃ  lÆ°u lÆ°á»£ng xe á»•n Ä‘á»‹nh.",
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
        96,
        5,
        "ÄÃ´ng",
        "HoÃ n cÃ´ng Ä‘áº§y Ä‘á»§",
        adminUser.id,

        "BÃ¡n Ä‘áº¥t thá»• cÆ° gáº§n UBND Tháº¡nh Lá»™c, Quáº­n 12",
        "Äáº¥t ná»n",
        3550000000,
        "Q12 - Tháº¡nh Lá»™c",
        "Vá»‹ trÃ­ gáº§n trá»¥c Ä‘Æ°á»ng chÃ­nh, ná»n cao rÃ¡o, phÃ¡p lÃ½ rÃµ rÃ ng, thÃ­ch há»£p xÃ¢y á»Ÿ hoáº·c lÃ m tÃ i sáº£n giá»¯ tiá»n.",
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
        95,
        0,
        "Báº¯c",
        "Sá»• há»“ng riÃªng",
        adminUser.id,

        "Cho thuÃª nhÃ  nguyÃªn cÄƒn 1 trá»‡t 2 láº§u gáº§n Cityland Park Hills",
        "Cho thuÃª",
        18000000,
        "GÃ² Váº¥p - PhÆ°á»ng 10",
        "NhÃ  rá»™ng, cÃ³ sÃ¢n Ä‘á»ƒ xe, phÃ¹ há»£p gia Ä‘Ã¬nh Ä‘Ã´ng ngÆ°á»i hoáº·c lÃ m vÄƒn phÃ²ng káº¿t há»£p á»Ÿ.",
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
        88,
        4,
        "TÃ¢y Báº¯c",
        "Há»£p Ä‘á»“ng cho thuÃª",
        adminUser.id
      ]);
  }
}


function requireLogin(req, res, next) {
  if (!req.session.user) return res.status(401).json({ message: "Báº¡n chÆ°a Ä‘Äƒng nháº­p." });
  next();
}
function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== "admin") return res.status(403).json({ message: "Báº¡n khÃ´ng cÃ³ quyá»n truy cáº­p." });
  next();
}
function vnDate(d = new Date()) {
  const date = new Date(d);
  return new Date(date.getTime() + 7 * 60 * 60 * 1000);
}
function dateStr(d = new Date()) { return vnDate(d).toISOString().slice(0, 10); }
function dateTimeStr(d = new Date()) { return vnDate(d).toISOString().slice(0, 19).replace("T", " "); }
function addDays(date, days) { const d = new Date(`${date}T00:00:00+07:00`); d.setDate(d.getDate() + days); return dateStr(d); }

async function getActiveSubscription(userId) {
  const today = dateStr();
  return await get(
    `SELECT s.*, p.name as package_name, p.post_limit, p.can_feature
     FROM subscriptions s
     JOIN packages p ON s.package_id = p.id
     WHERE s.user_id = ? AND s.status = 'active' AND s.end_date >= ?
     ORDER BY s.id DESC LIMIT 1`,
    [userId, today]
  );
}

async function bootstrap() {
  await run(`CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK(id = 1),
    site_name TEXT DEFAULT 'Việc Làm Nhà Đất',
    site_slogan TEXT DEFAULT 'Nền tảng đăng tin bất động sản tập trung nhu cầu thật tại Gò Vấp, Quận 12 và TP.HCM.',
    qr_image TEXT DEFAULT '',
    bank_name TEXT DEFAULT 'MB Bank',
    bank_account_name TEXT DEFAULT 'NGUYEN VAN A',
    bank_account_number TEXT DEFAULT '0123456789',
    transfer_note_prefix TEXT DEFAULT 'RAOVAT',
    hero_banner TEXT DEFAULT '',
    announcement TEXT DEFAULT 'Chào mừng bạn đến với Việc Làm Nhà Đất'
  )`);
  await run(`INSERT OR IGNORE INTO settings (id) VALUES (1)`);
  await run(`UPDATE settings
    SET
      site_name = CASE
        WHEN site_name IS NULL OR TRIM(site_name) = '' OR site_name = 'NhaDatGoVapQ12.vn' THEN 'Việc Làm Nhà Đất'
        ELSE site_name
      END,
      site_slogan = CASE
        WHEN site_slogan IS NULL OR TRIM(site_slogan) = '' OR site_slogan LIKE 'ChuyÃªn trang%' THEN 'Nền tảng đăng tin bất động sản tập trung nhu cầu thật tại Gò Vấp, Quận 12 và TP.HCM.'
        ELSE site_slogan
      END,
      announcement = CASE
        WHEN announcement IS NULL OR TRIM(announcement) = '' OR announcement LIKE 'ChÃ o má»«ng%' OR announcement LIKE '%NhaDatGoVapQ12.vn%' THEN 'Chào mừng bạn đến với Việc Làm Nhà Đất'
        ELSE announcement
      END
    WHERE id = 1`);

  await run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    phone TEXT DEFAULT '',
    address TEXT DEFAULT '',
    bio TEXT DEFAULT '',
    avatar TEXT DEFAULT '',
    wallet_balance INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT (datetime('now','+7 hours'))
  )`);

  await run(`CREATE TABLE IF NOT EXISTS packages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    duration_days INTEGER NOT NULL DEFAULT 30,
    post_limit INTEGER NOT NULL DEFAULT 20,
    can_feature INTEGER NOT NULL DEFAULT 0,
    featured_badge TEXT DEFAULT '',
    description TEXT DEFAULT '',
    is_active INTEGER NOT NULL DEFAULT 1
  )`);

  await run(`CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    package_id INTEGER NOT NULL,
    price INTEGER NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    payment_note TEXT DEFAULT '',
    proof_image TEXT DEFAULT '',
    created_at DATETIME DEFAULT (datetime('now','+7 hours'))
  )`);

  await run(`CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    price INTEGER NOT NULL,
    location TEXT NOT NULL,
    description TEXT NOT NULL,
    image TEXT DEFAULT '',
    area REAL NOT NULL DEFAULT 0,
    bedrooms INTEGER NOT NULL DEFAULT 0,
    house_direction TEXT DEFAULT '',
    legal_status TEXT DEFAULT '',
    user_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'approved',
    is_featured INTEGER NOT NULL DEFAULT 0,
    views INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT (datetime('now','+7 hours'))
  )`);

  await run(`CREATE TABLE IF NOT EXISTS ai_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at DATETIME DEFAULT (datetime('now','+7 hours'))
  )`);

  await run(`CREATE TABLE IF NOT EXISTS ai_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER,
    user_id INTEGER,
    action_type TEXT NOT NULL,
    action_status TEXT NOT NULL DEFAULT 'pending',
    note TEXT DEFAULT '',
    created_at DATETIME DEFAULT (datetime('now','+7 hours'))
  )`);

  await run(`CREATE TABLE IF NOT EXISTS pricing_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    price INTEGER NOT NULL DEFAULT 0,
    duration_days INTEGER NOT NULL DEFAULT 7,
    feature_type TEXT NOT NULL DEFAULT 'normal',
    is_active INTEGER NOT NULL DEFAULT 1
  )`);

  await run(`CREATE TABLE IF NOT EXISTS wallet_topups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    payment_note TEXT DEFAULT '',
    proof_image TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending',
    created_at DATETIME DEFAULT (datetime('now','+7 hours'))
  )`);

  await run(`CREATE TABLE IF NOT EXISTS wallet_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    note TEXT DEFAULT '',
    created_at DATETIME DEFAULT (datetime('now','+7 hours'))
  )`);

  await run(`CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    post_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT (datetime('now','+7 hours')),
    UNIQUE(user_id, post_id)
  )`);

  await run(`CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    buyer_id INTEGER NOT NULL,
    seller_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT (datetime('now','+7 hours')),
    UNIQUE(post_id, buyer_id, seller_id)
  )`);

  await run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    body TEXT NOT NULL,
    created_at DATETIME DEFAULT (datetime('now','+7 hours'))
  )`);

  const settings = await get(`SELECT * FROM settings WHERE id = 1`);
  if (!settings.qr_image) {
    await run(`UPDATE settings
      SET qr_image = ?, bank_name = ?, bank_account_name = ?, bank_account_number = ?, transfer_note_prefix = ?, hero_banner = ?
      WHERE id = 1`,
      [
        "/assets/qr-acb.png",
        "ACB",
        "NGUYEN TUAN ANH",
        "214904949",
        "RAOVAT",
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80"
      ]
    );
  }

  const admin = await get(`SELECT * FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1`);
  if (!admin) {
    const hash = await bcrypt.hash(ADMIN_DEFAULTS.password, 10);
    await run(`INSERT INTO users (full_name, username, email, password, role, phone, address, bio, avatar)
      VALUES (?, ?, ?, ?, 'admin', ?, ?, ?, ?)`,
      [ADMIN_DEFAULTS.full_name, ADMIN_DEFAULTS.username, ADMIN_DEFAULTS.email, hash, ADMIN_DEFAULTS.phone, ADMIN_DEFAULTS.address, ADMIN_DEFAULTS.bio, ADMIN_DEFAULTS.avatar]);
  } else {
    const hash = await bcrypt.hash(ADMIN_DEFAULTS.password, 10);
    await run(`UPDATE users
      SET full_name = ?, username = ?, email = ?, password = ?, phone = ?, address = ?, bio = ?, avatar = ?, is_active = 1
      WHERE id = ?`,
      [ADMIN_DEFAULTS.full_name, ADMIN_DEFAULTS.username, ADMIN_DEFAULTS.email, hash, ADMIN_DEFAULTS.phone, ADMIN_DEFAULTS.address, ADMIN_DEFAULTS.bio, ADMIN_DEFAULTS.avatar, admin.id]);
  }

  const pkgCount = await get(`SELECT COUNT(*) as total FROM packages`);
  if (!pkgCount || pkgCount.total === 0) {
    await run(`INSERT INTO packages (name, price, duration_days, post_limit, can_feature, featured_badge, description) VALUES
      ('GÃ³i CÆ¡ Báº£n', 199000, 30, 10, 0, 'Phá»• biáº¿n', 'ÄÄƒng tá»‘i Ä‘a 10 tin trong 30 ngÃ y'),
      ('GÃ³i NÃ¢ng Cao', 399000, 30, 30, 1, 'BÃ¡n nhanh', 'ÄÄƒng tá»‘i Ä‘a 30 tin trong 30 ngÃ y vÃ  cÃ³ thá»ƒ ghim tin'),
      ('GÃ³i Shop Pro', 699000, 30, 100, 1, 'ChuyÃªn nghiá»‡p', 'ÄÄƒng tá»‘i Ä‘a 100 tin, ghim tin vÃ  Æ°u tiÃªn hiá»ƒn thá»‹')
    `);
  }

  const packageRows = await all(`SELECT id, name FROM packages ORDER BY id ASC`);
  const hasPortalPlans = packageRows.length === 14 && packageRows.some((pkg) => pkg.name === "NhÃ  Ä‘áº¥t - VIP 30 ngÃ y");
  if (!hasPortalPlans) {
    await run(`DELETE FROM packages`);
    await run(`INSERT INTO packages (name, price, duration_days, post_limit, can_feature, featured_badge, description) VALUES
      ('NhÃ  Ä‘áº¥t - Tin thÆ°á»ng', 0, 7, 10, 0, 'FREE', 'ÄÄƒng tin nhÃ  Ä‘áº¥t cÆ¡ báº£n trong 7 ngÃ y'),
      ('NhÃ  Ä‘áº¥t - Äáº©y tin', 10000, 1, 10, 0, 'BOOST', 'Äáº©y tin nhÃ  Ä‘áº¥t lÃªn Ä‘áº§u trong 1 láº§n'),
      ('NhÃ  Ä‘áº¥t - Tin ná»•i báº­t', 20000, 7, 15, 1, 'HOT', 'TÄƒng hiá»ƒn thá»‹ cho tin nhÃ  Ä‘áº¥t trong 7 ngÃ y'),
      ('NhÃ  Ä‘áº¥t - VIP 7 ngÃ y', 30000, 7, 20, 1, 'VIP', 'Æ¯u tiÃªn hiá»ƒn thá»‹ tin nhÃ  Ä‘áº¥t trong 7 ngÃ y'),
      ('NhÃ  Ä‘áº¥t - VIP 15 ngÃ y', 50000, 15, 30, 1, 'VIP+', 'Æ¯u tiÃªn hiá»ƒn thá»‹ tin nhÃ  Ä‘áº¥t trong 15 ngÃ y'),
      ('NhÃ  Ä‘áº¥t - VIP 30 ngÃ y', 80000, 30, 60, 1, 'PRO', 'Æ¯u tiÃªn hiá»ƒn thá»‹ tin nhÃ  Ä‘áº¥t trong 30 ngÃ y'),
      ('NhÃ  thuÃª - Tin thÆ°á»ng', 0, 7, 10, 0, 'FREE', 'ÄÄƒng tin cho thuÃª cÆ¡ báº£n trong 7 ngÃ y'),
      ('NhÃ  thuÃª - Äáº©y tin', 5000, 1, 10, 0, 'BOOST', 'Äáº©y tin cho thuÃª lÃªn Ä‘áº§u trong 1 láº§n'),
      ('NhÃ  thuÃª - Tin ná»•i báº­t', 15000, 7, 15, 1, 'HOT', 'TÄƒng hiá»ƒn thá»‹ tin cho thuÃª trong 7 ngÃ y'),
      ('NhÃ  thuÃª - VIP 7 ngÃ y', 25000, 7, 20, 1, 'VIP', 'Æ¯u tiÃªn hiá»ƒn thá»‹ tin cho thuÃª trong 7 ngÃ y'),
      ('Viá»‡c lÃ m - Tin thÆ°á»ng', 0, 7, 10, 0, 'FREE', 'ÄÄƒng tin viá»‡c lÃ m cÆ¡ báº£n trong 7 ngÃ y'),
      ('Viá»‡c lÃ m - Tin ná»•i báº­t', 10000, 7, 15, 1, 'HOT', 'TÄƒng hiá»ƒn thá»‹ tin viá»‡c lÃ m trong 7 ngÃ y'),
      ('Viá»‡c lÃ m - VIP', 20000, 7, 20, 1, 'VIP', 'Æ¯u tiÃªn hiá»ƒn thá»‹ tin viá»‡c lÃ m trong 7 ngÃ y'),
      ('Viá»‡c lÃ m - Äáº©y tin', 5000, 1, 10, 0, 'BOOST', 'Äáº©y tin viá»‡c lÃ m lÃªn Ä‘áº§u trong 1 láº§n')
    `);
  }

  const priceCount = await get(`SELECT COUNT(*) as total FROM pricing_plans`);
  if (!priceCount || priceCount.total === 0) {
    await run(`INSERT INTO pricing_plans (category, name, price, duration_days, feature_type) VALUES
      ('viec_lam', 'Tin thÆ°á»ng', 0, 7, 'normal'),
      ('viec_lam', 'Tin ná»•i báº­t', 10000, 7, 'featured'),
      ('viec_lam', 'Tin VIP', 20000, 7, 'vip'),
      ('viec_lam', 'Äáº©y tin', 5000, 1, 'push'),
      ('nha_thue', 'Tin thÆ°á»ng', 0, 7, 'normal'),
      ('nha_thue', 'Tin ná»•i báº­t', 15000, 7, 'featured'),
      ('nha_thue', 'Tin VIP', 25000, 7, 'vip'),
      ('nha_thue', 'Äáº©y tin', 10000, 1, 'push'),
      ('vip', 'VIP 3 ngÃ y', 15000, 3, 'vip'),
      ('vip', 'VIP 7 ngÃ y', 25000, 7, 'vip'),
      ('vip', 'VIP 15 ngÃ y', 50000, 15, 'vip'),
      ('vip', 'VIP 30 ngÃ y', 80000, 30, 'vip')`);
  }

  const validPriceRows = await get(`SELECT COUNT(*) as total FROM pricing_plans WHERE category IS NOT NULL AND feature_type IS NOT NULL`);
  if (!priceCount || priceCount.total !== 12 || !validPriceRows || validPriceRows.total !== 12) {
    await run(`DELETE FROM pricing_plans`);
    await run(`INSERT INTO pricing_plans (category, name, price, duration_days, feature_type) VALUES
      ('viec_lam', 'Tin thÆ°á»ng', 0, 7, 'normal'),
      ('viec_lam', 'Tin ná»•i báº­t', 10000, 7, 'featured'),
      ('viec_lam', 'Tin VIP', 20000, 7, 'vip'),
      ('viec_lam', 'Äáº©y tin', 5000, 1, 'push'),
      ('nha_thue', 'Tin thÆ°á»ng', 0, 7, 'normal'),
      ('nha_thue', 'Tin ná»•i báº­t', 15000, 7, 'featured'),
      ('nha_thue', 'Tin VIP', 25000, 7, 'vip'),
      ('nha_thue', 'Äáº©y tin', 5000, 1, 'push'),
      ('vip', 'VIP 3 ngÃ y', 15000, 3, 'vip'),
      ('vip', 'VIP 7 ngÃ y', 25000, 7, 'vip'),
      ('vip', 'VIP 15 ngÃ y', 50000, 15, 'vip'),
      ('vip', 'VIP 30 ngÃ y', 80000, 30, 'vip')`);
  }

  const postCount = await get(`SELECT COUNT(*) as total FROM posts`);
  if (!postCount || postCount.total === 0) {
    const adminUser = await get(`SELECT id FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1`);
    await run(`INSERT INTO posts (title, category, price, location, description, image, area, bedrooms, house_direction, legal_status, user_id, is_featured, views) VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 245),
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 192),
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 130),
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 88),
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 76),
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 58)`,
      [
        "BÃ¡n nhÃ  háº»m 6m Ä‘Æ°á»ng Quang Trung, PhÆ°á»ng 10, GÃ² Váº¥p",
        "NhÃ  bÃ¡n",
        6850000000,
        "GÃ² Váº¥p - PhÆ°á»ng 10",
        "NhÃ  1 trá»‡t 2 láº§u, háº»m xe hÆ¡i, gáº§n chá»£ Háº¡nh ThÃ´ng TÃ¢y, sá»• há»“ng riÃªng, khu dÃ¢n cÆ° an ninh.",
        "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80",
        68,
        3,
        "ÄÃ´ng Nam",
        "Sá»• há»“ng riÃªng",
        adminUser.id,
        "BÃ¡n Ä‘áº¥t thá»• cÆ° gáº§n Metro Hiá»‡p ThÃ nh, Quáº­n 12",
        "Äáº¥t ná»n",
        3200000000,
        "Quáº­n 12 - Hiá»‡p ThÃ nh",
        "LÃ´ Ä‘áº¥t Ä‘áº¹p vuÃ´ng vá»©c, Ä‘Æ°á»ng Ã´ tÃ´, khu dÃ¢n cÆ° hiá»‡n há»¯u, phÃ¹ há»£p Ä‘áº§u tÆ° hoáº·c xÃ¢y á»Ÿ.",
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
        82,
        0,
        "TÃ¢y Báº¯c",
        "Sá»• riÃªng",
        adminUser.id,
        "Cho thuÃª cÄƒn há»™ mini full ná»™i tháº¥t Nguyá»…n Oanh, GÃ² Váº¥p",
        "Cho thuÃª",
        6500000,
        "GÃ² Váº¥p - PhÆ°á»ng 17",
        "CÄƒn há»™ má»›i, cÃ³ thang mÃ¡y, giá» giáº¥c tá»± do, gáº§n Lotte Mart Nguyá»…n VÄƒn LÆ°á»£ng.",
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
        35,
        1,
        "Nam",
        "Há»£p Ä‘á»“ng thuÃª rÃµ rÃ ng",
        adminUser.id,
        "BÃ¡n nhÃ  máº·t tiá»n HÃ  Huy GiÃ¡p, Tháº¡nh Lá»™c, Quáº­n 12",
        "NhÃ  bÃ¡n",
        12900000000,
        "Quáº­n 12 - Tháº¡nh Lá»™c",
        "NhÃ  máº·t tiá»n kinh doanh tá»‘t, khu Ä‘Ã´ng dÃ¢n, gáº§n cáº§u PhÃº Long, phÃ¡p lÃ½ rÃµ rÃ ng.",
        "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1200&q=80",
        120,
        4,
        "ÄÃ´ng",
        "Sá»• há»“ng hoÃ n cÃ´ng",
        adminUser.id,
        "Cho thuÃª máº·t báº±ng kinh doanh gáº§n chá»£ An PhÃº ÄÃ´ng, Quáº­n 12",
        "Máº·t báº±ng",
        18000000,
        "Quáº­n 12 - An PhÃº ÄÃ´ng",
        "Máº·t báº±ng rá»™ng, máº·t tiá»n Ä‘áº¹p, phÃ¹ há»£p má»Ÿ shop, vÄƒn phÃ²ng hoáº·c showroom.",
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
        90,
        0,
        "Báº¯c",
        "Há»£p Ä‘á»“ng cho thuÃª",
        adminUser.id,

        "Tuyá»ƒn nhÃ¢n viÃªn kinh doanh báº¥t Ä‘á»™ng sáº£n khu vá»±c GÃ² Váº¥p",
        "Viá»‡c lÃ m",
        18000000,
        "GÃ² Váº¥p - VÄƒn phÃ²ng",
        "CÃ´ng ty cáº§n tuyá»ƒn nhÃ¢n viÃªn kinh doanh báº¥t Ä‘á»™ng sáº£n. KhÃ´ng yÃªu cáº§u kinh nghiá»‡m, Ä‘Æ°á»£c Ä‘Ã o táº¡o tá»« Ä‘áº§u, cÃ³ lÆ°Æ¡ng cá»©ng vÃ  hoa há»“ng. LÃ m viá»‡c táº¡i GÃ² Váº¥p.",
        "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
        0,
        0,
        "",
        "Tin tuyá»ƒn dá»¥ng",
        adminUser.id
      ]);
  }

  await repairDatabaseText();
}

app.post("/api/upload", requireLogin, upload.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "KhÃ´ng cÃ³ file." });
  res.json({ message: "Upload thÃ nh cÃ´ng.", url: "/uploads/" + req.file.filename });
});

app.get("/api/settings/public", async (req, res) => {
  const row = await get(`SELECT site_name, site_slogan, qr_image, bank_name, bank_account_name, bank_account_number, transfer_note_prefix, hero_banner, announcement FROM settings WHERE id = 1`);
  res.json(normalizeSettingsRow(row));
});

app.get("/api/settings", async (req, res) => {
  const row = await get(`SELECT site_name, site_slogan, qr_image, bank_name, bank_account_name, bank_account_number, transfer_note_prefix, hero_banner, announcement FROM settings WHERE id = 1`);
  res.json(normalizeSettingsRow(row));
});

app.get("/api/me", async (req, res) => {
  if (!req.session.user) return res.json({ user: null, subscription: null });
  const user = await get(`SELECT id, full_name, username, email, role, phone, address, bio, avatar, wallet_balance, is_active, created_at FROM users WHERE id = ?`, [req.session.user.id]);
  const subscription = await getActiveSubscription(req.session.user.id);
  res.json({ user, subscription });
});

app.post("/api/register", async (req, res) => {
  try {
    const { full_name, username, email, password } = req.body;
    if (!full_name || !username || !email || !password) return res.status(400).json({ message: "Vui lÃ²ng nháº­p Ä‘áº§y Ä‘á»§ thÃ´ng tin." });
    const hash = await bcrypt.hash(password, 10);
    const r = await run(`INSERT INTO users (full_name, username, email, password) VALUES (?, ?, ?, ?)`, [full_name, username, email, hash]);
    req.session.user = { id: r.lastID, role: "user" };
    const user = await get(`SELECT id, full_name, username, email, role, phone, address, bio, avatar, wallet_balance, is_active, created_at FROM users WHERE id = ?`, [r.lastID]);
    res.json({ message: "Táº¡o tÃ i khoáº£n thÃ nh cÃ´ng.", user });
  } catch (e) {
    if (String(e.message).includes("UNIQUE")) return res.status(400).json({ message: "Username hoáº·c email Ä‘Ã£ tá»“n táº¡i." });
    res.status(500).json({ message: "Lá»—i server." });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await get(`SELECT * FROM users WHERE username = ?`, [username]);
    if (!user) return res.status(400).json({ message: "TÃ i khoáº£n khÃ´ng tá»“n táº¡i." });
    if (!user.is_active) return res.status(403).json({ message: "TÃ i khoáº£n Ä‘Ã£ bá»‹ khÃ³a." });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: "Sai máº­t kháº©u." });
    req.session.user = { id: user.id, role: user.role };
    res.json({ message: "ÄÄƒng nháº­p thÃ nh cÃ´ng.", user: { id: user.id, full_name: user.full_name, username: user.username, email: user.email, role: user.role } });
  } catch {
    res.status(500).json({ message: "Lá»—i server." });
  }
});

app.post("/api/logout", (req, res) => req.session.destroy(() => res.json({ message: "ÄÄƒng xuáº¥t thÃ nh cÃ´ng." })));

app.put("/api/profile", requireLogin, async (req, res) => {
  try {
    const { full_name, email, phone, address, bio, avatar } = req.body;
    await run(`UPDATE users SET full_name = ?, email = ?, phone = ?, address = ?, bio = ?, avatar = ? WHERE id = ?`,
      [full_name, email, phone, address, bio, avatar, req.session.user.id]);
    const user = await get(`SELECT id, full_name, username, email, role, phone, address, bio, avatar, wallet_balance, is_active, created_at FROM users WHERE id = ?`, [req.session.user.id]);
    res.json({ message: "Cáº­p nháº­t thÃ´ng tin thÃ nh cÃ´ng.", user });
  } catch {
    res.status(500).json({ message: "Cáº­p nháº­t tháº¥t báº¡i." });
  }
});

app.get("/api/packages", async (req, res) => {
  res.json(await all(`SELECT * FROM packages WHERE is_active = 1 ORDER BY price ASC`));
});

app.get("/api/posts", async (req, res) => {
  const keyword = req.query.keyword || "";
  const category = req.query.category || "";
  const sort = req.query.sort || "newest";
  const min_price = Number(req.query.min_price || 0);
  const max_price = Number(req.query.max_price || 0);
  const min_area = Number(req.query.min_area || 0);
  const max_area = Number(req.query.max_area || 0);
  const bedrooms = Number(req.query.bedrooms || 0);
  const house_direction = req.query.house_direction || "";
  const legal_status = req.query.legal_status || "";
  const userId = req.session.user?.id || 0;
  let sql = `
    SELECT p.*, u.full_name, u.phone,
      CASE WHEN f.id IS NULL THEN 0 ELSE 1 END as is_favorite
    FROM posts p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN favorites f ON f.post_id = p.id AND f.user_id = ?
    WHERE p.status = 'approved'
  `;
  const params = [userId];
  if (keyword) {
    sql += ` AND (p.title LIKE ? OR p.description LIKE ? OR p.location LIKE ?)`;
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }
  if (category) {
    sql += ` AND p.category = ?`;
    params.push(category);
  }
  if (min_price > 0) {
    sql += ` AND p.price >= ?`;
    params.push(min_price);
  }
  if (max_price > 0) {
    sql += ` AND p.price <= ?`;
    params.push(max_price);
  }
  if (min_area > 0) {
    sql += ` AND p.area >= ?`;
    params.push(min_area);
  }
  if (max_area > 0) {
    sql += ` AND p.area <= ?`;
    params.push(max_area);
  }
  if (bedrooms > 0) {
    sql += ` AND p.bedrooms >= ?`;
    params.push(bedrooms);
  }
  if (house_direction) {
    sql += ` AND p.house_direction = ?`;
    params.push(house_direction);
  }
  if (legal_status) {
    sql += ` AND p.legal_status = ?`;
    params.push(legal_status);
  }
  if (sort === "price_asc") sql += ` ORDER BY p.is_featured DESC, p.price ASC`;
  else if (sort === "price_desc") sql += ` ORDER BY p.is_featured DESC, p.price DESC`;
  else if (sort === "views") sql += ` ORDER BY p.is_featured DESC, p.views DESC`;
  else sql += ` ORDER BY p.is_featured DESC, p.id DESC`;

  const posts = await all(sql, params);
  res.json(posts.map(normalizePostRow));
});

app.get("/api/posts/:id", async (req, res) => {
  const id = req.params.id;
  await run(`UPDATE posts SET views = views + 1 WHERE id = ?`, [id]);
  const userId = req.session.user?.id || 0;
  const post = await get(`
    SELECT p.*, u.full_name, u.phone, u.username,
      CASE WHEN f.id IS NULL THEN 0 ELSE 1 END as is_favorite
    FROM posts p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN favorites f ON f.post_id = p.id AND f.user_id = ?
    WHERE p.id = ?`, [userId, id]);
  if (!post) return res.status(404).json({ message: "KhÃ´ng tÃ¬m tháº¥y bÃ i Ä‘Äƒng." });
  res.json(normalizePostRow(post));
});

app.get("/api/my-posts", requireLogin, async (req, res) => {
  const posts = await all(`SELECT * FROM posts WHERE user_id = ? ORDER BY id DESC`, [req.session.user.id]);
  res.json(posts.map(normalizePostRow));
});

app.post("/api/posts", requireLogin, async (req, res) => {
  try {
    const { title, category, price, location, description, image, area, bedrooms, house_direction, legal_status, is_featured } = req.body;
    if (!title || !category || !price || !location || !description) return res.status(400).json({ message: "Vui lÃ²ng nháº­p Ä‘áº§y Ä‘á»§ thÃ´ng tin." });

    let featureFlag = 0;
    if (req.session.user.role !== "admin") {
      const sub = await getActiveSubscription(req.session.user.id);
      if (!sub) return res.status(403).json({ message: "Báº¡n cáº§n mua gÃ³i Ä‘Äƒng tin trÆ°á»›c khi Ä‘Äƒng bÃ i." });
      const used = await get(`SELECT COUNT(*) as total FROM posts WHERE user_id = ? AND date(created_at) >= date(?) AND date(created_at) <= date(?)`, [req.session.user.id, sub.start_date, sub.end_date]);
      if (used.total >= sub.post_limit) return res.status(403).json({ message: "Báº¡n Ä‘Ã£ háº¿t lÆ°á»£t Ä‘Äƒng tin trong gÃ³i hiá»‡n táº¡i." });
      if (sub.can_feature && Number(is_featured) === 1) featureFlag = 1;
    } else {
      featureFlag = Number(is_featured) === 1 ? 1 : 0;
    }

    await run(`INSERT INTO posts (title, category, price, location, description, image, area, bedrooms, house_direction, legal_status, user_id, status, is_featured, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?)`,
      [title, category, Number(price), location, description, image || "", Number(area || 0), Number(bedrooms || 0), house_direction || "", legal_status || "", req.session.user.id, featureFlag, dateTimeStr()]);
    res.json({ message: "ÄÄƒng tin thÃ nh cÃ´ng." });
  } catch {
    res.status(500).json({ message: "ÄÄƒng tin tháº¥t báº¡i." });
  }
});

app.put("/api/posts/:id", requireLogin, async (req, res) => {
  try {
    const id = req.params.id;
    const post = await get(`SELECT * FROM posts WHERE id = ?`, [id]);
    if (!post) return res.status(404).json({ message: "KhÃ´ng tÃ¬m tháº¥y bÃ i." });
    if (req.session.user.role !== "admin" && post.user_id !== req.session.user.id) return res.status(403).json({ message: "Báº¡n khÃ´ng cÃ³ quyá»n sá»­a bÃ i nÃ y." });

    const { title, category, price, location, description, image, area, bedrooms, house_direction, legal_status, is_featured } = req.body;
    let featureFlag = post.is_featured;
    if (req.session.user.role !== "admin") {
      const sub = await getActiveSubscription(req.session.user.id);
      featureFlag = sub && sub.can_feature && Number(is_featured) === 1 ? 1 : 0;
    } else {
      featureFlag = Number(is_featured) === 1 ? 1 : 0;
    }
    await run(`UPDATE posts SET title = ?, category = ?, price = ?, location = ?, description = ?, image = ?, area = ?, bedrooms = ?, house_direction = ?, legal_status = ?, is_featured = ? WHERE id = ?`,
      [title, category, Number(price), location, description, image || "", Number(area || 0), Number(bedrooms || 0), house_direction || "", legal_status || "", featureFlag, id]);
    res.json({ message: "Cáº­p nháº­t bÃ i Ä‘Äƒng thÃ nh cÃ´ng." });
  } catch {
    res.status(500).json({ message: "Cáº­p nháº­t bÃ i Ä‘Äƒng tháº¥t báº¡i." });
  }
});

app.delete("/api/posts/:id", requireLogin, async (req, res) => {
  const id = req.params.id;
  const post = await get(`SELECT * FROM posts WHERE id = ?`, [id]);
  if (!post) return res.status(404).json({ message: "KhÃ´ng tÃ¬m tháº¥y bÃ i." });
  if (req.session.user.role !== "admin" && post.user_id !== req.session.user.id) return res.status(403).json({ message: "Báº¡n khÃ´ng cÃ³ quyá»n xÃ³a bÃ i nÃ y." });
  await run(`DELETE FROM posts WHERE id = ?`, [id]);
  res.json({ message: "XÃ³a bÃ i Ä‘Äƒng thÃ nh cÃ´ng." });
});

app.post("/api/favorites/:postId", requireLogin, async (req, res) => {
  try {
    const post = await get(`SELECT * FROM posts WHERE id = ?`, [req.params.postId]);
    if (!post) return res.status(404).json({ message: "KhÃ´ng tÃ¬m tháº¥y bÃ i." });
    const existed = await get(`SELECT * FROM favorites WHERE user_id = ? AND post_id = ?`, [req.session.user.id, req.params.postId]);
    if (existed) {
      await run(`DELETE FROM favorites WHERE user_id = ? AND post_id = ?`, [req.session.user.id, req.params.postId]);
      return res.json({ message: "ÄÃ£ bá» khá»i yÃªu thÃ­ch.", active: false });
    }
    await run(`INSERT INTO favorites (user_id, post_id) VALUES (?, ?)`, [req.session.user.id, req.params.postId]);
    res.json({ message: "ÄÃ£ thÃªm vÃ o yÃªu thÃ­ch.", active: true });
  } catch {
    res.status(500).json({ message: "KhÃ´ng thá»ƒ cáº­p nháº­t yÃªu thÃ­ch." });
  }
});

app.get("/api/favorites", requireLogin, async (req, res) => {
  const rows = await all(`
    SELECT p.*, u.full_name, u.phone
    FROM favorites f
    JOIN posts p ON f.post_id = p.id
    JOIN users u ON p.user_id = u.id
    WHERE f.user_id = ?
    ORDER BY f.id DESC`, [req.session.user.id]);
  res.json(rows);
});

app.post("/api/subscriptions", requireLogin, async (req, res) => {
  try {
    const { package_id, package_name = "", price = 0, duration_days = 0, proof_image = "" } = req.body;
    let pkg = null;
    if (package_id) {
      pkg = await get(`SELECT * FROM packages WHERE id = ? AND is_active = 1`, [package_id]);
    }
    if (!pkg && package_name) {
      pkg = await get(`SELECT * FROM packages WHERE name = ? AND price = ? AND duration_days = ? AND is_active = 1`, [package_name, Number(price || 0), Number(duration_days || 0)]);
    }
    if (!pkg) return res.status(404).json({ message: "KhÃ´ng tÃ¬m tháº¥y gÃ³i." });
    const startDate = dateStr();
    const endDate = addDays(startDate, Number(pkg.duration_days) - 1);
    const note = `RAOVAT-${req.session.user.id}-${Date.now().toString().slice(-6)}`;
    await run(`INSERT INTO subscriptions (user_id, package_id, price, start_date, end_date, status, payment_note, proof_image)
      VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`,
      [req.session.user.id, pkg.id, pkg.price, startDate, endDate, note, proof_image]);
    res.json({ message: "ÄÄƒng kÃ½ gÃ³i thÃ nh cÃ´ng, chá» admin xÃ¡c nháº­n thanh toÃ¡n.", payment_note: note });
  } catch {
    res.status(500).json({ message: "KhÃ´ng thá»ƒ Ä‘Äƒng kÃ½ gÃ³i." });
  }
});

app.post("/api/subscriptions/wallet", requireLogin, async (req, res) => {
  try {
    const { package_id, package_name = "", price = 0, duration_days = 0 } = req.body;
    let pkg = null;
    if (package_id) {
      pkg = await get(`SELECT * FROM packages WHERE id = ? AND is_active = 1`, [package_id]);
    }
    if (!pkg && package_name) {
      pkg = await get(`SELECT * FROM packages WHERE name = ? AND price = ? AND duration_days = ? AND is_active = 1`, [package_name, Number(price || 0), Number(duration_days || 0)]);
    }
    if (!pkg) return res.status(404).json({ message: "KhÃ´ng tÃ¬m tháº¥y gÃ³i." });

    const user = await get(`SELECT id, wallet_balance FROM users WHERE id = ?`, [req.session.user.id]);
    if (!user) return res.status(404).json({ message: "KhÃ´ng tÃ¬m tháº¥y tÃ i khoáº£n." });
    if (Number(user.wallet_balance || 0) < Number(pkg.price || 0)) {
      return res.status(400).json({ message: "Sá»‘ dÆ° vÃ­ khÃ´ng Ä‘á»§ Ä‘á»ƒ mua gÃ³i nÃ y." });
    }

    const startDate = dateStr();
    const endDate = addDays(startDate, Number(pkg.duration_days) - 1);
    const note = `WALLET-${req.session.user.id}-${Date.now().toString().slice(-6)}`;

    if (Number(pkg.price || 0) > 0) {
      await run(`UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?`, [pkg.price, req.session.user.id]);
      await run(`INSERT INTO wallet_transactions (user_id, type, amount, note) VALUES (?, 'debit', ?, ?)`,
        [req.session.user.id, pkg.price, `Mua gÃ³i ${pkg.name} báº±ng sá»‘ dÆ° vÃ­`]);
    }

    await run(`UPDATE subscriptions SET status = 'expired' WHERE user_id = ? AND status = 'active'`, [req.session.user.id]);
    await run(`INSERT INTO subscriptions (user_id, package_id, price, start_date, end_date, status, payment_note, proof_image)
      VALUES (?, ?, ?, ?, ?, 'active', ?, '')`,
      [req.session.user.id, pkg.id, pkg.price, startDate, endDate, note]);

    res.json({ message: "ÄÃ£ mua gÃ³i báº±ng sá»‘ dÆ° vÃ­ thÃ nh cÃ´ng.", end_date: endDate });
  } catch {
    res.status(500).json({ message: "KhÃ´ng thá»ƒ mua gÃ³i báº±ng sá»‘ dÆ° vÃ­." });
  }
});

app.get("/api/my-subscriptions", requireLogin, async (req, res) => {
  res.json(await all(`SELECT s.*, p.name as package_name, p.post_limit, p.can_feature
    FROM subscriptions s
    JOIN packages p ON s.package_id = p.id
    WHERE s.user_id = ?
    ORDER BY s.id DESC`, [req.session.user.id]));
});

app.post("/api/chat/start", requireLogin, async (req, res) => {
  const { post_id, seller_id } = req.body;
  if (!post_id || !seller_id) return res.status(400).json({ message: "Thiáº¿u thÃ´ng tin." });
  if (Number(seller_id) === req.session.user.id) return res.status(400).json({ message: "Báº¡n khÃ´ng thá»ƒ tá»± chat vá»›i chÃ­nh mÃ¬nh." });
  const post = await get(`SELECT * FROM posts WHERE id = ?`, [post_id]);
  if (!post) return res.status(404).json({ message: "KhÃ´ng tÃ¬m tháº¥y bÃ i." });

  let conv = await get(`SELECT * FROM conversations WHERE post_id = ? AND buyer_id = ? AND seller_id = ?`,
    [post_id, req.session.user.id, seller_id]);
  if (!conv) {
    const r = await run(`INSERT INTO conversations (post_id, buyer_id, seller_id) VALUES (?, ?, ?)`,
      [post_id, req.session.user.id, seller_id]);
    conv = await get(`SELECT * FROM conversations WHERE id = ?`, [r.lastID]);
  }
  res.json({ message: "ÄÃ£ má»Ÿ há»™i thoáº¡i.", conversation_id: conv.id });
});

app.get("/api/chat/conversations", requireLogin, async (req, res) => {
  const rows = await all(`
    SELECT c.*, p.title,
      buyer.full_name as buyer_name,
      seller.full_name as seller_name,
      (
        SELECT body FROM messages m WHERE m.conversation_id = c.id ORDER BY m.id DESC LIMIT 1
      ) as last_message
    FROM conversations c
    JOIN posts p ON c.post_id = p.id
    JOIN users buyer ON c.buyer_id = buyer.id
    JOIN users seller ON c.seller_id = seller.id
    WHERE c.buyer_id = ? OR c.seller_id = ?
    ORDER BY c.id DESC`, [req.session.user.id, req.session.user.id]);
  res.json(rows);
});

app.get("/api/chat/:conversationId/messages", requireLogin, async (req, res) => {
  const conv = await get(`SELECT * FROM conversations WHERE id = ?`, [req.params.conversationId]);
  if (!conv) return res.status(404).json({ message: "KhÃ´ng tÃ¬m tháº¥y há»™i thoáº¡i." });
  if (conv.buyer_id !== req.session.user.id && conv.seller_id !== req.session.user.id) return res.status(403).json({ message: "KhÃ´ng cÃ³ quyá»n truy cáº­p." });
  const rows = await all(`
    SELECT m.*, u.full_name
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    WHERE m.conversation_id = ?
    ORDER BY m.id ASC`, [req.params.conversationId]);
  res.json(rows);
});

app.post("/api/chat/:conversationId/messages", requireLogin, async (req, res) => {
  const conv = await get(`SELECT * FROM conversations WHERE id = ?`, [req.params.conversationId]);
  if (!conv) return res.status(404).json({ message: "KhÃ´ng tÃ¬m tháº¥y há»™i thoáº¡i." });
  if (conv.buyer_id !== req.session.user.id && conv.seller_id !== req.session.user.id) return res.status(403).json({ message: "KhÃ´ng cÃ³ quyá»n truy cáº­p." });
  if (!req.body.body) return res.status(400).json({ message: "Tin nháº¯n trá»‘ng." });
  await run(`INSERT INTO messages (conversation_id, sender_id, body) VALUES (?, ?, ?)`,
    [req.params.conversationId, req.session.user.id, req.body.body]);
  res.json({ message: "Gá»­i tin nháº¯n thÃ nh cÃ´ng." });
});


app.get("/api/pricing-plans", async (req, res) => {
  const rows = await all(`SELECT * FROM pricing_plans WHERE is_active = 1 ORDER BY category, price ASC`);
  res.json(rows);
});

app.post("/api/wallet/topup", requireLogin, async (req, res) => {
  try {
    const { amount, proof_image = "" } = req.body;
    const money = Number(amount || 0);
    if (money < 10000) return res.status(400).json({ message: "Nạp tối thiểu 10.000đ." });
    const note = `NAPTIEN-${req.session.user.id}-${Date.now().toString().slice(-6)}`;
    const topup = await run(`INSERT INTO wallet_topups (user_id, amount, payment_note, proof_image, status) VALUES (?, ?, ?, ?, 'approved')`,
      [req.session.user.id, money, note, proof_image]);
    await run(`UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?`, [money, req.session.user.id]);
    await run(`INSERT INTO wallet_transactions (user_id, type, amount, note) VALUES (?, 'credit', ?, ?)`,
      [req.session.user.id, money, `Nạp tiền tự động #${topup.lastID}`]);
    res.json({ message: "Đã nạp tiền vào ví thành công.", payment_note: note });
  } catch {
    res.status(500).json({ message: "Không tạo được yêu cầu nạp tiền." });
  }
});

app.get("/api/wallet/topups", requireLogin, async (req, res) => {
  const rows = await all(`SELECT * FROM wallet_topups WHERE user_id = ? ORDER BY id DESC`, [req.session.user.id]);
  res.json(rows);
});

app.get("/api/wallet/transactions", requireLogin, async (req, res) => {
  const rows = await all(`SELECT * FROM wallet_transactions WHERE user_id = ? ORDER BY id DESC`, [req.session.user.id]);
  res.json(rows);
});

app.post("/api/posts/:id/monetize", requireLogin, async (req, res) => {
  try {
    const post = await get(`SELECT * FROM posts WHERE id = ?`, [req.params.id]);
    if (!post) return res.status(404).json({ message: "KhÃ´ng tÃ¬m tháº¥y tin Ä‘Äƒng." });
    if (req.session.user.role !== "admin" && post.user_id !== req.session.user.id) {
      return res.status(403).json({ message: "Báº¡n khÃ´ng cÃ³ quyá»n nÃ¢ng cáº¥p tin nÃ y." });
    }
    const { plan_id } = req.body;
    const plan = await get(`SELECT * FROM pricing_plans WHERE id = ? AND is_active = 1`, [plan_id]);
    if (!plan) return res.status(404).json({ message: "KhÃ´ng tÃ¬m tháº¥y gÃ³i giÃ¡." });
    const user = await get(`SELECT id, wallet_balance FROM users WHERE id = ?`, [req.session.user.id]);
    if (user.wallet_balance < plan.price) return res.status(400).json({ message: "Sá»‘ dÆ° vÃ­ khÃ´ng Ä‘á»§." });

    if (plan.price > 0) {
      await run(`UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?`, [plan.price, req.session.user.id]);
      await run(`INSERT INTO wallet_transactions (user_id, type, amount, note) VALUES (?, 'debit', ?, ?)`,
        [req.session.user.id, plan.price, `Thanh toÃ¡n ${plan.name} cho tin #${post.id}`]);
    }
    if (plan.feature_type === 'featured' || plan.feature_type === 'vip') {
      await run(`UPDATE posts SET is_featured = 1 WHERE id = ?`, [post.id]);
    } else if (plan.feature_type === 'push') {
      await run(`UPDATE posts SET created_at = ? WHERE id = ?`, [dateTimeStr(), post.id]);
    }
    res.json({ message: "ÄÃ£ Ã¡p dá»¥ng gÃ³i kiáº¿m tiá»n cho tin Ä‘Äƒng." });
  } catch {
    res.status(500).json({ message: "KhÃ´ng thá»ƒ Ã¡p dá»¥ng gÃ³i." });
  }
});

app.get("/api/admin/topups", requireAdmin, async (req, res) => {
  const rows = await all(`SELECT t.*, u.full_name, u.username
    FROM wallet_topups t JOIN users u ON t.user_id = u.id
    ORDER BY t.id DESC`);
  res.json(rows);
});

app.put("/api/admin/topups/:id/approve", requireAdmin, async (req, res) => {
  const topup = await get(`SELECT * FROM wallet_topups WHERE id = ?`, [req.params.id]);
  if (!topup) return res.status(404).json({ message: "KhÃ´ng tÃ¬m tháº¥y yÃªu cáº§u náº¡p." });
  if (topup.status !== 'pending') return res.status(400).json({ message: "YÃªu cáº§u nÃ y Ä‘Ã£ xá»­ lÃ½." });
  await run(`UPDATE wallet_topups SET status = 'approved' WHERE id = ?`, [req.params.id]);
  await run(`UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?`, [topup.amount, topup.user_id]);
  await run(`INSERT INTO wallet_transactions (user_id, type, amount, note) VALUES (?, 'credit', ?, ?)`,
    [topup.user_id, topup.amount, `Admin duyá»‡t náº¡p tiá»n #${topup.id}`]);
  res.json({ message: "ÄÃ£ duyá»‡t náº¡p tiá»n." });
});

app.put("/api/admin/topups/:id/reject", requireAdmin, async (req, res) => {
  const topup = await get(`SELECT * FROM wallet_topups WHERE id = ?`, [req.params.id]);
  if (!topup) return res.status(404).json({ message: "KhÃ´ng tÃ¬m tháº¥y yÃªu cáº§u náº¡p." });
  await run(`UPDATE wallet_topups SET status = 'rejected' WHERE id = ?`, [req.params.id]);
  res.json({ message: "ÄÃ£ tá»« chá»‘i yÃªu cáº§u náº¡p." });
});


app.post("/api/ai/support", requireLogin, async (req, res) => {
  try {
    const {
      title = "",
      category = "",
      location = "",
      price = 0,
      area = 0,
      bedrooms = 0,
      house_direction = "",
      legal_status = ""
    } = req.body;

    if ((category || "").includes("Viá»‡c lÃ m")) {
      const salaryNum = Number(price || 0);
      const salaryText = salaryNum > 0 ? `${salaryNum.toLocaleString("vi-VN")}Ä‘/thÃ¡ng` : "thá»a thuáº­n";
      const smartTitle = title && title.trim()
        ? title.trim()
        : `Tuyá»ƒn nhÃ¢n sá»± ${location || "TP.HCM"} - thu nháº­p ${salaryText}`;
      const conciseTitle = `Tuyá»ƒn dá»¥ng ${location || "TP.HCM"}`;
      const salesTitle = `ðŸ”¥ Tuyá»ƒn viá»‡c lÃ m ${location || "TP.HCM"} | Thu nháº­p ${salaryText}`;
      const proTitle = `Tuyá»ƒn dá»¥ng nhÃ¢n sá»± ${location || "TP.HCM"} - Má»©c lÆ°Æ¡ng ${salaryText}`;

      const normalDescription = [
        `Doanh nghiá»‡p Ä‘ang tuyá»ƒn dá»¥ng vá»‹ trÃ­ viá»‡c lÃ m táº¡i ${location || "TP.HCM"}.`,
        `Má»©c lÆ°Æ¡ng: ${salaryText}.`,
        "MÃ´i trÆ°á»ng lÃ m viá»‡c á»•n Ä‘á»‹nh, cÃ³ cÆ¡ há»™i phÃ¡t triá»ƒn lÃ¢u dÃ i.",
        "LiÃªn há»‡ ngay Ä‘á»ƒ á»©ng tuyá»ƒn nhanh."
      ].join(" ");

      const salesDescription = [
        `CÆ¡ há»™i viá»‡c lÃ m háº¥p dáº«n táº¡i ${location || "TP.HCM"}.`,
        `Thu nháº­p ${salaryText}, mÃ´i trÆ°á»ng nÄƒng Ä‘á»™ng, phÃ¹ há»£p á»©ng viÃªn muá»‘n phÃ¡t triá»ƒn nhanh.`,
        "á»¨ng tuyá»ƒn sá»›m Ä‘á»ƒ nháº­n lá»‹ch phá»ng váº¥n."
      ].join(" ");

      const brokerDescription = [
        `Doanh nghiá»‡p cáº§n tuyá»ƒn nhÃ¢n sá»± lÃ m viá»‡c táº¡i ${location || "TP.HCM"},`,
        `má»©c lÆ°Æ¡ng ${salaryText},`,
        "Æ°u tiÃªn á»©ng viÃªn nghiÃªm tÃºc, cÃ³ tinh tháº§n há»c há»i vÃ  gáº¯n bÃ³ lÃ¢u dÃ i.",
        "LiÃªn há»‡ trá»±c tiáº¿p Ä‘á»ƒ nháº­n mÃ´ táº£ cÃ´ng viá»‡c chi tiáº¿t."
      ].join(" ");

      const seoTags = [...new Set([
        "viá»‡c lÃ m",
        "tuyá»ƒn dá»¥ng",
        location || "TP.HCM",
        "viá»‡c lÃ m gÃ² váº¥p",
        "viá»‡c lÃ m quáº­n 12",
        salaryText
      ].filter(Boolean))];

      const tips = [
        "NÃªn ghi rÃµ vá»‹ trÃ­ tuyá»ƒn dá»¥ng nhÆ° sale, hÃ nh chÃ­nh, marketing...",
        "NÃªn thÃªm má»©c lÆ°Æ¡ng cá»¥ thá»ƒ Ä‘á»ƒ tÄƒng tá»· lá»‡ á»©ng tuyá»ƒn.",
        "CÃ³ thá»ƒ dÃ¹ng tin ná»•i báº­t hoáº·c VIP Ä‘á»ƒ tiáº¿p cáº­n nhiá»u á»©ng viÃªn hÆ¡n."
      ];

      return res.json({
        message: "AI Ä‘Ã£ táº¡o ná»™i dung viá»‡c lÃ m.",
        result: {
          title: smartTitle,
          concise_title: conciseTitle,
          sales_title: salesTitle,
          pro_title: proTitle,
          normal_description: normalDescription,
          sales_description: salesDescription,
          broker_description: brokerDescription,
          suggested_price: salaryNum || 12000000,
          suggested_price_text: salaryText,
          seo_tags: seoTags,
          tips
        }
      });
    }

    const areaNum = Number(area || 0);
    const bedNum = Number(bedrooms || 0);
    const priceNum = Number(price || 0);

    const pricePerM2 = areaNum > 0 && priceNum > 0 ? Math.round(priceNum / areaNum) : 0;
    const suggestedPrice =
      priceNum > 0 ? priceNum :
      category.includes("NhÃ ") ? Math.max(areaNum * 85000000, 2500000000) :
      category.includes("Äáº¥t") ? Math.max(areaNum * 42000000, 1800000000) :
      category.includes("Cho thuÃª") ? Math.max(areaNum * 160000, 3500000) :
      Math.max(areaNum * 30000000, 1000000000);

    const priceText = priceNum > 0 ? `${priceNum.toLocaleString("vi-VN")}Ä‘` : "";
    const suggestedPriceText = `${Math.round(suggestedPrice).toLocaleString("vi-VN")}Ä‘`;
    const areaText = areaNum > 0 ? `${areaNum}mÂ²` : "";
    const bedText = bedNum > 0 ? `${bedNum}PN` : "";
    const directionText = house_direction ? `hÆ°á»›ng ${house_direction}` : "";
    const legalText = legal_status || "phÃ¡p lÃ½ rÃµ rÃ ng";

    const smartTitle = title && title.trim()
      ? title.trim()
      : [category || "Báº¥t Ä‘á»™ng sáº£n", location || "TP.HCM", areaText, bedText].filter(Boolean).join(" - ");

    const conciseTitle = [category || "BÄS", location || "TP.HCM", areaText, bedText].filter(Boolean).join(" - ");
    const salesTitle = [category || "BÄS Ä‘áº¹p", areaText, bedText, location || "TP.HCM", directionText, priceText ? `giÃ¡ ${priceText}` : `giÃ¡ tá»‘t ${suggestedPriceText}`].filter(Boolean).join(" | ");
    const proTitle = [category || "BÃ¡n/cho thuÃª BÄS", location || "TP.HCM", areaText, bedText, legalText].filter(Boolean).join(" - ");

    const normalDescription = [
      `${category || "Báº¥t Ä‘á»™ng sáº£n"} táº¡i ${location || "TP.HCM"}${areaText ? `, diá»‡n tÃ­ch ${areaText}` : ""}${bedText ? `, gá»“m ${bedText}` : ""}.`,
      directionText ? `NhÃ  ${directionText}.` : "",
      `PhÃ¡p lÃ½: ${legalText}.`,
      priceText ? `GiÃ¡ tham kháº£o: ${priceText}.` : `AI Ä‘á» xuáº¥t giÃ¡ tham kháº£o: ${suggestedPriceText}.`,
      "LiÃªn há»‡ Ä‘á»ƒ xem thá»±c táº¿ vÃ  lÃ m viá»‡c nhanh."
    ].filter(Boolean).join(" ");

    const salesDescription = [
      `Sáº£n pháº©m ${category || "báº¥t Ä‘á»™ng sáº£n"} Ä‘áº¹p táº¡i ${location || "TP.HCM"},`,
      areaText ? `${areaText},` : "",
      bedText ? `${bedText},` : "",
      directionText ? `${directionText},` : "",
      `phÃ¡p lÃ½ ${legalText}.`,
      priceText ? `Má»©c giÃ¡ ${priceText} cÃ²n thÆ°Æ¡ng lÆ°á»£ng.` : `AI gá»£i Ã½ má»©c giÃ¡ ${suggestedPriceText}.`,
      "PhÃ¹ há»£p khÃ¡ch mua á»Ÿ thá»±c, Ä‘áº§u tÆ° giá»¯ tÃ i sáº£n hoáº·c khai thÃ¡c dÃ²ng tiá»n."
    ].filter(Boolean).join(" ");

    const brokerDescription = [
      `Cáº§n bÃ¡n/cho thuÃª ${category || "báº¥t Ä‘á»™ng sáº£n"} vá»‹ trÃ­ ${location || "TP.HCM"},`,
      areaText ? `diá»‡n tÃ­ch ${areaText},` : "",
      bedText ? `${bedText},` : "",
      directionText ? `${directionText},` : "",
      `phÃ¡p lÃ½ ${legalText}.`,
      priceText ? `GiÃ¡ chÃ o ${priceText}.` : `Má»©c giÃ¡ AI Ä‘á» xuáº¥t ${suggestedPriceText}.`,
      pricePerM2 > 0 ? `ÄÆ¡n giÃ¡ khoáº£ng ${pricePerM2.toLocaleString("vi-VN")}Ä‘/mÂ².` : "",
      "Khu dÃ¢n cÆ° hiá»‡n há»¯u, káº¿t ná»‘i giao thÃ´ng thuáº­n tiá»‡n, phÃ¹ há»£p á»Ÿ thá»±c hoáº·c Ä‘áº§u tÆ° dÃ i háº¡n.",
      "KhÃ¡ch thiá»‡n chÃ­ liÃªn há»‡ Ä‘á»ƒ xem thá»±c táº¿ vÃ  thÆ°Æ¡ng lÆ°á»£ng trá»±c tiáº¿p."
    ].filter(Boolean).join(" ");

    const seoTags = [
      category,
      location,
      areaText,
      bedText,
      house_direction,
      legal_status,
      category.includes("NhÃ ") ? "nhÃ  Ä‘áº¹p" : "",
      category.includes("Äáº¥t") ? "Ä‘áº¥t ná»n" : "",
      category.includes("Cho thuÃª") ? "cho thuÃª nhanh" : "",
      "báº¥t Ä‘á»™ng sáº£n hcm",
      "rao váº·t nhÃ  Ä‘áº¥t"
    ].filter(Boolean);

    const uniqueTags = [...new Set(seoTags.map(t => String(t).trim()).filter(Boolean))];

    const tips = [];
    if (!location) tips.push("NÃªn chá»n khu vá»±c cá»¥ thá»ƒ nhÆ° GÃ² Váº¥p - PhÆ°á»ng 10 Ä‘á»ƒ khÃ¡ch tÃ¬m chÃ­nh xÃ¡c hÆ¡n.");
    if (areaNum <= 0) tips.push("NÃªn thÃªm diá»‡n tÃ­ch Ä‘á»ƒ AI Ä‘á» xuáº¥t giÃ¡ chÃ­nh xÃ¡c hÆ¡n.");
    if ((category || "").includes("NhÃ ") && bedNum <= 0) tips.push("NhÃ  bÃ¡n hoáº·c cho thuÃª nÃªn thÃªm sá»‘ phÃ²ng ngá»§.");
    if (!house_direction) tips.push("NÃªn thÃªm hÆ°á»›ng nhÃ  Ä‘á»ƒ tiáº¿p cáº­n nhÃ³m khÃ¡ch quan tÃ¢m phong thá»§y.");
    if (!legal_status) tips.push("NÃªn ghi rÃµ phÃ¡p lÃ½ nhÆ° sá»• há»“ng riÃªng, sá»• riÃªng hoáº·c há»£p Ä‘á»“ng rÃµ rÃ ng.");
    if (priceNum <= 0) tips.push(`AI Ä‘ang Ä‘á» xuáº¥t má»©c giÃ¡ khoáº£ng ${suggestedPriceText}. Báº¡n cÃ³ thá»ƒ láº¥y lÃ m má»‘c Ä‘Äƒng ban Ä‘áº§u.`);
    if (!tips.length) tips.push("Tin Ä‘Ã£ khÃ¡ tá»‘t. Gá»£i Ã½ tiáº¿p theo lÃ  dÃ¹ng tin ná»•i báº­t hoáº·c VIP Ä‘á»ƒ tÄƒng hiá»ƒn thá»‹.");

    res.json({
      message: "AI Ä‘Ã£ táº¡o ná»™i dung nÃ¢ng cao.",
      result: {
        title: smartTitle,
        concise_title: conciseTitle,
        sales_title: salesTitle,
        pro_title: proTitle,
        normal_description: normalDescription,
        sales_description: salesDescription,
        broker_description: brokerDescription,
        suggested_price: Math.round(suggestedPrice),
        suggested_price_text: suggestedPriceText,
        seo_tags: uniqueTags,
        tips
      }
    });
  } catch {
    res.status(500).json({ message: "AI support lá»—i." });
  }
});


app.post("/api/ai/moderate-post", requireLogin, async (req, res) => {
  try {
    const {
      post_id = 0,
      title = "",
      category = "",
      description = "",
      price = 0,
      location = "",
      image = ""
    } = req.body;

    const issues = [];
    let status = "approved";
    let action = "Duyá»‡t ngay";
    let score = 100;

    if (!title || title.trim().length < 10) { issues.push("TiÃªu Ä‘á» quÃ¡ ngáº¯n"); score -= 20; }
    if (!description || description.trim().length < 40) { issues.push("MÃ´ táº£ quÃ¡ ngáº¯n"); score -= 20; }
    if (!category) { issues.push("Thiáº¿u danh má»¥c"); score -= 20; }
    if (!location) { issues.push("Thiáº¿u khu vá»±c"); score -= 10; }
    if (Number(price || 0) <= 0) { issues.push("Thiáº¿u giÃ¡ / má»©c lÆ°Æ¡ng"); score -= 15; }

    const spamWords = ["zalo", "telegram", "ib ngay", "click", "kiáº¿m tiá»n online", "Ä‘áº§u tÆ° siÃªu lá»£i nhuáº­n", "nhanh tay káº»o lá»¡"];
    const lowerText = `${title} ${description}`.toLowerCase();
    const spamHits = spamWords.filter(w => lowerText.includes(w));
    if (spamHits.length) {
      issues.push(`Nghi spam: ${spamHits.join(", ")}`);
      score -= 30;
    }

    const duplicate = await get(
      `SELECT id, title FROM posts WHERE lower(title) = lower(?) AND id != ? LIMIT 1`,
      [title || "", Number(post_id || 0)]
    );
    if (duplicate) {
      issues.push("TiÃªu Ä‘á» cÃ³ dáº¥u hiá»‡u trÃ¹ng tin khÃ¡c");
      score -= 15;
    }

    if (score < 55) {
      status = "rejected";
      action = "Cáº§n cháº·n / sá»­a láº¡i";
    } else if (score < 80) {
      status = "pending";
      action = "Cáº§n bá»• sung thÃ´ng tin";
    }

    res.json({
      message: "AI Ä‘Ã£ duyá»‡t tin.",
      result: {
        score,
        status,
        action,
        issues,
        note: issues.length ? issues.join("; ") : "Tin Ä‘áº¡t cháº¥t lÆ°á»£ng tá»‘t."
      }
    });
  } catch {
    res.status(500).json({ message: "AI duyá»‡t tin lá»—i." });
  }
});

app.post("/api/ai/classify-post", requireLogin, async (req, res) => {
  try {
    const { title = "", description = "" } = req.body;
    const text = `${title} ${description}`.toLowerCase();
    let category = "NhÃ  bÃ¡n";
    if (text.includes("tuyá»ƒn") || text.includes("viá»‡c lÃ m") || text.includes("á»©ng tuyá»ƒn")) category = "Viá»‡c lÃ m";
    else if (text.includes("cho thuÃª") || text.includes("thuÃª")) category = "Cho thuÃª";
    else if (text.includes("Ä‘áº¥t") || text.includes("thá»• cÆ°") || text.includes("ná»n")) category = "Äáº¥t ná»n";
    else if (text.includes("máº·t báº±ng") || text.includes("shop") || text.includes("showroom")) category = "Máº·t báº±ng";

    res.json({
      message: "AI Ä‘Ã£ phÃ¢n loáº¡i tin.",
      result: { category }
    });
  } catch {
    res.status(500).json({ message: "AI phÃ¢n loáº¡i lá»—i." });
  }
});

app.post("/api/ai/reply-suggest", requireLogin, async (req, res) => {
  try {
    const { customer_message = "", post_title = "", post_price = 0, post_location = "" } = req.body;
    const msg = String(customer_message || "").toLowerCase();
    let reply = `Cáº£m Æ¡n báº¡n Ä‘Ã£ quan tÃ¢m tin "${post_title}".`;

    if (msg.includes("giÃ¡")) {
      reply = `Cáº£m Æ¡n báº¡n Ä‘Ã£ quan tÃ¢m. GiÃ¡ hiá»‡n táº¡i lÃ  ${Number(post_price || 0).toLocaleString("vi-VN")}Ä‘. Náº¿u báº¡n thiá»‡n chÃ­, mÃ¬nh cÃ³ thá»ƒ há»— trá»£ thÃªm thÃ´ng tin chi tiáº¿t.`;
    } else if (msg.includes("á»Ÿ Ä‘Ã¢u") || msg.includes("Ä‘á»‹a chá»‰") || msg.includes("khu vá»±c")) {
      reply = `Tin nÃ y thuá»™c khu vá»±c ${post_location || "TP.HCM"}. Báº¡n nháº¯n láº¡i sá»‘ Ä‘iá»‡n thoáº¡i hoáº·c thá»i gian xem phÃ¹ há»£p, mÃ¬nh gá»­i thÃ´ng tin chi tiáº¿t hÆ¡n nhÃ©.`;
    } else if (msg.includes("cÃ²n khÃ´ng") || msg.includes("cÃ²n tin")) {
      reply = `Tin nÃ y hiá»‡n váº«n cÃ²n. Náº¿u báº¡n cáº§n, mÃ¬nh cÃ³ thá»ƒ gá»­i thÃªm hÃ¬nh áº£nh vÃ  thÃ´ng tin chi tiáº¿t ngay.`;
    } else if (msg.includes("xem nhÃ ") || msg.includes("xem Ä‘áº¥t") || msg.includes("phá»ng váº¥n")) {
      reply = `Báº¡n cÃ³ thá»ƒ Ä‘á»ƒ láº¡i sá»‘ Ä‘iá»‡n thoáº¡i hoáº·c khung giá» phÃ¹ há»£p, mÃ¬nh sáº¯p xáº¿p há»— trá»£ nhanh cho báº¡n.`;
    }

    res.json({
      message: "AI Ä‘Ã£ gá»£i Ã½ tráº£ lá»i khÃ¡ch.",
      result: { reply }
    });
  } catch {
    res.status(500).json({ message: "AI tráº£ lá»i khÃ¡ch lá»—i." });
  }
});

app.post("/api/ai/renewal-reminders", requireAdmin, async (req, res) => {
  try {
    const users = await all(`SELECT id, full_name, wallet_balance FROM users ORDER BY id DESC LIMIT 20`);
    let count = 0;
    for (const u of users) {
      if (Number(u.wallet_balance || 0) < 20000) {
        await run(`INSERT INTO ai_actions (user_id, action_type, action_status, note) VALUES (?, 'renewal_reminder', 'done', ?)`,
          [u.id, `Nháº¯c náº¡p tiá»n cho ${u.full_name || "user"} vÃ¬ sá»‘ dÆ° tháº¥p.`]);
        count += 1;
      }
    }
    await run(`INSERT INTO ai_reports (report_type, title, body) VALUES ('renewal', ?, ?)`,
      ['AI nháº¯c gia háº¡n', `ÄÃ£ táº¡o/gá»£i Ã½ ${count} nháº¯c nhá»Ÿ náº¡p tiá»n hoáº·c gia háº¡n.`]);

    res.json({ message: `AI Ä‘Ã£ xá»­ lÃ½ nháº¯c gia háº¡n cho ${count} tÃ i khoáº£n.` });
  } catch {
    res.status(500).json({ message: "AI nháº¯c gia háº¡n lá»—i." });
  }
});

app.post("/api/ai/vip-suggestions", requireAdmin, async (req, res) => {
  try {
    const rows = await all(`SELECT id, title, views, is_featured FROM posts ORDER BY id DESC LIMIT 30`);
    const suggestions = rows
      .filter(p => Number(p.views || 0) < 30 && Number(p.is_featured || 0) === 0)
      .slice(0, 10)
      .map(p => `Tin #${p.id} - ${p.title} nÃªn gá»£i Ã½ gÃ³i VIP hoáº·c Ä‘áº©y tin.`);

    await run(`INSERT INTO ai_reports (report_type, title, body) VALUES ('vip', ?, ?)`,
      ['AI gá»£i Ã½ VIP', suggestions.join("\n") || 'ChÆ°a cÃ³ tin cáº§n gá»£i Ã½ VIP.']);

    res.json({
      message: "AI Ä‘Ã£ táº¡o gá»£i Ã½ VIP.",
      result: { suggestions }
    });
  } catch {
    res.status(500).json({ message: "AI gá»£i Ã½ VIP lá»—i." });
  }
});

app.post("/api/ai/spam-scan", requireAdmin, async (req, res) => {
  try {
    const posts = await all(`SELECT id, user_id, title, description FROM posts ORDER BY id DESC LIMIT 50`);
    const spamWords = ["zalo", "telegram", "kiáº¿m tiá»n online", "click", "siÃªu lá»£i nhuáº­n"];
    const flagged = [];

    for (const p of posts) {
      const text = `${p.title} ${p.description}`.toLowerCase();
      const hits = spamWords.filter(w => text.includes(w));
      if (hits.length) {
        flagged.push(`Tin #${p.id}: ${hits.join(", ")}`);
        await run(`INSERT INTO ai_actions (post_id, user_id, action_type, action_status, note) VALUES (?, ?, 'spam_scan', 'flagged', ?)`,
          [p.id, p.user_id, `Nghi spam: ${hits.join(", ")}`]);
      }
    }

    await run(`INSERT INTO ai_reports (report_type, title, body) VALUES ('spam', ?, ?)`,
      ['AI chá»‘ng spam', flagged.join("\n") || 'KhÃ´ng phÃ¡t hiá»‡n tin spam rÃµ rÃ ng.']);

    res.json({ message: "AI Ä‘Ã£ quÃ©t spam.", result: { flagged } });
  } catch {
    res.status(500).json({ message: "AI chá»‘ng spam lá»—i." });
  }
});

app.get("/api/admin/ai/reports", requireAdmin, async (req, res) => {
  const rows = await all(`SELECT * FROM ai_reports ORDER BY id DESC LIMIT 50`);
  res.json(rows.map(normalizeAiReportRow));
});

app.get("/api/admin/ai/actions", requireAdmin, async (req, res) => {
  const rows = await all(`SELECT a.*, u.full_name, u.username
    FROM ai_actions a
    LEFT JOIN users u ON a.user_id = u.id
    ORDER BY a.id DESC
    LIMIT 100`);
  res.json(rows.map(normalizeAiActionRow));
});

app.get("/api/admin/summary", requireAdmin, async (req, res) => {
  const [users, posts, revenue, pending, favorites] = await Promise.all([
    get(`SELECT COUNT(*) as total FROM users`),
    get(`SELECT COUNT(*) as total FROM posts`),
    get(`SELECT COALESCE(SUM(price), 0) as total FROM subscriptions WHERE status = 'active'`),
    get(`SELECT COUNT(*) as total FROM subscriptions WHERE status = 'pending'`),
    get(`SELECT COUNT(*) as total FROM favorites`)
  ]);
  const pendingTopups = await get(`SELECT COUNT(*) as total FROM wallet_topups WHERE status = 'pending'`);
  res.json({ users: users.total, posts: posts.total, revenue: revenue.total, pendingPayments: pending.total + pendingTopups.total, favorites: favorites.total });
});

app.get("/api/admin/users", requireAdmin, async (req, res) => {
  res.json(await all(`SELECT id, full_name, username, email, role, phone, is_active, created_at FROM users ORDER BY id DESC`));
});

app.put("/api/admin/users/:id/toggle", requireAdmin, async (req, res) => {
  const user = await get(`SELECT * FROM users WHERE id = ?`, [req.params.id]);
  if (!user) return res.status(404).json({ message: "KhÃ´ng tÃ¬m tháº¥y user." });
  const next = user.is_active ? 0 : 1;
  await run(`UPDATE users SET is_active = ? WHERE id = ?`, [next, req.params.id]);
  res.json({ message: next ? "ÄÃ£ má»Ÿ khÃ³a user." : "ÄÃ£ khÃ³a user." });
});

app.get("/api/admin/posts", requireAdmin, async (req, res) => {
  const rows = await all(`SELECT p.*, u.full_name, u.username FROM posts p JOIN users u ON p.user_id = u.id ORDER BY p.id DESC`);
  res.json(rows.map(normalizePostRow));
});

app.get("/api/admin/subscriptions", requireAdmin, async (req, res) => {
  res.json(await all(`SELECT s.*, p.name as package_name, u.full_name, u.username
    FROM subscriptions s
    JOIN packages p ON s.package_id = p.id
    JOIN users u ON s.user_id = u.id
    ORDER BY s.id DESC`));
});

app.put("/api/admin/subscriptions/:id/approve", requireAdmin, async (req, res) => {
  const sub = await get(`SELECT * FROM subscriptions WHERE id = ?`, [req.params.id]);
  if (!sub) return res.status(404).json({ message: "KhÃ´ng tÃ¬m tháº¥y gÃ³i Ä‘Äƒng kÃ½." });
  await run(`UPDATE subscriptions SET status = 'expired' WHERE user_id = ? AND status = 'active'`, [sub.user_id]);
  await run(`UPDATE subscriptions SET status = 'active' WHERE id = ?`, [req.params.id]);
  res.json({ message: "ÄÃ£ xÃ¡c nháº­n thanh toÃ¡n vÃ  kÃ­ch hoáº¡t gÃ³i." });
});

app.put("/api/admin/subscriptions/:id/reject", requireAdmin, async (req, res) => {
  const sub = await get(`SELECT * FROM subscriptions WHERE id = ?`, [req.params.id]);
  if (!sub) return res.status(404).json({ message: "KhÃ´ng tÃ¬m tháº¥y gÃ³i Ä‘Äƒng kÃ½." });
  await run(`UPDATE subscriptions SET status = 'rejected' WHERE id = ?`, [req.params.id]);
  res.json({ message: "ÄÃ£ tá»« chá»‘i Ä‘Äƒng kÃ½ gÃ³i." });
});

app.get("/api/admin/settings", requireAdmin, async (req, res) => {
  res.json(normalizeSettingsRow(await get(`SELECT * FROM settings WHERE id = 1`)));
});

app.put("/api/admin/settings", requireAdmin, async (req, res) => {
  const { site_name, site_slogan, qr_image, bank_name, bank_account_name, bank_account_number, transfer_note_prefix, hero_banner, announcement } = req.body;
  const nextSiteName = normalizeSettingText("site_name", site_name);
  const nextSiteSlogan = normalizeSettingText("site_slogan", site_slogan);
  const nextAnnouncement = normalizeSettingText("announcement", announcement);
  await run(`UPDATE settings SET site_name=?, site_slogan=?, qr_image=?, bank_name=?, bank_account_name=?, bank_account_number=?, transfer_note_prefix=?, hero_banner=?, announcement=? WHERE id=1`,
    [nextSiteName, nextSiteSlogan, qr_image, bank_name, bank_account_name, bank_account_number, transfer_note_prefix, hero_banner, nextAnnouncement]);
  res.json({ message: "Đã cập nhật cài đặt." });
});

app.get("/admin", (req, res) => res.sendFile(path.join(__dirname, "public", "admin.html")));

bootstrap()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Database path: ${dbPath}`);
      console.log(`Upload path: ${uploadDir}`);
    });
  })
  .catch(console.error);

