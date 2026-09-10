/* ============================================================
   Sprint Calendar — Google Calendar Module
   Read and create events via Google Calendar API v3
   ============================================================ */

const GoogleCalendar = (() => {
  const API_BASE = 'https://www.googleapis.com/calendar/v3';
  const CACHE_STORAGE_KEY = 'sprintCalendar_events_cache';

  // Load initial cache from localStorage if available
  let eventsCache = (() => {
    try {
      const raw = localStorage.getItem(CACHE_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  })();

  function saveCacheToStorage() {
    try {
      localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(eventsCache));
    } catch (e) {
      console.warn('GoogleCalendar: Failed to save events to storage', e);
    }
  }

  /**
   * Get events for a specific month.
   * 
   * @param {number} year
   * @param {number} month - 0-indexed
   * @returns {Promise<Array<{id, title, date, startTime, endTime, isAllDay}>>}
   */
  async function getEventsForMonth(year, month) {
    if (!GoogleAuth.isAuthenticated()) {
      return [];
    }

    const cacheKey = `${year}-${month}`;
    if (eventsCache[cacheKey]) {
      return eventsCache[cacheKey];
    }

    const timeMin = new Date(year, month, 1).toISOString();
    const timeMax = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

    const params = new URLSearchParams({
      timeMin,
      timeMax,
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '250',
    });

    try {
      const response = await fetch(
        `${API_BASE}/calendars/primary/events?${params}`,
        {
          headers: {
            Authorization: `Bearer ${GoogleAuth.getAccessToken()}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired
          GoogleAuth.signOut();
          return [];
        }
        if (response.status === 403) {
          const errData = await response.json().catch(() => ({}));
          console.error('GoogleCalendar: Error 403 Forbidden. Asegúrate de habilitar Google Calendar API en Google Cloud Console:', errData);
          if (typeof App !== 'undefined' && App.showToast) {
            App.showToast('Error 403: Habilita la "Google Calendar API" en tu Google Cloud Console.', 'error', 6000);
          }
          return [];
        }
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const events = (data.items || []).map(parseEvent);

      // Cache the results and persist
      eventsCache[cacheKey] = events;
      saveCacheToStorage();

      return events;
    } catch (error) {
      console.error('GoogleCalendar: Failed to fetch events', error);
      // Return cached events if available even on network error
      return eventsCache[cacheKey] || [];
    }
  }

  /**
   * Create a new event on the user's primary calendar.
   * 
   * @param {{title: string, date: string, startTime: string, endTime: string, description?: string}} eventData
   * @returns {Promise<object|null>}
   */
  async function createEvent(eventData) {
    if (!GoogleAuth.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    const { title, date, startTime, endTime, description } = eventData;

    const body = {
      summary: title,
      description: description || '',
      start: {
        dateTime: `${date}T${startTime}:00`,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: `${date}T${endTime}:00`,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    };

    try {
      const response = await fetch(
        `${API_BASE}/calendars/primary/events`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${GoogleAuth.getAccessToken()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          GoogleAuth.signOut();
          throw new Error('Token expired');
        }
        throw new Error(`API error: ${response.status}`);
      }

      const created = await response.json();

      // Invalidate cache for the event's month
      const eventDate = new Date(date);
      const cacheKey = `${eventDate.getFullYear()}-${eventDate.getMonth()}`;
      delete eventsCache[cacheKey];
      saveCacheToStorage();

      return parseEvent(created);
    } catch (error) {
      console.error('GoogleCalendar: Failed to create event', error);
      throw error;
    }
  }

  /**
   * Parse a Google Calendar API event into our simplified format.
   */
  function parseEvent(apiEvent) {
    const isAllDay = !apiEvent.start.dateTime;

    let date, startTime, endTime;

    if (isAllDay) {
      date = apiEvent.start.date; // "YYYY-MM-DD"
      startTime = null;
      endTime = null;
    } else {
      const start = new Date(apiEvent.start.dateTime);
      const end = new Date(apiEvent.end.dateTime);
      date = start.toISOString().split('T')[0];
      startTime = start.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', hour12: false });
      endTime = end.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', hour12: false });
    }

    return {
      id: apiEvent.id,
      title: apiEvent.summary || '(Sin título)',
      date,
      startTime,
      endTime,
      isAllDay,
    };
  }

  /**
   * Get events for a specific date from the cache.
   * 
   * @param {string} dateStr - "YYYY-MM-DD"
   * @param {number} year
   * @param {number} month - 0-indexed
   * @returns {Array}
   */
  function getEventsForDate(dateStr, year, month) {
    const cacheKey = `${year}-${month}`;
    const events = eventsCache[cacheKey] || [];
    return events.filter(e => e.date === dateStr);
  }

  /**
   * Clear the events cache (e.g., after auth change)
   */
  function clearCache() {
    eventsCache = {};
    try {
      localStorage.removeItem(CACHE_STORAGE_KEY);
    } catch (e) {}
  }

  return {
    getEventsForMonth,
    createEvent,
    getEventsForDate,
    clearCache,
  };
})();
