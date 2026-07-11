// Ported from Repeat/Inputs/IntervalTextInput.tsx.
// MUI TextField + Typography -> native <input type="number"> + plain text.
//
// props:
//   value    - the repeatDetails store (reads value.interval)
//   onChange - setRepeatDetails action
//   unit     - e.g. "week"
//   pluralizeUnit - appends "(s)" to unit when true

import { safeParseInt } from "../../../../lib/rrule";

export default function IntervalTextInput(props) {
  const handleInput = (e) => {
    const parsed = safeParseInt(e.target.value);
    if (parsed !== undefined) {
      props.onChange({ ...props.value, interval: parsed });
    }
  };

  return (
    <div class="flex items-center gap-2">
      <span>Every</span>
      <input
        type="number"
        aria-label="Interval"
        value={props.value.interval}
        onInput={handleInput}
        class="w-20 rounded-md border border-[var(--color-border-soft)] bg-[var(--color-bg)] px-2 py-1 text-[var(--color-text)]"
      />
      <span>
        {props.unit}
        {props.pluralizeUnit ? "(s)" : ""}
      </span>
    </div>
  );
}
