(function () {
  "use strict";

  // ===== کمک‌کننده‌ها =====
  const escapeHtml = (v) =>
    String(v).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
    );

  const formatValue = (col, v) =>
    col.key === "price" && typeof v === "number"
      ? v.toLocaleString("en-US")
      : String(v);

  // ===== یک بلوک جدول (وضعیت انتخاب مستقل برای هر بلوک) =====
  function mountTable(block, table) {
    const q = (role) => block.querySelector(`[data-role="${role}"]`);
    const el = {
      categories: q("categories"),
      subNav: q("subNav"),
      tabs: q("tabs"),
      title: q("title"),
      head: q("priceHead"),
      body: q("priceBody"),
      download: q("download"),
      notes: q("notes"),
    };

    const cats = table.categories || [];
    const state = { catId: null, subId: null, tabId: null };

    // ===== دسترسی به داده‌های انتخاب‌شده =====
    const currentCat = () => cats.find((c) => c.id === state.catId) || null;

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

    // ===== رندر =====
    function renderCategories() {
      el.categories.innerHTML = cats
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
      const cat = currentCat();
      const sub = currentSub();
      const tab = currentTab();

      // عنوان: جدول + نام کارت (دسته) + نام تب
      el.title.textContent =
        cat && tab ? `جدول قیمت ${cat.name} ${tab.name}` : "جدول قیمت";

      if (!sub || !tab) {
        el.head.innerHTML = "";
        el.body.innerHTML = `<tr><td class="empty-cell">به زودی</td></tr>`;
        return;
      }

      // تعیین ستون‌ها: اولویت با ستون‌های تب، در غیر این صورت ستون‌های زیرشاخه
      const columns = tab.columns || sub.columns;

      el.head.innerHTML = columns
        .map((c) => `<th>${escapeHtml(c.label)}</th>`)
        .join("");

      if (!tab.rows.length) {
        el.body.innerHTML = `<tr><td class="empty-cell" colspan="${columns.length}">به زودی</td></tr>`;
        return;
      }

      el.body.innerHTML = tab.rows
        .map(
          (row) => `
          <tr>
            ${columns
              .map(
                (col, i) =>
                  `<td class="${col.key === "price" ? "price" : ""}">${escapeHtml(formatValue(col, row[i]))}</td>`
              )
              .join("")}
          </tr>`
        )
        .join("");
    }

    // یادداشت‌ها از data/notes.js، کلید: دسته|زیرشاخه|تب
    function renderNotes() {
      const cat = currentCat();
      const sub = currentSub();
      const tab = currentTab();
      if (!cat || !sub || !tab) {
        el.notes.innerHTML = "";
        return;
      }
      const key = [cat.name, sub.name, tab.name].join("|");
      const lines = (typeof TAB_NOTES !== "undefined" && TAB_NOTES[key]) || [];
      el.notes.innerHTML = lines.map((l) => `<p>${escapeHtml(l)}</p>`).join("");
    }

    function renderAll() {
      renderCategories();
      renderSubNav();
      renderTabs();
      renderTable();
      renderNotes();
    }

    // ===== انتخاب‌ها =====
    function selectCategory(id) {
      const cat = cats.find((c) => c.id === id);
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

      const columns = tab.columns || sub.columns;

      const cell = (v) => `"${String(v).replace(/"/g, '""')}"`;
      const lines = [columns.map((c) => cell(c.label)).join(",")];
      tab.rows.forEach((row) =>
        lines.push(columns.map((c, i) => cell(row[i])).join(","))
      );

      // BOM برای نمایش درست فارسی در Excel
      const blob = new Blob(["﻿" + lines.join("\r\n")], {
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
    if (cats.length) {
      selectCategory(cats[0].id);
    } else {
      renderAll();
    }
  }

  // ===== اجرا برای هر بلوک جدول در صفحه =====
  const tablesById = new Map(
    ((typeof CATALOG !== "undefined" && CATALOG.tables) || []).map((t) => [t.id, t])
  );

  document.querySelectorAll(".table-block[data-table]").forEach((block) => {
    const table = tablesById.get(block.dataset.table) || { categories: [] };
    mountTable(block, table);
  });
})();
