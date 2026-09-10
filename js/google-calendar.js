/* ============================================================
   Sprint Calendar — Google Calendar Module
   Read and create events via Google Calendar API v3
   ============================================================ */

const GoogleCalendar = (() => {
  const API_BASE = 'https://www.googleapis.com/calendar/v3';

  // Cache events per month to avoid unnecessary API calls
  let eventsCache = {};

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
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const events = (data.items || []).map(parseEvent);

      // Cache the results
      eventsCache[cacheKey] = events;

      return events;
    } catch (error) {
      console.error('GoogleCalendar: Failed to fetch events', error);
      return [];
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
  }

  return {
    getEventsForMonth,
    createEvent,
    getEventsForDate,
    clearCache,
  };
})();
