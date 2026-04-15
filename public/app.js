
function currencyVN(num){
  return Number(num || 0).toLocaleString("vi-VN") + "đ";
}

let selectedPaymentPlan = null;
let monetizePlanRows = [];
let subscriptionPackageRows = [];
let activeAnnouncementTimer = null;
let lastAnnouncementPopupText = "";
let announcementPopupBooted = false;
let currentAnnouncementMessage = "";

function showAnnouncementPopup(message){
  const popup = document.getElementById("announcementPopup");
  const popupText = document.getElementById("announcementPopupText");
  const normalized = normalizeKnownVietnamese("announcement", String(message || "").trim());

  if (!popup || !popupText || !normalized) return;
  if (lastAnnouncementPopupText === normalized && popup.dataset.visible === "true") return;

  lastAnnouncementPopupText = normalized;
  popupText.textContent = normalized;
  popup.classList.remove("hidden");
  popup.dataset.visible = "true";
  popup.style.display = "flex";
  popup.style.opacity = "1";
  popup.style.visibility = "visible";

  if (activeAnnouncementTimer) {
    clearTimeout(activeAnnouncementTimer);
  }

  activeAnnouncementTimer = setTimeout(() => {
    closeAnnouncementPopup();
  }, 7000);
}

function closeAnnouncementPopup(){
  const popup = document.getElementById("announcementPopup");
  if (!popup) return;
  popup.dataset.visible = "false";
  popup.style.opacity = "0";
  popup.style.visibility = "hidden";
  popup.classList.add("hidden");
  popup.style.display = "none";
  if (activeAnnouncementTimer) {
    clearTimeout(activeAnnouncementTimer);
    activeAnnouncementTimer = null;
  }
}

function bootAnnouncementPopup(){
  if (announcementPopupBooted) return;
  const message = String(currentAnnouncementMessage || "").trim();
  if (!message) return;
  announcementPopupBooted = true;
  setTimeout(() => showAnnouncementPopup(message), 0);
}

async function loadSettingsAndPayment(){
  try{
    const fetchedSettings = await fetchJSON("/api/settings/public");
    const settings = {
      ...fetchedSettings,
      site_name: normalizeKnownVietnamese("site_name", fetchedSettings.site_name || FRONTEND_TEXT_FALLBACKS.site_name),
      site_slogan: normalizeKnownVietnamese("site_slogan", fetchedSettings.site_slogan || FRONTEND_TEXT_FALLBACKS.site_slogan),
      announcement: normalizeKnownVietnamese("announcement", fetchedSettings.announcement || FRONTEND_TEXT_FALLBACKS.announcement)
    };
    monetizePlanRows = await fetchJSON("/api/pricing-plans").catch(() => []);
    subscriptionPackageRows = await fetchJSON("/api/packages").catch(() => []);
    const siteNameNode = document.getElementById("siteName");
    const siteSloganNode = document.getElementById("siteSlogan");
    const announcementNode = document.getElementById("announcementText");
    const announcementBar = document.getElementById("homeAnnouncementBar");
    const announcementBarText = document.getElementById("homeAnnouncementText");
    const qr = document.getElementById("paymentQr");

    if (siteNameNode && settings.site_name) {
      siteNameNode.textContent = settings.site_name;
      document.title = settings.site_name;
    }
    if (siteSloganNode && settings.site_slogan) {
      siteSloganNode.textContent = settings.site_slogan;
    }
    if (announcementNode && settings.announcement) {
      announcementNode.textContent = settings.announcement;
    }
    if (announcementBar && announcementBarText) {
      if (settings.announcement && String(settings.announcement).trim()) {
        currentAnnouncementMessage = settings.announcement;
        announcementBar.classList.remove("hidden");
        announcementBarText.textContent = settings.announcement;
        const popupTextNode = document.getElementById("announcementPopupText");
        if (popupTextNode) popupTextNode.textContent = settings.announcement;
        showAnnouncementPopup(settings.announcement);
      } else {
        currentAnnouncementMessage = "";
        announcementBar.classList.add("hidden");
      }
    }

    if (settings.hero_banner) {
      const heroSlides = document.querySelectorAll(".hero-slide");
      heroSlides.forEach((slide, index) => {
        if (index > 0) return;
        slide.style.backgroundImage = `linear-gradient(135deg, rgba(15,23,42,.50), rgba(29,78,216,.38)), url('${settings.hero_banner}')`;
      });
    }

    if (qr) {
      qr.src = settings.qr_image || "/assets/qr-acb.png";
      qr.onerror = () => { qr.src = "/assets/qr-acb.png"; };
    }
    const first = document.querySelector(".plan-card.active") || document.querySelector(".plan-card");
    if (first) first.click();
  }catch(err){
    console.error(err);
  }
}


function slugNoSpace(txt){
  return String(txt || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}


function inferPaymentPlanMeta(code, price, days){
  const normalized = String(code || "").toUpperCase();
  const packageMatcherMap = {
    NHADAT_THUONG: "Nhà đất - Tin thường",
    NHADAT_DAYTIN: "Nhà đất - Đẩy tin",
    NHADAT_NOIBAT: "Nhà đất - Tin nổi bật",
    NHADAT_VIP7: "Nhà đất - VIP 7 ngày",
    NHADAT_VIP15: "Nhà đất - VIP 15 ngày",
    NHADAT_VIP30: "Nhà đất - VIP 30 ngày",
    THUE_THUONG: "Nhà thuê - Tin thường",
    THUE_DAYTIN: "Nhà thuê - Đẩy tin",
    THUE_NOIBAT: "Nhà thuê - Tin nổi bật",
    THUE_VIP7: "Nhà thuê - VIP 7 ngày",
    JOB_THUONG: "Việc làm - Tin thường",
    JOB_NOIBAT: "Việc làm - Tin nổi bật",
    JOB_VIP: "Việc làm - VIP",
    JOB_DAYTIN: "Việc làm - Đẩy tin"
  };
  const planMatcherMap = {
    NHADAT_THUONG: { category: "vip", featureType: "normal", duration: 7, price: 0 },
    NHADAT_DAYTIN: { category: "vip", featureType: "push", duration: 1, price: 10000 },
    NHADAT_NOIBAT: { category: "vip", featureType: "featured", duration: 7, price: 20000 },
    JOB_THUONG: { category: "viec_lam", featureType: "normal", duration: 7, price: 0 },
    JOB_NOIBAT: { category: "viec_lam", featureType: "featured", duration: 7, price: 10000 },
    JOB_VIP: { category: "viec_lam", featureType: "vip", duration: 7, price: 20000 },
    JOB_DAYTIN: { category: "viec_lam", featureType: "push", duration: 1, price: 5000 },
    THUE_THUONG: { category: "nha_thue", featureType: "normal", duration: 7, price: 0 },
    THUE_DAYTIN: { category: "nha_thue", featureType: "push", duration: 1, price: 5000 },
    THUE_NOIBAT: { category: "nha_thue", featureType: "featured", duration: 7, price: 15000 },
    THUE_VIP7: { category: "nha_thue", featureType: "vip", duration: 7, price: 25000 },
    NHADAT_VIP7: { category: "vip", featureType: "vip", duration: 7, price: 30000 },
    NHADAT_VIP15: { category: "vip", featureType: "vip", duration: 15, price: 50000 },
    NHADAT_VIP30: { category: "vip", featureType: "vip", duration: 30, price: 80000 }
  };

  const matchedRule = planMatcherMap[normalized] || null;
  const matchedPackage = subscriptionPackageRows.find((pkg) =>
    pkg.name === packageMatcherMap[normalized] &&
    Number(pkg.price || 0) === Number(price || 0) &&
    Number(pkg.duration_days || 0) === Number(days || 0)
  );
  const category = matchedRule ? matchedRule.category : "";
  const featureType = matchedRule ? matchedRule.featureType : "normal";
  const matchedPlan = matchedRule ? monetizePlanRows.find((plan) => {
    if (plan.category !== matchedRule.category || plan.feature_type !== matchedRule.featureType) return false;
    if (Number(plan.duration_days || 0) !== Number(matchedRule.duration || days || 0)) return false;
    return Number(plan.price || 0) === Number(matchedRule.price);
  }) : null;

  return {
    code,
    price: Number(price || 0),
    days: Number(days || 0),
    category,
    featureType,
    pricingPlanId: matchedPlan ? matchedPlan.id : null,
    packageId: matchedPackage ? matchedPackage.id : null
  };
}

function renderPaymentActions(){
  if (!selectedPaymentPlan) return "";
  const isFree = Number(selectedPaymentPlan.price || 0) <= 0;
  return `
    <div class="payment-actions-row">
      <button class="btn btn-primary" type="button" onclick="buySelectedPlanWithWallet()" ${selectedPaymentPlan.pricingPlanId ? "" : "disabled"}>${isFree ? "Kích hoạt gói" : "Mua bằng số dư ví"}</button>
      <button class="btn btn-light" type="button" onclick="paySelectedPlanByQr()" ${isFree ? "disabled" : ""}>Thanh toán qua QR</button>
    </div>
    <div class="payment-inline-note">${isFree ? "Gói miễn phí không cần chuyển khoản. Chỉ cần chọn đúng gói để bắt đầu dùng." : "Khách có thể thanh toán đúng số tiền qua QR hoặc nạp tiền vào ví rồi mua gói bằng số dư."}</div>
  `;
}

function selectPlan(code, name, price, days, el){
  document.querySelectorAll(".plan-card").forEach(card => card.classList.remove("active"));
  if (el) el.classList.add("active");
  selectedPaymentPlan = { name, ...inferPaymentPlanMeta(code, price, days) };

  const qr = document.getElementById("paymentQr");
  const info = document.getElementById("paymentInfo");
  if (qr) {
    qr.src = "/assets/qr-acb.png";
    qr.onerror = () => { qr.src = "/assets/qr-acb.png"; };
  }

  if (info) {
    info.innerHTML = `
      <div><strong>Gói:</strong> ${name}</div>
      <div><strong>Số tiền:</strong> ${currencyVN(price)}</div>
      <div><strong>Thời gian:</strong> ${days} ngày</div>
      <div><strong>Ngân hàng:</strong> ACB</div>
      <div><strong>Chủ TK:</strong> NGUYEN TUAN ANH</div>
      <div><strong>STK:</strong> 214904949</div>
      <div><strong>Nội dung CK:</strong> RAOVAT_${code}</div>
      <div class="payment-tip">Chuyển khoản đúng nội dung để đối chiếu và kích hoạt gói nhanh hơn.</div>
      ${renderPaymentActions()}
    `;
  }
  showToast("Đã chọn gói " + name);
}



async function buySelectedPlanWithWallet(){
  if (!selectedPaymentPlan) return showToast("Hãy chọn gói trước.");
  if (!selectedPaymentPlan.pricingPlanId) {
    return showToast("Gói này hiện chưa hỗ trợ mua tự động bằng ví. Bạn có thể thanh toán qua QR.");
  }
  await buyMonetizePlan(selectedPaymentPlan.pricingPlanId);
}

async function paySelectedPlanByQr(){
  if (!selectedPaymentPlan) return showToast("Hãy chọn gói trước.");
  if (Number(selectedPaymentPlan.price || 0) <= 0) {
    return showToast("Gói này miễn phí, không cần thanh toán qua QR.");
  }
  await createTopup(selectedPaymentPlan.price);
}

function showToast(msg, type="success"){
  const div = document.createElement("div");
  div.className = "toast " + type;
  div.textContent = normalizeFrontendMessage(msg);
  document.body.appendChild(div);
  setTimeout(()=>div.classList.add("show"),50);
  setTimeout(()=>{
    div.classList.remove("show");
    setTimeout(()=>div.remove(),300);
  },2500);
}

function maybeFixVietnameseMojibake(value){
  if (typeof value !== "string") return value;
  if (!/[ÃÂÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßá»��?]/.test(value)) return value;
  const directReplace = (input) => input
    .replace(/Ä‘/g, "đ")
    .replace(/Ä/g, "Đ")
    .replace(/Ã /g, "à")
    .replace(/Ã¡/g, "á")
    .replace(/áº¡/g, "ạ")
    .replace(/áº£/g, "ả")
    .replace(/Ã£/g, "ã")
    .replace(/Ã¢/g, "â")
    .replace(/áº§/g, "ầ")
    .replace(/áº¥/g, "ấ")
    .replace(/áº­/g, "ậ")
    .replace(/áº©/g, "ẩ")
    .replace(/áº«/g, "ẫ")
    .replace(/Äƒ/g, "ă")
    .replace(/áº±/g, "ằ")
    .replace(/áº¯/g, "ắ")
    .replace(/áº·/g, "ặ")
    .replace(/áº³/g, "ẳ")
    .replace(/áºµ/g, "ẵ")
    .replace(/Ã¨/g, "è")
    .replace(/Ã©/g, "é")
    .replace(/áº¹/g, "ẹ")
    .replace(/áº»/g, "ẻ")
    .replace(/áº½/g, "ẽ")
    .replace(/Ãª/g, "ê")
    .replace(/á»�/g, "ề")
    .replace(/áº¿/g, "ế")
    .replace(/á»‡/g, "ệ")
    .replace(/á»ƒ/g, "ể")
    .replace(/á»…/g, "ễ")
    .replace(/Ã¬/g, "ì")
    .replace(/Ã­/g, "í")
    .replace(/á»‹/g, "ị")
    .replace(/á»‰/g, "ỉ")
    .replace(/Ä©/g, "ĩ")
    .replace(/Ã²/g, "ò")
    .replace(/Ã³/g, "ó")
    .replace(/á»�/g, "ọ")
    .replace(/á»�/g, "ỏ")
    .replace(/Ãµ/g, "õ")
    .replace(/Ã´/g, "ô")
    .replace(/á»“/g, "ồ")
    .replace(/á»‘/g, "ố")
    .replace(/á»™/g, "ộ")
    .replace(/á»•/g, "ổ")
    .replace(/á»—/g, "ỗ")
    .replace(/Æ¡/g, "ơ")
    .replace(/á»�/g, "ờ")
    .replace(/á»›/g, "ớ")
    .replace(/á»£/g, "ợ")
    .replace(/á»Ÿ/g, "ở")
    .replace(/á»¡/g, "ỡ")
    .replace(/Ã¹/g, "ù")
    .replace(/Ãº/g, "ú")
    .replace(/á»¥/g, "ụ")
    .replace(/á»§/g, "ủ")
    .replace(/Å©/g, "ũ")
    .replace(/Æ°/g, "ư")
    .replace(/á»«/g, "ừ")
    .replace(/á»©/g, "ứ")
    .replace(/á»±/g, "ự")
    .replace(/á»­/g, "ử")
    .replace(/á»¯/g, "ữ")
    .replace(/á»³/g, "ỳ")
    .replace(/Ã½/g, "ý")
    .replace(/á»µ/g, "ỵ")
    .replace(/á»·/g, "ỷ")
    .replace(/á»¹/g, "ỹ")
    .replace(/Ã€/g, "À")
    .replace(/Ã�/g, "Á")
    .replace(/áº /g, "Ạ")
    .replace(/áº¢/g, "Ả")
    .replace(/Ãƒ/g, "Ã")
    .replace(/Ã‚/g, "Â")
    .replace(/Ä‚/g, "Ă")
    .replace(/Ãˆ/g, "È")
    .replace(/Ã‰/g, "É")
    .replace(/ÃŠ/g, "Ê")
    .replace(/ÃŒ/g, "Ì")
    .replace(/Ã�/g, "Í")
    .replace(/Ã’/g, "Ò")
    .replace(/Ã“/g, "Ó")
    .replace(/Ã”/g, "Ô")
    .replace(/Æ /g, "Ơ")
    .replace(/Ã™/g, "Ù")
    .replace(/Ãš/g, "Ú")
    .replace(/Æ¯/g, "Ư")
    .replace(/á»²/g, "Ỳ")
    .replace(/Ã�/g, "Ý")
    .replace(/Â·/g, "·")
    .replace(/mÂ²/g, "m²")
    .replace(/Â°/g, "°")
    .replace(/Â /g, " ")
    .replace(/â€¦/g, "…")
    .replace(/â€“/g, "–")
    .replace(/â€”/g, "—")
    .replace(/â€¢/g, "•")
    .replace(/â€˜/g, "'")
    .replace(/â€™/g, "'")
    .replace(/â€œ/g, '"')
    .replace(/â€�/g, '"')
    .replace(/â€/g, '"')
    .replace(/�/g, "đ");

  const candidates = [directReplace(value)];

  try {
    candidates.push(directReplace(decodeURIComponent(escape(value))));
  } catch {}

  try {
    const bytes = Uint8Array.from(Array.from(value).map((char) => char.charCodeAt(0) & 255));
    candidates.push(directReplace(new TextDecoder("utf-8").decode(bytes)));
  } catch {}

  return candidates.reduce((best, current) => {
    const score = (text) => (text.match(/[�?ÃÂÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞß]/g) || []).length;
    return score(current) < score(best) ? current : best;
  }, candidates[0]);
}

const FRONTEND_TEXT_FALLBACKS = {
  site_name: "Việc Làm Nhà Đất",
  site_slogan: "Nền tảng đăng tin bất động sản tập trung nhu cầu thật tại Gò Vấp, Quận 12 và TP.HCM.",
  announcement: "Chào mừng bạn đến với Việc Làm Nhà Đất",
  bio: "Tài khoản quản trị demo."
};

const FRONTEND_MESSAGE_FALLBACKS = [
  [/^Äăng nhập thành công\.?$/i, "Đăng nhập thành công."],
  [/^Äăng ký thành công\.?$/i, "Đăng ký thành công."],
  [/^Äã cập nhật cài đặt\.?$/i, "Đã cập nhật cài đặt."],
  [/Chào mừng bạn .*NhaDatGoVapQ12\.vn/i, "Chào mừng bạn đến với Việc Làm Nhà Đất"],
  [/Chào mừng bạn .*Việc Làm Nhà Đất/i, "Chào mừng bạn đến với Việc Làm Nhà Đất"]
];

function hasBrokenVietnamese(value){
  return typeof value === "string" && /[ÃÂÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßá»�]/.test(value);
}

function normalizeKnownVietnamese(key, value){
  const text = typeof value === "string" ? maybeFixVietnameseMojibake(value).trim() : value;
  if (typeof text !== "string") return text;

  if (key === "site_name" && (hasBrokenVietnamese(text) || /N\?ha?Dat/i.test(text) || /Vi.?c L.?m Nh. .*t/i.test(text))) {
    return FRONTEND_TEXT_FALLBACKS.site_name;
  }
  if (key === "site_slogan" && (hasBrokenVietnamese(text) || /N\?n t\?ng|b\?t \?ng s\?n|G\? V\?p/i.test(text) || /N.n t.ng .*TP\.HCM/i.test(text))) {
    return FRONTEND_TEXT_FALLBACKS.site_slogan;
  }
  if (key === "announcement" && (hasBrokenVietnamese(text) || /Ch\?o m\?ng/i.test(text) || /Ch.o m.ng b.n .*Vi.c L.m Nh. .*t/i.test(text))) {
    return FRONTEND_TEXT_FALLBACKS.announcement;
  }
  if (key === "bio" && (hasBrokenVietnamese(text) || /T\?i kho\?n/i.test(text))) {
    return FRONTEND_TEXT_FALLBACKS.bio;
  }
  return text;
}

function normalizeFrontendMessage(value){
  const text = typeof value === "string" ? maybeFixVietnameseMojibake(value).trim() : value;
  if (typeof text !== "string") return text;
  for (const [pattern, replacement] of FRONTEND_MESSAGE_FALLBACKS) {
    if (pattern.test(text)) return replacement;
  }
  return text;
}

function sanitizeUserProfile(user = {}){
  return {
    ...user,
    full_name: normalizeKnownVietnamese("full_name", user.full_name || ""),
    username: normalizeKnownVietnamese("username", user.username || ""),
    email: normalizeKnownVietnamese("email", user.email || ""),
    phone: normalizeKnownVietnamese("phone", user.phone || ""),
    address: normalizeKnownVietnamese("address", user.address || ""),
    bio: normalizeKnownVietnamese("bio", user.bio || ""),
    avatar: normalizeKnownVietnamese("avatar", user.avatar || "")
  };
}

function setPanelHeadingByChildId(childId, tinyTitle, heading){
  const child = document.getElementById(childId);
  const panel = child ? child.closest(".panel") : null;
  if (!panel) return;
  const tiny = panel.querySelector(".tiny-title");
  const h2 = panel.querySelector("h2");
  if (tiny && tinyTitle) tiny.textContent = tinyTitle;
  if (h2 && heading) h2.textContent = heading;
}

function normalizeVietnamesePayload(input){
  if (Array.isArray(input)) return input.map(normalizeVietnamesePayload);
  if (!input || typeof input !== "object") return maybeFixVietnameseMojibake(input);
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [key, normalizeVietnamesePayload(value)])
  );
}

function repairMojibakeInDom(root = document){
  const attrNames = ["placeholder", "title", "aria-label", "alt", "value"];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes = [];

  while (walker.nextNode()) {
    textNodes.push(walker.currentNode);
  }

  textNodes.forEach((node) => {
    if (!node.nodeValue || !node.nodeValue.trim()) return;
    const fixed = maybeFixVietnameseMojibake(node.nodeValue);
    if (fixed !== node.nodeValue) node.nodeValue = fixed;
  });

  if (!(root instanceof Element) && root !== document) return;
  const scope = root === document ? document.body : root;
  if (!scope) return;

  scope.querySelectorAll("*").forEach((el) => {
    attrNames.forEach((name) => {
      const raw = el.getAttribute(name);
      if (!raw) return;
      const fixed = maybeFixVietnameseMojibake(raw);
      if (fixed !== raw) el.setAttribute(name, fixed);
    });
  });
}

function initVietnameseTextRepair(){
  repairMojibakeInDom(document);
  forceVietnameseUiLabels(document);

  const observedRoot = document.body;
  if (!observedRoot) return;

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const fixed = maybeFixVietnameseMojibake(node.nodeValue || "");
          if (fixed !== node.nodeValue) node.nodeValue = fixed;
          return;
        }
        if (node.nodeType === Node.ELEMENT_NODE) {
          repairMojibakeInDom(node);
          forceVietnameseUiLabels(node);
        }
      });
    });
  });

  observer.observe(observedRoot, { childList: true, subtree: true });
}

function forceVietnameseUiLabels(root = document){
  const scope = root === document ? document : root;
  const setText = (selector, value) => {
    scope.querySelectorAll(selector).forEach((node) => {
      node.textContent = value;
    });
  };
  const setPlaceholder = (selector, value) => {
    scope.querySelectorAll(selector).forEach((node) => {
      node.setAttribute("placeholder", value);
    });
  };

  setText(".top-strip-inner span:nth-child(2)", "Chuyên đăng tin nhà đất TP.HCM");
  setText(".top-strip-inner span:nth-child(3)", "Trọng điểm: Gò Vấp, Quận 12, TP.HCM");
  setPlaceholder("#searchKeyword", "Tìm nhà bán, đất nền, căn hộ, mặt bằng, cho thuê...");
  setText("#guestActions .btn.btn-light", "Đăng nhập");
  setText("#guestActions .btn.btn-primary", "Đăng ký");

  const navText = ["Nhà bán", "Đất nền", "Cho thuê", "Mặt bằng", "Việc làm", "Khu vực", "Gói đăng tin", "Tư vấn BĐS"];
  scope.querySelectorAll(".main-nav a").forEach((node, index) => {
    if (navText[index]) node.textContent = navText[index];
  });

  const heroSlides = scope.querySelectorAll(".hero-slide");
  const heroCopy = [
    {
      badge: "Nền tảng đăng tin bất động sản cao cấp",
      title: "Đăng tin rõ ràng hơn. Hiển thị chuyên nghiệp hơn. Chốt khách nhanh hơn.",
      desc: "Dành cho môi giới, đội nhóm bán hàng, chủ tin và đơn vị cho thuê muốn có một website nhà đất vừa đẹp, vừa hiệu quả trong việc tạo lead thật.",
      cta1: "Đăng tin ngay",
      cta2: "Xem gói nổi bật"
    },
    {
      badge: "Gò Vấp - Quận 12 - TP.HCM",
      title: "Tập trung đúng khu vực trọng điểm để người mua và người thuê ra quyết định nhanh hơn.",
      desc: "Từ bộ lọc, card tin đến CTA đều được sắp xếp lại để khách hàng quét giá, diện tích, vị trí và hành động liên hệ chỉ trong vài giây.",
      cta1: "Xem tin Gò Vấp",
      cta2: "Xem tin Quận 12"
    },
    {
      badge: "Gói đăng tin tối ưu hiển thị",
      title: "Free để phủ rộng. Boost để đẩy nhanh. VIP và PRO để tăng lượt hỏi thật.",
      desc: "Hệ gói đăng tin được trình bày rõ ràng để môi giới và chủ tin chọn đúng mục tiêu hiển thị theo thời gian, mức độ ưu tiên và ngân sách.",
      cta1: "Khám phá bảng giá",
      cta2: "Tạo tin mới"
    }
  ];
  heroSlides.forEach((slide, index) => {
    const copy = heroCopy[index];
    if (!copy) return;
    const badge = slide.querySelector(".hero-badge");
    const title = slide.querySelector("h1");
    const desc = slide.querySelector("p");
    const buttons = slide.querySelectorAll(".hero-cta-row button");
    if (badge) badge.textContent = copy.badge;
    if (title) title.textContent = copy.title;
    if (desc) desc.textContent = copy.desc;
    if (buttons[0]) buttons[0].textContent = copy.cta1;
    if (buttons[1]) buttons[1].textContent = copy.cta2;
  });

  setText(".hero-left .mini-badge", "Chuyên bất động sản TP.HCM");
  setText(".hero-left h1", "Website nhà đất được thiết kế lại để phục vụ đúng hành vi tìm kiếm và giao dịch.");
  setText(".hero-left p", "Tập trung vào trải nghiệm xem tin, lọc khu vực, hiển thị gói đăng tin và tăng hành động gọi, chat, xem chi tiết cho người mua, người thuê và môi giới.");
  const heroPoints = ["Đăng tin dễ thao tác", "Lọc khu vực rõ ràng", "Card tin sạch và sâu", "CTA gọi và chat rõ hơn", "Tối ưu lead nhà đất"];
  scope.querySelectorAll(".hero-points span").forEach((node, index) => {
    if (heroPoints[index]) node.textContent = heroPoints[index];
  });
  setText(".hero-cta .btn.btn-primary", "Xem gói đăng tin");
  setText(".hero-cta .btn.btn-light", "Bắt đầu đăng tin");
  setText(".summary-card .tiny-title", "Nền tảng chuyên biệt");
  setText(".summary-card h3", "Thiết kế riêng cho môi giới, chủ tin và đội bán hàng bất động sản.");
  setText(".summary-card p", "Không phải web rao vặt cũ. Đây là một giao diện tập trung vào độ tin cậy, tốc độ ra quyết định và khả năng chuyển đổi từ lượt xem thành khách hỏi thật.");
  setText(".market-card .tiny-title", "Thị trường trọng điểm");
  setText(".market-card h3", "Gò Vấp, Quận 12 và nhóm khách hàng có nhu cầu giao dịch thật.");
  setText(".market-card p", "Tối ưu cho nhà bán, đất nền, cho thuê, mặt bằng và các tin cần hiển thị nổi bật để tăng cơ hội chốt nhanh.");

  const heroMiniStats = [
    "<strong>Gò Vấp</strong><span>Nhà ở thực</span>",
    "<strong>Quận 12</strong><span>Đất và mặt bằng</span>",
    "<strong>TP.HCM</strong><span>Mở rộng nguồn khách</span>"
  ];
  scope.querySelectorAll(".hero-mini-stats div").forEach((node, index) => {
    if (heroMiniStats[index]) node.innerHTML = heroMiniStats[index];
  });

  const statHtml = [
    "<strong>Nhà bán Gò Vấp</strong><span>Tập trung khu vực có nhu cầu ở thực và khả năng chốt giao dịch nhanh.</span>",
    "<strong>Đất nền Quận 12</strong><span>Ưu tiên khu tăng trưởng, mặt bằng rõ và dễ so sánh giữa các tin.</span>",
    "<strong>Cho thuê TP.HCM</strong><span>Tối ưu cho căn hộ mini, nhà nguyên căn và mặt bằng kinh doanh.</span>",
    "<strong>Gói đăng tin nổi bật</strong><span>Phân tầng free, boost, VIP và PRO để tăng khả năng hiển thị đúng mục tiêu.</span>"
  ];
  scope.querySelectorAll(".quick-stats .stat-box").forEach((node, index) => {
    if (statHtml[index]) node.innerHTML = statHtml[index];
  });

  setText(".showcase-panel .tiny-title", "Tin nổi bật ngoài trang chủ");
  setText(".showcase-panel h2", "Tin demo và tin nổi bật được hiển thị ngay khi khách vừa vào website");
  setText(".showcase-panel .soft-badge", "Ưu tiên các tin đã duyệt và có sức hút cao");

  setText("#marketSection .tiny-title", "Khu vực hot");
  setText("#marketSection .section-intro p", "Chọn nhanh quận, phường hoặc điểm nóng quen thuộc để lọc tin theo khu vực có nhu cầu thật.");
  const marketPills = ["Tất cả", "Nhà bán", "Đất nền", "Cho thuê", "Mặt bằng"];
  scope.querySelectorAll("#marketSection .filter-pill").forEach((node, index) => {
    if (marketPills[index]) node.textContent = marketPills[index];
  });
  const locationButtons = ["Gò Vấp", "Quận 12"];
  scope.querySelectorAll("#marketSection .quick-locations button").forEach((node, index) => {
    if (locationButtons[index]) {
      node.textContent = locationButtons[index];
      node.classList.remove("hidden");
    } else {
      node.classList.add("hidden");
    }
  });

  setText(".sidebar .panel:nth-of-type(1) .tiny-title", "Tài khoản");
  setText(".sidebar .panel:nth-of-type(1) h3", "Hồ sơ người dùng");
  setText(".sidebar .panel:nth-of-type(2) .tiny-title", "Bộ lọc");
  setText(".sidebar .panel:nth-of-type(2) h3", "Lọc bất động sản");
  setText(".sidebar .panel:nth-of-type(3) .tiny-title", "Yêu thích");
  setText(".sidebar .panel:nth-of-type(3) h3", "Tin đã lưu");
  setPanelHeadingByChildId("walletHistory", "Ví doanh thu", "Nạp tiền và giao dịch ví");
  setPanelHeadingByChildId("myPostList", "Quản lý cá nhân", "Tin của tôi");
  setPanelHeadingByChildId("mySubscriptionList", "Lịch sử gói", "Gói đăng ký của tôi");
  setPanelHeadingByChildId("conversationList", "Tin nhắn", "Chat người mua / người bán");

  setPlaceholder("#filterKeyword", "Nhập từ khóa...");
  setPlaceholder("#filterMinPrice", "Giá từ");
  setPlaceholder("#filterMaxPrice", "Giá đến");
  setPlaceholder("#filterMinArea", "Diện tích từ");
  setPlaceholder("#filterMaxArea", "Diện tích đến");
  setText(".preset-price-row .btn:nth-child(1)", "Tất cả giá");
  setText(".preset-price-row .btn:nth-child(2)", "Dưới 3 tỷ");
  setText(".preset-price-row .btn:nth-child(3)", "3 - 5 tỷ");
  setText(".preset-price-row .btn:nth-child(4)", "5 - 8 tỷ");
  setText(".preset-price-row .btn:nth-child(5)", "Trên 8 tỷ");
  setText("#filterLocation option[value='']", "Tất cả khu vực");
  setText("#filterBedrooms option[value='']", "Số phòng ngủ");
  setText("#filterDirection option[value='']", "Hướng nhà");
  setText("#filterLegal option[value='']", "Pháp lý");

  const directionOptions = ["Chọn hướng", "Đông", "Tây", "Nam", "Bắc", "Đông Nam", "Đông Bắc", "Tây Nam", "Tây Bắc"];
  scope.querySelectorAll("#postDirection option").forEach((node, index) => {
    if (directionOptions[index]) node.textContent = directionOptions[index];
  });

  const postLocationOptions = [
    "Chọn khu vực",
    "Gò Vấp",
    "Quận 12"
  ];
  scope.querySelectorAll("#postLocation option").forEach((node, index) => {
    if (postLocationOptions[index]) node.textContent = postLocationOptions[index];
  });

  setText(".content .section-header-block .tiny-title", "Tin bất động sản");
  setText(".content .section-header-block h2", "Tin đăng mới nhất khu vực TP.HCM");
  setText(".content .section-header-block .soft-badge", "Ưu tiên hiển thị tin nổi bật");

  setText("#packagesSection .tiny-title", "Bảng giá đăng tin");
  setText("#packagesSection h2", "Gói hiển thị dành cho môi giới, chủ tin và đội bán hàng nhà đất");
  setText("#packagesSection .section-header .soft-badge", "Rõ giá · rõ thời gian · rõ mức ưu tiên");
  setText("#paymentPanel .tiny-title", "Thanh toán gói");
  setText("#paymentPanel h3", "Chọn nhanh gói đăng tin phù hợp");
  setText(".payment-note", "ACB · NGUYEN TUAN ANH · 214904949");
  setText("#paymentInfo .payment-tip", "Chuyển khoản đúng nội dung để đối chiếu và kích hoạt gói nhanh hơn.");

  const pricingTitles = ["Nhà đất", "Nhà thuê", "Việc làm"];
  scope.querySelectorAll(".pricing-group .pricing-title").forEach((node, index) => {
    if (pricingTitles[index]) node.textContent = pricingTitles[index];
  });
  setText(".plan-buy-inline", "Mua gói");
  const planTitles = {
    FREE: "Tin thường",
    BOOST: "Đẩy tin",
    HOT: "Tin nổi bật",
    VIP: "VIP 7 ngày",
    "VIP+": "VIP 15 ngày",
    PRO: "PRO 30 ngày"
  };
  const planDescriptions = {
    "Nhà đất_FREE": "Hiển thị 7 ngày",
    "Nhà đất_BOOST": "Đẩy đầu trang 1 lần",
    "Nhà đất_HOT": "Nổi bật 7 ngày",
    "Nhà đất_VIP": "Ưu tiên hiển thị",
    "Nhà đất_VIP+": "Hiển thị lâu hơn",
    "Nhà đất_PRO": "Tối đa ưu tiên",
    "Nhà thuê_FREE": "Hiển thị 7 ngày",
    "Nhà thuê_BOOST": "Đẩy nhanh hiển thị",
    "Nhà thuê_HOT": "Nổi bật 7 ngày",
    "Nhà thuê_VIP": "Tăng độ ưu tiên",
    "Việc làm_FREE": "Hiển thị 7 ngày",
    "Việc làm_HOT": "Nổi bật 7 ngày",
    "Việc làm_VIP": "Ưu tiên hiển thị",
    "Việc làm_BOOST": "Đẩy nhanh hiển thị"
  };
  scope.querySelectorAll(".pricing-group").forEach((group) => {
    const groupName = group.querySelector(".pricing-title")?.textContent?.trim() || "";
    group.querySelectorAll(".plan-card").forEach((card) => {
      const badge = card.querySelector(".plan-badge")?.textContent?.trim() || "";
      const strong = card.querySelector("strong");
      const desc = card.querySelector("p");
      if (strong && planTitles[badge]) strong.textContent = planTitles[badge];
      if (desc) {
        const key = `${groupName}_${badge}`;
        if (planDescriptions[key]) desc.textContent = planDescriptions[key];
      }
    });
  });

  setText("#walletSection .tiny-title", "Ví doanh thu");
  setText("#walletSection h2", "Nạp tiền và giao dịch ví");
  setText("#postSection .tiny-title", "Đăng bài");
  setText("#postSection h2", "Tạo hoặc cập nhật tin bất động sản");
  setText("#postSection .soft-badge", "Có upload ảnh từ máy");

  const postLabels = ["Tiêu đề", "Loại hình", "Giá / mức lương", "Diện tích (m²)", "Số phòng ngủ / kinh nghiệm", "Hướng nhà", "Pháp lý", "Khu vực", "Mô tả", "Link ảnh hoặc ảnh đã upload", "Hoặc chọn ảnh từ máy", "Ghim tin nổi bật"];
  scope.querySelectorAll("#postForm label").forEach((node, index) => {
    if (postLabels[index]) node.textContent = postLabels[index];
  });
  setPlaceholder("#postBedrooms", "Ví dụ: 3");
  setPlaceholder("#postDescription", "Mô tả vị trí, diện tích, ưu điểm, pháp lý, nội thất hoặc nhu cầu tuyển dụng...");
  setText(".ai-trigger-copy strong", "AI hỗ trợ viết tin");
  setText(".ai-trigger-copy p", "Tạo mô tả chuyên nghiệp");
  setText(".ai-support-panel .ai-tip-title", "Gợi ý nhanh");
  setText(".ai-support-panel .ai-tip-copy", "AI sẽ gợi ý cách viết nội dung rõ hơn cho nhà bán, cho thuê, mặt bằng và các tin việc làm.");
  setText(".form-actions .btn.btn-primary", "Đăng tin ngay");
  setText(".form-actions .btn.btn-light", "Làm mới");
  setText(".btn.btn-light[onclick='uploadPostImage()']", "Upload ảnh");

  setText("#contactSection .tiny-title", "Liên hệ tư vấn mua bán");
  setText("#contactSection .contact-copy h2", "Tư vấn mua đất, chọn nhà rõ ràng hơn để xuống tiền đúng khu vực và đúng nhu cầu.");
  setText("#contactSection .contact-copy p", "Để lại thông tin nếu bạn muốn được tư vấn chọn khu vực phù hợp, so sánh giá, kiểm tra pháp lý và định hướng mua ở hoặc đầu tư an toàn hơn.");
  const contactPoints = [
    "Tư vấn mua đất theo khu vực",
    "Hỗ trợ chọn nhà theo ngân sách",
    "Lọc pháp lý và so sánh giá"
  ];
  scope.querySelectorAll("#contactSection .contact-points span").forEach((node, index) => {
    if (contactPoints[index]) node.textContent = contactPoints[index];
  });
  const contactLabels = ["Họ và tên", "Số điện thoại", "Email", "Nhu cầu", "Mô tả ngắn"];
  scope.querySelectorAll("#contactSection label").forEach((node, index) => {
    if (contactLabels[index]) node.textContent = contactLabels[index];
  });
  setPlaceholder("#contactName", "Nguyễn Văn A");
  setPlaceholder("#contactPhone", "09xx xxx xxx");
  setPlaceholder("#contactMessage", "Mình cần tư vấn cách đăng tin, chọn gói hiển thị, tối ưu khu vực và làm website bất động sản chuyên nghiệp hơn để tăng khách hỏi thật...");
  scope.querySelectorAll("#contactNeed option").forEach((node, index) => {
    const options = [
      "Tư vấn tối ưu tin đăng BĐS",
      "Tư vấn gói VIP, boost và hiển thị",
      "Tư vấn website bán nhà, cho thuê, đất nền"
    ];
    if (options[index]) node.textContent = options[index];
  });
  setText("#contactSection .contact-actions .btn.btn-primary", "Nhận tư vấn BĐS");
  setText("#contactSection .contact-actions .btn.btn-light", "Gọi ngay 0908777102");

  setText(".site-footer .footer-brand strong", "Việc Làm Nhà Đất");
  setText(".site-footer .footer-brand p", "Chuyên trang đăng tin bất động sản TP.HCM, tập trung Gò Vấp, Quận 12 và các khu vực có nhu cầu thật.");
  const footerTitles = ["Loại hình", "Khu vực", "Liên hệ"];
  scope.querySelectorAll(".footer-cols h4").forEach((node, index) => {
    if (footerTitles[index]) node.textContent = footerTitles[index];
  });
  setText("#chatMessages.empty-state", "Chọn một hội thoại để xem tin nhắn.");
  setPlaceholder("#chatInput", "Nhập tin nhắn...");
  setText("#chatForm .btn.btn-primary", "Gửi");
  setText("#chatPopup .tiny-title", "Hỗ trợ nhanh");
  setText("#chatPopup h3", "Chat với người đăng");
  setPlaceholder("#chatPopupInput", "Nhập tin nhắn...");
  setText("#chatPopup .btn.btn-primary.btn-sm", "Gửi");
}


async function fetchJSON(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const contentType = res.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await res.json().catch(() => ({}))
    : await res.text().catch(() => "");
  if (!res.ok) {
    const message = typeof payload === "string" ? payload : (payload.message || "Lỗi server");
    throw new Error(message);
  }
  return normalizeVietnamesePayload(payload);
}


function initStickyPills(){
  document.querySelectorAll(".filter-pill").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-pill").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });
}

function updatePostFieldHints(){
  const category = (window.postCategory && postCategory.value) || "";
  const bedroomsInput = document.getElementById("postBedrooms");
  const areaInput = document.getElementById("postArea");
  const direction = document.getElementById("postDirection");
  const legal = document.getElementById("postLegal");
  const fieldWrap = bedroomsInput ? bedroomsInput.parentElement : null;
  const label = fieldWrap ? fieldWrap.querySelector("label") : null;
  if (!bedroomsInput || !areaInput || !direction || !legal || !fieldWrap || !label) return;

  let hint = document.getElementById("postBedroomsHint");
  if (!hint) {
    hint = document.createElement("small");
    hint.id = "postBedroomsHint";
    hint.className = "field-hint";
    fieldWrap.appendChild(hint);
  }

  if (category === "Việc làm") {
    label.textContent = "Kinh nghiệm";
    hint.textContent = "Gợi ý: nhập số năm kinh nghiệm hoặc mức như 0, 1, 2 năm.";
    bedroomsInput.placeholder = "Ví dụ: 2";
    areaInput.placeholder = "Có thể để 0 nếu không áp dụng";
    direction.disabled = true;
    legal.disabled = true;
    direction.value = "";
    legal.value = "";
    return;
  }

  label.textContent = "Số phòng ngủ / kinh nghiệm";
  hint.textContent = "Tin nhà đất: nhập số phòng ngủ. Nếu là việc làm, trường này dùng cho kinh nghiệm.";
  bedroomsInput.placeholder = "Ví dụ: 3";
  areaInput.placeholder = "";
  direction.disabled = false;
  legal.disabled = false;
}

document.addEventListener("DOMContentLoaded", () => {
  initStickyPills();
  if (window.postCategory) {
    postCategory.addEventListener("change", updatePostFieldHints);
    updatePostFieldHints();
  }
});


let heroSlideIndex = 0;
let heroSliderTimer = null;

function initHeroSlider(){
  const slides = document.querySelectorAll(".hero-slide");
  const dots = document.querySelectorAll("#heroSliderDots button");
  if (!slides.length) return;

  function showSlide(index){
    slides.forEach((slide, i) => slide.classList.toggle("active", i === index));
    dots.forEach((dot, i) => dot.classList.toggle("active", i === index));
    heroSlideIndex = index;
  }

  dots.forEach((dot, i) => {
    dot.addEventListener("click", () => {
      showSlide(i);
      resetHeroSlider();
    });
  });

  function nextSlide(){
    showSlide((heroSlideIndex + 1) % slides.length);
  }

  function resetHeroSlider(){
    if (heroSliderTimer) clearInterval(heroSliderTimer);
    heroSliderTimer = setInterval(nextSlide, 4500);
  }

  showSlide(0);
  resetHeroSlider();
}

function openDetailModal(post = {}){
  const modal = document.getElementById("detailModal");
  if (!modal) return;
  const img = post.image || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1400&q=80";
  const title = post.title || "Chi tiết tin đăng";
  const meta = post.category === "Việc làm"
    ? `${post.category || ""} · ${post.location || ""}`
    : `${post.category ? post.category + " · " : ""}${post.location || ""}${post.area ? " · " + post.area + "m²" : ""}${post.bedrooms ? " · " + post.bedrooms + " PN" : ""}`;
  document.getElementById("detailGalleryMain").style.backgroundImage = `url('${img}')`;
  const thumbs = document.getElementById("detailGalleryThumbs");
  if (thumbs) {
    const imgs = [img, img, img, img];
    thumbs.innerHTML = imgs.map(src => `<div class="detail-thumb" style="background-image:url('${src}')"></div>`).join("");
  }
  document.getElementById("detailTitle").textContent = title;
  document.getElementById("detailPrice").textContent = post.category === "Cho thuê" ? `${price}/tháng` : price;
  document.getElementById("detailMeta").textContent = meta;
  document.getElementById("detailDesc").textContent = post.description || "Chưa có mô tả chi tiết.";
  modal.classList.add("open");
}

function closeDetailModal(){
  const modal = document.getElementById("detailModal");
  if (modal) modal.classList.remove("open");
}

function openChatPopup(){
  const popup = document.getElementById("chatPopup");
  if (popup) popup.classList.add("open");
}

function closeChatPopup(){
  const popup = document.getElementById("chatPopup");
  if (popup) popup.classList.remove("open");
}

function sendQuickChat(){
  const input = document.getElementById("chatPopupInput");
  const box = document.getElementById("chatPopupMessages");
  if (!input || !box || !input.value.trim()) return;
  const div = document.createElement("div");
  div.className = "chat-bubble from-user";
  div.textContent = input.value.trim();
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
  input.value = "";
  setTimeout(() => {
    const reply = document.createElement("div");
    reply.className = "chat-bubble from-owner";
    reply.textContent = "Mình đã nhận tin nhắn. Mình sẽ phản hồi thêm thông tin chi tiết cho bạn ngay.";
    box.appendChild(reply);
    box.scrollTop = box.scrollHeight;
  }, 600);
}

document.addEventListener("DOMContentLoaded", () => {
  loadSettingsAndPayment();
  initHeroSlider();
  initVietnameseTextRepair();
});


async function runAiModerationCheck(){
  try{
    const data = await fetchJSON("/api/ai/moderate-post", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        title: postTitle.value,
        category: postCategory.value,
        description: postDescription.value,
        price: postPrice.value,
        location: postLocation.value,
        image: postImage.value
      })
    });
    const box = document.getElementById("aiSupportTips");
    if (box) {
      box.innerHTML = `
        <div class="ai-tip-list">
          <div><strong>Điểm chất lượng:</strong><br>${data.result.score}/100</div>
          <div><strong>Gợi ý hành động:</strong><br>${data.result.action}</div>
          <div><strong>Trạng thái đề xuất:</strong><br>${data.result.status}</div>
          <div><strong>Lỗi phát hiện:</strong><br>${(data.result.issues || []).join(", ") || "Không có lỗi lớn"}</div>
        </div>`;
    }
  }catch(err){ showToast(err.message); }
}

async function runAiClassify(){
  try{
    const data = await fetchJSON("/api/ai/classify-post", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        title: postTitle.value,
        description: postDescription.value
      })
    });
    if (data.result && data.result.category) {
      postCategory.value = data.result.category;
      updatePostFieldHints();
    }
    showToast(`AI gợi ý danh mục: ${data.result.category}`);
  }catch(err){ showToast(err.message); }
}

async function runAiReplySuggest(){
  try{
    const customer_message = prompt("Nhập tin nhắn khách cần trả lời:", "Tin này còn không, giá bao nhiêu?");
    if (!customer_message) return;
    const data = await fetchJSON("/api/ai/reply-suggest", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        customer_message,
        post_title: postTitle.value,
        post_price: postPrice.value,
        post_location: postLocation.value
      })
    });
    const box = document.getElementById("aiSupportTips");
    if (box) {
      box.innerHTML = `<div class="ai-tip-list"><div><strong>AI gợi ý trả lời khách:</strong><br>${data.result.reply}</div></div>`;
    }
  }catch(err){ showToast(err.message); }
}




async function runAiSupport(){
  try{
    const data = await fetchJSON("/api/ai/support", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        title: postTitle.value,
        category: postCategory.value,
        location: postLocation.value,
        price: postPrice.value,
        area: postArea.value,
        bedrooms: postBedrooms.value,
        house_direction: postDirection.value,
        legal_status: postLegal.value
      })
    });

    if (!postTitle.value) postTitle.value = data.result.title || "";
    if (!postPrice.value && data.result.suggested_price) postPrice.value = data.result.suggested_price;
    if (!postDescription.value || postDescription.value.length < 20) {
      postDescription.value = data.result.broker_description || data.result.normal_description || "";
    }

    const tipsBox = document.getElementById("aiSupportTips");
    if (tipsBox) {
      tipsBox.innerHTML = `
        <div class="ai-tip-list">
          <div><strong>Tiêu đề chuẩn:</strong><br>${data.result.title || ""}</div>
          <div><strong>Tiêu đề ngắn:</strong><br>${data.result.concise_title || ""}</div>
          <div><strong>Tiêu đề bán hàng:</strong><br>${data.result.sales_title || ""}</div>
          <div><strong>Tiêu đề chuẩn môi giới:</strong><br>${data.result.pro_title || ""}</div>
          <div><strong>Mô tả thường:</strong><br>${data.result.normal_description || ""}</div>
          <div><strong>Mô tả bán hàng:</strong><br>${data.result.sales_description || ""}</div>
          <div><strong>Mô tả chuẩn môi giới:</strong><br>${data.result.broker_description || ""}</div>
          <div><strong>Giá AI đề xuất:</strong><br>${data.result.suggested_price_text || ""}</div>
          <div><strong>Tag / từ khóa SEO:</strong><br>${(data.result.seo_tags || []).join(", ")}</div>
          ${(data.result.tips || []).map(t => `<div>${t}</div>`).join("")}
        </div>`;
    }
  }catch(err){ showToast(err.message); }
}

let currentCategory = "";
let currentConversationId = "";
const currency = (v) => Number(v || 0).toLocaleString("vi-VN") + " đ";
function openModal(id){ document.getElementById(id).classList.add("show"); }
function closeModal(id){ document.getElementById(id).classList.remove("show"); }
window.onclick = (e) => document.querySelectorAll(".modal").forEach(m => { if (e.target === m) m.classList.remove("show"); });
function scrollToPost(){ document.getElementById("postSection").scrollIntoView({behavior:"smooth"}); }
function scrollToPackages(){ document.getElementById("packagesSection").scrollIntoView({behavior:"smooth"}); }
function setQuickLocation(location){
  if (window.filterLocation) filterLocation.value = location;
  document.querySelectorAll(".quick-locations button").forEach(btn => btn.classList.remove("active"));
  document.querySelectorAll(".quick-locations button").forEach(btn => {
    const text = btn.textContent.trim();
    if (location.includes(text) || location === text) btn.classList.add("active");
  });
  if (typeof loadPosts === "function") loadPosts();
}

async function checkMe(){
  const data = await fetchJSON("/api/me");
  if (!data.user){
    guestActions.classList.remove("hidden"); userActions.classList.add("hidden");
    accountBox.innerHTML = `<div class="empty-state">Bạn chưa đăng nhập. Hãy tạo tài khoản để mua gói và đăng tin.</div>`;
    profilePreview.innerHTML = `<div class="empty-state">Đăng nhập để xem hồ sơ và gói hiện tại.</div>`;
    myPostList.innerHTML = `<div class="empty-state">Bạn cần đăng nhập để xem tin của mình.</div>`;
    mySubscriptionList.innerHTML = `<div class="empty-state">Bạn chưa có gói đăng ký nào.</div>`;
    favoriteBox.innerHTML = `<div class="empty-state">Đăng nhập để dùng yêu thích.</div>`;
    conversationList.innerHTML = `<div class="empty-state">Đăng nhập để dùng chat.</div>`;
    return;
  }
  data.user = sanitizeUserProfile(data.user);
  guestActions.classList.add("hidden"); userActions.classList.remove("hidden");
  welcomeUser.textContent = `Xin chào, ${data.user.full_name}`;
  if (data.user.role === "admin") adminLink.classList.remove("hidden"); else adminLink.classList.add("hidden");

  accountBox.innerHTML = `<div class="info-list">
    <div class="info-card"><strong>${data.user.full_name}</strong><br>@${data.user.username}</div>
    <div class="info-card"><strong>Vai trò:</strong> ${data.user.role}</div>
    <div class="info-card"><strong>Số dư ví:</strong> ${currency(data.user.wallet_balance || 0)}</div>
    <div class="info-card"><button class="btn btn-primary" type="button" onclick="createTopup()">Nạp tiền</button></div>
    <div class="info-card"><strong>Email:</strong> ${data.user.email || "Chưa cập nhật"}</div>
    <div class="info-card"><strong>SĐT:</strong> ${data.user.phone || "Chưa cập nhật"}</div>
  </div>`;

  profileFullName.value = data.user.full_name || "";
  profileEmail.value = data.user.email || "";
  profilePhone.value = data.user.phone || "";
  profileAddress.value = data.user.address || "";
  profileBio.value = data.user.bio || "";
  profileAvatar.value = data.user.avatar || "";

  profilePreview.innerHTML = `<div class="info-list">
    <div class="info-card"><strong>Họ tên</strong><div>${data.user.full_name || ""}</div></div>
    <div class="info-card"><strong>Email</strong><div>${data.user.email || ""}</div></div>
    <div class="info-card"><strong>Số điện thoại</strong><div>${data.user.phone || "Chưa cập nhật"}</div></div>
    <div class="info-card"><strong>Địa chỉ</strong><div>${data.user.address || "Chưa cập nhật"}</div></div>
    <div class="info-card"><strong>Giới thiệu</strong><div>${data.user.bio || "Chưa cập nhật"}</div></div>
    <div class="info-card"><strong>Gói hiện tại</strong><div>${data.subscription ? `${data.subscription.package_name} · còn tới ${data.subscription.end_date}` : "Chưa có gói hoạt động"}</div></div>
  </div>`;
  await Promise.all([loadMyPosts(), loadMySubscriptions(), loadFavorites(), loadConversations(), loadWalletTransactions()]);
}

async function loadPosts(){
  const keyword = filterKeyword.value || searchKeyword.value || "";
  const category = filterCategory.value || currentCategory || "";
  const location = (window.filterLocation && filterLocation.value) ? filterLocation.value : "";
  const sort = sortSelect.value || "newest";
  const minPrice = filterMinPrice.value || "";
  const maxPrice = filterMaxPrice.value || "";
  const minArea = filterMinArea.value || "";
  const maxArea = filterMaxArea.value || "";
  const bedrooms = filterBedrooms.value || "";
  const direction = filterDirection.value || "";
  const legal = filterLegal.value || "";
  const posts = await fetchJSON(`/api/posts?keyword=${encodeURIComponent(keyword)}&category=${encodeURIComponent(category)}&sort=${encodeURIComponent(sort)}&min_price=${encodeURIComponent(minPrice)}&max_price=${encodeURIComponent(maxPrice)}&min_area=${encodeURIComponent(minArea)}&max_area=${encodeURIComponent(maxArea)}&bedrooms=${encodeURIComponent(bedrooms)}&house_direction=${encodeURIComponent(direction)}&legal_status=${encodeURIComponent(legal)}`);
  const filteredPosts = location ? posts.filter(p => (p.location || "").toLowerCase().includes(location.toLowerCase())) : posts;
  if (!filteredPosts.length){ postList.innerHTML = `<div class="empty-state">Không có tin đăng phù hợp.</div>`; return; }
  postList.innerHTML = filteredPosts.map(post => `
    <div class="post-card fade-in">
      <div class="post-cover">
        ${post.is_featured ? `<div class="featured-label">TIN NỔI BẬT</div>` : ""}
        <img class="post-image" src="${post.image || "https://via.placeholder.com/800x600?text=No+Image"}" alt="${post.title}" onerror="this.src='https://via.placeholder.com/800x600?text=No+Image'">
      </div>
      <div class="post-body">
        <div class="post-title">${post.title}</div>
        <div class="post-price">${currency(post.price)}</div>
        <div class="post-meta">${post.category === "Việc làm" ? `${post.category} · ${post.location} · ${currency(post.price)} · ${post.views} lượt xem` : `${post.category} · ${post.location} · ${post.area || 0}m² · ${post.bedrooms || 0} PN · ${post.house_direction || "-"} · ${post.views} lượt xem`}</div>
        <div class="post-desc">${post.description}</div>
        <div class="post-seller"><strong>Người bán:</strong> ${post.full_name}<br><strong>SĐT:</strong> ${post.phone || "Chưa cập nhật"}</div>
        <div class="card-actions">
          <button class="btn btn-light" onclick="viewDetail(${post.id})">Xem chi tiết</button>
          <button class="btn btn-primary" onclick="toggleFavorite(${post.id})">${post.is_favorite ? "Bỏ yêu thích" : "Yêu thích"}</button>
        </div>
      </div>
    </div>`).join("");
}

async function viewDetail(id){
  try{
    const post = await fetchJSON(`/api/posts/${id}`);
    const detailFacts = post.category === "Việc làm"
      ? `
        <div class="detail-facts-grid">
          <div class="info-card detail-side-card"><strong>Mức lương</strong><div>${currency(post.price)}</div></div>
          <div class="info-card detail-side-card"><strong>Khu vực làm việc</strong><div>${post.location}</div></div>
          <div class="info-card detail-side-card"><strong>Loại tin</strong><div>Tin tuyển dụng</div></div>
          <div class="info-card detail-side-card"><strong>Lượt xem</strong><div>${post.views}</div></div>
        </div>
      `
      : `
        <div class="detail-facts-grid">
          <div class="info-card detail-side-card"><strong>Diện tích</strong><div>${post.area || 0}m²</div></div>
          <div class="info-card detail-side-card"><strong>Phòng ngủ</strong><div>${post.bedrooms || 0}</div></div>
          <div class="info-card detail-side-card"><strong>Hướng nhà</strong><div>${post.house_direction || "Chưa cập nhật"}</div></div>
          <div class="info-card detail-side-card"><strong>Pháp lý</strong><div>${post.legal_status || "Chưa cập nhật"}</div></div>
          <div class="info-card detail-side-card"><strong>Lượt xem</strong><div>${post.views}</div></div>
        </div>
      `;

    detailContent.innerHTML = `
      <div class="detail-grid">
        <div class="detail-main">
          <img class="detail-image" src="${post.image || "https://via.placeholder.com/900x700?text=No+Image"}" alt="${post.title}">
          <div class="info-card detail-description-card">
            <strong>Mô tả</strong>
            <div>${post.description}</div>
          </div>
        </div>
        <div class="detail-meta">
          <div class="tiny-title">Chi tiết tin đăng</div>
          <h2>${post.title}</h2>
          <div class="post-price">${currency(post.price)}</div>
          <div class="detail-primary-grid">
            <div class="info-card detail-side-card"><strong>Danh mục</strong><div>${post.category}</div></div>
            <div class="info-card detail-side-card"><strong>Khu vực</strong><div>${post.location}</div></div>
            <div class="info-card detail-side-card"><strong>Người bán</strong><div>${post.full_name} · @${post.username}</div></div>
            <div class="info-card detail-side-card"><strong>Điện thoại</strong><div>${post.phone || "Chưa cập nhật"}</div></div>
          </div>
          ${detailFacts}
          <div class="card-actions">
            <button class="btn btn-primary" onclick="startChat(${post.id}, ${post.user_id})">Nhắn người bán</button>
            <button class="btn btn-light" onclick="toggleFavorite(${post.id})">${post.is_favorite ? "Bỏ yêu thích" : "Yêu thích"}</button>
          </div>
        </div>
      </div>`;
    openModal("detailModal");
    await loadPosts();
  }catch(err){ showToast(err.message); }
}


async function loadPackages(){
  const rows = await fetchJSON("/api/pricing-plans");

  const grouped = {
    viec_lam: rows.filter(r => r.category === "viec_lam"),
    nha_thue: rows.filter(r => r.category === "nha_thue"),
    vip: rows.filter(r => r.category === "vip")
  };

  const renderCard = (pkg, groupTitle) => {
    let badgeClass = "price-badge-free";
    let badgeText = "Miễn phí";
    let tip = "Phù hợp để bắt đầu đăng tin.";
    if (pkg.feature_type === "featured") {
      badgeClass = "price-badge-featured";
      badgeText = "Nổi bật";
      tip = "Tăng nhận diện, dễ được chú ý hơn.";
    } else if (pkg.feature_type === "vip") {
      badgeClass = "price-badge-vip";
      badgeText = "VIP";
      tip = "Ưu tiên hiển thị mạnh hơn, phù hợp cần chốt nhanh.";
    } else if (pkg.feature_type === "push") {
      badgeClass = "price-badge-push";
      badgeText = "Đẩy tin";
      tip = "Đưa tin lên đầu nhanh để tăng lượt xem.";
    }

    const amount = pkg.price === 0 ? "Miễn phí" : currency(pkg.price);
    return `
      <div class="price-card">
        <div class="mini-badge ${badgeClass}">${badgeText}</div>
        <h3>${groupTitle} - ${pkg.name}</h3>
        <div class="price-head-row">
          <div class="amount">${amount}</div>
          <button class="btn btn-primary price-head-buy" onclick="buyMonetizePlan(${pkg.id})">Mua gói</button>
        </div>
        <div class="price-meta">
          <div><strong>Thời gian:</strong> ${pkg.duration_days} ngày${pkg.feature_type === "push" ? " / lần" : ""}</div>
          <div><strong>Hình thức:</strong> ${pkg.feature_type === "normal" ? "Tin thường" : pkg.feature_type === "featured" ? "Tin nổi bật" : pkg.feature_type === "vip" ? "Tin VIP" : "Đẩy tin"}</div>
        </div>
        <div class="price-tip">${tip}</div>
        <div class="card-actions price-actions" style="margin-top:16px">
          <button class="btn btn-primary full" onclick="buyMonetizePlan(${pkg.id})">Mua bằng ví</button>
          <button class="btn btn-light full" onclick="createTopup()">Nạp tiền vào ví</button>
        </div>
      </div>
    `;
  };

  packageList.innerHTML = `
    ${grouped.viec_lam.map(pkg => renderCard(pkg, "Việc làm")).join("")}
    ${grouped.nha_thue.map(pkg => renderCard(pkg, "Nhà thuê")).join("")}
    ${grouped.vip.map(pkg => renderCard(pkg, "Gói VIP nâng cao")).join("")}
  `;
}



async function buyMonetizePlan(planId){
  try{
    const posts = await fetchJSON("/api/my-posts");
    if (!posts.length) return showToast("Bạn cần có ít nhất 1 tin đăng để áp dụng gói.");
    const id = prompt("Nhập ID tin đăng muốn áp dụng bảng giá này:", posts[0].id || "");
    if (!id) return;
    const data = await fetchJSON(`/api/posts/${id}/monetize`, {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ plan_id: planId })
    });
    showToast(data.message);
    await Promise.all([checkMe(), loadMyPosts(), loadPosts(), loadWalletTransactions()]);
  }catch(err){ showToast(err.message); }
}

async function createTopup(defaultAmount){
  try{
    const amount = prompt("Nhập số tiền muốn nạp (tối thiểu 10.000):", defaultAmount ? String(defaultAmount) : "50000");
    if (!amount) return;
    const proof = prompt("Dán link ảnh biên lai nếu có:", "") || "";
    const data = await fetchJSON("/api/wallet/topup", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ amount, proof_image: proof })
    });
    showToast(`${data.message}\nNội dung chuyển khoản: ${data.payment_note}`);
    await Promise.all([checkMe(), loadWalletTransactions()]);
  }catch(err){ showToast(err.message); }
}


async function loadWalletTransactions(){
  try{
    const [topups, txs] = await Promise.all([
      fetchJSON("/api/wallet/topups"),
      fetchJSON("/api/wallet/transactions")
    ]);
    const walletBox = document.getElementById("walletHistory");
    if (!walletBox) return;
    walletBox.innerHTML = `
      <div class="info-list">
        <div class="info-card"><strong>Yêu cầu nạp gần nhất</strong><div>${topups.slice(0,3).map(t => `${currency(t.amount)} · ${t.status}`).join("<br>") || "Chưa có"}</div></div>
        <div class="info-card"><strong>Giao dịch ví gần nhất</strong><div>${txs.slice(0,5).map(t => `${t.type === "credit" ? "+" : "-"}${currency(t.amount)} · ${t.note}`).join("<br>") || "Chưa có"}</div></div>
      </div>`;
  }catch{}
}

async function buyPackage(packageId){
  try{
    const proof = prompt("Nếu có link ảnh biên lai thì dán vào đây. Có thể để trống rồi admin xác nhận sau.", "") || "";
    const data = await fetchJSON("/api/subscriptions", {
      method:"POST", headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        package_id: packageId || null,
        package_name: selectedPaymentPlan?.name || "",
        price: Number(selectedPaymentPlan?.price || 0),
        duration_days: Number(selectedPaymentPlan?.days || 0),
        proof_image: proof
      })
    });
    showToast(`${data.message}\nNội dung chuyển khoản gợi ý: ${data.payment_note}`);
    await loadMySubscriptions(); await checkMe();
  }catch(err){ showToast(err.message); }
}

async function buyPackageWithWallet(packageId){
  try{
    const data = await fetchJSON("/api/subscriptions/wallet", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        package_id: packageId || null,
        package_name: selectedPaymentPlan?.name || "",
        price: Number(selectedPaymentPlan?.price || 0),
        duration_days: Number(selectedPaymentPlan?.days || 0)
      })
    });
    showToast(data.message);
    await Promise.all([loadMySubscriptions(), checkMe(), loadWalletTransactions()]);
  }catch(err){ showToast(err.message); }
}

async function loadMyPosts(){
  try{
    const posts = await fetchJSON("/api/my-posts");
    if (!posts.length){ myPostList.innerHTML = `<div class="empty-state">Bạn chưa có tin đăng nào.</div>`; return; }
    myPostList.innerHTML = `<div class="my-list">${posts.map(post => `
      <div class="list-row fade-in">
        <div>
          <strong>${post.title}</strong><br>
          <span>${currency(post.price)} · ${post.location}</span><br>
          <small>${post.is_featured ? "Tin nổi bật" : "Tin thường"}</small>
        </div>
        <div class="card-actions">
          <button class="btn btn-light" onclick='editPost(${JSON.stringify(post).replace(/'/g, "&apos;")})'>Sửa</button>
          <button class="btn btn-danger" onclick="deletePost(${post.id})">Xóa</button>
        </div>
      </div>`).join("")}</div>`;
  }catch{
    myPostList.innerHTML = `<div class="empty-state">Bạn cần đăng nhập để xem tin của mình.</div>`;
  }
}

function editPost(post){
  editingPostId.value = post.id;
  postTitle.value = post.title || "";
  postCategory.value = post.category || "";
  postPrice.value = post.price || "";
  postLocation.value = post.location || "";
  postDescription.value = post.description || "";
  postArea.value = post.area || "";
  postBedrooms.value = post.bedrooms || "";
  postDirection.value = post.house_direction || "";
  postLegal.value = post.legal_status || "";
  postImage.value = post.image || "";
  postFeatured.checked = Number(post.is_featured) === 1;
  postSubmitBtn.textContent = "Cập nhật bài đăng";
  updatePostFieldHints();
  scrollToPost();
}

function resetPostForm(){
  editingPostId.value = "";
  postForm.reset();
  postSubmitBtn.textContent = "Đăng tin ngay";
  uploadStatus.textContent = "";
  updatePostFieldHints();
}

async function uploadPostImage(){
  try{
    if (!postImageFile.files[0]) return showToast("Chọn ảnh trước đã.");
    const fd = new FormData();
    fd.append("image", postImageFile.files[0]);
    uploadStatus.textContent = "Đang upload...";
    const res = await fetch("/api/upload", { method:"POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Upload thất bại.");
    postImage.value = data.url;
    uploadStatus.textContent = "Upload thành công: " + data.url;
  }catch(err){ uploadStatus.textContent = err.message; }
}

async function deletePost(id){
  if (!confirm("Bạn chắc chắn muốn xóa bài này?")) return;
  try{
    const data = await fetchJSON(`/api/posts/${id}`, { method:"DELETE" });
    showToast(data.message);
    await loadMyPosts(); await loadPosts();
  }catch(err){ showToast(err.message); }
}

async function toggleFavorite(id){
  try{
    const data = await fetchJSON(`/api/favorites/${id}`, { method:"POST" });
    showToast(data.message);
    await loadFavorites(); await loadPosts();
  }catch(err){ showToast(err.message); }
}

async function loadFavorites(){
  try{
    const rows = await fetchJSON("/api/favorites");
    if (!rows.length){ favoriteBox.innerHTML = `<div class="empty-state">Chưa có tin yêu thích.</div>`; return; }
    favoriteBox.innerHTML = rows.slice(0, 6).map(p => `<div class="mini-item"><strong>${p.title}</strong><br><small>${currency(p.price)}</small></div>`).join("");
  }catch{
    favoriteBox.innerHTML = `<div class="empty-state">Đăng nhập để dùng yêu thích.</div>`;
  }
}

async function loadMySubscriptions(){
  try{
    const rows = await fetchJSON("/api/my-subscriptions");
    if (!rows.length){ mySubscriptionList.innerHTML = `<div class="empty-state">Bạn chưa đăng ký gói nào.</div>`; return; }
    mySubscriptionList.innerHTML = rows.map(sub => `
      <div class="sub-row fade-in">
        <div>
          <strong>${sub.package_name}</strong><br>
          <span>${currency(sub.price)} · ${sub.start_date} → ${sub.end_date}</span><br>
          <small>Nội dung CK: ${sub.payment_note}</small>
        </div>
        <div class="status-badge status-${sub.status}">${sub.status}</div>
      </div>`).join("");
  }catch{
    mySubscriptionList.innerHTML = `<div class="empty-state">Bạn cần đăng nhập để xem lịch sử gói.</div>`;
  }
}

async function startChat(postId, sellerId){
  try{
    const data = await fetchJSON("/api/chat/start", {
      method:"POST", headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ post_id: postId, seller_id: sellerId })
    });
    closeModal("detailModal");
    await loadConversations();
    await openConversation(data.conversation_id);
  }catch(err){ showToast(err.message); }
}

async function loadConversations(){
  try{
    const rows = await fetchJSON("/api/chat/conversations");
    if (!rows.length){ conversationList.innerHTML = `<div class="empty-state">Chưa có hội thoại nào.</div>`; return; }
    conversationList.innerHTML = rows.map(c => `
      <button class="conversation-item ${String(currentConversationId) === String(c.id) ? "active" : ""}" onclick="openConversation(${c.id})">
        <strong>${c.title}</strong><br>
        <small>${c.last_message || "Chưa có tin nhắn"}</small>
      </button>`).join("");
  }catch{
    conversationList.innerHTML = `<div class="empty-state">Đăng nhập để dùng chat.</div>`;
  }
}

async function openConversation(id){
  currentConversationId = id;
  currentConversationIdInput.value = id;
  await loadConversations();
  try{
    const rows = await fetchJSON(`/api/chat/${id}/messages`);
    if (!rows.length){ chatMessages.innerHTML = `<div class="empty-state">Chưa có tin nhắn.</div>`; return; }
    const me = await fetchJSON("/api/me");
    chatMessages.innerHTML = rows.map(m => `
      <div class="msg ${me.user && me.user.id === m.sender_id ? "self" : "other"}">
        <div>${m.body}</div>
        <small>${m.full_name}</small>
      </div>`).join("");
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }catch(err){
    chatMessages.innerHTML = `<div class="empty-state">${err.message}</div>`;
  }
}

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  try{
    const data = await fetchJSON("/api/register", {
      method:"POST", headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ full_name: registerFullName.value, username: registerUsername.value, email: registerEmail.value, password: registerPassword.value })
    });
    showToast(data.message); closeModal("registerModal"); e.target.reset(); await checkMe();
  }catch(err){ showToast(err.message); }
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  try{
    const data = await fetchJSON("/api/login", {
      method:"POST", headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ username: loginUsername.value, password: loginPassword.value })
    });
    showToast(data.message); closeModal("loginModal"); e.target.reset(); await checkMe(); await loadPosts();
  }catch(err){ showToast(err.message); }
});

async function logout(){ await fetchJSON("/api/logout", { method:"POST" }); location.reload(); }

profileForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  try{
    const data = await fetchJSON("/api/profile", {
      method:"PUT", headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        full_name: profileFullName.value, email: profileEmail.value, phone: profilePhone.value,
        address: profileAddress.value, bio: profileBio.value, avatar: profileAvatar.value
      })
    });
    showToast(data.message); await checkMe();
  }catch(err){ showToast(err.message); }
});

postForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    title: postTitle.value, category: postCategory.value, price: postPrice.value, location: postLocation.value,
    description: postDescription.value, image: postImage.value, is_featured: postFeatured.checked ? 1 : 0
  };
  try{
    let data;
    if (editingPostId.value) {
      data = await fetchJSON(`/api/posts/${editingPostId.value}`, { method:"PUT", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(payload) });
    } else {
      data = await fetchJSON("/api/posts", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(payload) });
    }
    showToast(data.message);
    resetPostForm();
    await loadPosts(); await loadMyPosts();
  }catch(err){ showToast(err.message); }
});

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  try{
    if (!currentConversationIdInput.value) return showToast("Chọn hội thoại trước.");
    if (!chatInput.value.trim()) return;
    await fetchJSON(`/api/chat/${currentConversationIdInput.value}/messages`, {
      method:"POST", headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ body: chatInput.value.trim() })
    });
    chatInput.value = "";
    await openConversation(currentConversationIdInput.value);
  }catch(err){ showToast(err.message); }
});

sortSelect.addEventListener("change", loadPosts);
loadSettings(); loadPackages(); loadPosts(); checkMe();
