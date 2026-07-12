// New entry creation form. Reuses RRuleBuilder for the recurrence rule
// and saves directly to PocketBase via pb.js (see CLAUDE.md WIP note).
import { createSignal } from "solid-js";
import { useNavigate } from "@solidjs/router";
import NavBar from "../components/NavBar";
import RRuleBuilder from "../components/RRuleBuilder/RRuleBuilder";
import { BuilderStoreProvider, useBuilderStoreContext } from "../lib/rrule";
import pb from "../lib/pb";


// Combines the RRuleBuilder's date-only startDate with a separately
// entered time-of-day into an RFC 5545 floating-time DATE-TIME string:
// "YYYYMMDDTHHMMSS" (no trailing "Z", which is what would make it UTC
// instead of floating). This is naive on purpose (see CLAUDE.md, "don't
// use timezones"): it's just the wall-clock time the notification should
// fire at, same as a journal entry's date.
function toDtstartString(date, time) {
  if (!date) return "";
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const [hh, mm] = (time || "00:00").split(":");
  return `${y}${m}${d}T${hh.padStart(2, "0")}${mm.padStart(2, "0")}00`;
}


// The store's rruleString includes a leading "DTSTART:" line, but dtstart
// is stored in its own field. rrule-go's StrToRRule() expects the bare
// rule value (no "RRULE:" prefix), so that's stripped here too.
function extractRRuleLine(rruleString) {
   if (!rruleString) return "";
   const line = rruleString.split("\n").find((l) => l.startsWith("RRULE:"));
  return (line ?? rruleString).replace(/^RRULE:/, "");
 }

// New notes are appended after the current last one. Good enough for a
// single-user app; see README's note on why full LexoRank isn't needed.
async function nextPosition() {
  try {
    const last = await pb.collection("notes").getFirstListItem("", { sort: "-position" });
    return last.position + 1;
  } catch {
    return 1;
  }
}

function NewEntryForm() {
  const navigate = useNavigate();
  const store = useBuilderStoreContext();
  const [label, setLabel] = createSignal("");
  const [description, setDescription] = createSignal("");
 // Time-of-day for the notification. RRuleBuilder's own date input is
  // date-only, so this is tracked separately and combined at submit time.
  const [time, setTime] = createSignal("09:00");
  const [pending, setPending] = createSignal(false);
  const [error, setError] = createSignal("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!store.validateForm()) {
      setError(
        "Please complete the recurrence rule (e.g. select at least one weekday).",
      );
      return;
    }

    setError("");
    setPending(true);
    try {
      const position = await nextPosition();
      await pb.collection("notes").create({
        label: label(),
        description: description(),
         dtstart: toDtstartString(store.startDate(), time()),
        rrule: extractRRuleLine(store.rruleString()),
        position,
      });
      navigate("/");
    } catch (err) {
        console.error("create note failed:", err?.response ?? err);
      setError(err?.response?.message ?? "Failed to save the entry.");
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} class="flex w-full flex-col gap-6">
      <label class="flex flex-col gap-1 text-sm">
        <span>Label</span>
        <input
          type="text"
          value={label()}
          onInput={(e) => setLabel(e.target.value)}
          required
          autofocus
          class="rounded-md border border-[var(--color-border-soft)] bg-[var(--color-bg)] px-2 py-1 text-[var(--color-text)]"
        />
      </label>

      <label class="flex flex-col gap-1 text-sm">
        <span>Description</span>
        <textarea
          value={description()}
          onInput={(e) => setDescription(e.target.value)}
          rows="3"
          class="rounded-md border border-[var(--color-border-soft)] bg-[var(--color-bg)] px-2 py-1 text-[var(--color-text)]"
        />
      </label>

      <RRuleBuilder enableYearlyInterval />

      <label class="flex flex-col gap-1 text-sm">
        <span>Notify at</span>
        <input
          type="time"
          value={time()}
          onInput={(e) => setTime(e.target.value)}
          required
          class="w-32 rounded-md border border-[var(--color-border-soft)] bg-[var(--color-bg)] px-2 py-1 text-[var(--color-text)]"
        />
      </label>


      {error() && <p class="text-sm text-[#dc3545]">{error()}</p>}

      <button type="submit" class="btn" disabled={pending()}>
        {pending() ? "Saving…" : "Save"}
      </button>
    </form>
  );
}

export default function NewEntry() {
  return (
    <div class="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-8 bg-[var(--color-bg)] px-6 py-12 text-[var(--color-text)]">
      <NavBar />
      <h1 class="font-serif text-4xl">New Entry</h1>

      <BuilderStoreProvider>
        <NewEntryForm />
      </BuilderStoreProvider>
    </div>
  );
}
