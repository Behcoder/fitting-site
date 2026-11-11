(function () {
  "use strict";

  const menuButton = document.getElementById("mobileMenuToggle");
  const nav = document.getElementById("mainNav");
  if (menuButton && nav) {
    menuButton.addEventListener("click", function () {
      const open = menuButton.getAttribute("aria-expanded") !== "true";
      menuButton.setAttribute("aria-expanded", String(open));
      menuButton.setAttribute("aria-label", open ? "بستن منو" : "باز کردن منو");
      nav.classList.toggle("is-open", open);
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.setAttribute("aria-label", "باز کردن منو");
      });
    });
    document.addEventListener("click", function (event) {
      if (!nav.contains(event.target) && !menuButton.contains(event.target)) {
        nav.classList.remove("is-open");
        menuButton.setAttribute("aria-expanded", "false");
      }
    });
  }

  function openCategory(categoryId, tableId, subId, tabId) {
    const block = document.querySelector('.table-block[data-table="' + tableId + '"]');
    if (!block) return false;
    const categoryButton = block.querySelector('[data-cat="' + categoryId + '"]');
    if (!categoryButton) return false;
    categoryButton.click();
    if (subId) {
      const subButton = block.querySelector('[data-sub="' + subId + '"]');
      if (subButton) subButton.click();
    }
    if (tabId) {
      const tabButton = block.querySelector('[data-tab="' + tabId + '"]');
      if (tabButton) tabButton.click();
    }
    block.scrollIntoView({ behavior: "smooth", block: "start" });
    return true;
  }

  const engineeringForm = document.getElementById("engineeringForm");
  const productSelect = document.getElementById("deskProduct");
  if (engineeringForm && productSelect) {
    engineeringForm.addEventListener("submit", function (event) {
      event.preventDefault();
      const option = productSelect.options[productSelect.selectedIndex];
      const tableId = option.dataset.table || (option.value.indexOf("T2-") === 0 ? "table2" : "table1");
      const opened = openCategory(option.value, tableId);
      if (!opened) {
        const target = document.getElementById("catalog");
        if (target) target.scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  // Search against the existing catalogue data and open the matching category/subcategory/tab.
  const searchForm = document.getElementById("siteSearch");
  const searchInput = document.getElementById("siteSearchInput");
  if (searchForm && searchInput) {
    searchForm.addEventListener("submit", function (event) {
      event.preventDefault();
      const query = searchInput.value.trim().toLocaleLowerCase("fa-IR");
      if (!query) {
        searchInput.focus();
        return;
      }
      if (typeof CATALOG === "undefined" || !Array.isArray(CATALOG.tables)) return;

      let match = null;
      outer: for (const table of CATALOG.tables) {
        for (const category of table.categories || []) {
          const categoryName = String(category.name || "").toLocaleLowerCase("fa-IR");
          if (categoryName.includes(query)) {
            match = { tableId: table.id, categoryId: category.id };
            break outer;
          }
          for (const sub of category.subcategories || []) {
            const subName = String(sub.name || "").toLocaleLowerCase("fa-IR");
            if (subName.includes(query)) {
              match = { tableId: table.id, categoryId: category.id, subId: sub.id };
              const tabs = sub.tabs || [];
              const foundTab = tabs.find(function (tab) {
                return String(tab.name || "").toLocaleLowerCase("fa-IR").includes(query);
              });
              if (foundTab) match.tabId = foundTab.id;
              break outer;
            }
          }
        }
      }

      if (match) {
        openCategory(match.categoryId, match.tableId, match.subId, match.tabId);
      } else {
        searchInput.setCustomValidity("موردی با این عبارت در دسته‌بندی فعلی پیدا نشد.");
        searchInput.reportValidity();
        searchInput.addEventListener("input", function clearValidity() {
          searchInput.setCustomValidity("");
          searchInput.removeEventListener("input", clearValidity);
        }, { once: true });
      }
    });
  }

  // Small entrance treatment; content remains visible when reduced motion is requested.
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const observed = document.querySelectorAll(".engineering-desk, .catalog-section, .journal-section, .closing-content");
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    observed.forEach(function (element) { observer.observe(element); });
  }
})();
