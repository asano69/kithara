// Package db wraps the embedded PocketBase datastore that persists card performance and
// review history. All persistence is issued through this package; no other package
// touches the datastore directly.
package db

import (
	"github.com/asano69/kithara/internal/errs"
	_ "github.com/asano69/kithara/migrations"

	"github.com/pocketbase/pocketbase"

	"os"
)

type Database struct{ app *pocketbase.PocketBase }

// OpenScratch creates a Database backed by a fresh, disposable PocketBase
// instance in its own temporary directory. Each call returns an
// independent, empty database with no effect on any other Database.
// PocketBase always needs a directory on disk, so this is kithara'
// equivalent of SQLite's ":memory:" mode.
func OpenScratch() (*Database, error) {
	dir, err := os.MkdirTemp("", "kithara-pocketbase-*")
	if err != nil {
		return nil, errs.Newf("create temporary PocketBase data directory: %v", err)
	}
	app := pocketbase.NewWithConfig(pocketbase.Config{DefaultDataDir: dir, HideStartBanner: true})
	if err := app.Bootstrap(); err != nil {
		return nil, errs.Newf("bootstrap PocketBase: %v", err)
	}
	return newDatabase(app)
}

// New wraps an already-bootstrapped PocketBase app and ensures the
// kithara schema exists in it. app is expected to be the single instance
// shared by the whole CLI (see cmd/kithara/main.go); its data directory is
// controlled by PocketBase's standard "--dir" flag, not by kithara itself.
func New(app *pocketbase.PocketBase) (*Database, error) {
	return newDatabase(app)
}

// newDatabase wraps app in a Database and applies any pending app-level
// schema migrations (see internal/migrations). System migrations
// (_collections, _params, ...) already ran inside app.Bootstrap(), so only
// the user-defined AppMigrations need to be applied here. Calling this on
// every startup (including in tests, via OpenScratch) is safe and
// idempotent — RunAppMigrations skips migrations already recorded in the
// _migrations table.
func newDatabase(app *pocketbase.PocketBase) (*Database, error) {
	if err := app.RunAppMigrations(); err != nil {
		return nil, errs.Newf("run migrations: %v", err)
	}

	db := &Database{app: app}

	return db, nil
}

// Note is a snapshot of a "notes" record's scheduling-relevant fields.
// Dtstart and RRule are stored exactly as the frontend writes them: a
// floating (timezone-less) "YYYYMMDDTHHMMSS" string and a bare RRULE value
// with no "RRULE:" prefix (see NoteForm.jsx).
type Note struct {
	ID          string
	Label       string
	Description string
	Dtstart     string
	RRule       string
}

// ListNotes returns every note in the "notes" collection.
func (d *Database) ListNotes() ([]Note, error) {
	records, err := d.app.FindAllRecords("notes")
	if err != nil {
		return nil, errs.Newf("list notes: %v", err)
	}

	notes := make([]Note, 0, len(records))
	for _, r := range records {
		notes = append(notes, Note{
			ID:          r.Id,
			Label:       r.GetString("label"),
			Description: r.GetString("description"),
			Dtstart:     r.GetString("dtstart"),
			RRule:       r.GetString("rrule"),
		})
	}
	return notes, nil
}

// NotificationTarget is a snapshot of a "notifications" record's
// connection info for a single notification provider (currently only
// "gotify").
type NotificationTarget struct {
	ID       string
	Provider string
	Endpoint string
	Token    string
	Channel  string
}

// ListNotificationTargets returns every configured notification connection.
func (d *Database) ListNotificationTargets() ([]NotificationTarget, error) {
	records, err := d.app.FindAllRecords("notifications")
	if err != nil {
		return nil, errs.Newf("list notification targets: %v", err)
	}

	targets := make([]NotificationTarget, 0, len(records))
	for _, r := range records {
		targets = append(targets, NotificationTarget{
			ID:       r.Id,
			Provider: r.GetString("provider"),
			Endpoint: r.GetString("endpoint"),
			Token:    r.GetString("token"),
			Channel:  r.GetString("channel"),
		})
	}
	return targets, nil
}
