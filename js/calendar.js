/* ============================================================
   Sprint Calendar — Calendar Renderer
   Renders the monthly calendar grid with sprints and events
   ============================================================ */

const Calendar = (() => {
  let currentYear;
  let currentMonth; // 0-indexed
  let slideDirection = null; // 'left' | 'right' | null

  const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  /**
   * Initialize the calendar with the current month
   */
  function init() {
    const now = new Date();
    currentYear = now.getFullYear();
    currentMonth = now.getMonth();
    render();
    bindNavigation();
  }

  /**
   * Navigate to previous month
   */
  function prevMonth() {
    slideDirection = 'right';
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    render();
  }

  /**
   * Navigate to next month
   */
  function nextMonth() {
    slideDirection = 'left';
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    render();
  }

  /**
   * Go to today's month
   */
  function goToToday() {
    const now = new Date();
    slideDirection = null;
    currentYear = now.getFullYear();
    currentMonth = now.getMonth();
    render();
  }

  /**
   * Re-render the calendar (used after config changes)
   */
  function refresh() {
    slideDirection = null;
    render();
  }

  /**
   * Main render function
   */
  async function render() {
    updateMonthDisplay();
    renderGrid();
    updateSprintLegend();

    // Load and render Google Calendar events
    if (GoogleAuth.isAuthenticated()) {
      await loadEvents();
    }
  }

  /**
   * Update the month/year display in the header
   */
  function updateMonthDisplay() {
    const display = document.getElementById('month-display');
    if (display) {
      display.textContent = `${MONTH_NAMES[currentMonth]} ${currentYear}`;
    }
  }

  /**
   * Render the calendar grid
   */
  function renderGrid() {
    const grid = document.getElementById('calendar-grid');
    if (!grid) return;

    // Apply slide animation class
    if (slideDirection) {
      grid.className = `calendar__grid is-sliding-${slideDirection}`;
    } else {
      grid.className = 'calendar__grid';
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate the days to display
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    // Day of week for first day (Monday=0, Sunday=6)
    let startDow = firstDayOfMonth.getDay() - 1;
    if (startDow < 0) startDow = 6;

    const totalDays = lastDayOfMonth.getDate();

    // Days from previous month to show
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();

    // Get sprints for this month
    const sprints = Sprint.getSprintsForMonth(currentYear, currentMonth);

    let html = '';

    // Generate all day cells
    const totalCells = Math.ceil((startDow + totalDays) / 7) * 7;

    for (let i = 0; i < totalCells; i++) {
      const dayNumber = i - startDow + 1;
      let displayDate;
      let isOutside = false;
      let dateStr;

      if (dayNumber < 1) {
        // Previous month
        const d = prevMonthLastDay + dayNumber;
        const m = currentMonth - 1 < 0 ? 11 : currentMonth - 1;
        const y = currentMonth - 1 < 0 ? currentYear - 1 : currentYear;
        displayDate = d;
        isOutside = true;
        dateStr = formatDateStr(y, m, d);
      } else if (dayNumber > totalDays) {
        // Next month
        const d = dayNumber - totalDays;
        const m = currentMonth + 1 > 11 ? 0 : currentMonth + 1;
        const y = currentMonth + 1 > 11 ? currentYear + 1 : currentYear;
        displayDate = d;
        isOutside = true;
        dateStr = formatDateStr(y, m, d);
      } else {
        // Current month
        displayDate = dayNumber;
        dateStr = formatDateStr(currentYear, currentMonth, dayNumber);
      }

      // Determine day classes
      const classes = ['calendar__day'];
      const cellDate = new Date(dateStr + 'T00:00:00');

      if (isOutside) {
        classes.push('calendar__day--outside');
      }

      // Today
      if (cellDate.getTime() === today.getTime()) {
        classes.push('calendar__day--today');
      }

      // Weekend (Saturday=6, Sunday=0)
      const dow = cellDate.getDay();
      if (dow === 0 || dow === 6) {
        classes.push('calendar__day--weekend');
      }

      // Sprint state
      if (!isOutside || true) { // Paint sprints even on outside days
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
      }

      // Build the day cell
      const ariaLabel = buildAriaLabel(cellDate, displayDate, isOutside);

      html += `
        <div class="${classes.join(' ')}" 
             role="gridcell" 
             tabindex="${isOutside ? -1 : 0}" 
             data-date="${dateStr}"
             aria-label="${ariaLabel}">
          <span class="calendar__day-number">${displayDate}</span>
          <div class="calendar__day-events" id="events-${dateStr}"></div>
        </div>
      `;
    }

    grid.innerHTML = html;

    // Bind day click events
    grid.querySelectorAll('.calendar__day:not(.calendar__day--outside)').forEach(day => {
      day.addEventListener('click', () => {
        const date = day.dataset.date;
        openCreateEventModal(date);
      });

      day.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const date = day.dataset.date;
          openCreateEventModal(date);
        }
      });
    });

    // Reset slide direction
    slideDirection = null;
  }

  /**
   * Load Google Calendar events for the visible month
   */
  async function loadEvents() {
    try {
      const events = await GoogleCalendar.getEventsForMonth(currentYear, currentMonth);
      renderEvents(events);
    } catch (e) {
      console.warn('Calendar: Failed to load events', e);
    }
  }

  /**
   * Render events into the calendar day cells
   */
  function renderEvents(events) {
    // Group events by date
    const eventsByDate = {};
    events.forEach(event => {
      if (!eventsByDate[event.date]) {
        eventsByDate[event.date] = [];
      }
      eventsByDate[event.date].push(event);
    });

    // Render into each day cell
    Object.keys(eventsByDate).forEach(dateStr => {
      const container = document.getElementById(`events-${dateStr}`);
      if (!container) return;

      const dayEvents = eventsByDate[dateStr];
      const maxVisible = 3;
      let html = '';

      dayEvents.slice(0, maxVisible).forEach(event => {
        const time = event.startTime || '📅';
        html += `
          <div class="event-badge" title="${event.title}${event.startTime ? ' · ' + event.startTime + '–' + event.endTime : ''}">
            <span class="event-badge__time">${time}</span>
            <span class="event-badge__title">${escapeHtml(event.title)}</span>
          </div>
        `;
      });

      if (dayEvents.length > maxVisible) {
        html += `<div class="event-badge event-badge--more">+${dayEvents.length - maxVisible} más</div>`;
      }

      container.innerHTML = html;
    });
  }

  /**
   * Update the sprint legend section
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
   * Open the create event modal with a pre-filled date
   */
  function openCreateEventModal(dateStr) {
    const dateInput = document.getElementById('event-date');
    if (dateInput) {
      dateInput.value = dateStr;
    }

    // Show/hide auth warning vs form
    const isAuthed = GoogleAuth.isAuthenticated();
    const warning = document.getElementById('create-event-auth-warning');
    const form = document.getElementById('create-event-form');
    if (warning) warning.style.display = isAuthed ? 'none' : '';
    if (form) form.style.display = isAuthed ? '' : 'none';

    Modal.open('modal-create-event');
  }

  /**
   * Format a date as "YYYY-MM-DD"
   */
  function formatDateStr(year, month, day) {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  }

  /**
   * Build an aria label for a day cell
   */
  function buildAriaLabel(date, dayNumber, isOutside) {
    const monthName = MONTH_NAMES[date.getMonth()];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let label = `${dayNumber} de ${monthName}`;
    if (isOutside) label += ' (otro mes)';
    if (date.getTime() === today.getTime()) label += ', hoy';

    const sprint = Sprint.getSprintForDate(date);
    if (sprint) {
      label += `, Sprint ${sprint.number}`;
      if (sprint.isActive) label += ' (activo)';
    }

    return label;
  }

  /**
   * Escape HTML entities
   */
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Bind navigation button events
   */
  function bindNavigation() {
    document.getElementById('btn-prev-month')?.addEventListener('click', prevMonth);
    document.getElementById('btn-next-month')?.addEventListener('click', nextMonth);
    document.getElementById('btn-today')?.addEventListener('click', goToToday);
  }

  /**
   * Get current display state
   */
  function getState() {
    return { year: currentYear, month: currentMonth };
  }

  return {
    init,
    prevMonth,
    nextMonth,
    goToToday,
    refresh,
    render,
    loadEvents,
    getState,
  };
})();
