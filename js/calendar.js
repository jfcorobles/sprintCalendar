/* ============================================================
   Sprint Calendar — Calendar Renderer
   Renders the calendar with the sprint always vertically & horizontally centered
   ============================================================ */

const Calendar = (() => {
  let focusDate = new Date();
  let slideDirection = null; // 'left' | 'right' | null
  let isManualMonthNav = false; // true when user explicitly navigates month-by-month
  let currentGridRange = { startDate: new Date(), endDate: new Date() };

  const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  const MONTH_ABBR = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
  ];

  /**
   * Helper: Get Monday of the week containing a date
   */
  function getMonday(d) {
    const date = new Date(d);
    date.setHours(0, 0, 0, 0);
    const day = date.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    date.setDate(date.getDate() + diff);
    return date;
  }

  /**
   * Helper: Get Sunday of the week containing a date
   */
  function getSunday(d) {
    const mon = getMonday(d);
    const sun = new Date(mon);
    sun.setDate(sun.getDate() + 6);
    sun.setHours(23, 59, 59, 999);
    return sun;
  }

  /**
   * Initialize the calendar
   */
  function init() {
    focusDate = new Date();
    isManualMonthNav = false;
    render();
    bindNavigation();
  }

  /**
   * Navigate to previous month (complete calendar month)
   */
  function prevMonth() {
    slideDirection = 'right';
    isManualMonthNav = true;
    focusDate = new Date(focusDate.getFullYear(), focusDate.getMonth() - 1, 1);
    render();
  }

  /**
   * Navigate to next month (complete calendar month)
   */
  function nextMonth() {
    slideDirection = 'left';
    isManualMonthNav = true;
    focusDate = new Date(focusDate.getFullYear(), focusDate.getMonth() + 1, 1);
    render();
  }

  /**
   * Go to today's active sprint / month
   */
  function goToToday() {
    slideDirection = null;
    isManualMonthNav = false;
    focusDate = new Date();
    render();
  }

  /**
   * Re-render the calendar
   */
  function refresh() {
    slideDirection = null;
    render();
  }

  let currentEvents = [];
  let selectedDateForDayView = null;
  let selectedEventForDetail = null;

  /**
   * Main render function
   */
  async function render() {
    updateHeaderDisplay();
    renderGrid();
    updateSprintLegend();

    // Load and render Google Calendar events for the visible range
    if (GoogleAuth.isAuthenticated()) {
      await loadEvents();
    }
  }

  /**
   * Update header month/sprint title
   */
  function updateHeaderDisplay() {
    const display = document.getElementById('month-display');
    if (!display) return;

    // If manual month navigation, always show that exact month
    if (!isManualMonthNav && Storage.hasSprintConfig()) {
      const sprint = Sprint.getSprintForDate(focusDate);
      if (sprint) {
        const startMonth = sprint.startDate.getMonth();
        const endMonth = sprint.endDate.getMonth();
        const startYear = sprint.startDate.getFullYear();
        const endYear = sprint.endDate.getFullYear();

        // Only show dual-month title if the sprint actually spans across two different months
        if (startMonth !== endMonth || startYear !== endYear) {
          if (startYear === endYear) {
            display.textContent = `${MONTH_NAMES[startMonth]} – ${MONTH_NAMES[endMonth]} ${startYear}`;
          } else {
            display.textContent = `${MONTH_NAMES[startMonth]} ${startYear} – ${MONTH_NAMES[endMonth]} ${endYear}`;
          }
          return;
        }
      }
    }

    display.textContent = `${MONTH_NAMES[focusDate.getMonth()]} ${focusDate.getFullYear()}`;
  }

  /**
   * Render the calendar grid
   */
  function renderGrid() {
    const grid = document.getElementById('calendar-grid');
    if (!grid) return;

    if (slideDirection) {
      grid.className = `calendar__grid is-sliding-${slideDirection}`;
    } else {
      grid.className = 'calendar__grid';
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let gridStartDate;
    let totalWeeks = 5;

    const focusedSprint = (!isManualMonthNav && Storage.hasSprintConfig())
      ? Sprint.getSprintForDate(focusDate)
      : null;

    // Check if sprint crosses month boundary
    const isCrossMonthSprint = focusedSprint && (
      focusedSprint.startDate.getMonth() !== focusedSprint.endDate.getMonth() ||
      focusedSprint.startDate.getFullYear() !== focusedSprint.endDate.getFullYear()
    );

    if (isCrossMonthSprint) {
      // Continuous multi-week view centered on the cross-month sprint
      const sprintMonday = getMonday(focusedSprint.startDate);
      const sprintSunday = getSunday(focusedSprint.endDate);
      const sprintWeeks = Math.round((sprintSunday.getTime() - sprintMonday.getTime()) / (7 * 86400000)) + 1;

      totalWeeks = Math.max(5, sprintWeeks + 2);
      const weeksBefore = Math.max(1, Math.floor((totalWeeks - sprintWeeks) / 2));

      gridStartDate = new Date(sprintMonday);
      gridStartDate.setDate(gridStartDate.getDate() - (weeksBefore * 7));
    } else {
      // Standard full calendar month (1st of month to end of month)
      const year = focusDate.getFullYear();
      const month = focusDate.getMonth();
      const firstDayOfMonth = new Date(year, month, 1);
      const lastDayOfMonth = new Date(year, month + 1, 0);

      gridStartDate = getMonday(firstDayOfMonth);
      const gridEndSunday = getSunday(lastDayOfMonth);

      // Total weeks needed to display the full month
      totalWeeks = Math.round((gridEndSunday.getTime() - gridStartDate.getTime()) / (7 * 86400000)) + 1;
      totalWeeks = Math.max(5, Math.min(6, totalWeeks));
    }

    const totalDays = totalWeeks * 7;
    const gridEndDate = new Date(gridStartDate);
    gridEndDate.setDate(gridEndDate.getDate() + totalDays - 1);
    currentGridRange = { startDate: gridStartDate, endDate: gridEndDate };

    let html = '';

    for (let i = 0; i < totalDays; i++) {
      const cellDate = new Date(gridStartDate);
      cellDate.setDate(cellDate.getDate() + i);
      cellDate.setHours(0, 0, 0, 0);

      const dateStr = formatDateStr(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate());
      const dayNumber = cellDate.getDate();
      const isFirstOfMonth = dayNumber === 1;

      const classes = ['calendar__day'];

      // Today highlight
      if (cellDate.getTime() === today.getTime()) {
        classes.push('calendar__day--today');
      }

      // Weekend highlight
      const dow = cellDate.getDay();
      if (dow === 0 || dow === 6) {
        classes.push('calendar__day--weekend');
      }

      // Sprint state & boundary styling
      const sprintInfo = Sprint.getSprintForDate(cellDate);
      if (sprintInfo) {
        if (sprintInfo.isActive) {
          classes.push('calendar__day--sprint-active');
        } else {
          classes.push('calendar__day--sprint-inactive');
        }

        if (Sprint.isSprintStart(cellDate)) {
          classes.push('calendar__day--sprint-start');
        }
        if (Sprint.isSprintEnd(cellDate)) {
          classes.push('calendar__day--sprint-end');
        }
      }

      // Format day header (number + optional subtle month tag)
      let tagHtml = '';
      if (isFirstOfMonth) {
        tagHtml = `<span class="calendar__day-tag">${MONTH_ABBR[cellDate.getMonth()]}</span>`;
      }

      const ariaLabel = buildAriaLabel(cellDate, dayNumber);

      html += `
        <div class="${classes.join(' ')}" 
             role="gridcell" 
             tabindex="0" 
             data-date="${dateStr}"
             aria-label="${ariaLabel}">
          <div class="calendar__day-header">
            <span class="calendar__day-number">${dayNumber}</span>
            ${tagHtml}
          </div>
          <div class="calendar__day-events" id="events-${dateStr}"></div>
        </div>
      `;
    }

    grid.innerHTML = html;

    // Bind day clicks to open Day View (Detalle del Día)
    grid.querySelectorAll('.calendar__day').forEach(day => {
      day.addEventListener('click', (e) => {
        // If an event badge was directly clicked, don't trigger day view here
        if (e.target.closest('.event-badge')) return;
        const date = day.dataset.date;
        openDayView(date);
      });

      day.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const date = day.dataset.date;
          openDayView(date);
        }
      });
    });

    slideDirection = null;

    // If we have cached/current events, re-render them into the new cells
    if (currentEvents.length > 0) {
      renderEvents(currentEvents);
    }
  }

  /**
   * Load Google Calendar events for the visible centered range
   */
  async function loadEvents() {
    try {
      const events = await GoogleCalendar.getEventsForRange(currentGridRange.startDate, currentGridRange.endDate);
      currentEvents = events;
      renderEvents(events);
    } catch (e) {
      console.warn('Calendar: Failed to load events', e);
    }
  }

  /**
   * Render events into the calendar day cells
   */
  function renderEvents(events) {
    currentEvents = events;
    const eventsByDate = {};
    events.forEach(event => {
      if (!eventsByDate[event.date]) {
        eventsByDate[event.date] = [];
      }
      eventsByDate[event.date].push(event);
    });

    // Clear all event containers in grid first
    document.querySelectorAll('.calendar__day-events').forEach(el => {
      el.innerHTML = '';
    });

    Object.keys(eventsByDate).forEach(dateStr => {
      const container = document.getElementById(`events-${dateStr}`);
      if (!container) return;

      const dayEvents = eventsByDate[dateStr];
      const maxVisible = 3;
      let html = '';

      dayEvents.slice(0, maxVisible).forEach(event => {
        const isAllDay = event.isAllDay;
        const badgeClass = isAllDay ? 'event-badge event-badge--allday' : 'event-badge';
        const timeHtml = !isAllDay && event.startTime ? `<span class="event-badge__time">${event.startTime}</span>` : '';

        html += `
          <div class="${badgeClass}" 
               data-event-id="${event.id}"
               title="${escapeHtml(event.title)}${!isAllDay && event.startTime ? ' · ' + event.startTime + '–' + event.endTime : ' (Todo el día)'}">
            <span class="event-badge__dot"></span>
            ${timeHtml}
            <span class="event-badge__title">${escapeHtml(event.title)}</span>
          </div>
        `;
      });

      if (dayEvents.length > maxVisible) {
        html += `<div class="event-badge event-badge--more" data-date="${dateStr}">+${dayEvents.length - maxVisible} más</div>`;
      }

      container.innerHTML = html;
    });

    // Bind click events on event pills to open event detail
    document.querySelectorAll('.event-badge[data-event-id]').forEach(badge => {
      badge.addEventListener('click', (e) => {
        e.stopPropagation();
        const eventId = badge.dataset.eventId;
        openEventDetail(eventId);
      });
    });

    // Bind click on "+N más" to open day view
    document.querySelectorAll('.event-badge--more').forEach(badge => {
      badge.addEventListener('click', (e) => {
        e.stopPropagation();
        const dateStr = badge.dataset.date;
        openDayView(dateStr);
      });
    });
  }

  /**
   * Open the Day View Modal (Detalle del Día)
   */
  function openDayView(dateStr) {
    selectedDateForDayView = dateStr;
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);

    const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dayName = DAY_NAMES[dateObj.getDay()];
    const monthName = MONTH_NAMES[dateObj.getMonth()];

    // Title & Sprint badge
    const titleEl = document.getElementById('day-view-title');
    const sprintBadgeEl = document.getElementById('day-view-sprint-badge');
    const eventsListEl = document.getElementById('day-events-list');

    if (titleEl) {
      titleEl.textContent = `${dayName}, ${d} de ${monthName} ${y}`;
    }

    if (sprintBadgeEl) {
      const sprint = Sprint.getSprintForDate(dateObj);
      if (sprint) {
        sprintBadgeEl.textContent = `Sprint ${sprint.number}${sprint.isActive ? ' (Activo)' : ''} · Día ${sprint.dayInSprint} de ${sprint.totalDays}`;
        sprintBadgeEl.className = sprint.isActive ? 'modal__subtitle modal__subtitle--active' : 'modal__subtitle';
        sprintBadgeEl.style.display = '';
      } else {
        sprintBadgeEl.style.display = 'none';
      }
    }

    // Filter events for this day
    const dayEvents = currentEvents.filter(e => e.date === dateStr);

    if (eventsListEl) {
      if (dayEvents.length === 0) {
        eventsListEl.innerHTML = `
          <div class="day-events-empty">
            <span class="day-events-empty__icon">📅</span>
            <p class="day-events-empty__text">No hay eventos programados para este día.</p>
          </div>
        `;
      } else {
        let itemsHtml = '';
        dayEvents.forEach(event => {
          const isAllDay = event.isAllDay;
          const timeDisplay = isAllDay ? 'Todo el día' : `${event.startTime || ''} – ${event.endTime || ''}`;
          const pillClass = isAllDay ? 'day-event-card__pill day-event-card__pill--allday' : 'day-event-card__pill';

          itemsHtml += `
            <div class="day-event-card" data-event-id="${event.id}">
              <div class="${pillClass}"></div>
              <div class="day-event-card__content">
                <div class="day-event-card__title">${escapeHtml(event.title)}</div>
                <div class="day-event-card__time">⏰ ${timeDisplay}</div>
                ${event.location ? `<div class="day-event-card__location">📍 ${escapeHtml(event.location)}</div>` : ''}
              </div>
              <span class="day-event-card__arrow">→</span>
            </div>
          `;
        });
        eventsListEl.innerHTML = itemsHtml;

        // Bind clicks on each event card in day view
        eventsListEl.querySelectorAll('.day-event-card').forEach(card => {
          card.addEventListener('click', () => {
            const eventId = card.dataset.eventId;
            Modal.close('modal-day-view');
            openEventDetail(eventId);
          });
        });
      }
    }

    Modal.open('modal-day-view');
  }

  /**
   * Open the Event Detail Modal (Detalle del Evento)
   */
  function openEventDetail(eventId) {
    const event = currentEvents.find(e => e.id === eventId);
    if (!event) {
      console.warn('Calendar: Event not found for id', eventId);
      return;
    }

    selectedEventForDetail = event;

    const summaryEl = document.getElementById('event-detail-summary');
    const timeEl = document.getElementById('event-detail-time');
    const sprintEl = document.getElementById('event-detail-sprint');
    const sprintItemEl = document.getElementById('event-detail-sprint-item');
    const locationEl = document.getElementById('event-detail-location');
    const locationItemEl = document.getElementById('event-detail-location-item');
    const descEl = document.getElementById('event-detail-description');
    const descContainer = document.getElementById('event-detail-description-container');
    const googleLinkBtn = document.getElementById('btn-open-google-cal');

    if (summaryEl) summaryEl.textContent = event.title;

    // Date and time formatting
    if (timeEl) {
      const [y, m, d] = event.date.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const dayName = DAY_NAMES[dateObj.getDay()];
      const monthName = MONTH_NAMES[dateObj.getMonth()];

      if (event.isAllDay) {
        timeEl.textContent = `${dayName}, ${d} de ${monthName} ${y} · Todo el día`;
      } else {
        timeEl.textContent = `${dayName}, ${d} de ${monthName} ${y} · ${event.startTime} – ${event.endTime}`;
      }
    }

    // Sprint info
    if (sprintEl && sprintItemEl) {
      const [y, m, d] = event.date.split('-').map(Number);
      const sprint = Sprint.getSprintForDate(new Date(y, m - 1, d));
      if (sprint) {
        sprintEl.textContent = `Sprint ${sprint.number}${sprint.isActive ? ' (Activo)' : ''} · Día ${sprint.dayInSprint} de ${sprint.totalDays}`;
        sprintItemEl.style.display = 'flex';
      } else {
        sprintItemEl.style.display = 'none';
      }
    }

    // Location
    if (locationEl && locationItemEl) {
      if (event.location) {
        locationEl.textContent = event.location;
        locationItemEl.style.display = 'flex';
      } else {
        locationItemEl.style.display = 'none';
      }
    }

    // Description
    if (descEl && descContainer) {
      if (event.description && event.description.trim()) {
        descEl.textContent = event.description;
        descContainer.style.display = 'block';
      } else {
        descContainer.style.display = 'none';
      }
    }

    // Google Calendar Link
    if (googleLinkBtn) {
      if (event.htmlLink) {
        googleLinkBtn.href = event.htmlLink;
        googleLinkBtn.style.display = 'inline-flex';
      } else {
        googleLinkBtn.style.display = 'none';
      }
    }

    Modal.open('modal-event-detail');
  }

  /**
   * Update sprint legend info
   */
  function updateSprintLegend() {
    const infoEl = document.getElementById('sprint-info');
    const legendActiveEl = document.getElementById('sprint-legend-active');

    if (infoEl) {
      infoEl.textContent = Sprint.getSprintInfoText();
    }

    const currentSprint = Sprint.getCurrentSprint();
    if (legendActiveEl && currentSprint) {
      legendActiveEl.textContent = `Sprint ${currentSprint.number} (activo)`;
    }
  }

  /**
   * Open the create event modal with prefilled date
   */
  function openCreateEventModal(dateStr) {
    const dateInput = document.getElementById('event-date');
    if (dateInput) {
      dateInput.value = dateStr || formatDateStr(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
    }

    const isAuthed = GoogleAuth.isAuthenticated();
    const warning = document.getElementById('create-event-auth-warning');
    const form = document.getElementById('create-event-form');
    if (warning) warning.style.display = isAuthed ? 'none' : '';
    if (form) form.style.display = isAuthed ? '' : 'none';

    Modal.open('modal-create-event');
  }

  /**
   * Format date as "YYYY-MM-DD"
   */
  function formatDateStr(year, month, day) {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  }

  /**
   * Build an aria label
   */
  function buildAriaLabel(date, dayNumber) {
    const monthName = MONTH_NAMES[date.getMonth()];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let label = `${dayNumber} de ${monthName}`;
    if (date.getTime() === today.getTime()) label += ', hoy';

    const sprint = Sprint.getSprintForDate(date);
    if (sprint) {
      label += `, Sprint ${sprint.number}`;
      if (sprint.isActive) label += ' (activo)';
    }

    return label;
  }

  /**
   * Escape HTML
   */
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Bind navigation buttons and touch drag gestures
   */
  function bindNavigation() {
    document.getElementById('btn-prev-month')?.addEventListener('click', prevMonth);
    document.getElementById('btn-next-month')?.addEventListener('click', nextMonth);
    document.getElementById('btn-today')?.addEventListener('click', goToToday);
    bindTouchGestures();
  }

  /**
   * Bind swipe / drag gesture for mobile and desktop
   */
  function bindTouchGestures() {
    const calendarEl = document.querySelector('.calendar') || document.getElementById('calendar-grid');
    if (!calendarEl) return;

    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let isSwiping = false;

    calendarEl.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
      isSwiping = true;
    }, { passive: true });

    calendarEl.addEventListener('touchend', (e) => {
      if (!isSwiping || e.changedTouches.length !== 1) return;
      isSwiping = false;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      const elapsedTime = Date.now() - touchStartTime;

      // Swipe detected if: > 40px horizontal, mostly horizontal (not vertical scroll), within 500ms
      if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2 && elapsedTime < 500) {
        if (deltaX < 0) {
          // Swipe left -> next month
          nextMonth();
        } else {
          // Swipe right -> prev month
          prevMonth();
        }
      }
    }, { passive: true });

    // Mouse drag support for desktop
    let mouseStartX = 0;
    let mouseStartY = 0;
    let isMouseDown = false;
    let hasDragged = false;

    calendarEl.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      // Don't drag if clicking buttons or links
      if (e.target.closest('button, a, input')) return;
      mouseStartX = e.clientX;
      mouseStartY = e.clientY;
      isMouseDown = true;
      hasDragged = false;
    });

    calendarEl.addEventListener('mousemove', (e) => {
      if (!isMouseDown) return;
      if (Math.abs(e.clientX - mouseStartX) > 10) {
        hasDragged = true;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (!isMouseDown) return;
      isMouseDown = false;
      const deltaX = e.clientX - mouseStartX;
      const deltaY = e.clientY - mouseStartY;

      if (hasDragged && Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
        if (deltaX < 0) {
          nextMonth();
        } else {
          prevMonth();
        }
      }
    });
  }

  /**
   * Get current state
   */
  function getState() {
    return { focusDate, currentGridRange, currentEvents, selectedDateForDayView, selectedEventForDetail };
  }

  return {
    init,
    prevMonth,
    nextMonth,
    goToToday,
    refresh,
    render,
    loadEvents,
    openDayView,
    openEventDetail,
    openCreateEventModal,
    getSelectedDateForDayView: () => selectedDateForDayView,
    getSelectedEventForDetail: () => selectedEventForDetail,
    getState,
  };
})();
