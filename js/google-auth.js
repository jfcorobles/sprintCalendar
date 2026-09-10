/* ============================================================
   Sprint Calendar — Google Auth Module
   OAuth2 authentication with Google Identity Services
   ============================================================ */

const GoogleAuth = (() => {
  // ⚠️ Replace with your own Google Cloud Console Client ID
  // Go to: https://console.cloud.google.com/apis/credentials
  // Create an OAuth 2.0 Client ID (Web application type)
  // Add your deployment URL to Authorized JavaScript origins
  // Enable the Google Calendar API in your project
  const CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
  const SCOPES = 'https://www.googleapis.com/auth/calendar.events';

  let accessToken = null;
  let tokenClient = null;
  let isInitialized = false;
  let onAuthChangeCallbacks = [];

  /**
   * Initialize Google Identity Services
   */
  function init() {
    // Load GIS library dynamically
    if (document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
      setupTokenClient();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setupTokenClient();
    };
    script.onerror = () => {
      console.warn('GoogleAuth: Failed to load Google Identity Services');
    };
    document.head.appendChild(script);
  }

  /**
   * Set up the token client after GIS loads
   */
  function setupTokenClient() {
    if (typeof google === 'undefined' || !google.accounts) {
      console.warn('GoogleAuth: Google Identity Services not available');
      return;
    }

    try {
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: handleTokenResponse,
      });
      isInitialized = true;
    } catch (e) {
      console.warn('GoogleAuth: Failed to initialize token client', e);
    }
  }

  /**
   * Handle the OAuth token response
   */
  function handleTokenResponse(response) {
    if (response.error) {
      console.error('GoogleAuth: Token error', response.error);
      accessToken = null;
      notifyAuthChange(false);
      return;
    }

    accessToken = response.access_token;
    notifyAuthChange(true);
    updateAuthUI(true);
  }

  /**
   * Start the sign-in flow
   */
  function signIn() {
    if (!isInitialized || !tokenClient) {
      showToast('Google Auth no está disponible. Recarga la página.', 'error');
      return;
    }

    if (CLIENT_ID.includes('YOUR_GOOGLE_CLIENT_ID')) {
      showToast('Configura tu Google Client ID en js/google-auth.js', 'error');
      return;
    }

    tokenClient.requestAccessToken({ prompt: 'consent' });
  }

  /**
   * Sign out / revoke access
   */
  function signOut() {
    if (accessToken) {
      google.accounts.oauth2.revoke(accessToken, () => {
        accessToken = null;
        notifyAuthChange(false);
        updateAuthUI(false);
      });
    } else {
      accessToken = null;
      notifyAuthChange(false);
      updateAuthUI(false);
    }
  }

  /**
   * Check if user is authenticated
   */
  function isAuthenticated() {
    return accessToken !== null;
  }

  /**
   * Get the current access token
   */
  function getAccessToken() {
    return accessToken;
  }

  /**
   * Register a callback for auth state changes
   */
  function onAuthChange(callback) {
    onAuthChangeCallbacks.push(callback);
  }

  /**
   * Notify all registered callbacks
   */
  function notifyAuthChange(isAuthed) {
    onAuthChangeCallbacks.forEach(cb => cb(isAuthed));
  }

  /**
   * Update the auth UI elements
   */
  function updateAuthUI(isConnected) {
    const disconnected = document.getElementById('google-auth-disconnected');
    const connected = document.getElementById('google-auth-connected');
    const eventWarning = document.getElementById('create-event-auth-warning');
    const eventForm = document.getElementById('create-event-form');

    if (disconnected) disconnected.style.display = isConnected ? 'none' : '';
    if (connected) connected.style.display = isConnected ? '' : 'none';

    if (eventWarning) eventWarning.style.display = isConnected ? 'none' : '';
    if (eventForm) eventForm.style.display = isConnected ? '' : 'none';
  }

  /**
   * Show a toast notification (uses global function if available)
   */
  function showToast(message, type) {
    if (typeof App !== 'undefined' && App.showToast) {
      App.showToast(message, type);
    } else {
      console.log(`[${type}] ${message}`);
    }
  }

  return {
    init,
    signIn,
    signOut,
    isAuthenticated,
    getAccessToken,
    onAuthChange,
    updateAuthUI,
  };
})();
