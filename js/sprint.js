/* ============================================================
   Sprint Calendar — Sprint Calculation Engine
   Calculates sprint boundaries, active sprint, and coloring
   ============================================================ */

const Sprint = (() => {

  /**
   * Get all sprints that overlap with a given month.
   * Returns an array of sprint objects with their date ranges.
   * 
   * @param {number} year
   * @param {number} month - 0-indexed (0=Jan, 11=Dec)
   * @returns {Array<{number: number, startDate: Date, endDate: Date, isActive: boolean}>}
   */
  function getSprintsForMonth(year, month) {
    const config = Storage.getFullConfig();
    if (!config.sprintStartDate) return [];

    const sprintDuration = config.sprintDuration || 14;
    const sprintStart = new Date(config.sprintStartDate + 'T00:00:00');

    // Month boundaries
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0); // last day of month

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate the sprint number for the first day of the month
    const daysDiffStart = Math.floor((monthStart - sprintStart) / (1000 * 60 * 60 * 24));
    let firstSprintNumber = Math.floor(daysDiffStart / sprintDuration);

    // Go one sprint back to catch sprints that start before the month
    firstSprintNumber = Math.max(firstSprintNumber - 1, 0);
    // If the sprint start is in the future relative to the month, handle negative
    if (daysDiffStart < 0) {
      firstSprintNumber = Math.floor(daysDiffStart / sprintDuration);
    }

    const sprints = [];
    const seen = new Set();

    // Generate sprints that could overlap with this month
    for (let i = firstSprintNumber - 1; i <= firstSprintNumber + 6; i++) {
      const sStart = new Date(sprintStart);
      sStart.setDate(sStart.getDate() + i * sprintDuration);

      const sEnd = new Date(sStart);
      sEnd.setDate(sEnd.getDate() + sprintDuration - 1);

      // Check if this sprint overlaps with the month
      if (sEnd >= monthStart && sStart <= monthEnd) {
        const key = sStart.toISOString();
        if (seen.has(key)) continue;
        seen.add(key);

        const isActive = today >= sStart && today <= sEnd;

        sprints.push({
          number: i + 1, // 1-indexed
          startDate: sStart,
          endDate: sEnd,
          isActive,
        });
      }
    }

    return sprints;
  }

  /**
   * Get the sprint info for a specific date.
   * 
   * @param {Date} date
   * @returns {{number: number, startDate: Date, endDate: Date, isActive: boolean, dayInSprint: number, totalDays: number} | null}
   */
  function getSprintForDate(date) {
    const config = Storage.getFullConfig();
    if (!config.sprintStartDate) return null;

    const sprintDuration = config.sprintDuration || 14;
    const sprintStart = new Date(config.sprintStartDate + 'T00:00:00');

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor((targetDate - sprintStart) / (1000 * 60 * 60 * 24));
    const sprintNumber = Math.floor(daysDiff / sprintDuration);

    const sStart = new Date(sprintStart);
    sStart.setDate(sStart.getDate() + sprintNumber * sprintDuration);

    const sEnd = new Date(sStart);
    sEnd.setDate(sEnd.getDate() + sprintDuration - 1);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isActive = today >= sStart && today <= sEnd;

    const dayInSprint = Math.floor((targetDate - sStart) / (1000 * 60 * 60 * 24)) + 1;

    return {
      number: sprintNumber + 1,
      startDate: sStart,
      endDate: sEnd,
      isActive,
      dayInSprint,
      totalDays: sprintDuration,
    };
  }

  /**
   * Get the current active sprint.
   * 
   * @returns {{number: number, startDate: Date, endDate: Date, isActive: boolean, dayInSprint: number, totalDays: number} | null}
   */
  function getCurrentSprint() {
    return getSprintForDate(new Date());
  }

  /**
   * Check if a specific date is the first day of its sprint.
   */
  function isSprintStart(date) {
    const sprint = getSprintForDate(date);
    if (!sprint) return false;
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === sprint.startDate.getTime();
  }

  /**
   * Check if a specific date is the last day of its sprint.
   */
  function isSprintEnd(date) {
    const sprint = getSprintForDate(date);
    if (!sprint) return false;
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === sprint.endDate.getTime();
  }

  /**
   * Format sprint legend info string.
   */
  function getSprintInfoText() {
    const current = getCurrentSprint();
    if (!current) return 'Configura tus sprints en ⚙️';
    return `Sprint ${current.number} · Día ${current.dayInSprint} de ${current.totalDays}`;
  }

  return {
    getSprintsForMonth,
    getSprintForDate,
    getCurrentSprint,
    isSprintStart,
    isSprintEnd,
    getSprintInfoText,
  };
})();
