/* ============================================================
   Sprint Calendar — Storage Module
   localStorage wrapper with typed get/set and defaults
   ============================================================ */

const Storage = (() => {
  const STORAGE_KEY = 'sprintCalendar';

  const DEFAULTS = {
    sprintDuration: 14,       // days (7, 14, 21, 28)
    sprintStartDate: null,    // ISO date string or null
    theme: 'dark',            // 'light', 'dark', 'system'
    googleClientId: '',       // Google OAuth Client ID string
  };

  /**
   * Get the full config object, merged with defaults
   */
  function getFullConfig() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULTS };
      const stored = JSON.parse(raw);
      return { ...DEFAULTS, ...stored };
    } catch (e) {
      console.warn('Storage: failed to read config, using defaults', e);
      return { ...DEFAULTS };
    }
  }

  /**
   * Get a single config value by key
   */
  function getConfig(key) {
    const config = getFullConfig();
    return config[key] !== undefined ? config[key] : DEFAULTS[key];
  }

  /**
   * Set a single config value
   */
  function setConfig(key, value) {
    try {
      const config = getFullConfig();
      config[key] = value;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
      console.error('Storage: failed to save config', e);
    }
  }

  /**
   * Set multiple config values at once
   */
  function setMultiple(updates) {
    try {
      const config = getFullConfig();
      Object.assign(config, updates);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
      console.error('Storage: failed to save config', e);
    }
  }

  /**
   * Clear all stored configuration
   */
  function clearConfig() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Storage: failed to clear config', e);
    }
  }

  /**
   * Check if user has configured sprints
   */
  function hasSprintConfig() {
    const config = getFullConfig();
    return config.sprintStartDate !== null;
  }

  return {
    getFullConfig,
    getConfig,
    setConfig,
    setMultiple,
    clearConfig,
    hasSprintConfig,
    DEFAULTS,
  };
})();
