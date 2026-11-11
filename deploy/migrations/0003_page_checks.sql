-- Page checks (CP-15): a real browser loads a page, records lab metrics and a screenshot,
-- and compares the screenshot with the previous one.

CREATE TABLE page_checks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('first','changed','daily')),
  status INTEGER,
  final_url TEXT,
  ttfb_ms INTEGER,
  lcp_ms INTEGER,
  cls REAL,
  load_ms INTEGER,
  transfer_bytes INTEGER,
  requests INTEGER,
  console_errors INTEGER,
  shot_key TEXT,
  diff_pct REAL,
  error TEXT,
  ran_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX page_checks_site ON page_checks (site_id, ran_at DESC);

CREATE TABLE page_check_state (
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  content_hash TEXT,
  shot_key TEXT,
  last_check TEXT NOT NULL,
  PRIMARY KEY (site_id, url)
);

CREATE TRIGGER page_checks_require_verified BEFORE INSERT ON page_checks
WHEN NOT EXISTS (SELECT 1 FROM sites s WHERE s.id = NEW.site_id AND s.verified_at IS NOT NULL)
BEGIN SELECT RAISE(ABORT, 'site is not verified'); END;
