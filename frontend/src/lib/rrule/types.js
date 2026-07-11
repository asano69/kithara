// Ported from react-rrule-builder-ts/src/components/Repeat/Repeat.types.ts.
// Framework-independent: no React/MUI imports, so this file works as-is in Solid.

export const Weekday = {
  MO: "MO",
  TU: "TU",
  WE: "WE",
  TH: "TH",
  FR: "FR",
  SA: "SA",
  SU: "SU",
};

export const Months = {
  JAN: 1,
  FEB: 2,
  MAR: 3,
  APR: 4,
  MAY: 5,
  JUN: 6,
  JUL: 7,
  AUG: 8,
  SEP: 9,
  OCT: 10,
  NOV: 11,
  DEC: 12,
};

export const MonthBy = {
  BYMONTHDAY: "BYMONTHDAY",
  BYSETPOS: "BYSETPOS",
};

export const YearlyBy = {
  BYMONTH: "BYMONTH",
  BYSETPOS: "BYSETPOS",
};

export const WeekdayExtras = {
  DAY: "DAY",
  WEEKDAY: "WEEKDAY",
  WEEKEND: "WEEKEND",
};

export const OnThe = {
  FIRST: "1",
  SECOND: "2",
  THIRD: "3",
  FOURTH: "4",
  LAST: "-1",
};

export const AllWeekDayOptions = {
  ...Weekday,
  ...WeekdayExtras,
};

/**
 * @typedef {Object} AllRepeatDetails
 * @property {number} interval
 * @property {number[]} bySetPos
 * @property {string[]} byDay - Weekday values
 * @property {number[]} byMonthDay
 * @property {number[]} byMonth - not zero based (1 = January)
 */
