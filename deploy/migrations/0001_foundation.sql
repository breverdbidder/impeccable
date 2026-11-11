-- Deploy foundation (CP-11), Cloudflare D1 (SQLite).
-- Applied to database deploy-internal (d913e974-a802-45a6-93cf-60eb76c21716) on 2026-11-11.
-- Only the Worker reads or writes this database, through its DB binding.

CREATE TABLE sites (
  id TEXT PRIMARY KEY,
  hostname TEXT UNIQUE,
  name TEXT NOT NULL,
  github_repo TEXT,
  cf_worker TEXT,
  verify_method TEXT CHECK (verify_method IN ('dns_txt','meta','file')),
  verify_token TEXT NOT NULL DEFAULT (lower(hex(randomblob(18)))),
  verified_at TEXT,
  auto_publish TEXT NOT NULL DEFAULT 'off' CHECK (auto_publish IN ('off','preview','preview_production')),
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE monitors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('uptime','cert','visual','lighthouse','links','sitemap','content')),
  target TEXT NOT NULL,
  config TEXT NOT NULL DEFAULT '{}',
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (site_id, kind, target)
);

CREATE TABLE checks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  monitor_id INTEGER NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
  ok INTEGER NOT NULL,
  value TEXT NOT NULL,
  ran_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX checks_monitor_ran ON checks (monitor_id, ran_at DESC);

CREATE TABLE findings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('high','medium','low')),
  title TEXT NOT NULL,
  evidence TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','fixed','dismissed')),
  dedupe_key TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (site_id, dedupe_key)
);

CREATE INDEX findings_status ON findings (status, severity, created_at DESC);

CREATE TABLE usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  site_id TEXT REFERENCES sites(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  cost_cents INTEGER NOT NULL CHECK (cost_cents >= 0)
);

CREATE TABLE budget (
  month TEXT PRIMARY KEY,
  cap_cents INTEGER NOT NULL DEFAULT 10000 CHECK (cap_cents >= 0)
);

CREATE TABLE audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  actor_type TEXT NOT NULL CHECK (actor_type IN ('member','agent','token','system')),
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT,
  detail TEXT,
  cost_cents INTEGER NOT NULL DEFAULT 0
);

-- Nothing is recorded about a site that has not proven ownership.
CREATE TRIGGER checks_require_verified BEFORE INSERT ON checks
WHEN NOT EXISTS (SELECT 1 FROM monitors m JOIN sites s ON s.id = m.site_id WHERE m.id = NEW.monitor_id AND s.verified_at IS NOT NULL)
BEGIN SELECT RAISE(ABORT, 'site is not verified'); END;

CREATE TRIGGER findings_require_verified BEFORE INSERT ON findings
WHEN NOT EXISTS (SELECT 1 FROM sites s WHERE s.id = NEW.site_id AND s.verified_at IS NOT NULL)
BEGIN SELECT RAISE(ABORT, 'site is not verified'); END;

-- Spend cannot cross the month's cap (default 10000 cents).
CREATE TRIGGER usage_within_cap BEFORE INSERT ON usage
WHEN (SELECT COALESCE(SUM(cost_cents), 0) FROM usage WHERE ts >= strftime('%Y-%m-01T00:00:00.000Z','now')) + NEW.cost_cents
   > COALESCE((SELECT cap_cents FROM budget WHERE month = strftime('%Y-%m','now')), 10000)
BEGIN SELECT RAISE(ABORT, 'monthly budget cap reached'); END;

-- The audit log is append-only.
CREATE TRIGGER audit_no_update BEFORE UPDATE ON audit_log BEGIN SELECT RAISE(ABORT, 'audit_log is append-only'); END;

CREATE TRIGGER audit_no_delete BEFORE DELETE ON audit_log BEGIN SELECT RAISE(ABORT, 'audit_log is append-only'); END;

INSERT INTO sites (id, hostname, name, github_repo, cf_worker) VALUES
  ('biddeed', 'biddeed.ai', 'BidDeed.AI', 'breverdbidder/biddeed-web', 'biddeed-web-production'),
  ('dealdeed', 'dealdeed.app', 'DealDeed (includes RentalIQ)', 'breverdbidder/rentaliq', NULL),
  ('zonewise', NULL, 'ZoneWise', 'breverdbidder/zonewise-web', 'zonewise-web-production');
