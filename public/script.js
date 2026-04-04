let showcaseState = {
  groups: {},
  activeTab: "nha_ban"
};

document.addEventListener("DOMContentLoaded", () => {
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
    buy.textContent = "Mua gói";
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
    const response = await fetch("/api/posts?sort=views");
    const posts = await response.json();
    const rows = Array.isArray(posts) ? prioritizeShowcasePosts(posts) : [];

    if (!rows.length) {
      box.innerHTML = `<div class="empty-state">Chưa có tin nổi bật để hiển thị.</div>`;
      return;
    }

    showcaseState.groups = {
      nha_ban: {
        label: "Nhà bán",
        items: rows.filter((post) => post.category === "Nhà bán")
      },
      dat_nen: {
        label: "Đất nền",
        items: rows.filter((post) => post.category === "Đất nền")
      },
      cho_thue: {
        label: "Cho thuê",
        items: rows.filter((post) => post.category === "Cho thuê")
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
    box.innerHTML = `<div class="empty-state">Không thể tải tin nổi bật ngoài trang chủ.</div>`;
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

  const fallbackItems = Object.values(showcaseState.groups)
    .flatMap((group) => group.items)
    .slice(0, 6);
  const baseItems = current.items.length ? [...current.items] : [];
  const usedIds = new Set(baseItems.map((post) => Number(post.id)));
  const supplementItems = Object.values(showcaseState.groups)
    .flatMap((group) => group.items)
    .filter((post) => !usedIds.has(Number(post.id)));
  const items = baseItems.length
    ? [...baseItems, ...supplementItems].slice(0, Math.max(4, baseItems.length))
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
      aria-label="Đi tới tin ${index + 1}"
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
