package scheduler

import (
	"testing"
	"time"

	"github.com/asano69/kithara/internal/db"
)

func TestParseRule(t *testing.T) {
	rule, err := parseRule(db.Note{
		ID:      "note1",
		Dtstart: "20260101T090000",
		RRule:   "FREQ=DAILY;INTERVAL=1",
	})
	if err != nil {
		t.Fatalf("parseRule() error = %v", err)
	}

	next := rule.After(time.Date(2026, 1, 1, 9, 0, 0, 0, time.UTC), false)
	want := time.Date(2026, 1, 2, 9, 0, 0, 0, time.UTC)
	if !next.Equal(want) {
		t.Errorf("next = %v, want %v", next, want)
	}
}

func TestParseRuleInvalid(t *testing.T) {
	if _, err := parseRule(db.Note{RRule: "NOT_VALID"}); err == nil {
		t.Error("expected an error for an invalid RRULE, got nil")
	}
}

func TestNextTimerEmpty(t *testing.T) {
	timerC, timer := nextTimer(nil)
	if timerC != nil || timer != nil {
		t.Error("nextTimer(nil) should return a nil channel and nil timer")
	}
}

func TestNextTimerPicksEarliest(t *testing.T) {
	now := time.Now()
	entries := []entry{
		{next: now.Add(2 * time.Hour)},
		{next: now.Add(1 * time.Minute)},
		{next: now.Add(1 * time.Hour)},
	}

	timerC, timer := nextTimer(entries)
	if timerC == nil || timer == nil {
		t.Fatal("expected a non-nil timer")
	}
	defer stopTimer(timer)

	if d := time.Until(entries[1].next); d > time.Minute+time.Second || d < 0 {
		t.Errorf("earliest entry drifted unexpectedly: %v", d)
	}
}
