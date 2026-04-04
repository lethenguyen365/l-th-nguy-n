const currency = (v) => Number(v || 0).toLocaleString("vi-VN") + " đ";
async function fetchJSON(url, options = {}){ const res = await fetch(url, options); const data = await res.json(); if (!res.ok) throw new Error(data.message || "Có lỗi."); return data; }

async function loadSummary(){
  try{
    const s = await fetchJSON("/api/admin/summary");
    sumUsers.textContent = s.users;
    sumPosts.textContent = s.posts;
    sumRevenue.textContent = currency(s.revenue);
    sumPending.textContent = s.pendingPayments;
    sumFavorites.textContent = s.favorites;
  }catch(err){ alert(err.message); location.href = "/"; }
}

async function loadUsers(){
  const rows = await fetchJSON("/api/admin/users");
  userTableWrap.innerHTML = `<div class="table-wrap"><table><thead><tr><th>ID</th><th>Họ tên</th><th>Username</th><th>Email</th><th>Vai trò</th><th>Trạng thái</th><th>Hành động</th></tr></thead><tbody>
    ${rows.map(u => `<tr><td>${u.id}</td><td>${u.full_name}</td><td>${u.username}</td><td>${u.email}</td><td>${u.role}</td><td>${u.is_active ? "Hoạt động" : "Đã khóa"}</td><td><button class="btn btn-dark" onclick="toggleUser(${u.id})">${u.is_active ? "Khóa" : "Mở khóa"}</button></td></tr>`).join("")}
  </tbody></table></div>`;
}
async function toggleUser(id){ const data = await fetchJSON(`/api/admin/users/${id}/toggle`, { method:"PUT" }); alert(data.message); await loadUsers(); }

async function loadPostsAdmin(){
  const rows = await fetchJSON("/api/admin/posts");
  postTableWrap.innerHTML = `<div class="table-wrap"><table><thead><tr><th>ID</th><th>Tiêu đề</th><th>User</th><th>Danh mục</th><th>Giá</th><th>Views</th><th>Ghim</th><th>Xóa</th></tr></thead><tbody>
    ${rows.map(p => `<tr><td>${p.id}</td><td>${p.title}</td><td>${p.full_name} (@${p.username})</td><td>${p.category}</td><td>${currency(p.price)}</td><td>${p.views}</td><td>${p.is_featured ? "Có" : "Không"}</td><td><button class="btn btn-danger" onclick="deletePostAdmin(${p.id})">Xóa</button></td></tr>`).join("")}
  </tbody></table></div>`;
}
async function deletePostAdmin(id){ if (!confirm("Xóa bài đăng này?")) return; const data = await fetchJSON(`/api/posts/${id}`, { method:"DELETE" }); alert(data.message); await loadPostsAdmin(); await loadSummary(); }

async function loadSubscriptions(){
  const rows = await fetchJSON("/api/admin/subscriptions");
  subscriptionTableWrap.innerHTML = `<div class="table-wrap"><table><thead><tr><th>ID</th><th>User</th><th>Gói</th><th>Giá</th><th>Thời hạn</th><th>Trạng thái</th><th>Nội dung CK</th><th>Hành động</th></tr></thead><tbody>
    ${rows.map(s => `<tr><td>${s.id}</td><td>${s.full_name} (@${s.username})</td><td>${s.package_name}</td><td>${currency(s.price)}</td><td>${s.start_date} → ${s.end_date}</td><td>${s.status}</td><td>${s.payment_note}</td><td><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-primary" onclick="approveSub(${s.id})">Duyệt</button><button class="btn btn-danger" onclick="rejectSub(${s.id})">Từ chối</button></div></td></tr>`).join("")}
  </tbody></table></div>`;
}
async function approveSub(id){ const data = await fetchJSON(`/api/admin/subscriptions/${id}/approve`, { method:"PUT" }); alert(data.message); await loadSubscriptions(); await loadSummary(); }
async function rejectSub(id){ const data = await fetchJSON(`/api/admin/subscriptions/${id}/reject`, { method:"PUT" }); alert(data.message); await loadSubscriptions(); await loadSummary(); }

async function loadSettings(){
  const st = await fetchJSON("/api/admin/settings");
  stSiteName.value = st.site_name || "";
  stSiteSlogan.value = st.site_slogan || "";
  stQrImage.value = st.qr_image || "";
  stHeroBanner.value = st.hero_banner || "";
  stBankName.value = st.bank_name || "";
  stBankAccountName.value = st.bank_account_name || "";
  stBankAccountNumber.value = st.bank_account_number || "";
  stTransferNotePrefix.value = st.transfer_note_prefix || "";
  stAnnouncement.value = st.announcement || "";
}

settingsForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = await fetchJSON("/api/admin/settings", {
    method:"PUT", headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({
      site_name: stSiteName.value, site_slogan: stSiteSlogan.value, qr_image: stQrImage.value,
      hero_banner: stHeroBanner.value, bank_name: stBankName.value, bank_account_name: stBankAccountName.value,
      bank_account_number: stBankAccountNumber.value, transfer_note_prefix: stTransferNotePrefix.value,
      announcement: stAnnouncement.value
    })
  });
  alert(data.message);
});

async function logoutAdmin(){ await fetchJSON("/api/logout", { method:"POST" }); location.href = "/"; }

loadSummary(); loadUsers(); loadPostsAdmin(); loadSubscriptions(); loadTopups(); loadAiOps(); loadSettings();


async function loadTopups(){
  const rows = await fetchJSON("/api/admin/topups");
  topupTableWrap.innerHTML = `<div class="table-wrap"><table><thead><tr><th>ID</th><th>User</th><th>Số tiền</th><th>Trạng thái</th><th>Nội dung CK</th><th>Hành động</th></tr></thead><tbody>
    ${rows.map(t => `<tr><td>${t.id}</td><td>${t.full_name} (@${t.username})</td><td>${currency(t.amount)}</td><td>${t.status}</td><td>${t.payment_note}</td><td><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-primary" onclick="approveTopup(${t.id})">Duyệt</button><button class="btn btn-danger" onclick="rejectTopup(${t.id})">Từ chối</button></div></td></tr>`).join("")}
  </tbody></table></div>`;
}
async function approveTopup(id){ const data = await fetchJSON(`/api/admin/topups/${id}/approve`, { method:"PUT" }); alert(data.message); await loadTopups(); await loadSummary(); }
async function rejectTopup(id){ const data = await fetchJSON(`/api/admin/topups/${id}/reject`, { method:"PUT" }); alert(data.message); await loadTopups(); await loadSummary(); }


async function loadAiOps(){
  const [reports, actions] = await Promise.all([
    fetchJSON("/api/admin/ai/reports"),
    fetchJSON("/api/admin/ai/actions")
  ]);

  aiOpsSummary.innerHTML = `
    <div class="info-list">
      <div class="info-card"><strong>Báo cáo AI</strong><div>${reports.length}</div></div>
      <div class="info-card"><strong>Hành động AI</strong><div>${actions.length}</div></div>
    </div>`;

  aiReportsWrap.innerHTML = `<div class="table-wrap"><table><thead><tr><th>ID</th><th>Loại</th><th>Tiêu đề</th><th>Nội dung</th><th>Thời gian</th></tr></thead><tbody>
    ${reports.map(r => `<tr><td>${r.id}</td><td>${r.report_type}</td><td>${r.title}</td><td>${r.body}</td><td>${r.created_at}</td></tr>`).join("")}
  </tbody></table></div>`;

  aiActionsWrap.innerHTML = `<div class="table-wrap"><table><thead><tr><th>ID</th><th>Post</th><th>User</th><th>Loại</th><th>Trạng thái</th><th>Ghi chú</th><th>Thời gian</th></tr></thead><tbody>
    ${actions.map(a => `<tr><td>${a.id}</td><td>${a.post_id || ""}</td><td>${a.user_id || ""}</td><td>${a.action_type}</td><td>${a.action_status}</td><td>${a.note || ""}</td><td>${a.created_at}</td></tr>`).join("")}
  </tbody></table></div>`;
}

async function runAiRenewal(){
  const data = await fetchJSON("/api/ai/renewal-reminders", { method: "POST" });
  alert(data.message);
  await loadAiOps();
}

async function runAiVip(){
  const data = await fetchJSON("/api/ai/vip-suggestions", { method: "POST" });
  alert(data.message);
  await loadAiOps();
}

async function runAiSpam(){
  const data = await fetchJSON("/api/ai/spam-scan", { method: "POST" });
  alert(data.message);
  await loadAiOps();
}
