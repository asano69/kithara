// Ported from react-rrule-builder-ts/src/utils/buildRRuleString.ts.
// The original took a `dateAdapter` (MUI/luxon) to convert dates. Cithara
// treats dates as naive (see CLAUDE.md), so this version takes plain Date
// objects directly and does no timezone conversion at all.
//
// Callers should build startDate/endDate as UTC-midnight, e.g.
// `new Date(Date.UTC(year, month - 1, day))`, so the calendar date is not
// shifted by the local timezone when rrule serializes it.

import { RRule } from "rrule";
import { EndType } from "./endTypes";

/**
 * @param {Object} params
 * @param {number} params.frequency - rrule Frequency (RRule.YEARLY, etc.)
 * @param {Date|null} params.startDate
 * @param {import('./types').AllRepeatDetails} params.repeatDetails
 * @param {import('./endTypes').EndDetails} params.endDetails
 * @returns {string} an RRULE string, e.g. "DTSTART:...\nRRULE:FREQ=WEEKLY;..."
 */
export function buildRRuleString({
  frequency,
  startDate,
  repeatDetails,
  endDetails,
}) {
  const ruleOptions = {
    byeaster: null,
    byhour: null,
    byminute: null,
    bymonth: null,
    bymonthday: null,
    bynmonthday: null,
    bynweekday: null,
    bysecond: null,
    bysetpos: null,
    byweekday: null,
    byweekno: null,
    byyearday: null,
    count: null,
    interval: 1,
    tzid: null,
    until: null,
    wkst: null,
    freq: frequency,
    dtstart: startDate ?? null,
  };

  if (repeatDetails.interval) {
    ruleOptions.interval = repeatDetails.interval;
  }

  if (repeatDetails.byDay.length > 0) {
    ruleOptions.byweekday = repeatDetails.byDay.map((day) => RRule[day]);
  }

  if (repeatDetails.byMonthDay.length > 0) {
    ruleOptions.bymonthday = repeatDetails.byMonthDay;
  }

  if (repeatDetails.byMonth.length > 0) {
    ruleOptions.bymonth = repeatDetails.byMonth;
  }

  if (repeatDetails.bySetPos.length > 0) {
    ruleOptions.bysetpos = repeatDetails.bySetPos;
  }

  switch (endDetails.endingType) {
    case EndType.NEVER:
      break;
    case EndType.AFTER:
      ruleOptions.count = endDetails.occurrences ?? null;
      break;
    case EndType.ON:
      ruleOptions.until = endDetails.endDate ?? null;
      break;
    default:
      break;
  }

  return new RRule(ruleOptions).toString();
}
