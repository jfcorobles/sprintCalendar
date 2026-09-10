/* ============================================================
   Sprint Calendar — Theme Manager
   Fixed Dark Theme (VS Code / Antigravity Style)
   ============================================================ */

const ThemeManager = (() => {
  function init() {
    applyDarkTheme();
  }

  function applyDarkTheme() {
    document.documentElement.setAttribute('data-theme', 'dark');

    // Update meta theme-color for mobile browsers
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.content = '#1e1e1e';
    }

    Storage.setConfig('theme', 'dark');
  }

  function getTheme() {
    return 'dark';
  }

  return {
    init,
    applyTheme: applyDarkTheme,
    getTheme,
  };
})();
