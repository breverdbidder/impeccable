-- Deploy foundation (CP-11). Not applied anywhere yet.
-- Access model: people sign in through Cloudflare Access. Only the Pages
-- Functions talk to Postgres, with the service role. Row level security is on
-- with no policies, so the anon and authenticated roles can read nothing.

create extension if not exists pgcrypto;

create table sites (
  id text primary key,
  hostname text unique,
  name text not null,
  github_repo text,
  cf_project text,
  verify_method text check (verify_method in ('dns_txt','meta','file')),
  verify_token text not null default encode(gen_random_bytes(18), 'hex'),
  verified_at timestamptz,
  auto_publish text not null default 'off' check (auto_publish in ('off','preview','preview_production')),
  timezone text not null default 'America/New_York',
  created_at timestamptz not null default now()
);

create table monitors (
  id uuid primary key default gen_random_uuid(),
  site_id text not null references sites(id) on delete cascade,
  kind text not null check (kind in ('uptime','cert','visual','lighthouse','links','sitemap','content')),
  target text not null,
  config jsonb not null default '{}',
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);
create index on monitors (site_id);

create table checks (
  id uuid primary key default gen_random_uuid(),
  monitor_id uuid not null references monitors(id) on delete cascade,
  ok boolean not null,
  value jsonb not null,
  ran_at timestamptz not null default now()
);
create index on checks (monitor_id, ran_at desc);

create table findings (
  id uuid primary key default gen_random_uuid(),
  site_id text not null references sites(id) on delete cascade,
  source text not null,
  severity text not null check (severity in ('high','medium','low')),
  title text not null,
  evidence jsonb not null,
  status text not null default 'open' check (status in ('open','in_progress','fixed','dismissed')),
  dedupe_key text not null,
  created_at timestamptz not null default now(),
  unique (site_id, dedupe_key)
);
create index on findings (status, severity, created_at desc);

create table usage (
  id bigint generated always as identity primary key,
  ts timestamptz not null default now(),
  site_id text references sites(id) on delete set null,
  provider text not null,
  model text not null,
  cost_cents int not null check (cost_cents >= 0)
);
create index on usage (ts desc);

create table budget (
  month date primary key,
  cap_cents int not null default 10000 check (cap_cents >= 0)
);

create table audit_log (
  id bigint generated always as identity primary key,
  ts timestamptz not null default now(),
  actor_type text not null check (actor_type in ('member','agent','token','system')),
  actor_id text not null,
  action text not null,
  target text,
  input jsonb,
  output jsonb,
  cost_cents int not null default 0
);
create index on audit_log (ts desc);

-- Guard used by every job before it records anything about a site.
create function assert_site_verified(p_site text) returns void
language plpgsql as $$
begin
  if not exists (select 1 from sites where id = p_site and verified_at is not null) then
    raise exception 'site % is not verified', p_site using errcode = 'P0001';
  end if;
end $$;

create function checks_require_verified() returns trigger
language plpgsql as $$
begin
  perform assert_site_verified((select site_id from monitors where id = new.monitor_id));
  return new;
end $$;
create trigger checks_verified before insert on checks for each row execute function checks_require_verified();

create function findings_require_verified() returns trigger
language plpgsql as $$
begin
  perform assert_site_verified(new.site_id);
  return new;
end $$;
create trigger findings_verified before insert on findings for each row execute function findings_require_verified();

-- Spend cannot cross the month's cap.
create function usage_within_cap() returns trigger
language plpgsql as $$
declare cap int; spent int;
begin
  select cap_cents into cap from budget where month = date_trunc('month', now())::date;
  cap := coalesce(cap, 10000);
  select coalesce(sum(cost_cents), 0) into spent from usage where ts >= date_trunc('month', now());
  if spent + new.cost_cents > cap then
    raise exception 'monthly budget cap reached (% of % cents)', spent, cap using errcode = 'P0002';
  end if;
  return new;
end $$;
create trigger usage_cap before insert on usage for each row execute function usage_within_cap();

-- The audit log is append-only, including for the service role.
create function audit_append_only() returns trigger
language plpgsql as $$ begin raise exception 'audit_log is append-only'; end $$;
create trigger audit_no_change before update or delete on audit_log for each row execute function audit_append_only();

alter table sites enable row level security;
alter table monitors enable row level security;
alter table checks enable row level security;
alter table findings enable row level security;
alter table usage enable row level security;
alter table budget enable row level security;
alter table audit_log enable row level security;

insert into sites (id, hostname, name, github_repo, cf_project) values
  ('biddeed', 'biddeed.ai', 'BidDeed.AI', 'breverdbidder/biddeed-web', null),
  ('dealdeed', 'dealdeed.app', 'DealDeed (includes RentalIQ)', 'breverdbidder/rentaliq', 'rentaliq'),
  ('zonewise', null, 'ZoneWise', 'breverdbidder/zonewise-web', null);
