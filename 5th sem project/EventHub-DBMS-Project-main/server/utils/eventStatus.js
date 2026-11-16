// server/utils/eventStatus.js

/**
 * Computes the event's effective status based on current time and event dates:
 * - 'cancelled' if explicitly cancelled
 * - 'completed' if end time (or start time if no end time exists) is in the past
 * - 'ongoing' if current time is between start time and end time
 * - 'upcoming' otherwise
 *
 * Supports startDateTime / startDate / date and endDateTime / endDate
 *
 * @param {Object} event
 * @returns {'upcoming' | 'ongoing' | 'completed' | 'cancelled'}
 */
const computeEventStatus = (event) => {
  if (!event) return 'upcoming';

  const rawStatus = (event.status || '').toString().toLowerCase();
  if (rawStatus === 'cancelled') {
    return 'cancelled';
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
      return 'completed';
    }
    if (isValidStart && now >= start && now <= end) {
      return 'ongoing';
    }
    return 'upcoming';
  }

  if (isValidStart) {
    if (now > start) {
      return 'completed';
    }
    return 'upcoming';
  }

  if (rawStatus === 'completed' || rawStatus === 'ended') return 'completed';
  if (rawStatus === 'ongoing') return 'ongoing';
  return 'upcoming';
};

/**
 * Checks whether an event has already ended based on computed status.
 *
 * @param {Object} event
 * @returns {boolean}
 */
const isEventEnded = (event) => {
  return computeEventStatus(event) === 'completed';
};

module.exports = {
  computeEventStatus,
  isEventEnded
};
