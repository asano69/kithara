// Replaces react-rrule-builder-ts/src/validation/validationSchema.ts (Yup).
// The rules are small enough that hand-written checks are clearer and
// avoid pulling in a validation library for a handful of range checks.

import { Frequency } from "rrule";

/**
 * Validates repeatDetails for the given frequency.
 * @param {number} frequency - rrule Frequency
 * @param {import('./types').AllRepeatDetails} repeatDetails
 * @returns {Record<string, string>} field -> error message; empty when valid
 */
export function validateRepeatDetails(frequency, repeatDetails) {
  const errors = {};

  if (frequency === undefined || frequency === null) {
    errors.frequency = "Frequency is required";
    return errors;
  }

  // YEARLY doesn't require an interval (matches the original schema, which
  // marks it optional for YEARLY only).
  if (frequency === Frequency.YEARLY) {
    if (repeatDetails.interval != null && repeatDetails.interval < 1) {
      errors.interval = "Interval must be at least 1";
    }
  } else if (repeatDetails.interval == null) {
    errors.interval = "Interval is required";
  } else if (repeatDetails.interval < 1) {
    errors.interval = "Interval must be at least 1";
  }

  if (frequency === Frequency.WEEKLY && repeatDetails.byDay.length < 1) {
    errors.byDay = "At least one day must be selected";
  }

  if (repeatDetails.bySetPos.some((pos) => pos < -1 || pos > 4)) {
    errors.bySetPos = "Position must be between -1 and 4";
  }

  if (repeatDetails.byMonthDay.some((day) => day < 1 || day > 31)) {
    errors.byMonthDay = "Day must be between 1 and 31";
  }

  if (repeatDetails.byMonth.some((month) => month < 1 || month > 12)) {
    errors.byMonth = "Month must be between 1 and 12";
  }

  return errors;
}
