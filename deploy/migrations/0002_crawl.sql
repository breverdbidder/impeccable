-- Crawl job (CP-14): pages seen per site and per-site crawl state.

CREATE TABLE pages (
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  in_sitemap INTEGER NOT NULL DEFAULT 0,
  found_on TEXT,
  status INTEGER,
  redirect_to TEXT,
  title TEXT,
  canonical TEXT,
  noindex INTEGER,
  has_jsonld INTEGER,
  content_hash TEXT,
  changed_at TEXT,
  first_seen TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  last_crawled TEXT,
  PRIMARY KEY (site_id, url)
);

CREATE INDEX pages_due ON pages (site_id, last_crawled);

CREATE TABLE crawl_state (
  site_id TEXT PRIMARY KEY REFERENCES sites(id) ON DELETE CASCADE,
  robots_status INTEGER,
  robots_blocks_all INTEGER,
  sitemap_url TEXT,
  sitemap_count INTEGER,
  sitemap_checked_at TEXT,
  last_tick TEXT
);

CREATE TRIGGER pages_require_verified BEFORE INSERT ON pages
WHEN NOT EXISTS (SELECT 1 FROM sites s WHERE s.id = NEW.site_id AND s.verified_at IS NOT NULL)
BEGIN SELECT RAISE(ABORT, 'site is not verified'); END;
