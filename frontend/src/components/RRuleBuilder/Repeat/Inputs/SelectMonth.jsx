// Ported from Repeat/Inputs/SelectMonth.tsx. MUI Select+FormControl -> <select>.

import { For } from "solid-js";
import { Months, monthShortTextMapping } from "../../../../lib/rrule";

export default function SelectMonth(props) {
  const handleChange = (e) => {
    props.onChange({ ...props.value, byMonth: [Number(e.target.value)] });
  };

  return (
    <label class="flex flex-col gap-1 text-sm">
      <span>Select Month</span>
      <select
        disabled={props.disabled}
        value={props.value.byMonth[0] ?? ""}
        onChange={handleChange}
        class="rounded-md border border-[var(--color-border-soft)] bg-[var(--color-bg)] px-2 py-1 text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <option value="" disabled>Select Month</option>
        <For each={Object.values(Months)}>
          {(monthNum) => <option value={monthNum}>{monthShortTextMapping[monthNum]}</option>}
        </For>
      </select>
    </label>
  );
}
