/* ============================================================
   Sprint Calendar — Theme Manager
   Handles dark/light/system theme switching
   ============================================================ */

const ThemeManager = (() => {
  let currentTheme = 'dark';

  /**
   * Initialize the theme manager
   */
  function init() {
    currentTheme = Storage.getConfig('theme') || 'dark';
    applyTheme(currentTheme);
    bindEvents();
    listenSystemThemeChange();
  }

  /**
   * Apply a theme to the document
   */
  function applyTheme(theme) {
    currentTheme = theme;

    if (theme === 'system') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }

    // Update meta theme-color for mobile browsers
    const isDark = theme === 'dark' || (theme === 'system' && getSystemTheme() === 'dark');
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.content = isDark ? '#0f0f1a' : '#f8f9fc';
    }

    Storage.setConfig('theme', theme);
    updateToggleUI();
  }

  /**
   * Get the system's preferred color scheme
   */
  function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  /**
   * Get current theme
   */
  function getTheme() {
    return currentTheme;
  }

  /**
   * Update the toggle UI to reflect the active theme
   */
  function updateToggleUI() {
    const options = document.querySelectorAll('.theme-toggle__option');
    options.forEach(option => {
      const isActive = option.dataset.theme === currentTheme;
      option.classList.toggle('is-active', isActive);
      option.setAttribute('aria-checked', isActive ? 'true' : 'false');
    });
  }

  /**
   * Bind click events to theme toggle options
   */
  function bindEvents() {
    const toggle = document.querySelector('.theme-toggle');
    if (toggle) {
      toggle.addEventListener('click', (e) => {
        const option = e.target.closest('.theme-toggle__option');
        if (option) {
          const newTheme = option.dataset.theme;
          applyTheme(newTheme);
        }
      });
    }
  }

  /**
   * Listen for system theme changes (when "system" is selected)
   */
  function listenSystemThemeChange() {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (currentTheme === 'system') {
        // Re-apply system to trigger meta tag update
        applyTheme('system');
      }
    });
  }

  return {
    init,
    applyTheme,
    getTheme,
    getSystemTheme,
  };
})();
