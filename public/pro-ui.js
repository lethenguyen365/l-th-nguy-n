(function () {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const money = (value) => {
    const num = Number(value || 0);
    if (!num) return "Liên hệ";
    return num.toLocaleString("vi-VN") + " đ";
  };
  const escapeHtml = (value) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  const normalize = (value) =>
    String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  const fixText = (value) =>
    typeof window.maybeFixVietnameseMojibake === "function"
      ? window.maybeFixVietnameseMojibake(String(value ?? ""))
      : String(value ?? "");

  const fallbackDescriptions = {
    saleHome: "Nhà 1 trệt 2 lầu, hẻm xe hơi, gần chợ Hạnh Thông Tây, sổ hồng riêng, khu dân cư an ninh.",
    land: "Lô đất đẹp vuông vức, ngang tốt, khu dân cư hiện hữu, phù hợp đầu tư hoặc xây ở.",
    rent: "Căn hộ mini full nội thất, khu dân cư an ninh, phù hợp khách thuê cần vào ở ngay.",
    shop: "Mặt bằng kinh doanh sáng, khu dân cư đông, thuận tiện mở shop, văn phòng hoặc dịch vụ.",
    job: "Công ty cần tuyển nhân viên kinh doanh bất động sản. Không yêu cầu kinh nghiệm, được đào tạo từ đầu, có lương cứng và hoa hồng."
  };

  const hasBrokenVietnamese = (value) =>
    /�|Ã|Â|Ä|Æ|áº|á»|Lđ|Nhđ|trđt|đp|vương vức|L t p|vung vc|ng t,|khu dn|c hi|ph hp|hoc xy|Nh 1 tr|hm xe hi|gn ch|Hnh Thng|s hng|Cng ty|cn tuyn|bt ng sn|Khng yu cu|kinh nghim|c o to|lng cng|c ng|c n tuyển|thuc|c\.n|n\.i|th\.t/i.test(String(value || ""));

  const getPostFallback = (post) => {
    const title = normalize(fixText(post.title || ""));
    const category = normalize(fixText(post.category || ""));
    if (title.includes("metro") || category.includes("dat nen")) return { category: "Đất nền", description: fallbackDescriptions.land };
    if (title.includes("tuyen") || category.includes("viec lam")) return { category: "Việc làm", description: fallbackDescriptions.job };
    if (title.includes("mat bang") || category.includes("mat bang")) return { category: "Mặt bằng", description: fallbackDescriptions.shop };
    if (title.includes("cho thue") || category.includes("cho thue")) return { category: "Cho thuê", description: fallbackDescriptions.rent };
    if (title.includes("ban nha") || category.includes("nha ban")) return { category: "Nhà bán", description: fallbackDescriptions.saleHome };
    return null;
  };

  const fetchJSONPro = async (url, options) => {
    if (typeof window.fetchJSON === "function") return window.fetchJSON(url, options);
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Không tải được dữ liệu");
    return data;
  };

  const currentUser = () => {
    try {
      return JSON.parse(localStorage.getItem("currentUser") || "null");
    } catch {
      return null;
    }
  };

  const getInitials = (name) =>
    String(name || "VN")
      .split(/\s+/)
      .filter(Boolean)
      .slice(-2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();

  const getPrimaryImage = (post) => {
    const list = post.images || post.image_list || post.gallery;
    if (Array.isArray(list) && list.length) return list[0];
    if (typeof list === "string" && list.trim()) {
      try {
        const parsed = JSON.parse(list);
        if (Array.isArray(parsed) && parsed.length) return parsed[0];
      } catch {
        return list.split(",")[0].trim();
      }
    }
    return post.image || post.image_url || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1000&q=80";
  };

  const buildQuery = () => {
    const params = new URLSearchParams();
    const keyword = ($("#filterKeyword")?.value || $("#searchKeyword")?.value || "").trim();
    const category = $("#filterCategory")?.value || window.currentCategory || "";
    const sort = $("#sortSelect")?.value || "";
    if (keyword) params.set("q", keyword);
    if (category) params.set("category", category);
    if (sort) params.set("sort", sort);
    return params.toString();
  };

  const getFilters = () => ({
    keyword: ($("#filterKeyword")?.value || $("#searchKeyword")?.value || "").trim(),
    category: $("#filterCategory")?.value || window.currentCategory || "",
    location: $("#filterLocation")?.value || "",
    minPrice: Number($("#filterMinPrice")?.value || 0),
    maxPrice: Number($("#filterMaxPrice")?.value || 0),
    minArea: Number($("#filterMinArea")?.value || 0),
    maxArea: Number($("#filterMaxArea")?.value || 0),
    bedrooms: $("#filterBedrooms")?.value || "",
    direction: $("#filterDirection")?.value || "",
    legal: $("#filterLegal")?.value || "",
    sort: $("#sortSelect")?.value || "",
  });

  const passesClientFilters = (post, filters) => {
    const haystack = normalize(
      [post.title, post.description, post.location, post.category, post.legal, post.direction, post.seller_name].join(" "),
    );
    if (filters.keyword && !haystack.includes(normalize(filters.keyword))) return false;
    if (filters.location && !normalize(post.location).includes(normalize(filters.location))) return false;
    if (filters.minPrice && Number(post.price || 0) < filters.minPrice) return false;
    if (filters.maxPrice && Number(post.price || 0) > filters.maxPrice) return false;
    if (filters.minArea && Number(post.area || 0) < filters.minArea) return false;
    if (filters.maxArea && Number(post.area || 0) > filters.maxArea) return false;
    if (filters.bedrooms && String(post.bedrooms || "") !== String(filters.bedrooms)) return false;
    if (filters.direction && normalize(post.direction) !== normalize(filters.direction)) return false;
    if (filters.legal && normalize(post.legal) !== normalize(filters.legal)) return false;
    return true;
  };

  const sortPosts = (posts, sort) => {
    const list = [...posts];
    if (sort === "price_asc") list.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    if (sort === "price_desc") list.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    if (sort === "views") list.sort((a, b) => Number(b.views || 0) - Number(a.views || 0));
    if (sort === "featured") list.sort((a, b) => Number(b.featured || 0) - Number(a.featured || 0));
    return list;
  };

  const formatTime = (value) => {
    if (!value) return "Vừa đăng";
    const raw = String(value).replace("T", " ");
    const date = new Date(raw.includes("Z") ? raw : raw.replace(" ", "T"));
    if (Number.isNaN(date.getTime())) return raw;
    return date.toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const showToast = (message) => {
    let toast = $(".pro-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "pro-toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
  };

  const renderActiveFilters = (filters) => {
    const target = $(".pro-active-filters");
    if (!target) return;
    const labels = [
      ["keyword", filters.keyword && `Từ khóa: ${filters.keyword}`],
      ["category", filters.category && `Danh mục: ${filters.category}`],
      ["location", filters.location && `Khu vực: ${filters.location}`],
      ["price", (filters.minPrice || filters.maxPrice) && `Giá: ${money(filters.minPrice)} - ${money(filters.maxPrice)}`],
      ["area", (filters.minArea || filters.maxArea) && `Diện tích: ${filters.minArea || 0} - ${filters.maxArea || "∞"} m²`],
      ["bedrooms", filters.bedrooms && `${filters.bedrooms} phòng ngủ`],
      ["direction", filters.direction && `Hướng ${filters.direction}`],
      ["legal", filters.legal && `Pháp lý: ${filters.legal}`],
    ].filter((item) => item[1]);

    target.innerHTML = labels.length
      ? labels
          .map(
            ([key, label]) =>
              `<span class="pro-filter-chip">${escapeHtml(label)} <button type="button" data-clear-filter="${key}" aria-label="Bỏ lọc">×</button></span>`,
          )
          .join("") +
        `<button class="pro-filter-chip" type="button" data-clear-filter="all">Xóa tất cả</button>`
      : "";
  };

  const clearFilter = (key) => {
    if (key === "all") {
      ["filterKeyword", "searchKeyword", "filterCategory", "filterLocation", "filterMinPrice", "filterMaxPrice", "filterMinArea", "filterMaxArea", "filterBedrooms", "filterDirection", "filterLegal"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.value = "";
      });
      window.currentCategory = "";
      window.proLoadPosts?.();
      return;
    }
    const map = {
      keyword: ["filterKeyword", "searchKeyword"],
      category: ["filterCategory"],
      location: ["filterLocation"],
      price: ["filterMinPrice", "filterMaxPrice"],
      area: ["filterMinArea", "filterMaxArea"],
      bedrooms: ["filterBedrooms"],
      direction: ["filterDirection"],
      legal: ["filterLegal"],
    };
    (map[key] || []).forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
    if (key === "category") window.currentCategory = "";
    window.proLoadPosts?.();
  };

  const renderCard = (post) => {
    const title = escapeHtml(fixText(post.title || "Tin bất động sản đang cập nhật"));
    const location = escapeHtml(fixText(post.location || "TP.HCM"));
    const fallback = getPostFallback(post);
    const fixedCategory = fixText(post.category || "Tin đăng");
    const fixedDescription = fixText(post.description || "Tin đăng đang được người bán cập nhật thêm thông tin chi tiết.");
    const category = escapeHtml(fallback && hasBrokenVietnamese(fixedCategory) ? fallback.category : fixedCategory);
    const seller = escapeHtml(fixText(post.seller_name || post.user_name || post.full_name || "Người đăng tin"));
    const description = escapeHtml(fallback && hasBrokenVietnamese(fixedDescription) ? fallback.description : fixedDescription);
    const isFeatured = Number(post.featured || post.is_featured || 0) > 0;
    const views = Number(post.views || 0);
    const phone = post.phone || post.seller_phone || "";
    return `
      <article class="post-card pro-listing-card fade-in" data-post-id="${post.id}">
        <div class="pro-listing-media">
          <img src="${escapeHtml(getPrimaryImage(post))}" alt="${title}" loading="lazy" />
          <div class="pro-badge-row">
            <span class="pro-badge dark">${formatTime(post.created_at || post.updated_at)}</span>
            ${isFeatured ? '<span class="pro-badge gold">Tin nổi bật</span>' : '<span class="pro-badge">Tin mới</span>'}
            <span class="pro-badge">Xác minh khu vực</span>
          </div>
          <div class="pro-card-actions">
            <button type="button" onclick="toggleFavorite(${Number(post.id)})" aria-label="Yêu thích">♡</button>
            <button type="button" onclick="proSharePost(${Number(post.id)})" aria-label="Chia sẻ">↗</button>
          </div>
        </div>
        <div class="pro-listing-body">
          <h3 class="pro-listing-title">${title}</h3>
          <div class="pro-price">${money(post.price)}</div>
          <div class="pro-meta-grid">
            <span class="pro-meta">📍 ${location}</span>
            <span class="pro-meta">🏷 ${category}</span>
            ${post.area ? `<span class="pro-meta">📐 ${escapeHtml(fixText(post.area))} m²</span>` : ""}
            ${post.bedrooms ? `<span class="pro-meta">🛏 ${escapeHtml(fixText(post.bedrooms))} PN</span>` : ""}
            ${views ? `<span class="pro-meta">👁 ${views} lượt xem</span>` : ""}
          </div>
          <p class="pro-desc">${description}</p>
          <div class="pro-listing-footer">
            <div class="pro-seller">
              <span class="pro-avatar">${escapeHtml(getInitials(seller))}</span>
              <span>${seller}<br><small>Phản hồi nhanh</small></span>
            </div>
            <button class="pro-card-cta" type="button" onclick="viewDetail(${Number(post.id)})">Xem chi tiết</button>
          </div>
          ${phone ? `<a class="pro-card-cta" href="tel:${escapeHtml(phone)}">Gọi ${escapeHtml(phone)}</a>` : ""}
        </div>
      </article>`;
  };

  const renderLoading = () => {
    const target = $("#postList");
    if (!target) return;
    target.innerHTML = '<div class="pro-skeleton"></div><div class="pro-skeleton"></div><div class="pro-skeleton"></div><div class="pro-skeleton"></div>';
  };

  const proLoadPosts = async () => {
    const target = $("#postList");
    if (!target) return;
    renderLoading();
    try {
      const filters = getFilters();
      const query = buildQuery();
      let posts = await fetchJSONPro("/api/posts" + (query ? `?${query}` : ""));
      if (!Array.isArray(posts)) posts = posts.posts || [];
      posts = posts.filter((post) => passesClientFilters(post, filters));
      posts = sortPosts(posts, filters.sort);
      window.__lastProPosts = posts;
      renderActiveFilters(filters);
      if (!posts.length) {
        target.innerHTML = `
          <div class="pro-empty-state">
            <h3>Chưa có tin phù hợp</h3>
            <p>Thử nới rộng khu vực, mức giá hoặc xóa bớt bộ lọc để xem nhiều tin hơn.</p>
            <button class="primary-btn" type="button" data-clear-filter="all">Xóa bộ lọc</button>
          </div>`;
        return;
      }
      target.innerHTML = posts.map(renderCard).join("");
    } catch (error) {
      target.innerHTML = `
        <div class="pro-empty-state">
          <h3>Không tải được danh sách tin</h3>
          <p>${escapeHtml(error.message || "Vui lòng thử lại sau vài giây.")}</p>
          <button class="primary-btn" type="button" onclick="proLoadPosts()">Tải lại</button>
        </div>`;
    }
  };

  const proViewDetail = async (id) => {
    const target = $("#detailContent");
    if (!target) return;
    target.innerHTML = '<div class="pro-skeleton"></div>';
    window.openModal?.("detailModal");
    try {
      const post = await fetchJSONPro(`/api/posts/${id}`);
      const title = escapeHtml(fixText(post.title || "Tin đăng bất động sản"));
      const location = escapeHtml(fixText(post.location || "TP.HCM"));
      const seller = escapeHtml(fixText(post.seller_name || post.user_name || post.full_name || "Người đăng tin"));
      const phone = escapeHtml(post.phone || post.seller_phone || "0908 777 102");
      const related = (window.__lastProPosts || [])
        .filter((item) => Number(item.id) !== Number(id))
        .slice(0, 3);
      target.innerHTML = `
        <div class="pro-detail">
          <div>
            <div class="pro-detail-gallery">
              <img src="${escapeHtml(getPrimaryImage(post))}" alt="${title}" />
            </div>
            <section class="pro-detail-main">
              <div class="pro-badge-row" style="position:static;margin-bottom:10px">
                <span class="pro-badge gold">${escapeHtml(fixText(post.category || "Tin đăng"))}</span>
                <span class="pro-badge">Mã tin #${Number(post.id)}</span>
                <span class="pro-badge">Đã xác minh khu vực</span>
              </div>
              <h2 class="pro-detail-title">${title}</h2>
              <div class="pro-detail-price">${money(post.price)}</div>
              <div class="pro-detail-info">
                <div class="pro-info-item"><span>Khu vực</span><b>${location}</b></div>
                <div class="pro-info-item"><span>Diện tích</span><b>${escapeHtml(fixText(post.area || "Đang cập nhật"))} m²</b></div>
                <div class="pro-info-item"><span>Phòng ngủ</span><b>${escapeHtml(fixText(post.bedrooms || "Đang cập nhật"))}</b></div>
                <div class="pro-info-item"><span>Pháp lý</span><b>${escapeHtml(fixText(post.legal || post.legal_status || "Trao đổi khi liên hệ"))}</b></div>
                <div class="pro-info-item"><span>Hướng</span><b>${escapeHtml(fixText(post.direction || post.house_direction || "Không yêu cầu"))}</b></div>
                <div class="pro-info-item"><span>Ngày đăng</span><b>${formatTime(post.created_at)}</b></div>
              </div>
              <h3>Mô tả chi tiết</h3>
              <p style="white-space:pre-line;line-height:1.8;color:var(--pro-muted);font-weight:650">${escapeHtml(
                fixText(post.description || "Người đăng đang cập nhật mô tả. Bấm liên hệ để nhận thông tin nhanh hơn."),
              )}</p>
            </section>
            ${
              related.length
                ? `<section class="pro-detail-main"><h3>Tin tương tự trong khu vực</h3><div class="pro-meta-grid">${related
                    .map(
                      (item) =>
                        `<button class="pro-meta" type="button" onclick="viewDetail(${Number(item.id)})">${escapeHtml(fixText(item.title || "Tin đăng"))} · ${money(item.price)}</button>`,
                    )
                    .join("")}</div></section>`
                : ""
            }
          </div>
          <aside class="pro-detail-contact">
            <div class="pro-contact-card">
              <span class="pro-avatar" style="width:58px;height:58px;font-size:18px">${escapeHtml(getInitials(seller))}</span>
              <h3>${seller}</h3>
              <p>Người đăng đã xác minh khu vực. Liên hệ trực tiếp để hỏi giá, lịch xem và tình trạng tin.</p>
              <div class="pro-contact-actions">
                <a class="call" href="tel:${phone}">Gọi ngay ${phone}</a>
                <a class="zalo" href="https://zalo.me/${phone.replace(/\D/g, "")}" target="_blank" rel="noreferrer">Nhắn Zalo</a>
                <button class="light" type="button" onclick="toggleFavorite(${Number(post.id)})">Lưu tin yêu thích</button>
                <button class="light" type="button" onclick="proSharePost(${Number(post.id)})">Chia sẻ tin</button>
              </div>
            </div>
          </aside>
        </div>`;
    } catch (error) {
      target.innerHTML = `<div class="pro-empty-state"><h3>Không mở được tin</h3><p>${escapeHtml(error.message)}</p></div>`;
    }
  };

  const injectHero = () => {
    const hero = $(".hero-section");
    const left = $(".hero-left");
    if (!hero || !left || $(".pro-hero-search")) return;
    const headline = left.querySelector("h1, h2");
    const copy = left.querySelector("p");
    if (headline) headline.textContent = "Tìm nhà, đất và việc làm đúng khu vực chỉ trong vài phút.";
    if (copy) {
      copy.textContent =
        "Nền tảng đăng tin tập trung Gò Vấp, Quận 12 và TP.HCM. Tìm nhanh theo nhu cầu thật, liên hệ rõ ràng, thông tin dễ kiểm tra.";
    }
    const heroSearch = document.createElement("div");
    heroSearch.className = "pro-hero-search";
    heroSearch.innerHTML = `
      <input id="proHeroKeyword" type="search" placeholder="Nhập khu vực, giá, loại nhà hoặc công việc..." />
      <button class="primary-btn" type="button" id="proHeroSearchBtn">Tìm ngay</button>`;
    left.appendChild(heroSearch);
    const chips = document.createElement("div");
    chips.className = "pro-hero-chips";
    chips.innerHTML = `
      <button type="button" data-pro-quick="Gò Vấp">Gò Vấp</button>
      <button type="button" data-pro-quick="Quận 12">Quận 12</button>
      <button type="button" data-pro-category="Nhà bán">Nhà bán</button>
      <button type="button" data-pro-category="Cho thuê">Cho thuê</button>`;
    left.appendChild(chips);
  };

  const injectCategorySection = () => {
    if ($(".pro-category-section")) return;
    const hero = $(".hero-section");
    if (!hero) return;
    const section = document.createElement("section");
    section.className = "pro-section pro-category-section";
    section.innerHTML = `
      <div class="pro-section-head">
        <div>
          <span class="section-pill">Danh mục trọng điểm</span>
          <h2>Tìm nhanh đúng loại nhu cầu</h2>
          <p>Lọc trước theo nhóm tin phổ biến để xem đúng danh sách phù hợp, ít nhiễu và dễ liên hệ hơn.</p>
        </div>
      </div>
      <div class="pro-category-rail">
        ${[
          ["🏠", "Nhà bán", "Nhà phố, hẻm xe hơi, nhà ở thật"],
          ["🔑", "Đất nền", "Đất khu dân cư, sổ rõ ràng"],
          ["🏢", "Cho thuê", "Phòng, căn hộ, nhà nguyên căn"],
          ["🏬", "Mặt bằng", "Mặt tiền, kinh doanh, văn phòng"],
          ["💼", "Việc làm", "Tuyển dụng quanh khu vực BĐS"],
        ]
          .map(
            ([icon, title, text]) =>
              `<article class="pro-category-card" data-pro-category="${title}"><div class="icon">${icon}</div><h3>${title}</h3><p>${text}</p></article>`,
          )
          .join("")}
      </div>`;
    hero.insertAdjacentElement("afterend", section);
  };

  const injectRegionSection = () => {
    if ($(".pro-region-section")) return;
    const categorySection = $(".pro-category-section");
    if (!categorySection) return;
    const section = document.createElement("section");
    section.className = "pro-section pro-region-section";
    section.innerHTML = `
      <div class="pro-section-head">
        <div>
          <span class="section-pill">Khu vực đang được quan tâm</span>
          <h2>Lọc nhanh theo nơi có nhu cầu thật</h2>
          <p>Ưu tiên các khu vực người mua, người thuê và chủ tin đang tìm nhiều để tiết kiệm thời gian lọc.</p>
        </div>
      </div>
      <div class="pro-category-rail">
        <article class="pro-region-card" data-pro-quick="Gò Vấp">
          <strong>Gò Vấp</strong>
          <span>Nhà ở · phòng thuê · mặt bằng</span>
          <p>Khu dân cư đông, nhu cầu thuê và mua bán nhà phố ổn định.</p>
        </article>
        <article class="pro-region-card" data-pro-quick="Quận 12">
          <strong>Quận 12</strong>
          <span>Đất nền · nhà bán · thuê ở</span>
          <p>Phù hợp người tìm diện tích rộng hơn, giá mềm hơn trung tâm.</p>
        </article>
        <article class="pro-region-card" data-pro-quick="TP.HCM">
          <strong>TP.HCM</strong>
          <span>BĐS · việc làm · dịch vụ</span>
          <p>Mở rộng tìm kiếm theo nhiều nhóm tin đang có nhu cầu thực tế.</p>
        </article>
      </div>`;
    categorySection.insertAdjacentElement("afterend", section);
  };

  const injectTrustSection = () => {
    if ($(".pro-trust-section")) return;
    const packages = $("#packagesSection");
    if (!packages) return;
    const section = document.createElement("section");
    section.className = "pro-section pro-trust-section";
    section.innerHTML = `
      <div class="pro-section-head">
        <div>
          <span class="section-pill">Vì sao nên đăng tin tại đây</span>
          <h2>Tập trung đúng khu vực, đúng người cần</h2>
          <p>Thiết kế luồng đăng tin để người bán, chủ nhà và nhà tuyển dụng trình bày thông tin rõ hơn, tăng khả năng nhận liên hệ thật.</p>
        </div>
      </div>
      <div class="pro-category-rail">
        <article class="pro-category-card"><div class="icon">📍</div><h3>Khu vực rõ</h3><p>Ưu tiên Gò Vấp, Quận 12 và TP.HCM để người tìm dễ lọc.</p></article>
        <article class="pro-category-card"><div class="icon">⚡</div><h3>Liên hệ nhanh</h3><p>CTA gọi, Zalo và lưu tin được đặt ở vị trí dễ thao tác.</p></article>
        <article class="pro-category-card"><div class="icon">✅</div><h3>Tin dễ kiểm tra</h3><p>Thông tin giá, diện tích, pháp lý, thời gian đăng được trình bày rõ.</p></article>
        <article class="pro-category-card"><div class="icon">📈</div><h3>Có gói nổi bật</h3><p>Gói hiển thị giúp tin quan trọng xuất hiện chuyên nghiệp hơn.</p></article>
      </div>`;
    packages.insertAdjacentElement("beforebegin", section);
  };

  const setupFilters = () => {
    const content = $(".content");
    const sidebar = $(".sidebar");
    if (content && !$(".pro-active-filters")) {
      const active = document.createElement("div");
      active.className = "pro-active-filters";
      content.insertAdjacentElement("afterbegin", active);
    }
    if (content && !$(".pro-mobile-filter-btn")) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pro-mobile-filter-btn";
      btn.textContent = "Bộ lọc & sắp xếp";
      btn.addEventListener("click", () => document.body.classList.add("filter-sheet-open"));
      content.insertAdjacentElement("beforebegin", btn);
    }
    if (sidebar && !$(".pro-filter-close", sidebar)) {
      const close = document.createElement("button");
      close.type = "button";
      close.className = "pro-filter-close";
      close.style.display = "none";
      close.textContent = "Đóng bộ lọc";
      close.addEventListener("click", () => document.body.classList.remove("filter-sheet-open"));
      sidebar.prepend(close);
    }
    document.addEventListener("click", (event) => {
      const clearBtn = event.target.closest("[data-clear-filter]");
      if (clearBtn) clearFilter(clearBtn.dataset.clearFilter);
      const quickLocation = event.target.closest("[data-pro-quick]");
      if (quickLocation) {
        const input = $("#filterLocation");
        if (input) input.value = quickLocation.dataset.proQuick;
        window.proLoadPosts?.();
        $("#marketSection")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      const quickCategory = event.target.closest("[data-pro-category]");
      if (quickCategory) {
        const value = quickCategory.dataset.proCategory;
        const input = $("#filterCategory");
        if (input) input.value = value;
        window.currentCategory = value;
        window.proLoadPosts?.();
        $("#marketSection")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });

    let timer;
    ["filterKeyword", "searchKeyword", "proHeroKeyword"].forEach((id) => {
      const input = document.getElementById(id);
      if (!input) return;
      input.addEventListener("input", () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          const keyword = input.value;
          ["filterKeyword", "searchKeyword", "proHeroKeyword"].forEach((targetId) => {
            const target = document.getElementById(targetId);
            if (target && target !== input) target.value = keyword;
          });
          window.proLoadPosts?.();
        }, 280);
      });
    });
    ["filterCategory", "filterLocation", "sortSelect", "filterMinPrice", "filterMaxPrice", "filterMinArea", "filterMaxArea", "filterBedrooms", "filterDirection", "filterLegal"].forEach((id) => {
      const input = document.getElementById(id);
      if (input) input.addEventListener("change", () => window.proLoadPosts?.());
    });
    $("#proHeroSearchBtn")?.addEventListener("click", () => {
      const keyword = $("#proHeroKeyword")?.value || "";
      ["filterKeyword", "searchKeyword"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.value = keyword;
      });
      window.proLoadPosts?.();
      $("#marketSection")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    window.setCategory = (category) => {
      const input = $("#filterCategory");
      if (input) input.value = category || "";
      window.currentCategory = category || "";
      window.proLoadPosts?.();
      $("#marketSection")?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
  };

  const enhancePackages = () => {
    $$(".plan-card").forEach((card) => {
      const text = normalize(card.textContent);
      if (text.includes("vip") || text.includes("pro") || text.includes("hot")) {
        card.classList.add("recommended");
        card.dataset.proRecommended = "true";
      }
      if (!$(".pro-plan-benefits", card)) {
        const benefits = document.createElement("ul");
        benefits.className = "pro-plan-benefits";
        benefits.innerHTML = `
          <li>Hiển thị nổi bật hơn trong danh sách tin</li>
          <li>Tăng độ tin cậy với badge gói dịch vụ</li>
          <li>Phù hợp khi cần tìm khách nhanh trong khu vực</li>`;
        card.appendChild(benefits);
      }
    });
  };

  const enhancePostForm = () => {
    const form = $("#postForm");
    const section = $("#postSection");
    if (!form || !section || $(".pro-post-stepper")) return;
    const stepper = document.createElement("div");
    stepper.className = "pro-post-stepper";
    stepper.innerHTML = `
      <div class="pro-step active"><b>1. Loại tin</b>Chọn danh mục và khu vực</div>
      <div class="pro-step"><b>2. Thông tin</b>Giá, diện tích, thuộc tính</div>
      <div class="pro-step"><b>3. Hình ảnh</b>Ảnh rõ, đúng thực tế</div>
      <div class="pro-step"><b>4. Gói đăng</b>Chọn hiển thị phù hợp</div>`;
    form.insertAdjacentElement("beforebegin", stepper);

    if (!form.parentElement.classList.contains("pro-form-shell")) {
      const shell = document.createElement("div");
      shell.className = "pro-form-shell";
      form.insertAdjacentElement("beforebegin", shell);
      shell.appendChild(form);
      const preview = document.createElement("aside");
      preview.className = "pro-preview-card";
      preview.innerHTML = `
        <div class="pro-preview-head">
          <span class="pro-badge gold">Xem trước</span>
          <h3>Tin sẽ hiển thị như thế nào?</h3>
          <p>Nội dung bên dưới cập nhật theo thông tin bạn đang nhập.</p>
        </div>
        <article class="pro-preview-listing" id="postLivePreview"></article>`;
      shell.appendChild(preview);
    }

    const draftKey = "proPostDraft";
    const fields = $$("input, select, textarea", form).filter((el) => el.id);
    const renderPreview = () => {
      const previewCard = $("#postLivePreview");
      if (!previewCard) return;

      const data = {
        title: fixText($("#postTitle")?.value || ""),
        category: fixText($("#postCategory")?.value || ""),
        price: $("#postPrice")?.value || "",
        location: fixText($("#postLocation")?.value || ""),
        description: fixText($("#postDescription")?.value || ""),
        image: $("#postImage")?.value || "",
        area: $("#postArea")?.value || "",
        bedrooms: $("#postBedrooms")?.value || "",
        featured: $("#postFeatured")?.checked || false
      };

      const title = data.title || "Tiêu đề tin đăng của bạn";
      const category = data.category || "Loại tin";
      const location = data.location || "Khu vực";
      const description = data.description || "Mô tả ngắn về vị trí, ưu điểm, pháp lý, nội thất hoặc nhu cầu tuyển dụng sẽ hiển thị tại đây.";
      const imageBlock = data.image
        ? `<img src="${escapeHtml(data.image)}" alt="${escapeHtml(title)}" onerror="this.closest('.pro-preview-image').classList.add('is-empty');this.remove();">`
        : "";

      previewCard.innerHTML = `
        <div class="pro-preview-image ${data.image ? "" : "is-empty"}">
          ${imageBlock}
          <span>${data.featured ? "Tin nổi bật" : "Ảnh tin đăng"}</span>
        </div>
        <div class="pro-preview-content">
          <div class="pro-preview-title">${escapeHtml(title)}</div>
          <div class="pro-preview-price">${escapeHtml(money(data.price))}</div>
          <div class="pro-preview-meta">
            <span>📍 ${escapeHtml(location)}</span>
            <span>🏷 ${escapeHtml(category)}</span>
            ${data.area ? `<span>📐 ${escapeHtml(data.area)} m²</span>` : ""}
            ${data.bedrooms ? `<span>${category === "Việc làm" ? "💼" : "🛏"} ${escapeHtml(data.bedrooms)} ${category === "Việc làm" ? "năm KN" : "PN"}</span>` : ""}
          </div>
          <p>${escapeHtml(description)}</p>
        </div>`;
    };

    window.updatePostPreview = renderPreview;
    try {
      const saved = JSON.parse(localStorage.getItem(draftKey) || "{}");
      fields.forEach((el) => {
        if (saved[el.id] && !el.value && el.type !== "file") el.value = saved[el.id];
      });
    } catch {
      localStorage.removeItem(draftKey);
    }
    fields.forEach((el) => {
      el.addEventListener("input", () => {
        const data = {};
        fields.forEach((field) => {
          if (field.type !== "file") data[field.id] = field.value;
        });
        localStorage.setItem(draftKey, JSON.stringify(data));
        renderPreview();
      });
      el.addEventListener("change", renderPreview);
    });
    renderPreview();
  };

  const enhanceCopy = () => {
    const brandTitle = $(".brand-title h1, .brand-title .brand-name");
    const brandSub = $(".brand-title p");
    if (brandTitle) brandTitle.textContent = "Việc Làm Nhà Đất";
    if (brandSub) brandSub.textContent = "Đăng tin và tìm bất động sản, việc làm quanh Gò Vấp, Quận 12, TP.HCM.";

    const contactTitle = $(".contact-copy h2");
    const contactText = $(".contact-copy p");
    if (contactTitle) contactTitle.textContent = "Cần tư vấn mua bán hoặc đăng tin hiệu quả?";
    if (contactText) {
      contactText.textContent =
        "Để lại thông tin, đội ngũ hỗ trợ sẽ gợi ý cách chọn khu vực, định giá, tối ưu nội dung và gói hiển thị phù hợp.";
    }

    const packageTitle = $("#packagesSection h2");
    const packageIntro = $("#packagesSection .section-header p, #packagesSection .section-intro p");
    if (packageTitle) packageTitle.textContent = "Chọn gói hiển thị phù hợp mục tiêu đăng tin";
    if (packageIntro) packageIntro.textContent = "Gói cơ bản để bắt đầu, gói nổi bật để tăng khả năng được nhìn thấy, gói VIP/PRO cho tin cần ra khách nhanh hơn.";
  };

  const setupShare = () => {
    window.proSharePost = async (id) => {
      const post = (window.__lastProPosts || []).find((item) => Number(item.id) === Number(id));
      const url = `${location.origin}${location.pathname}#post-${id}`;
      const title = post?.title || "Tin đăng Việc Làm Nhà Đất";
      try {
        if (navigator.share) await navigator.share({ title, url });
        else {
          await navigator.clipboard.writeText(url);
          showToast("Đã sao chép liên kết tin đăng.");
        }
      } catch {
        showToast("Chưa chia sẻ được, vui lòng thử lại.");
      }
    };
  };

  const setupFloatingActions = () => {
    const chat = $(".floating-messenger");
    if (chat) {
      chat.setAttribute("href", "#");
      chat.setAttribute("aria-label", "Mở chat hỗ trợ");
      chat.addEventListener("click", (event) => {
        event.preventDefault();
        if (typeof window.openChatPopup === "function") window.openChatPopup();
        else $("#chatPopup")?.classList.add("open");
      });
    }
    $(".floating-zalo")?.setAttribute("aria-label", "Nhắn Zalo");
    $(".floating-call")?.setAttribute("aria-label", "Gọi tư vấn");
  };

  const initProUi = () => {
    document.body.classList.add("pro-ui");
    injectHero();
    injectCategorySection();
    injectRegionSection();
    injectTrustSection();
    enhanceCopy();
    setupFilters();
    enhancePackages();
    enhancePostForm();
    setupShare();
    setupFloatingActions();
    window.proLoadPosts = proLoadPosts;
    window.loadPosts = proLoadPosts;
    window.viewDetail = proViewDetail;
    setTimeout(proLoadPosts, 80);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initProUi);
  } else {
    initProUi();
  }
})();
