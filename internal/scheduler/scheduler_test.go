package scheduler

import (
	"testing"
	"time"

	"github.com/asano69/cithara/internal/db"
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

func TestParseRulePastDtstartAlwaysReturnsFutureNext(t *testing.T) {
	past := time.Now().UTC().Add(-24 * time.Hour)
	note := db.Note{
		ID:      "note1",
		Dtstart: past.Format("20060102T150405"),
		RRule:   "FREQ=MINUTELY;INTERVAL=1",
	}

	rule, err := parseRule(note)
	if err != nil {
		t.Fatalf("parseRule() error = %v", err)
	}

	now := time.Now().UTC()
	next := rule.After(now, false)
	if next.IsZero() {
		t.Fatal("expected a non-zero next occurrence")
	}
	if !next.After(now) {
		t.Errorf("next = %v, want a time strictly after now (%v)", next, now)
	}
}

func TestBuildMessageTitle(t *testing.T) {
	got := buildMessageTitle(db.Note{Label: "Water plants"})
	want := "Cithara: Water plants"
	if got != want {
		t.Errorf("got %q, want %q", got, want)
	}
}

func TestBuildMessageBody(t *testing.T) {
	t.Run("formats description with MEMO prefix", func(t *testing.T) {
		got := buildMessageBody(db.Note{Description: "Living room ficus"})
		want := "MEMO: Living room ficus"
		if got != want {
			t.Errorf("got %q, want %q", got, want)
		}
	})

	t.Run("stays non-empty when description is empty", func(t *testing.T) {
		got := buildMessageBody(db.Note{Description: ""})
		if got == "" {
			t.Error("expected a non-empty body even with an empty description")
		}
	})
}
