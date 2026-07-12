// frontend/src/lib/tz.js
// Single place where wall-clock <-> UTC conversion happens for a given
// IANA timezone. The server never touches timezones (see CLAUDE.md): it
// only stores/returns whatever string this module produces.

// Converts a canonical UTC dtstart ("YYYYMMDDTHHMMSSZ") to a naive
// "YYYYMMDDTHHMMSS" wall-clock string in tzId, for display/editing.
export function utcToLocal(utcStr, tzId) {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(utcStr ?? "");
  if (!m) return utcStr ?? ""; // legacy naive record or empty
  const [, y, mo, d, h, mi, s] = m;
  const instant = new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s));
  const p = partsInTz(instant, tzId);
  return `${p.year}${p.month}${p.day}T${p.hour}${p.minute}${p.second}`;
}

// Converts a naive "YYYYMMDDTHHMMSS" wall-clock string (interpreted in
// tzId) into a canonical UTC dtstart string, for saving.
export function localToUtc(naiveStr, tzId) {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/.exec(
    naiveStr ?? "",
  );
  if (!m) return naiveStr ?? "";
  const [, y, mo, d, h, mi, s] = m;
  const guess = Date.UTC(+y, +mo - 1, +d, +h, +mi, +s);

  // The offset between "wall time in tzId" and UTC isn't known in
  // advance (DST), so find it by asking what wall time `guess` would
  // show in tzId, then correct by the difference. One correction is
  // enough except right at a DST transition, so iterate to be safe.
  let instant = new Date(guess);
  for (let i = 0; i < 2; i++) {
    const p = partsInTz(instant, tzId);
    const shown = Date.UTC(
      +p.year,
      +p.month - 1,
      +p.day,
      +p.hour,
      +p.minute,
      +p.second,
    );
    instant = new Date(instant.getTime() + (guess - shown));
  }
  return formatUtc(instant);
}

function partsInTz(date, tzId) {
  return Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: tzId,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
}

function formatUtc(date) {
  const p = partsInTz(date, "UTC");
  return `${p.year}${p.month}${p.day}T${p.hour}${p.minute}${p.second}Z`;
}
