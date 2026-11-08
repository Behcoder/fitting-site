(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const el = {
    categories: $("categories"),
    subNav: $("subNav"),
    tabs: $("tabs"),
    title: $("panelTitle"),
    head: $("priceHead"),
    body: $("priceBody"),
    download: $("downloadBtn"),
  };

  const state = { catId: null, subId: null, tabId: null };

  // ===== دسترسی به داده‌های انتخاب‌شده =====
  const currentCat = () =>
    CATALOG.categories.find((c) => c.id === state.catId) || null;

  const currentSub = () => {
    const cat = currentCat();
    if (!cat) return null;
    return cat.subcategories.find((s) => s.id === state.subId) || null;
  };

  const currentTab = () => {
    const sub = currentSub();
    if (!sub || !sub.tabs.length) return null;
    return sub.tabs.find((t) => t.id === state.tabId) || sub.tabs[0];
  };

  // ===== کمک‌کننده‌ها =====
  const escapeHtml = (v) =>
    String(v).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
    );

  const formatValue = (col, v) =>
    col.key === "price" && typeof v === "number"
      ? v.toLocaleString("en-US")
      : String(v);

  // ===== رندر =====
  function renderCategories() {
    el.categories.innerHTML = CATALOG.categories
      .map(
        (cat) => `
        <button type="button" class="cat-card ${cat.id === state.catId ? "active" : ""}" data-cat="${cat.id}">
          <span class="cat-img">${cat.image ? `<img src="${cat.image}" alt="">` : ""}</span>
          <span class="cat-name">${escapeHtml(cat.name)}</span>
        </button>`
      )
      .join("");
  }

  function renderSubNav() {
    const cat = currentCat();
    if (!cat || !cat.subcategories.length) {
      el.subNav.innerHTML = `<span class="empty-cell">به زودی</span>`;
      return;
    }
    el.subNav.innerHTML = cat.subcategories
      .map(
        (s) => `
        <button type="button" class="sub-item ${s.id === state.subId ? "active" : ""}" data-sub="${s.id}">
          ${escapeHtml(s.name)}
        </button>`
      )
      .join("");
  }

  function renderTabs() {
    const sub = currentSub();
    const tab = currentTab();
    if (!sub || sub.tabs.length < 2) {
      el.tabs.style.display = "none";
      el.tabs.innerHTML = "";
      return;
    }
    el.tabs.style.display = "flex";
    el.tabs.innerHTML = sub.tabs
      .map(
        (t) => `
        <button type="button" class="tab ${t.id === tab.id ? "active" : ""}" data-tab="${t.id}">
          ${escapeHtml(t.name)}
        </button>`
      )
      .join("");
  }

  function renderTable() {
    const sub = currentSub();
    const tab = currentTab();

    el.title.textContent = sub ? `جدول قیمت ${sub.name}` : "جدول قیمت";

    if (!sub || !tab) {
      el.head.innerHTML = "";
      el.body.innerHTML = `<tr><td class="empty-cell">به زودی</td></tr>`;
      return;
    }

    el.head.innerHTML = sub.columns
      .map((c) => `<th>${escapeHtml(c.label)}</th>`)
      .join("");

    if (!tab.rows.length) {
      el.body.innerHTML = `<tr><td class="empty-cell" colspan="${sub.columns.length}">به زودی</td></tr>`;
      return;
    }

    el.body.innerHTML = tab.rows
      .map(
        (row) => `
        <tr>
          ${sub.columns
            .map(
              (col, i) =>
                `<td class="${col.key === "price" ? "price" : ""}">${escapeHtml(formatValue(col, row[i]))}</td>`
            )
            .join("")}
        </tr>`
      )
      .join("");
  }

  function renderAll() {
    renderCategories();
    renderSubNav();
    renderTabs();
    renderTable();
  }

  // ===== انتخاب‌ها =====
  function selectCategory(id) {
    const cat = CATALOG.categories.find((c) => c.id === id);
    if (!cat) return;
    state.catId = id;
    state.subId = cat.subcategories[0] ? cat.subcategories[0].id : null;
    state.tabId = null;
    renderAll();
  }

  function selectSub(id) {
    state.subId = id;
    state.tabId = null;
    renderAll();
  }

  function selectTab(id) {
    state.tabId = id;
    renderAll();
  }

  // ===== دانلود CSV از جدول فعلی =====
  function downloadCsv() {
    const sub = currentSub();
    const tab = currentTab();
    if (!sub || !tab || !tab.rows.length) return;

    const cell = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const lines = [sub.columns.map((c) => cell(c.label)).join(",")];
    tab.rows.forEach((row) =>
      lines.push(sub.columns.map((c, i) => cell(row[i])).join(","))
    );

    // BOM برای نمایش درست فارسی در Excel
    const blob = new Blob(["\uFEFF" + lines.join("\r\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sub.name}-${tab.name}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // ===== رویدادها (delegation) =====
  el.categories.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-cat]");
    if (btn) selectCategory(btn.dataset.cat);
  });

  el.subNav.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-sub]");
    if (btn) selectSub(btn.dataset.sub);
  });

  el.tabs.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-tab]");
    if (btn) selectTab(btn.dataset.tab);
  });

  el.download.addEventListener("click", downloadCsv);

  // ===== شروع =====
  if (CATALOG.categories.length) {
    selectCategory(CATALOG.categories[0].id);
  }
})();