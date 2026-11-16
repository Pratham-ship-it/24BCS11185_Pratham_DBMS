/**
 * Computes the effective event status based on current time and event dates:
 * - 'Cancelled' if explicitly cancelled
 * - 'Completed' if end time (or start time if no end time exists) is in the past
 * - 'Ongoing' if current time is between start time and end time
 * - 'Upcoming' otherwise
 *
 * Supports startDateTime / startDate / date and endDateTime / endDate
 *
 * @param {Object} event - Event object
 * @returns {'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled'}
 */
export const getEventStatus = (event) => {
  if (!event) return 'Upcoming';

  const rawStatus = (event.status || '').toString().toLowerCase();
  if (rawStatus === 'cancelled') {
    return 'Cancelled';
  }

  const now = new Date();

  const endVal = event.endDateTime || event.endDate;
  const startVal = event.startDateTime || event.startDate || event.date;

  const end = endVal ? new Date(endVal) : null;
  const start = startVal ? new Date(startVal) : null;

  const isValidEnd = end && !isNaN(end.getTime());
  const isValidStart = start && !isNaN(start.getTime());

  if (isValidEnd) {
    if (now > end) {
      return 'Completed';
    }
    if (isValidStart && now >= start && now <= end) {
      return 'Ongoing';
    }
    return 'Upcoming';
  }

  if (isValidStart) {
    if (now > start) {
      return 'Completed';
    }
    return 'Upcoming';
  }

  if (rawStatus === 'completed' || rawStatus === 'ended') return 'Completed';
  if (rawStatus === 'ongoing') return 'Ongoing';
  return 'Upcoming';
};

/**
 * Checks whether an event has already ended.
 *
 * @param {Object} event
 * @returns {boolean}
 */
export const isEventEnded = (event) => {
  return getEventStatus(event) === 'Completed';
};

/**
 * Checks whether an event is cancelled.
 *
 * @param {Object} event
 * @returns {boolean}
 */
export const isEventCancelled = (event) => {
  return getEventStatus(event) === 'Cancelled';
};

/**
 * Returns Tailwind badge classes for a given computed status.
 *
 * @param {'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled'} status
 * @returns {string}
 */
export const getStatusBadgeStyle = (status) => {
  switch (status) {
    case 'Completed':
      return 'bg-slate-600 text-white shadow-sm';
    case 'Cancelled':
      return 'bg-rose-600 text-white shadow-sm';
    case 'Ongoing':
      return 'bg-blue-600 text-white shadow-sm';
    case 'Upcoming':
    default:
      return 'bg-emerald-600/90 text-white shadow-sm';
  }
};
