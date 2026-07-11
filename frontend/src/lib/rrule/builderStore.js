// Ported from react-rrule-builder-ts/src/store/builderStore.tsx.
// zustand -> solid-js/store. No React Context here; see
// builderStoreContext.jsx for the optional sharing layer.
//
// Simplification vs. the original: since Stage 1 dropped the luxon date
// adapter, RRule.parseString() already returns native Date objects for
// dtstart/until, so setStoreFromRRuleString no longer needs to round-trip
// through an adapter to convert them.

import { createSignal } from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import { Frequency, RRule } from "rrule";
import { MonthBy, YearlyBy } from "./types";
import { EndType } from "./endTypes";
import { buildRRuleString } from "./buildRRuleString";
import { validateRepeatDetails } from "./validate";

export const baseRepeatDetails = {
  interval: 1,
  bySetPos: [],
  byMonth: [],
  byMonthDay: [],
  byDay: [],
};

// Adds `days` to a UTC-midnight-anchored Date without touching local
// timezone fields, keeping dates naive per CLAUDE.md's "no timezones" rule.
function addDays(date, days) {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

/**
 * Creates an independent builder store. Call this once per <RRuleBuilder>
 * instance (Solid component bodies run once, so this is safe to call
 * directly in a component's setup code — no useRef needed like in React).
 */
export function createBuilderStore() {
  const [frequency, setFrequencyRaw] = createSignal(Frequency.WEEKLY);
  const [startDate, setStartDateRaw] = createSignal(null);
  const [minEndDate, setMinEndDate] = createSignal(undefined);
  const [radioValue, setRadioValue] = createSignal(null);
  const [rruleString, setRRuleString] = createSignal(undefined);

  const [repeatDetails, setRepeatDetailsStore] = createStore({
    ...baseRepeatDetails,
  });
  const [endDetails, setEndDetailsStore] = createStore({
    endingType: EndType.NEVER,
  });
  const [validationErrors, setValidationErrors] = createStore({});

  let onChangeCallback;
  const setOnChange = (fn) => {
    onChangeCallback = fn;
  };

  const rebuildRRuleString = () => {
    const output = buildRRuleString({
      frequency: frequency(),
      startDate: startDate(),
      repeatDetails: { ...repeatDetails },
      endDetails: { ...endDetails },
    });
    setRRuleString(output);
    if (onChangeCallback) onChangeCallback(output);
  };

  const setFrequency = (freq) => {
    setFrequencyRaw(freq);
    setRepeatDetailsStore({ ...baseRepeatDetails });
    setValidationErrors(reconcile({}));
    rebuildRRuleString();
  };

  const setRepeatDetails = (details) => {
    setRepeatDetailsStore(details);
    rebuildRRuleString();
  };

  const setEndDetails = (details) => {
    setEndDetailsStore(reconcile(details));
    rebuildRRuleString();
  };

  const setStartDate = (date) => {
    let nextMinEndDate = minEndDate();
    let nextEndDetails = { ...endDetails };

    if (date) {
      nextMinEndDate = addDays(date, 1);
    }

    // Push the end date forward if the new start date is on or after it.
    if (
      endDetails.endingType === EndType.ON &&
      endDetails.endDate &&
      date &&
      date.getTime() >= endDetails.endDate.getTime()
    ) {
      nextEndDetails = { endingType: EndType.ON, endDate: addDays(date, 1) };
    }

    setStartDateRaw(date);
    setMinEndDate(nextMinEndDate);
    setEndDetailsStore(reconcile(nextEndDetails));
    setValidationErrors(reconcile({}));
    rebuildRRuleString();
  };

  const validateForm = () => {
    const errors = validateRepeatDetails(frequency(), { ...repeatDetails });
    setValidationErrors(reconcile(errors));
    return Object.keys(errors).length === 0;
  };

  const setStoreFromRRuleString = (rruleStr) => {
    let parsed;
    try {
      parsed = RRule.parseString(rruleStr);
    } catch (error) {
      console.error("Failed to parse RRULE string:", error);
      setValidationErrors(reconcile({ rruleString: "Invalid RRULE string" }));
      return;
    }

    const freq = parsed.freq ?? Frequency.WEEKLY;

    let radio = null;
    if (freq === Frequency.YEARLY) {
      if (parsed.byweekday || parsed.bysetpos) {
        radio = YearlyBy.BYSETPOS;
      } else if (parsed.bymonth || parsed.bymonthday) {
        radio = YearlyBy.BYMONTH;
      }
    } else if (freq === Frequency.MONTHLY) {
      if (parsed.bymonthday) {
        radio = MonthBy.BYMONTHDAY;
      } else if (parsed.bysetpos || parsed.byweekday) {
        radio = MonthBy.BYSETPOS;
      }
    }

    let start = null;
    let nextMinEndDate;
    if (parsed.dtstart) {
      start = parsed.dtstart;
      nextMinEndDate = addDays(start, 1);
    }

    let nextEndDetails = { endingType: EndType.NEVER };
    if (parsed.until) {
      nextEndDetails = { endingType: EndType.ON, endDate: parsed.until };
    } else if (parsed.count) {
      nextEndDetails = { endingType: EndType.AFTER, occurrences: parsed.count };
    }

    const nextRepeatDetails = {
      interval: parsed.interval ?? 1,
      byDay: [],
      byMonthDay: [],
      byMonth: [],
      bySetPos: [],
    };
    if (parsed.bymonth) {
      nextRepeatDetails.byMonth = Array.isArray(parsed.bymonth)
        ? parsed.bymonth
        : [parsed.bymonth];
    }
    if (parsed.bymonthday) {
      nextRepeatDetails.byMonthDay = Array.isArray(parsed.bymonthday)
        ? parsed.bymonthday
        : [parsed.bymonthday];
    }
    if (parsed.byweekday) {
      const days = Array.isArray(parsed.byweekday)
        ? parsed.byweekday
        : [parsed.byweekday];
      nextRepeatDetails.byDay = days.map((day) => day.toString());
    }
    if (parsed.bysetpos) {
      nextRepeatDetails.bySetPos = Array.isArray(parsed.bysetpos)
        ? parsed.bysetpos
        : [parsed.bysetpos];
    }

    setFrequencyRaw(freq);
    setRadioValue(radio);
    setStartDateRaw(start);
    setMinEndDate(nextMinEndDate);
    setEndDetailsStore(reconcile(nextEndDetails));
    setRepeatDetailsStore(nextRepeatDetails);
    setValidationErrors(reconcile({}));

    rebuildRRuleString();
  };

  return {
    // Reactive reads: call signals as functions; repeatDetails/endDetails/
    // validationErrors are reactive store objects, read fields directly.
    frequency,
    startDate,
    minEndDate,
    radioValue,
    rruleString,
    repeatDetails,
    endDetails,
    validationErrors,
    // Actions
    setFrequency,
    setRepeatDetails,
    setEndDetails,
    setStartDate,
    setRadioValue,
    setOnChange,
    buildRRuleString: rebuildRRuleString,
    validateForm,
    setStoreFromRRuleString,
  };
}
