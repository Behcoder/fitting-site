// ============================================================
// js/palette.js — انتخاب پالت رنگی با دکمه‌های پایین صفحه
// قواعد:
//  - «پیش‌فرض» یعنی نمای خود تم فعلی: تم تیره = Industrial Precision، تم روشن = بدون پالت.
//  - انتخاب یکی از پالت‌های پایین صفحه در localStorage ('sf-palette') ذخیره و اولویت دارد.
//  - کلیک روی دکمه تم بالا (رویداد sf:theme-change) اولویت را می‌گیرد:
//    انتخاب پایین پاک می‌شود، دکمه‌ها روی «پیش‌فرض» می‌روند و تم تغییر می‌کند.
// ============================================================
(function () {
  var KEY = 'sf-palette';
  var DARK_DEFAULT = 'precision';
  var root = document.documentElement;
  var buttons = document.querySelectorAll('[data-palette-btn]');

  function savedChoice() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function saveChoice(value) {
    try {
      if (value) localStorage.setItem(KEY, value);
      else localStorage.removeItem(KEY);
    } catch (e) {}
  }

  function isDark() {
    return root.getAttribute('data-theme') !== 'light';
  }

  // پالتی که واقعاً روی صفحه اعمال می‌شود
  function effectivePalette(choice) {
    if (choice && choice !== 'default') return choice;
    return isDark() ? DARK_DEFAULT : null;
  }

  function render() {
    var choice = savedChoice();
    var effective = effectivePalette(choice);
    if (effective) root.setAttribute('data-palette', effective);
    else root.removeAttribute('data-palette');

    var pressed = choice && choice !== 'default' ? choice : 'default';
    buttons.forEach(function (b) {
      var on = (b.dataset.paletteBtn || 'default') === pressed;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  buttons.forEach(function (b) {
    b.addEventListener('click', function () {
      var key = b.dataset.paletteBtn;
      saveChoice(key === 'default' ? null : key);
      render();
    });
  });

  // کلیک روی دکمه تم بالا: اولویت با آن است و پالت پایین به «پیش‌فرض» برمی‌گردد
  document.addEventListener('sf:theme-change', function () {
    saveChoice(null);
    render();
  });

  render();
})();
