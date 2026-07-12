// Package tz resolves the timezone used to interpret the naive
// wall-clock dtstart strings the frontend sends, and converts between
// that naive local representation and the canonical UTC representation
// stored in the database.
//
// The frontend never deals with timezones (see CLAUDE.md): it always
// sends/receives a floating "YYYYMMDDTHHMMSS" string. This package is
// what turns that floating time into an unambiguous instant server-side,
// so the scheduler can compare it against a real UTC clock.
package tz

import (
	"strings"
	"time"

	"github.com/pocketbase/pocketbase/core"

	"github.com/asano69/kithara/internal/errs"
)

const naiveLayout = "20060102T150405"
const utcLayout = naiveLayout + "Z"

// Location returns the timezone configured in the "settings" collection
// (key "TZ", e.g. "Asia/Tokyo"). Falls back to the server's local
// timezone if no such setting exists or its value is invalid.
func Location(app core.App) *time.Location {
	record, err := app.FindFirstRecordByData("settings", "key", "TZ")
	if err != nil {
		return time.Local
	}

	loc, err := time.LoadLocation(record.GetString("value"))
	if err != nil {
		return time.Local
	}
	return loc
}

// ToUTC converts a naive "YYYYMMDDTHHMMSS" string (interpreted in loc)
// into the canonical "YYYYMMDDTHHMMSSZ" form stored in the database.
// Already-canonical or empty input is returned unchanged, so this is
// safe to call on every save regardless of the record's current state.
func ToUTC(dtstart string, loc *time.Location) (string, error) {
	if dtstart == "" || strings.HasSuffix(dtstart, "Z") {
		return dtstart, nil
	}

	t, err := time.ParseInLocation(naiveLayout, dtstart, loc)
	if err != nil {
		return "", errs.Newf("parse dtstart %q: %v", dtstart, err)
	}
	return t.UTC().Format(utcLayout), nil
}

// ToLocal converts a canonical "YYYYMMDDTHHMMSSZ" string back into the
// naive wall-clock form the frontend expects, in loc. Legacy records
// that predate this conversion (no trailing "Z") are already naive and
// are returned unchanged.
func ToLocal(dtstart string, loc *time.Location) (string, error) {
	if !strings.HasSuffix(dtstart, "Z") {
		return dtstart, nil
	}

	t, err := time.Parse(utcLayout, dtstart)
	if err != nil {
		return "", errs.Newf("parse dtstart %q: %v", dtstart, err)
	}
	return t.In(loc).Format(naiveLayout), nil
}
