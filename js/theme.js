// ============================================================
// js/theme.js — تغییر تم تیره/روشن با دکمه بالای صفحه
// تم اولیه را اسکریپت inline داخل <head> اعمال می‌کند؛ این فایل فقط دکمه را به‌کار می‌اندازد.
// کلیک روی این دکمه در اولویت است: انتخاب پالت پایین صفحه پاک می‌شود (پیش‌فرض)
// و به js/palette.js با رویداد sf:theme-change خبر داده می‌شود.
// ============================================================
(function () {
  var KEY = 'sf-theme';
  var root = document.documentElement;
  var btn = document.getElementById('themeToggle');
  if (!btn) return;

  function current() {
    return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }

  function apply(theme) {
    root.setAttribute('data-theme', theme);
    var toLight = theme === 'dark'; // دکمه همیشه تمِ مقابل را پیشنهاد می‌دهد
    var label = toLight ? 'تغییر به تم روشن' : 'تغییر به تم تیره';
    btn.setAttribute('aria-pressed', theme === 'light' ? 'true' : 'false');
    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', toLight ? 'تم روشن' : 'تم تیره');
  }

  btn.addEventListener('click', function () {
    var next = current() === 'light' ? 'dark' : 'light';
    apply(next);
    try { localStorage.setItem(KEY, next); } catch (e) {}
    document.dispatchEvent(new CustomEvent('sf:theme-change', { detail: next }));
  });

  apply(current());
})();
