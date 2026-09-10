/* ============================================================
   Sprint Calendar — Google Auth Module
   OAuth2 authentication with Google Identity Services
   ============================================================ */

const GoogleAuth = (() => {
  // ⚠️ Replace with your own Google Cloud Console Client ID
  // Go to: https://console.cloud.google.com/apis/credentials
  // Create an OAuth 2.0 Client ID (Web application type)
  // Add your deployment URL to Authorized JavaScript origins
  const DEFAULT_CLIENT_ID = '196494881282-5tdlac2r3hmlkfhv7bqto4jv41akccgi.apps.googleusercontent.com';
  let clientId = Storage.getConfig('googleClientId') || DEFAULT_CLIENT_ID;
  const SCOPES = 'https://www.googleapis.com/auth/calendar.events';

  let accessToken = null;
  let tokenClient = null;
  let isInitialized = false;
  let onAuthChangeCallbacks = [];

  /**
   * Initialize Google Identity Services
   */
  function init() {
    clientId = Storage.getConfig('googleClientId') || clientId;

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
   * Set or update Client ID dynamically
   */
  function setClientId(newId) {
    clientId = newId ? newId.trim() : '';
    setupTokenClient();
  }

  /**
   * Get current Client ID
   */
  function getClientId() {
    return clientId;
  }

  /**
   * Set up the token client after GIS loads
   */
  function setupTokenClient() {
    if (typeof google === 'undefined' || !google.accounts) {
      return;
    }

    if (!clientId || clientId.includes('YOUR_GOOGLE_CLIENT_ID')) {
      tokenClient = null;
      isInitialized = false;
      return;
    }

    try {
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
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
    clientId = Storage.getConfig('googleClientId') || clientId;

    if (!clientId || clientId.includes('YOUR_GOOGLE_CLIENT_ID')) {
      showToast('Por favor ingresa tu Google Client ID en Configuración ⚙️', 'error');
      // Highlight settings
      const clientIdInput = document.getElementById('google-client-id');
      if (clientIdInput) {
        Modal.open('modal-settings');
        clientIdInput.focus();
      }
      return;
    }

    if (!tokenClient) {
      setupTokenClient();
    }

    if (!tokenClient) {
      showToast('No se pudo inicializar Google Auth con el Client ID proporcionado.', 'error');
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
    setClientId,
    getClientId,
  };
})();

