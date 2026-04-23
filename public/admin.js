const currency = (v) => Number(v || 0).toLocaleString("vi-VN") + " đ";

const ADMIN_SETTING_FALLBACKS = {
  site_name: "Việc Làm Nhà Đất",
  site_slogan: "Chuyên trang đăng tin bất động sản TP.HCM - Gò Vấp - Quận 12",
  announcement: "Chào mừng bạn đến với Việc Làm Nhà Đất",
};

const ADMIN_TEXT_FIXUPS = [
  [/^AI gợi ý VIP\.?$/i, "AI gợi ý VIP."],
  [/^Chưa có tin cần gợi ý VIP\.?$/i, "Chưa có tin cần gợi ý VIP."],
  [/^AI đã tạo gợi ý VIP\.?$/i, "AI đã tạo gợi ý VIP."],
  [/^AI\s*(?:�|ã|d|da|đã)?\s*xử lý nhắc gia hạn cho\s*(\d+)\s*tài khoản\.?$/i, "AI đã xử lý nhắc gia hạn cho $1 tài khoản."],
  [/^AI\s*(?:�|ã|d|da|đã)?\s*tạo gợi ý VIP\.?$/i, "AI đã tạo gợi ý VIP."],
  [/^AI\s*(?:�|ã|d|da|đã)?\s*quét spam\.?$/i, "AI đã quét spam."],
  [/^Đã cập nhật cài đặt\.?$/i, "Đã cập nhật cài đặt."],
  [/^Đã cập nhật thông báo\.?$/i, "Đã cập nhật thông báo."],
];

function decodeMojibake(value) {
  if (typeof value !== "string") return value;
  const score = (text) => {
    const source = String(text || "");
    let total = 0;
    total += (source.match(/(�|Ã|Â|Ä|Æ|áº|á»|â€|â€“|â€”|â€¦)/g) || []).length * 5;
    total += (source.match(/\b(Lđ|Nhđ|trđt|đp|c ng|c n|thuc|c\.n|n\.i|th\.t|gia h\.n)\b/gi) || []).length * 4;
    return total;
  };
  if (!/(Ã|Â|Ä|Æ|áº|á»|â€|â€“|â€”|â€¦|�|\bLđ\b|\bNhđ\b|trđt|\bc ng\b|\bc n\b|thuc|c\.n|n\.i|th\.t|gia h\.n)/i.test(value)) return value.trim();
  const clean = (text) => text
    .replace(/Ä‘/g, "đ")
    .replace(/Ä/g, "Đ")
    .replace(/Ã¡/g, "á")
    .replace(/Ã /g, "à")
    .replace(/Ã¢/g, "â")
    .replace(/Ãª/g, "ê")
    .replace(/Ã´/g, "ô")
    .replace(/Æ¡/g, "ơ")
    .replace(/Æ°/g, "ư")
    .replace(/â†’/g, "→")
    .trim();
  const candidates = [clean(value)];
  try {
    const bytes = Uint8Array.from(Array.from(value).map((char) => char.charCodeAt(0) & 255));
    candidates.push(clean(new TextDecoder("utf-8").decode(bytes)));
  } catch {}
  const best = candidates.reduce((winner, item) => (score(item) < score(winner) ? item : winner), candidates[0]);
  return score(best) <= score(value) ? best : value.trim();
}

function normalizeAdminText(value) {
  if (typeof value !== "string") return value;
  const rawText = String(value || "").trim();
  let text = rawText
    .replace(/^AI\s*(?:�|ã|d|da|đã)?\s*xử lý nhắc gia hạn cho\s*(\d+)\s*tài khoản\.?$/i, "AI đã xử lý nhắc gia hạn cho $1 tài khoản.")
    .replace(/^AI\s*(?:�|ã|d|da|đã)?\s*tạo gợi ý VIP\.?$/i, "AI đã tạo gợi ý VIP.")
    .replace(/^AI\s*(?:�|ã|d|da|đã)?\s*quét spam\.?$/i, "AI đã quét spam.");

  text = decodeMojibake(text)
    .replace(/á»‡/g, "ệ")
    .replace(/á»›/g, "ớ")
    .replace(/á»‹/g, "ị")
    .replace(/á»—/g, "ỗ")
    .replace(/á»¹/g, "ỹ")
    .replace(/áº£/g, "ả")
    .replace(/áº¥/g, "ấ")
    .replace(/áº§/g, "ầ")
    .replace(/áº«/g, "ẫ")
    .replace(/áº­/g, "ậ")
    .replace(/áº¿/g, "ế")
    .replace(/á»ƒ/g, "ể")
    .replace(/áº¡/g, "ạ")
    .replace(/á»�/g, "ờ")
    .replace(/á»“/g, "ồ")
    .replace(/á»/g, "ờ")
    .replace(/á»±/g, "ự")
    .replace(/á»/g, "ọ")
    .replace(/á»§/g, "ủ")
    .replace(/á»«/g, "ừ")
    .replace(/á»/g, "ỏ")
    .replace(/Â·/g, "·")
    .replace(/�/g, "");

  text = text
    .replace(/AI ch\s*ng spam/gi, "AI chống spam")
    .replace(/AI g.i . VIP/gi, "AI gợi ý VIP")
    .replace(/AI nh.c gia h.n/gi, "AI nhắc gia hạn")
    .replace(/^AI đã xử lý nhắc gia hạn cho\s*(\d+)\s*tài khoản\.?$/i, "AI đã xử lý nhắc gia hạn cho $1 tài khoản.")
    .replace(/^AI đã tạo gợi ý VIP\.?$/i, "AI đã tạo gợi ý VIP.")
    .replace(/^AI đã quét spam\.?$/i, "AI đã quét spam.")
    .replace(/Khng pht hi!?n tin spam r rng\.?/gi, "Không phát hiện tin spam rõ ràng.")
    .replace(/Kh.ng ph.t hi.n tin spam r. r.ng\.?/gi, "Không phát hiện tin spam rõ ràng.")
    .replace(/Ch.a c. tin c.n g.i . VIP\.?/gi, "Chưa có tin cần gợi ý VIP.")
    .replace(/to\/gi1 nhc nhx np tin hoc gia hn\.?/gi, "Đã tạo/gợi ý nhắc nhở nạp tiền hoặc gia hạn.")
    .replace(/to\/gi\s*\d+\s*nhc\s*nhx\s*np\s*tin\s*hoc\s*gia\s*hn\.?/gi, "Đã tạo/gợi ý nhắc nhở nạp tiền hoặc gia hạn.")
    .replace(/Nh.c n.p ti.n cho/gi, "Nhắc nạp tiền cho")
    .replace(/Nhc np tin cho/gi, "Nhắc nạp tiền cho")
    .replace(/v. s. d. th.p\.?/gi, "vì số dư thấp.")
    .replace(/\sv\s*d\s*thp\.?/gi, " vì số dư thấp.")
    .replace(/Qu.n 12/gi, "Quận 12")
    .replace(/G. V.p/gi, "Gò Vấp")
    .replace(/Th.nh L.c/gi, "Thạnh Lộc")
    .replace(/Hi.p Th.nh/gi, "Hiệp Thành")
    .replace(/Ph..ng/gi, "Phường")
    .replace(/\bLđ\b/gi, "Lô")
    .replace(/\bLô t đt ở đp vương vức\b/gi, "Lô đất ở đẹp vuông vức")
    .replace(/\bNhđ\b/gi, "Nhà")
    .replace(/trđt/gi, "trệt")
    .replace(/vương vức/gi, "vuông vức")
    .replace(/\bc ng ty c n tuyển\b/gi, "Công ty cần tuyển")
    .replace(/\bc ng ty\b/gi, "Công ty")
    .replace(/\bc n tuyển\b/gi, "cần tuyển")
    .replace(/\bđp\b/gi, "đẹp")
    .replace(/N.i dung/gi, "Nội dung")
    .replace(/Th.i gian/gi, "Thời gian")
    .replace(/Tr.ng th.i/gi, "Trạng thái")
    .replace(/Ghi ch./gi, "Ghi chú")
    .replace(/Ti.u ..../gi, "Tiêu đề")
    .replace(/Lo.i/gi, "Loại")
    .replace(/H.nh .ng/gi, "Hành động")
    .replace(/S. ti.n/gi, "Số tiền")
    .replace(/Duy.t/gi, "Duyệt")
    .replace(/T. ch.i/gi, "Từ chối")
    .replace(/Kh.a/gi, "Khóa")
    .replace(/M. kh.a/gi, "Mở khóa")
    .replace(/Ho.t .ng/gi, "Hoạt động")
    .replace(/.. kh.a/gi, "Đã khóa")
    .replace(/Vai tr./gi, "Vai trò")
    .replace(/H. t.n/gi, "Họ tên");

  const hardFixes = [
    [/AI ch ng spam/gi, "AI chống spam"],
    [/AI g.i . VIP/gi, "AI gợi ý VIP"],
    [/AI nh.c gia h.n/gi, "AI nhắc gia hạn"],
    [/^AI đã xử lý nhắc gia hạn cho\s*(\d+)\s*tài khoản\.?$/i, "AI đã xử lý nhắc gia hạn cho $1 tài khoản."],
    [/^AI ã xử lý nhắc gia hạn cho\s*(\d+)\s*tài khoản\.?$/i, "AI đã xử lý nhắc gia hạn cho $1 tài khoản."],
    [/^AI đã tạo gợi ý VIP\.?$/i, "AI đã tạo gợi ý VIP."],
    [/^AI ã tạo gợi ý VIP\.?$/i, "AI đã tạo gợi ý VIP."],
    [/^AI đã quét spam\.?$/i, "AI đã quét spam."],
    [/^AI ã quét spam\.?$/i, "AI đã quét spam."],
    [/Kh.ng ph.t hi.n tin spam r. r.ng\./gi, "Không phát hiện tin spam rõ ràng."],
    [/Ch.a c. tin c.n g.i . VIP\./gi, "Chưa có tin cần gợi ý VIP."],
    [/to\/g.i \d+ nh.c nh. n.p ti.n ho.c gia h.n\./gi, "Đã tạo/gợi ý nhắc nhở nạp tiền hoặc gia hạn."],
    [/to\/gi\s*\d+\s*nhc\s*nhx\s*np\s*tin\s*hoc\s*gia\s*hn\.?/gi, "Đã tạo/gợi ý nhắc nhở nạp tiền hoặc gia hạn."],
    [/Nh.c n.p ti.n cho/gi, "Nhắc nạp tiền cho"],
    [/Nhc np tin cho/gi, "Nhắc nạp tiền cho"],
    [/v. s. d. th.p\./gi, "vì số dư thấp."],
    [/\sv\s*d\s*thp\.?/gi, " vì số dư thấp."],
    [/Qu.n 12/gi, "Quận 12"],
    [/G. V.p/gi, "Gò Vấp"],
    [/Th.nh L.c/gi, "Thạnh Lộc"],
    [/Hi.p Th.nh/gi, "Hiệp Thành"],
    [/Ph..ng/gi, "Phường"],
    [/N.i dung/gi, "Nội dung"],
    [/Th.i gian/gi, "Thời gian"],
    [/Tr.ng th.i/gi, "Trạng thái"],
    [/Ghi ch./gi, "Ghi chú"],
    [/Ti.u ..../gi, "Tiêu đề"],
    [/Lo.i/gi, "Loại"],
    [/H.nh .ng/gi, "Hành động"],
    [/S. ti.n/gi, "Số tiền"],
    [/Duy.t/gi, "Duyệt"],
    [/T. ch.i/gi, "Từ chối"],
    [/Kh.a/gi, "Khóa"],
    [/M. kh.a/gi, "Mở khóa"],
    [/Ho.t .ng/gi, "Hoạt động"],
    [/.. kh.a/gi, "Đã khóa"],
    [/Vai tr./gi, "Vai trò"],
    [/H. t.n/gi, "Họ tên"],
    [/Khng pht hin tin spam r rng\./gi, "Không phát hiện tin spam rõ ràng."],
    [/AI ch ng spam/gi, "AI chống spam"],
    [/AI nh.c gia h.n/gi, "AI nhắc gia hạn"]
  ];

  for (const [pattern, replacement] of hardFixes) {
    text = text.replace(pattern, replacement);
  }

  for (const [pattern, replacement] of ADMIN_TEXT_FIXUPS) {
    text = text.replace(pattern, replacement);
  }

  text = text
    .replace(/^AI ch ng spam\.?$/i, "AI chống spam")
    .replace(/^AI nh.c gia h.n\.?$/i, "AI nhắc gia hạn")
    .replace(/^AI g.i . VIP\.?$/i, "AI gợi ý VIP.")
    .replace(/^AI\s*ã\s*xử lý nhắc gia hạn cho\s*(\d+)\s*tài khoản\.?$/i, "AI đã xử lý nhắc gia hạn cho $1 tài khoản.")
    .replace(/^AI\s*xử lý nhắc gia hạn cho\s*(\d+)\s*tài khoản\.?$/i, "AI đã xử lý nhắc gia hạn cho $1 tài khoản.")
    .replace(/^AI\s*ã\s*tạo gợi ý VIP\.?$/i, "AI đã tạo gợi ý VIP.")
    .replace(/^AI\s*tạo gợi ý VIP\.?$/i, "AI đã tạo gợi ý VIP.")
    .replace(/^AI\s*ã\s*quét spam\.?$/i, "AI đã quét spam.")
    .replace(/^AI\s*quét spam\.?$/i, "AI đã quét spam.")
    .replace(/^Khng pht hi.?n tin spam r.? r.ng\.?$/i, "Không phát hiện tin spam rõ ràng.")
    .replace(/^Ch.a c. tin c.n g.i . VIP\.?$/i, "Chưa có tin cần gợi ý VIP.")
    .replace(/^to\/gi\s*\d+\s*nhc.*gia hn\.?$/i, "Đã tạo/gợi ý nhắc nhở nạp tiền hoặc gia hạn.")
    .replace(/^Nh.c n.p ti.n cho\s+(.+?)\s+v.*th.p\.?$/i, "Nhắc nạp tiền cho $1 vì số dư thấp.");

  return text;
}

function sanitizeData(payload) {
  if (typeof payload === "string") return normalizeAdminText(payload);
  if (Array.isArray(payload)) return payload.map(sanitizeData);
  if (payload && typeof payload === "object") {
    return Object.fromEntries(Object.entries(payload).map(([key, value]) => [key, sanitizeData(value)]));
  }
  return payload;
}

async function fetchJSON(url, options = {}) {
  const res = await fetch(url, options);
  const raw = await res.json();
  const data = sanitizeData(raw);
  if (!res.ok) throw new Error(data.message || "Có lỗi.");
  return data;
}

function showAlert(message) {
  const text = normalizeAdminText(message || "")
    .replace(/^AI ch ng spam\.?$/i, "AI chống spam")
    .replace(/^AI nh.c gia h.n\.?$/i, "AI nhắc gia hạn")
    .replace(/^AI g.i . VIP\.?$/i, "AI gợi ý VIP.")
    .replace(/^AI\s*ã\s+xử lý nhắc gia hạn cho\s*(\d+)\s*tài khoản\.?$/i, "AI đã xử lý nhắc gia hạn cho $1 tài khoản.")
    .replace(/^AI\s*ã\s+tạo gợi ý VIP\.?$/i, "AI đã tạo gợi ý VIP.")
    .replace(/^AI\s*ã\s*quét spam\.?$/i, "AI đã quét spam.");
  let backdrop = document.getElementById("adminAlertBackdrop");
  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.id = "adminAlertBackdrop";
    backdrop.className = "admin-alert-backdrop";
    backdrop.innerHTML = `
      <div class="admin-alert-card" role="alertdialog" aria-modal="true" aria-labelledby="adminAlertTitle">
        <div class="admin-alert-title" id="adminAlertTitle">Thông báo</div>
        <div class="admin-alert-message" id="adminAlertMessage"></div>
        <div class="admin-alert-actions">
          <button type="button" class="btn btn-primary admin-alert-ok" id="adminAlertOk">OK</button>
        </div>
      </div>`;
    document.body.appendChild(backdrop);
    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop) backdrop.classList.remove("show");
    });
    backdrop.querySelector("#adminAlertOk").addEventListener("click", () => {
      backdrop.classList.remove("show");
    });
  }

  const messageNode = backdrop.querySelector("#adminAlertMessage");
  if (messageNode) messageNode.textContent = text;
  backdrop.classList.add("show");
}

function settingValue(key, value) {
  const text = normalizeAdminText(value || "");
  return text || ADMIN_SETTING_FALLBACKS[key] || "";
}

function userStatusLabel(isActive) {
  return isActive ? "Hoạt động" : "Đã khóa";
}

function boolLabel(value) {
  return value ? "Có" : "Không";
}

function initAdminSectionTabs() {
  const sections = Array.from(document.querySelectorAll("[data-admin-section]"));
  const navItems = Array.from(document.querySelectorAll("[data-admin-nav]"));
  if (!sections.length || !navItems.length) return;

  const validSections = new Set(sections.map((section) => section.dataset.adminSection));
  const showSection = (target = "summary", updateHash = true) => {
    const nextTarget = validSections.has(target) ? target : "summary";
    sections.forEach((section) => {
      const isActive = section.dataset.adminSection === nextTarget;
      section.hidden = !isActive;
      section.classList.toggle("is-active", isActive);
    });
    navItems.forEach((item) => {
      const isActive = item.dataset.adminNav === nextTarget;
      item.classList.toggle("is-active", isActive);
      item.setAttribute("aria-current", isActive ? "page" : "false");
    });
    if (updateHash) history.replaceState(null, "", `#${nextTarget}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  navItems.forEach((item) => {
    item.addEventListener("click", (event) => {
      event.preventDefault();
      showSection(item.dataset.adminNav);
    });
  });

  window.addEventListener("hashchange", () => {
    showSection(location.hash.replace("#", "") || "summary", false);
  });

  showSection(location.hash.replace("#", "") || "summary", false);
}

function updateAnnouncementPreview(value) {
  const cleanValue = settingValue("announcement", value) || "Chào mừng bạn đến với Việc Làm Nhà Đất";
  if (window.dailyAnnouncementPreview) dailyAnnouncementPreview.textContent = cleanValue;
}

function collectSettingsPayload() {
  return {
    site_name: stSiteName.value,
    site_slogan: stSiteSlogan.value,
    qr_image: stQrImage.value,
    hero_banner: stHeroBanner.value,
    bank_name: stBankName.value,
    bank_account_name: stBankAccountName.value,
    bank_account_number: stBankAccountNumber.value,
    transfer_note_prefix: stTransferNotePrefix.value,
    announcement: stAnnouncement.value,
  };
}

function tableWrap(headers, rows) {
  return `<div class="table-wrap"><table><thead><tr>${headers.map((h) => `<th>${normalizeAdminText(h)}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table></div>`;
}

function formatAdminDateTime(value) {
  if (!value) return "";
  const text = String(value).trim();
  const normalized = text.replace(" ", "T");
  const date = new Date(normalized);

  if (!Number.isNaN(date.getTime())) {
    const parts = new Intl.DateTimeFormat("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }).formatToParts(date);

    const pick = (type) => parts.find((part) => part.type === type)?.value || "";
    return `${pick("hour")}:${pick("minute")}:${pick("second")} ${pick("day")}/${pick("month")}/${pick("year")}`;
  }

  return text;
}

async function loadSummary() {
  try {
    const s = await fetchJSON("/api/admin/summary");
    sumUsers.textContent = s.users;
    sumPosts.textContent = s.posts;
    sumRevenue.textContent = currency(s.revenue);
    sumPending.textContent = s.pendingPayments;
    sumFavorites.textContent = s.favorites;
  } catch (err) {
    showAlert(err.message);
    location.href = "/";
  }
}

async function loadUsers() {
  const rows = await fetchJSON("/api/admin/users");
  userTableWrap.innerHTML = tableWrap(
    ["ID", "Họ tên", "Username", "Email", "Vai trò", "Trạng thái", "Hành động"],
    rows.map(
      (u) => `<tr>
        <td>${u.id}</td>
        <td>${normalizeAdminText(u.full_name || "")}</td>
        <td>${normalizeAdminText(u.username || "")}</td>
        <td>${normalizeAdminText(u.email || "")}</td>
        <td>${normalizeAdminText(u.role || "")}</td>
        <td>${userStatusLabel(u.is_active)}</td>
        <td><button class="btn btn-dark admin-action-btn" onclick="toggleUser(${u.id})">${u.is_active ? "Khóa" : "Mở khóa"}</button></td>
      </tr>`
    )
  );
}

async function toggleUser(id) {
  const data = await fetchJSON(`/api/admin/users/${id}/toggle`, { method: "PUT" });
  showAlert(data.message);
  await loadUsers();
}

async function loadPostsAdmin() {
  const rows = await fetchJSON("/api/admin/posts");
  postTableWrap.innerHTML = tableWrap(
    ["ID", "Tiêu đề", "User", "Danh mục", "Giá", "Views", "Ghim", "Xóa"],
    rows.map(
      (p) => `<tr>
        <td>${p.id}</td>
        <td>${normalizeAdminText(p.title || "")}</td>
        <td>${normalizeAdminText(p.full_name || "")} (@${normalizeAdminText(p.username || "")})</td>
        <td>${normalizeAdminText(p.category || "")}</td>
        <td>${currency(p.price)}</td>
        <td>${p.views}</td>
        <td>${boolLabel(p.is_featured)}</td>
        <td><button class="btn btn-danger admin-action-btn" onclick="deletePostAdmin(${p.id})">Xóa</button></td>
      </tr>`
    )
  );
}

async function deletePostAdmin(id) {
  if (!confirm("Xóa bài đăng này?")) return;
  const data = await fetchJSON(`/api/posts/${id}`, { method: "DELETE" });
  showAlert(data.message);
  await loadPostsAdmin();
  await loadSummary();
}

async function loadSubscriptions() {
  const rows = await fetchJSON("/api/admin/subscriptions");
  subscriptionTableWrap.innerHTML = tableWrap(
    ["ID", "User", "Gói", "Giá", "Thời hạn", "Trạng thái", "Nội dung CK", "Hành động"],
    rows.map(
      (s) => `<tr>
        <td>${s.id}</td>
        <td>${normalizeAdminText(s.full_name || "")} (@${normalizeAdminText(s.username || "")})</td>
        <td>${normalizeAdminText(s.package_name || "")}</td>
        <td>${currency(s.price)}</td>
        <td>${formatAdminDateTime(s.start_date)} → ${formatAdminDateTime(s.end_date)}</td>
        <td>${normalizeAdminText(s.status || "")}</td>
        <td>${normalizeAdminText(s.payment_note || "")}</td>
        <td><div class="admin-action-row"><button class="btn btn-primary admin-action-btn" onclick="approveSub(${s.id})">Duyệt</button><button class="btn btn-danger admin-action-btn" onclick="rejectSub(${s.id})">Từ chối</button></div></td>
      </tr>`
    )
  );
}

async function approveSub(id) {
  const data = await fetchJSON(`/api/admin/subscriptions/${id}/approve`, { method: "PUT" });
  showAlert(data.message);
  await loadSubscriptions();
  await loadSummary();
}

async function rejectSub(id) {
  const data = await fetchJSON(`/api/admin/subscriptions/${id}/reject`, { method: "PUT" });
  showAlert(data.message);
  await loadSubscriptions();
  await loadSummary();
}

async function loadTopups() {
  const rows = await fetchJSON("/api/admin/topups");
  topupTableWrap.innerHTML = tableWrap(
    ["ID", "User", "Số tiền", "Trạng thái", "Nội dung CK", "Hành động"],
    rows.map(
      (t) => `<tr>
        <td>${t.id}</td>
        <td>${normalizeAdminText(t.full_name || "")} (@${normalizeAdminText(t.username || "")})</td>
        <td>${currency(t.amount)}</td>
        <td>${normalizeAdminText(t.status || "")}</td>
        <td>${normalizeAdminText(t.payment_note || "")}</td>
        <td><div class="admin-action-row"><button class="btn btn-primary admin-action-btn" onclick="approveTopup(${t.id})">Duyệt</button><button class="btn btn-danger admin-action-btn" onclick="rejectTopup(${t.id})">Từ chối</button></div></td>
      </tr>`
    )
  );
}

async function approveTopup(id) {
  const data = await fetchJSON(`/api/admin/topups/${id}/approve`, { method: "PUT" });
  showAlert(data.message);
  await loadTopups();
  await loadSummary();
}

async function rejectTopup(id) {
  const data = await fetchJSON(`/api/admin/topups/${id}/reject`, { method: "PUT" });
  showAlert(data.message);
  await loadTopups();
  await loadSummary();
}

async function loadAiOps() {
  const [reports, actions] = await Promise.all([
    fetchJSON("/api/admin/ai/reports"),
    fetchJSON("/api/admin/ai/actions"),
  ]);

  aiOpsSummary.innerHTML = `
    <div class="info-list">
      <div class="info-card"><strong>Báo cáo AI</strong><div>${reports.length}</div></div>
      <div class="info-card"><strong>Hành động AI</strong><div>${actions.length}</div></div>
    </div>`;

  aiReportsWrap.innerHTML = tableWrap(
    ["ID", "Loại", "Tiêu đề", "Nội dung", "Thời gian"],
    reports.map((r) => `<tr><td>${r.id}</td><td>${normalizeAdminText(r.report_type || "")}</td><td>${normalizeAdminText(r.title || "")}</td><td>${normalizeAdminText(r.body || "")}</td><td>${formatAdminDateTime(r.created_at)}</td></tr>`)
  );

  aiActionsWrap.innerHTML = tableWrap(
    ["ID", "Post", "User", "Loại", "Trạng thái", "Ghi chú", "Thời gian"],
    actions.map((a) => `<tr><td>${a.id}</td><td>${a.post_id || ""}</td><td>${a.user_id || ""}</td><td>${normalizeAdminText(a.action_type || "")}</td><td>${normalizeAdminText(a.action_status || "")}</td><td>${normalizeAdminText(a.note || "")}</td><td>${formatAdminDateTime(a.created_at)}</td></tr>`)
  );
}

async function runAiRenewal() {
  const data = await fetchJSON("/api/ai/renewal-reminders", { method: "POST" });
  showAlert(data.message);
  await loadAiOps();
}

async function runAiVip() {
  const data = await fetchJSON("/api/ai/vip-suggestions", { method: "POST" });
  showAlert(data.message);
  await loadAiOps();
}

async function runAiSpam() {
  const data = await fetchJSON("/api/ai/spam-scan", { method: "POST" });
  showAlert(data.message);
  await loadAiOps();
}

async function loadSettings() {
  const st = await fetchJSON("/api/admin/settings");
  stSiteName.value = settingValue("site_name", st.site_name);
  stSiteSlogan.value = settingValue("site_slogan", st.site_slogan);
  stQrImage.value = settingValue("qr_image", st.qr_image);
  stHeroBanner.value = settingValue("hero_banner", st.hero_banner);
  stBankName.value = settingValue("bank_name", st.bank_name);
  stBankAccountName.value = settingValue("bank_account_name", st.bank_account_name);
  stBankAccountNumber.value = settingValue("bank_account_number", st.bank_account_number);
  stTransferNotePrefix.value = settingValue("transfer_note_prefix", st.transfer_note_prefix);
  stAnnouncement.value = settingValue("announcement", st.announcement);
  if (window.dailyAnnouncement) dailyAnnouncement.value = stAnnouncement.value;
  updateAnnouncementPreview(stAnnouncement.value);
}

settingsForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = await fetchJSON("/api/admin/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(collectSettingsPayload()),
  });
  showAlert(data.message || "Đã cập nhật cài đặt.");
  await loadSettings();
});

if (window.dailyAnnouncement) {
  dailyAnnouncement.addEventListener("input", () => {
    stAnnouncement.value = dailyAnnouncement.value;
    updateAnnouncementPreview(dailyAnnouncement.value);
  });
}

if (window.stAnnouncement) {
  stAnnouncement.addEventListener("input", () => updateAnnouncementPreview(stAnnouncement.value));
}

if (window.syncAnnouncementBtn) {
  syncAnnouncementBtn.addEventListener("click", () => {
    if (window.dailyAnnouncement) dailyAnnouncement.value = stAnnouncement.value;
    updateAnnouncementPreview(stAnnouncement.value);
  });
}

if (window.saveAnnouncementBtn) {
  saveAnnouncementBtn.addEventListener("click", async () => {
    stAnnouncement.value = dailyAnnouncement.value;
    const data = await fetchJSON("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(collectSettingsPayload()),
    });
    showAlert(data.message || "Đã cập nhật thông báo.");
    await loadSettings();
  });
}

async function logoutAdmin() {
  await fetchJSON("/api/logout", { method: "POST" });
  location.href = "/";
}

initAdminSectionTabs();
loadSummary();
loadUsers();
loadPostsAdmin();
loadSubscriptions();
loadTopups();
loadAiOps();
loadSettings();
