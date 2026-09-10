/* ============================================================
   Sprint Calendar — Modal System
   Reusable modal open/close with animations and accessibility
   ============================================================ */

const Modal = (() => {
  let activeModalId = null;
  let previousFocus = null;

  /**
   * Initialize modal system — bind close buttons and overlay clicks
   */
  function init() {
    // Close buttons
    document.querySelectorAll('[data-modal-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (activeModalId) close(activeModalId);
      });
    });

    // Overlay click to close
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          close(overlay.id);
        }
      });
    });

    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && activeModalId) {
        close(activeModalId);
      }
    });
  }

  /**
   * Open a modal by its overlay ID
   */
  function open(modalId) {
    const overlay = document.getElementById(modalId);
    if (!overlay) return;

    // If another modal is open, close it first
    if (activeModalId && activeModalId !== modalId) {
      close(activeModalId);
    }

    // Save the currently focused element to restore later
    previousFocus = document.activeElement;

    // Show the modal
    overlay.classList.add('is-active');
    overlay.setAttribute('aria-hidden', 'false');
    activeModalId = modalId;

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Focus the first focusable element inside the modal
    requestAnimationFrame(() => {
      const modal = overlay.querySelector('.modal');
      const focusable = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length > 0) {
        focusable[0].focus();
      }
    });

    // Set up focus trap
    overlay.addEventListener('keydown', trapFocus);
  }

  /**
   * Close a modal by its overlay ID
   */
  function close(modalId) {
    const overlay = document.getElementById(modalId);
    if (!overlay) return;

    overlay.classList.remove('is-active');
    overlay.setAttribute('aria-hidden', 'true');

    // Restore body scroll
    document.body.style.overflow = '';

    // Remove focus trap
    overlay.removeEventListener('keydown', trapFocus);

    // Restore focus to the previously focused element
    if (previousFocus) {
      previousFocus.focus();
      previousFocus = null;
    }

    activeModalId = null;
  }

  /**
   * Trap focus within the active modal
   */
  function trapFocus(e) {
    if (e.key !== 'Tab') return;

    const overlay = document.getElementById(activeModalId);
    if (!overlay) return;

    const modal = overlay.querySelector('.modal');
    const focusable = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  /**
   * Check if a specific modal is currently open
   */
  function isOpen(modalId) {
    return activeModalId === modalId;
  }

  /**
   * Get the ID of the currently active modal
   */
  function getActiveModal() {
    return activeModalId;
  }

  return {
    init,
    open,
    close,
    isOpen,
    getActiveModal,
  };
})();
