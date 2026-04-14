let showcaseState = {
  groups: {},
  activeTab: "nha_ban"
};

document.addEventListener("DOMContentLoaded", () => {
  initPremiumCopy();
  initRevealOnScroll();
  initFaq();
  initContactForm();
  initAnchorScroll();
  initRealEstateConsultingCopy();
  initPlanCardBuyButtons();
  initAccountModal();
  moveWalletSectionUp();
  initListingFeedAdapter();
  loadShowcasePosts();
});

function initPremiumCopy() {
  const siteSlogan = document.getElementById("siteSlogan");
  const searchKeyword = document.getElementById("searchKeyword");
  const topStrip = document.querySelectorAll(".top-strip-inner span");
  const navLinks = document.querySelectorAll(".main-nav a");
  const heroSlides = document.querySelectorAll(".hero-slide");
  const heroLeft = document.querySelector(".hero-left");
  const summaryCard = document.querySelector(".summary-card");
  const marketCard = document.querySelector(".market-card");
  const quickStats = document.querySelectorAll(".quick-stats .stat-box");
  const marketTitle = document.querySelector("#marketSection .section-intro .tiny-title");
  const marketText = document.querySelector("#marketSection .section-intro p");
  const showcaseTitle = document.querySelector(".showcase-panel .tiny-title");
  const showcaseHeading = document.querySelector(".showcase-panel h2");
  const showcaseBadge = document.querySelector(".showcase-panel .soft-badge");

  if (siteSlogan) siteSlogan.textContent = "N?n t?ng ??ng tin b?t ??ng s?n t?p trung nhu c?u th?t t?i G? V?p, Qu?n 12 v? TP.HCM.";
  if (searchKeyword) searchKeyword.placeholder = "T?m nh? b?n, ??t n?n, c?n h?, m?t b?ng, cho thu?...";

  if (topStrip[1]) topStrip[1].textContent = "Chuy?n ??ng tin nh? ??t TP.HCM";
  if (topStrip[2]) topStrip[2].textContent = "Tr?ng ?i?m: G? V?p, Qu?n 12, TP.HCM";

  const navText = ["Nh? b?n", "??t n?n", "Cho thu?", "M?t b?ng", "Vi?c l?m", "Khu v?c", "G?i ??ng tin", "T? v?n B?S"];
  navLinks.forEach((link, index) => {
    if (navText[index]) link.textContent = navText[index];
  });

  if (heroSlides[0]) {
    const badge = heroSlides[0].querySelector(".hero-badge");
    const title = heroSlides[0].querySelector("h1");
    const desc = heroSlides[0].querySelector("p");
    const buttons = heroSlides[0].querySelectorAll(".hero-cta-row button");
    if (badge) badge.textContent = "N?n t?ng ??ng tin b?t ??ng s?n cao c?p";
    if (title) title.textContent = "M?t m?t ti?n nh? ??t ?? sang ?? kh?ch tin ngay t? ?nh nh?n ??u ti?n.";
    if (desc) desc.textContent = "T?i ?u cho m?i gi?i, ch? tin v? ??i b?n h?ng c?n m?t website r? r?ng, s?ch v? c? kh? n?ng chuy?n l??t xem th?nh kh?ch h?i th?t.";
    if (buttons[0]) buttons[0].textContent = "Đăng tin ngay";
    if (buttons[1]) buttons[1].textContent = "Xem b?ng gi?";
  }

  if (heroSlides[1]) {
    const badge = heroSlides[1].querySelector(".hero-badge");
    const title = heroSlides[1].querySelector("h1");
    const desc = heroSlides[1].querySelector("p");
    const buttons = heroSlides[1].querySelectorAll(".hero-cta-row button");
    if (badge) badge.textContent = "G? V?p - Qu?n 12 - TP.HCM";
    if (title) title.textContent = "T?p trung ??ng khu v?c c? nhu c?u th?t ?? tin ??ng kh?ng b? lo?ng.";
    if (desc) desc.textContent = "B? l?c, v? tr?, gi? v? h?nh ??ng li?n h? ???c ??t ??ng ch? ?? kh?ch nh?n nhanh, hi?u nhanh v? ph?n h?i nhanh.";
    if (buttons[0]) buttons[0].textContent = "Xem tin G? V?p";
    if (buttons[1]) buttons[1].textContent = "Xem tin Qu?n 12";
  }

  if (heroSlides[2]) {
    const badge = heroSlides[2].querySelector(".hero-badge");
    const title = heroSlides[2].querySelector("h1");
    const desc = heroSlides[2].querySelector("p");
    const buttons = heroSlides[2].querySelectorAll(".hero-cta-row button");
    if (badge) badge.textContent = "G?i ??ng tin t?i ?u hi?n th?";
    if (title) title.textContent = "Free ?? kh?i ??ng. VIP ?? n?i b?t. PRO ?? ??y t?c ?? ch?t lead.";
    if (desc) desc.textContent = "M?t c?u tr?c g?i r? r?ng, ?? s?ch ?? kh?ch hi?u ngay gi? tr? v? ?? sang ?? t?ng ni?m tin khi mua hi?n th?.";
    if (buttons[0]) buttons[0].textContent = "Kh?m ph? b?ng gi?";
    if (buttons[1]) buttons[1].textContent = "T?o tin m?i";
  }

  if (heroLeft) {
    const badge = heroLeft.querySelector(".mini-badge");
    const title = heroLeft.querySelector("h1");
    const desc = heroLeft.querySelector("p");
    const points = heroLeft.querySelectorAll(".hero-points span");
    const buttons = heroLeft.querySelectorAll(".hero-cta button");
    if (badge) badge.textContent = "Chuy?n b?t ??ng s?n TP.HCM";
    if (title) title.textContent = "Website nh? ??t ???c thi?t k? l?i ?? ph?c v? ??ng h?nh vi t?m ki?m v? giao d?ch.";
    if (desc) desc.textContent = "T?p trung v?o tr?i nghi?m xem tin, l?c khu v?c, hi?n th? g?i ??ng tin v? t?ng h?nh ??ng g?i, chat, xem chi ti?t cho ng??i mua, ng??i thu? v? m?i gi?i.";
    const pointText = ["??ng tin d? thao t?c", "L?c khu v?c r? r?ng", "Card tin s?ch v? s?u", "CTA g?i v? chat r? h?n", "T?i ?u lead nh? ??t"];
    points.forEach((point, index) => { if (pointText[index]) point.textContent = pointText[index]; });
    if (buttons[0]) buttons[0].textContent = "Xem g?i ??ng tin";
    if (buttons[1]) buttons[1].textContent = "B?t ??u ??ng tin";
  }

  if (summaryCard) {
    const title = summaryCard.querySelector(".tiny-title");
    const heading = summaryCard.querySelector("h3");
    const desc = summaryCard.querySelector("p");
    if (title) title.textContent = "N?n t?ng chuy?n bi?t";
    if (heading) heading.textContent = "Thi?t k? ri?ng cho m?i gi?i, ch? tin v? ??i b?n h?ng b?t ??ng s?n.";
    if (desc) desc.textContent = "Kh?ng ph?i web rao v?t c?. ??y l? m?t giao di?n t?p trung v?o ?? tin c?y, t?c ?? ra quy?t ??nh v? kh? n?ng chuy?n ??i t? l??t xem th?nh kh?ch h?i th?t.";
  }

  if (marketCard) {
    const title = marketCard.querySelector(".tiny-title");
    const heading = marketCard.querySelector("h3");
    const desc = marketCard.querySelector("p");
    const stats = marketCard.querySelectorAll(".hero-mini-stats div");
    if (title) title.textContent = "Th? tr??ng tr?ng ?i?m";
    if (heading) heading.textContent = "G? V?p, Qu?n 12 v? nh?m kh?ch h?ng c? nhu c?u giao d?ch th?t.";
    if (desc) desc.textContent = "T?i ?u cho nh? b?n, ??t n?n, cho thu?, m?t b?ng v? c?c tin c?n hi?n th? n?i b?t ?? t?ng c? h?i ch?t nhanh.";
    if (stats[0]) stats[0].innerHTML = "<strong>G? V?p</strong><span>Nh? ? th?c</span>";
    if (stats[1]) stats[1].innerHTML = "<strong>Qu?n 12</strong><span>??t v? m?t b?ng</span>";
    if (stats[2]) stats[2].innerHTML = "<strong>TP.HCM</strong><span>M? r?ng ngu?n kh?ch</span>";
  }

  if (quickStats[0]) quickStats[0].innerHTML = "<strong>Nh? b?n G? V?p</strong><span>T?p trung khu v?c c? nhu c?u ? th?c v? kh? n?ng ch?t giao d?ch nhanh.</span>";
  if (quickStats[1]) quickStats[1].innerHTML = "<strong>??t n?n Qu?n 12</strong><span>?u ti?n khu t?ng tr??ng, m?t b?ng r? v? d? so s?nh gi?a c?c tin.</span>";
  if (quickStats[2]) quickStats[2].innerHTML = "<strong>Cho thu? TP.HCM</strong><span>T?i ?u cho c?n h? mini, nh? nguy?n c?n v? m?t b?ng kinh doanh.</span>";
  if (quickStats[3]) quickStats[3].innerHTML = "<strong>G?i ??ng tin n?i b?t</strong><span>Ph?n t?ng free, boost, VIP v? PRO ?? t?ng kh? n?ng hi?n th? ??ng m?c ti?u.</span>";

  if (marketTitle) marketTitle.textContent = "Khu v?c hot";
  if (marketText) marketText.textContent = "Ch?n nhanh qu?n, ph??ng ho?c ?i?m n?ng quen thu?c ?? l?c tin theo khu v?c c? nhu c?u th?t.";
  if (showcaseTitle) showcaseTitle.textContent = "Tin n?i b?t ngo?i trang ch?";
  if (showcaseHeading) showcaseHeading.textContent = "Tin demo v? tin n?i b?t ???c hi?n th? ngay khi kh?ch v?a v?o website";
  if (showcaseBadge) showcaseBadge.textContent = "?u ti?n c?c tin ?? duy?t v? c? s?c h?t cao";

  const tinyTitles = document.querySelectorAll('.tiny-title');
  const tinyMap = {
    'H??? s??': 'H? s?',
    'B??? l???c': 'B? l?c',
    'Tr???ng th??i': 'Tr?ng th?i',
    '????ng b??i': '??ng b?i',
    'V?? doanh thu': 'V? doanh thu'
  };
  tinyTitles.forEach((node) => {
    const raw = (node.textContent || '').trim();
    if (tinyMap[raw]) node.textContent = tinyMap[raw];
  });

  const headings = document.querySelectorAll('.panel h3, .panel h2');
  headings.forEach((node) => {
    const raw = (node.textContent || '').trim();
    if (raw.includes('Th??ng tin c?? nh??n')) node.textContent = 'Th?ng tin c? nh?n';
    if (raw.includes('H??? s?? v?? g??i')) node.textContent = 'H? s? v? g?i ?ang d?ng';
    if (raw.includes('T???o ho???c c???p nh???t')) node.textContent = 'T?o ho?c c?p nh?t tin b?t ??ng s?n';
    if (raw.includes('L???c b???t ?????ng s???n')) node.textContent = 'L?c b?t ??ng s?n';
  });

  const labels = Array.from(document.querySelectorAll('label'));
  const labelMap = {
    'H??? v?? t??n': 'H? v? t?n',
    'S??? ??i???n tho???i': 'S? ?i?n tho?i',
    '?????a ch???': '??a ch?',
    'Gi???i thi???u': 'Gi?i thi?u',
    'Link ???nh ?????i di???n': 'Link ?nh ??i di?n',
    'Ti??u ?????': 'Ti?u ??',
    'Lo???i h??nh': 'Lo?i h?nh',
    'Gi?? / m???c l????ng': 'Gi? / m?c l??ng',
    'Di???n t??ch (m??)': 'Di?n t?ch (m?)',
    'S??? ph??ng ng??? / kinh nghi???m': 'S? ph?ng ng? / kinh nghi?m',
    'H?????ng nh??': 'H??ng nh?',
    'Ph??p l??': 'Ph?p l?',
    'Khu v???c': 'Khu v?c',
    'M?? t???': 'M? t?',
    'Link ???nh ho???c ???nh ???? upload': 'Link ?nh ho?c ?nh ?? upload',
    'Ho???c ch???n ???nh t??? m??y': 'Ho?c ch?n ?nh t? m?y',
    'Ghim tin n???i b???t': 'Ghim tin n?i b?t'
  };
  labels.forEach((label) => {
    const raw = (label.textContent || '').trim();
    if (labelMap[raw]) label.textContent = labelMap[raw];
  });

  const optionMap = {
    'Ch???n lo???i h??nh': 'Ch?n lo?i h?nh',
    'Nh?? b??n': 'Nh? b?n',
    '?????t n???n': '??t n?n',
    'Cho thu??': 'Cho thu?',
    'M???t b???ng': 'M?t b?ng',
    'Vi???c l??m': 'Vi?c l?m',
    'Ch???n h?????ng': 'Ch?n h??ng',
    '????ng': '??ng',
    'T??y': 'T?y',
    'Nam': 'Nam',
    'B???c': 'B?c',
    '????ng Nam': '??ng Nam',
    '????ng B???c': '??ng B?c',
    'T??y Nam': 'T?y Nam',
    'T??y B???c': 'T?y B?c',
    'Ch???n ph??p l??': 'Ch?n ph?p l?',
    'S??? h???ng ri??ng': 'S? h?ng ri?ng',
    'S??? ri??ng': 'S? ri?ng',
    'S??? h???ng ho??n c??ng': 'S? h?ng ho?n c?ng',
    'H???p ?????ng thu?? r?? r??ng': 'H?p ??ng thu? r? r?ng',
    'H???p ?????ng cho thu??': 'H?p ??ng cho thu?',
    'Ch???n khu v???c': 'Ch?n khu v?c',
    'G?? V???p - Ph?????ng 1': 'G? V?p - Ph??ng 1',
    'G?? V???p - Ph?????ng 5': 'G? V?p - Ph??ng 5',
    'G?? V???p - Ph?????ng 10': 'G? V?p - Ph??ng 10',
    'G?? V???p - Ph?????ng 17': 'G? V?p - Ph??ng 17',
    'Qu???n 12 - Hi???p Th??nh': 'Qu?n 12 - Hi?p Th?nh',
    'Qu???n 12 - Th???nh L???c': 'Qu?n 12 - Th?nh L?c',
    'Qu???n 12 - An Ph?? ????ng': 'Qu?n 12 - An Ph? ??ng',
    'Qu???n 12 - T??n Ch??nh Hi???p': 'Qu?n 12 - T?n Ch?nh Hi?p',
    'TP.HCM - Khu kh??c': 'TP.HCM - Khu kh?c',
    'T???t c??? lo???i h??nh': 'T?t c? lo?i h?nh',
    'T???t c??? khu v???c': 'T?t c? khu v?c'
  };
  document.querySelectorAll('option').forEach((option) => {
    const raw = (option.textContent || '').trim();
    if (optionMap[raw]) option.textContent = optionMap[raw];
  });

  const placeholders = {
    '#filterKeyword': 'Nh?p t? kh?a...',
    '#filterMinPrice': 'Gi? t?',
    '#filterMaxPrice': 'Gi? ??n',
    '#filterMinArea': 'Di?n t?ch t?',
    '#filterMaxArea': 'Di?n t?ch ??n',
    '#postDescription': 'M? t? v? tr?, di?n t?ch, ?u ?i?m, ph?p l?, n?i th?t ho?c nhu c?u tuy?n d?ng...'
  };
  Object.entries(placeholders).forEach(([selector, value]) => {
    const el = document.querySelector(selector);
    if (el) el.placeholder = value;
  });

  const uploadBtn = Array.from(document.querySelectorAll('button')).find((button) => /Upload/.test(button.textContent));
  if (uploadBtn) uploadBtn.textContent = 'Upload ảnh';
  const postSubmitBtn = document.getElementById('postSubmitBtn');
  if (postSubmitBtn) postSubmitBtn.textContent = 'Đăng tin ngay';
}

function initRevealOnScroll() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, {
    threshold: 0.16,
    rootMargin: "0px 0px -40px 0px"
  });

  items.forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index * 45, 220)}ms`;
    observer.observe(item);
  });
}

function initFaq() {
  const questions = document.querySelectorAll(".faq-question");
  if (!questions.length) return;

  questions.forEach((button) => {
    button.addEventListener("click", () => {
      const item = button.closest(".faq-item");
      if (!item) return;

      const isActive = item.classList.contains("active");
      document.querySelectorAll(".faq-item").forEach((faq) => faq.classList.remove("active"));
      if (!isActive) item.classList.add("active");
    });
  });
}

function initContactForm() {
  const form = document.getElementById("contactForm");
  const feedback = document.getElementById("contactFeedback");
  if (!form || !feedback) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = document.getElementById("contactName")?.value?.trim() || "bạn";
    feedback.textContent = `Đã nhận thông tin của ${name}. Đội ngũ sẽ liên hệ sớm để tư vấn hướng nâng cấp phù hợp cho website bất động sản của bạn.`;
    form.reset();
  });
}

function initAnchorScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      if (!href || href === "#") return;

      const target = document.querySelector(href);
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function initRealEstateConsultingCopy() {
  const section = document.getElementById("contactSection");
  if (!section) return;

  const tinyTitle = section.querySelector(".contact-copy .tiny-title");
  const heading = section.querySelector(".contact-copy h2");
  const paragraph = section.querySelector(".contact-copy p");
  const points = section.querySelectorAll(".contact-points span");
  const nameLabel = section.querySelector('label[for="contactName"]') || section.querySelectorAll("label")[0];
  const phoneLabel = section.querySelectorAll("label")[1];
  const needLabel = section.querySelectorAll("label")[3];
  const messageLabel = section.querySelectorAll("label")[4];
  const nameInput = document.getElementById("contactName");
  const phoneInput = document.getElementById("contactPhone");
  const needSelect = document.getElementById("contactNeed");
  const messageInput = document.getElementById("contactMessage");
  const submitButton = section.querySelector('.contact-actions .btn.btn-primary');
  const callButton = section.querySelector('.contact-actions .btn.btn-light');

  if (tinyTitle) tinyTitle.textContent = "Liên hệ tư vấn BĐS";
  if (heading) heading.textContent = "Tư vấn cách làm website bất động sản rõ ràng hơn, lên tin tốt hơn và tăng khách hỏi thật.";
  if (paragraph) paragraph.textContent = "Để lại thông tin nếu bạn muốn được tư vấn về cách đăng tin, chọn gói hiển thị, tối ưu khu vực trọng điểm và hành trình khách mua, khách thuê hoặc chủ tin bất động sản.";

  if (points[0]) points[0].textContent = "Tư vấn đăng tin bất động sản";
  if (points[1]) points[1].textContent = "Tối ưu gói VIP và hiển thị";
  if (points[2]) points[2].textContent = "Tăng lead khách mua và khách thuê";

  if (nameLabel) nameLabel.textContent = "Họ và tên";
  if (phoneLabel) phoneLabel.textContent = "Số điện thoại";
  if (needLabel) needLabel.textContent = "Nhu cầu";
  if (messageLabel) messageLabel.textContent = "Mô tả ngắn";

  if (nameInput) nameInput.placeholder = "Nguyễn Văn A";
  if (phoneInput) phoneInput.placeholder = "09xx xxx xxx";
  if (messageInput) messageInput.placeholder = "Mình cần tư vấn cách đăng tin, chọn gói hiển thị, tối ưu khu vực và làm website bất động sản chuyên nghiệp hơn để tăng khách hỏi thật...";

  if (needSelect) {
    needSelect.innerHTML = `
      <option value="Tư vấn tối ưu tin đăng bất động sản">Tư vấn tối ưu tin đăng bất động sản</option>
      <option value="Tư vấn gói VIP, boost và hiển thị">Tư vấn gói VIP, boost và hiển thị</option>
      <option value="Tư vấn website bán nhà, cho thuê, đất nền">Tư vấn website bán nhà, cho thuê, đất nền</option>
    `;
  }

  if (submitButton) submitButton.textContent = "Nhận tư vấn BĐS";
  if (callButton) callButton.textContent = "Gọi ngay 0908777102";
}

function initPlanCardBuyButtons() {
  const cards = document.querySelectorAll(".plan-card");
  if (!cards.length) return;

  cards.forEach((card) => {
    if (card.querySelector(".plan-buy-inline")) return;

    const price = card.querySelector(".plan-price");
    if (!price) return;

    const row = document.createElement("div");
    row.className = "plan-price-row";
    price.parentNode.insertBefore(row, price);
    row.appendChild(price);

    const buy = document.createElement("span");
    buy.className = "plan-buy-inline";
    buy.textContent = "Mua gÃ³i";
    buy.setAttribute("role", "button");
    buy.setAttribute("tabindex", "0");

    const activate = (event) => {
      event.preventDefault();
      event.stopPropagation();
      card.click();
      const paymentInfo = document.getElementById("paymentInfo");
      if (paymentInfo) {
        paymentInfo.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    };

    buy.addEventListener("click", activate);
    buy.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        activate(event);
      }
    });

    row.appendChild(buy);
  });
}

function initAccountModal() {
  const modalContent = document.getElementById("accountModalContent");
  const profileSection = document.querySelector("section.double-grid");
  if (!modalContent || !profileSection) return;

  profileSection.classList.add("account-section-embedded");
  modalContent.appendChild(profileSection);
}

function moveWalletSectionUp() {
  const walletHistory = document.getElementById("walletHistory");
  const postSection = document.getElementById("postSection");
  const content = document.querySelector(".content");
  const walletSection = walletHistory ? walletHistory.closest("section.panel") : null;
  if (!walletSection || !postSection || !content) return;

  content.insertBefore(walletSection, postSection);
}

function initListingFeedAdapter() {
  const list = document.getElementById("postList");
  if (!list) return;

  const adapt = () => {
    const cards = Array.from(list.querySelectorAll(".post-card"));
    if (!cards.length) return;

    list.className = "listing-feed";

    cards.forEach((card) => {
      if (card.classList.contains("listing-item")) return;

      const cover = card.querySelector(".post-cover");
      const image = card.querySelector(".post-image");
      const body = card.querySelector(".post-body");
      const title = card.querySelector(".post-title");
      const price = card.querySelector(".post-price");
      const meta = card.querySelector(".post-meta");
      const desc = card.querySelector(".post-desc");
      const seller = card.querySelector(".post-seller");
      const actions = card.querySelector(".card-actions");
      if (!cover || !image || !body || !title || !price || !meta || !desc || !seller || !actions) return;

      card.classList.remove("post-card");
      card.classList.add("listing-item");

      cover.classList.add("listing-media");
      image.classList.add("listing-image");
      body.classList.add("listing-content");

      const top = document.createElement("div");
      top.className = "listing-top";

      const copy = document.createElement("div");
      copy.className = "listing-copy";

      title.classList.add("listing-title");
      meta.classList.add("listing-meta");
      price.classList.add("listing-price");
      desc.classList.add("listing-desc");
      seller.classList.add("listing-seller");

      copy.appendChild(title);
      copy.appendChild(meta);
      top.appendChild(copy);
      top.appendChild(price);

      const bottom = document.createElement("div");
      bottom.className = "listing-bottom";
      bottom.appendChild(seller);
      bottom.appendChild(actions);

      body.innerHTML = "";
      body.appendChild(top);
      body.appendChild(desc);
      body.appendChild(bottom);
    });
  };

  const observer = new MutationObserver(() => {
    adapt();
  });

  observer.observe(list, { childList: true, subtree: true });
  adapt();
}

async function loadShowcasePosts() {
  const box = document.getElementById("showcaseList");
  if (!box) return;

  try {
    const posts = typeof fetchJSON === "function"
      ? await fetchJSON("/api/posts?sort=views")
      : await fetch("/api/posts?sort=views").then((res) => res.json());
    const rows = Array.isArray(posts) ? prioritizeShowcasePosts(posts) : [];

    if (!rows.length) {
      box.innerHTML = '<div class="empty-state">Chưa có tin nổi bật để hiển thị.</div>';
      return;
    }

    const categoryValue = (post) => String(post.category || "").trim().toLowerCase();
    const byCategory = (name) => rows.filter((post) => categoryValue(post) === name);

    showcaseState.allItems = rows.slice(0, 6);

    showcaseState.groups = {
      nha_ban: {
        label: "Nhà bán",
        items: byCategory("nhà bán")
      },
      dat_nen: {
        label: "Đất nền",
        items: byCategory("đất nền")
      },
      cho_thue: {
        label: "Cho thuê",
        items: byCategory("cho thuê")
      }
    };

    box.innerHTML = `
      <div class="showcase-tabs">
        ${Object.entries(showcaseState.groups).map(([key, group]) => `
          <button class="showcase-tab ${key === showcaseState.activeTab ? "active" : ""}" data-tab="${key}" type="button">
            ${group.label}
          </button>
        `).join("")}
      </div>
      <div class="showcase-carousel-shell">
        <button class="showcase-nav showcase-prev" type="button" aria-label="Xem mục trước">&#8249;</button>
        <div class="showcase-viewport">
          <div class="showcase-track" id="showcaseTrack"></div>
        </div>
        <button class="showcase-nav showcase-next" type="button" aria-label="Xem mục sau">&#8250;</button>
      </div>
      <div class="showcase-dots" id="showcaseDots"></div>
    `;

    bindShowcaseTabs();
    bindShowcaseNav();
    renderShowcaseTrack();
  } catch {
    box.innerHTML = '<div class="empty-state">Không thể tải tin nổi bật ngoài trang chủ.</div>';
  }
}

function prioritizeShowcasePosts(posts) {
  const featured = posts.filter((post) => Number(post.is_featured) === 1);
  const normal = posts.filter((post) => Number(post.is_featured) !== 1);
  return [...featured, ...normal].slice(0, 12);
}

function bindShowcaseTabs() {
  document.querySelectorAll(".showcase-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      showcaseState.activeTab = tab.dataset.tab;
      document.querySelectorAll(".showcase-tab").forEach((item) => {
        item.classList.toggle("active", item === tab);
      });
      renderShowcaseTrack();
    });
  });
}

function bindShowcaseNav() {
  const viewport = document.querySelector(".showcase-viewport");
  const prev = document.querySelector(".showcase-prev");
  const next = document.querySelector(".showcase-next");
  if (!viewport || !prev || !next) return;

  prev.addEventListener("click", () => {
    scrollShowcaseByCard(-1);
  });

  next.addEventListener("click", () => {
    scrollShowcaseByCard(1);
  });

  viewport.addEventListener("scroll", syncShowcaseDots);
}

function renderShowcaseTrack() {
  const track = document.getElementById("showcaseTrack");
  const viewport = document.querySelector(".showcase-viewport");
  const current = showcaseState.groups[showcaseState.activeTab];
  if (!track || !viewport || !current) return;

  const fallbackItems = (showcaseState.allItems || []).slice(0, 6);
  const baseItems = current.items.length ? [...current.items] : [];
  const usedIds = new Set(baseItems.map((post) => Number(post.id)));
  const supplementItems = (showcaseState.allItems || []).filter((post) => !usedIds.has(Number(post.id)));
  const items = baseItems.length
    ? [...baseItems, ...supplementItems].slice(0, 6)
    : fallbackItems;

  track.innerHTML = items.map((post) => renderShowcaseCard(post)).join("");
  viewport.scrollTo({ left: 0, behavior: "auto" });
  renderShowcaseDots(items.length);
  syncShowcaseDots();
}

function renderShowcaseCard(post) {
  const title = escapeHtml(post.title || "Tin bất động sản");
  const location = escapeHtml(post.location || "TP.HCM");
  const badge = post.is_featured ? "TIN NỔI BẬT" : "TIN MỚI";

  return `
    <article class="showcase-card fade-in">
      <div class="showcase-cover">
        <div class="showcase-card-top">
          <span class="showcase-time">8 giờ trước</span>
          <button class="showcase-heart" type="button" onclick="toggleFavorite(${Number(post.id)})" aria-label="Lưu tin">♡</button>
        </div>
        <div class="showcase-badge ${post.is_featured ? "featured" : ""}">${badge}</div>
        <img
          class="showcase-image"
          src="${post.image || "https://via.placeholder.com/800x600?text=No+Image"}"
          alt="${title}"
          onerror="this.src='https://via.placeholder.com/800x600?text=No+Image'"
        >
      </div>
      <div class="showcase-body">
        <div class="showcase-title">${title}</div>
        <div class="showcase-price">${formatCurrency(post.price)}</div>
        <div class="showcase-location">📍 ${location}</div>
        <button class="showcase-link" type="button" onclick="viewDetail(${Number(post.id)})">Xem chi tiết</button>
      </div>
    </article>
  `;
}
function renderShowcaseDots(count) {
  const dots = document.getElementById("showcaseDots");
  if (!dots) return;

  dots.innerHTML = Array.from({ length: count }, (_, index) => `
    <button
      class="showcase-dot ${index === 0 ? "active" : ""}"
      type="button"
      data-index="${index}"
      aria-label="Äi tá»›i tin ${index + 1}"
    ></button>
  `).join("");

  dots.querySelectorAll(".showcase-dot").forEach((dot) => {
    dot.addEventListener("click", () => {
      scrollShowcaseToIndex(Number(dot.dataset.index || 0));
    });
  });
}

function getShowcaseStep() {
  const firstCard = document.querySelector(".showcase-card");
  if (!firstCard) return 260;

  const parentStyles = window.getComputedStyle(firstCard.parentElement);
  const gap = parseFloat(parentStyles.columnGap || parentStyles.gap || "12") || 12;
  return firstCard.getBoundingClientRect().width + gap;
}

function scrollShowcaseByCard(direction) {
  const viewport = document.querySelector(".showcase-viewport");
  if (!viewport) return;

  viewport.scrollBy({
    left: getShowcaseStep() * direction,
    behavior: "smooth"
  });
}

function scrollShowcaseToIndex(index) {
  const viewport = document.querySelector(".showcase-viewport");
  if (!viewport) return;

  viewport.scrollTo({
    left: getShowcaseStep() * index,
    behavior: "smooth"
  });
}

function syncShowcaseDots() {
  const viewport = document.querySelector(".showcase-viewport");
  const dots = document.querySelectorAll(".showcase-dot");
  if (!viewport || !dots.length) return;

  const activeIndex = Math.round(viewport.scrollLeft / getShowcaseStep());
  dots.forEach((dot, index) => {
    dot.classList.toggle("active", index === activeIndex);
  });
}

function formatCurrency(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")} đ`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}


