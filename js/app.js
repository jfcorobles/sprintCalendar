/* ============================================================
   Sprint Calendar — App Entry Point
   Initializes all modules and connects global interactions
   ============================================================ */

const App = (() => {
  /**
   * Main initialization
   */
  function init() {
    // 1. Theme (must be first to prevent flash)
    ThemeManager.init();

    // 2. Modal system
    Modal.init();

    // 3. Google Auth (restores session & loads GIS SDK)
    GoogleAuth.init();

    // 4. Calendar (renders the grid + automatically loads events if session active)
    Calendar.init();

    // 5. Connect event handlers
    bindSettingsModal();
    bindCreateEventModal();
    bindDayViewModal();
    bindEventDetailModal();
    bindFabButton();
    bindGoogleAuthButtons();

    // 6. Listen for auth changes (manual sign in / sign out)
    GoogleAuth.onAuthChange((isAuthed, isUserAction) => {
      if (isAuthed) {
        Calendar.loadEvents();
        if (isUserAction) {
          showToast('Google Calendar conectado', 'success');
        }
      } else {
        GoogleCalendar.clearCache();
        Calendar.refresh();
        if (isUserAction) {
          showToast('Google Calendar desconectado', 'info');
        }
      }
    });

    // 7. Load saved settings into the settings modal
    loadSettingsIntoModal();

    // 8. Show welcome info if no sprint config
    if (!Storage.hasSprintConfig()) {
      showToast('¡Bienvenido! Configura tus sprints con el botón ⚙️', 'info');
    }

    console.log('Sprint Calendar initialized ✅');
  }

  /**
   * Bind settings modal interactions
   */
  function bindSettingsModal() {
    // Open settings
    document.getElementById('btn-settings')?.addEventListener('click', () => {
      loadSettingsIntoModal();
      Modal.open('modal-settings');
    });

    // Save settings
    document.getElementById('btn-save-settings')?.addEventListener('click', () => {
      saveSettings();
    });
  }

  /**
   * Load current config into the settings modal fields
   */
  function loadSettingsIntoModal() {
    const config = Storage.getFullConfig();

    const durationSelect = document.getElementById('sprint-duration');
    const startDateInput = document.getElementById('sprint-start-date');

    if (durationSelect) {
      durationSelect.value = String(config.sprintDuration);
    }
    if (startDateInput && config.sprintStartDate) {
      startDateInput.value = config.sprintStartDate;
    }

    // Update Google auth UI
    GoogleAuth.updateAuthUI(GoogleAuth.isAuthenticated());
  }

  /**
   * Save settings from the modal
   */
  function saveSettings() {
    const duration = parseInt(document.getElementById('sprint-duration')?.value || '14', 10);
    const startDate = document.getElementById('sprint-start-date')?.value || null;

    Storage.setMultiple({
      sprintDuration: duration,
      sprintStartDate: startDate,
    });

    // Re-render calendar with new sprint config
    Calendar.refresh();

    // Close modal
    Modal.close('modal-settings');

    showToast('Configuración guardada', 'success');
  }

  /**
   * Bind create event modal interactions
   */
  function bindCreateEventModal() {
    const allDayCheckbox = document.getElementById('event-all-day');
    const timeRow = document.getElementById('event-time-row');

    allDayCheckbox?.addEventListener('change', () => {
      if (timeRow) {
        timeRow.style.display = allDayCheckbox.checked ? 'none' : '';
      }
    });

    document.getElementById('btn-create-event')?.addEventListener('click', async () => {
      await handleCreateEvent();
    });
  }

  /**
   * Handle the create event form submission
   */
  async function handleCreateEvent() {
    const titleInput = document.getElementById('event-title');
    const dateInput = document.getElementById('event-date');
    const allDayCheckbox = document.getElementById('event-all-day');
    const startTimeInput = document.getElementById('event-start-time');
    const endTimeInput = document.getElementById('event-end-time');
    const descriptionInput = document.getElementById('event-description');
    const errorEl = document.getElementById('event-title-error');

    // Validate
    const title = titleInput?.value?.trim();
    if (!title) {
      if (errorEl) errorEl.style.display = '';
      titleInput?.focus();
      return;
    }
    if (errorEl) errorEl.style.display = 'none';

    const isAllDay = allDayCheckbox ? allDayCheckbox.checked : false;
    let startTime = startTimeInput?.value || '09:00';
    let endTime = endTimeInput?.value || '10:00';

    // Validate times if not all day
    if (!isAllDay) {
      if (endTime <= startTime) {
        showToast('La hora de fin debe ser posterior a la de inicio', 'error');
        return;
      }
    }

    // Check auth
    if (!GoogleAuth.isAuthenticated()) {
      showToast('Conecta tu Google Calendar primero', 'error');
      return;
    }

    // Show loading state
    const createBtn = document.getElementById('btn-create-event');
    if (createBtn) {
      createBtn.classList.add('is-loading');
      createBtn.disabled = true;
    }

    try {
      await GoogleCalendar.createEvent({
        title,
        date: dateInput?.value,
        startTime: isAllDay ? undefined : startTime,
        endTime: isAllDay ? undefined : endTime,
        isAllDay,
        description: descriptionInput?.value || '',
      });

      // Clear form
      if (titleInput) titleInput.value = '';
      if (descriptionInput) descriptionInput.value = '';
      if (allDayCheckbox) {
        allDayCheckbox.checked = false;
        const timeRow = document.getElementById('event-time-row');
        if (timeRow) timeRow.style.display = '';
      }
      if (startTimeInput) startTimeInput.value = '09:00';
      if (endTimeInput) endTimeInput.value = '10:00';

      // Close modal and refresh calendar
      Modal.close('modal-create-event');
      await Calendar.loadEvents();

      showToast('Evento creado exitosamente', 'success');
    } catch (error) {
      showToast('Error al crear el evento. Intenta de nuevo.', 'error');
    } finally {
      if (createBtn) {
        createBtn.classList.remove('is-loading');
        createBtn.disabled = false;
      }
    }
  }

  /**
   * Bind Day View Modal interactions
   */
  function bindDayViewModal() {
    document.getElementById('btn-day-view-add-event')?.addEventListener('click', () => {
      const selectedDate = Calendar.getSelectedDateForDayView();
      Modal.close('modal-day-view');
      Calendar.openCreateEventModal(selectedDate);
    });
  }

  /**
   * Bind Event Detail Modal interactions (Delete event)
   */
  function bindEventDetailModal() {
    document.getElementById('btn-delete-event')?.addEventListener('click', async () => {
      const selectedEvent = Calendar.getSelectedEventForDetail();
      if (!selectedEvent) return;

      const confirmDelete = confirm(`¿Estás seguro de que deseas eliminar el evento "${selectedEvent.title}"?`);
      if (!confirmDelete) return;

      const deleteBtn = document.getElementById('btn-delete-event');
      if (deleteBtn) {
        deleteBtn.disabled = true;
        deleteBtn.textContent = 'Eliminando...';
      }

      try {
        await GoogleCalendar.deleteEvent(selectedEvent.id);
        Modal.close('modal-event-detail');
        await Calendar.loadEvents();
        showToast('Evento eliminado exitosamente', 'success');
      } catch (err) {
        showToast('Error al eliminar el evento', 'error');
      } finally {
        if (deleteBtn) {
          deleteBtn.disabled = false;
          deleteBtn.textContent = '🗑️ Eliminar';
        }
      }
    });
  }

  /**
   * Bind Floating Action Button (FAB)
   */
  function bindFabButton() {
    document.getElementById('fab-add-event')?.addEventListener('click', () => {
      const todayStr = new Date().toISOString().split('T')[0];
      Calendar.openCreateEventModal(todayStr);
    });
  }

  /**
   * Bind Google auth button events
   */
  function bindGoogleAuthButtons() {
    document.getElementById('btn-google-connect')?.addEventListener('click', () => {
      GoogleAuth.signIn();
    });

    document.getElementById('btn-google-connect-event')?.addEventListener('click', () => {
      GoogleAuth.signIn();
    });

    document.getElementById('btn-google-disconnect')?.addEventListener('click', () => {
      GoogleAuth.signOut();
    });
  }

  /**
   * Show a toast notification
   * 
   * @param {string} message
   * @param {'success' | 'error' | 'info'} type
   * @param {number} duration - ms to show (default 4000)
   */
  function showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
      <span>${message}</span>
      <button class="toast__close" aria-label="Cerrar">✕</button>
    `;

    container.appendChild(toast);

    // Close button
    toast.querySelector('.toast__close')?.addEventListener('click', () => {
      removeToast(toast);
    });

    // Auto remove
    setTimeout(() => {
      removeToast(toast);
    }, duration);
  }

  /**
   * Remove a toast with exit animation
   */
  function removeToast(toast) {
    if (!toast.parentNode) return;
    toast.classList.add('is-leaving');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }

  return {
    init,
    showToast,
  };
})();

// ============================================================
// Boot the application when DOM is ready
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
