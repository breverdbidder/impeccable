-- REAI Valley marketplace tables. PROPOSAL ONLY: new tables on the production
-- project mocerqjnksmhcjzxrewo are a schema change and wait for the owner's
-- explicit approval. multi_county_auctions is read-only and is referenced,
-- never altered.

create table if not exists valley_vendors (
  id            text primary key,                 -- 'v-brv-title'
  name          text not null,
  trade         text not null,                    -- id from trades.json
  county        text not null,                    -- 'Brevard'
  color         text not null default '#f59e0b',
  website       text,
  contact_email text,
  status        text not null default 'prospect', -- prospect | active | churned
  synthetic     boolean not null default false,   -- demo rows stay labeled
  created_at    timestamptz not null default now()
);

create table if not exists valley_plots (
  id         text primary key,                    -- 'brevard:build:1'
  county     text not null,
  district   text not null,                       -- id from trades.json districts
  trade      text not null,                       -- the trade this plot is reserved for
  slot       int  not null,
  exclusive  boolean not null default false,
  unique (county, trade)                          -- one plot per trade per county
);

create table if not exists valley_leases (
  id          bigint generated always as identity primary key,
  vendor_id   text not null references valley_vendors(id),
  plot_id     text not null references valley_plots(id),
  tier        text not null,                      -- standard | exclusive
  monthly_usd numeric(10,2) not null,
  starts_at   date not null,
  ends_at     date,
  stripe_subscription_id text,
  created_at  timestamptz not null default now()
);

create table if not exists valley_buyers (
  id            bigint generated always as identity primary key,
  auction_id    bigint,                           -- multi_county_auctions.id (read-only source)
  case_number   text,
  parcel_id     text,
  county        text not null,
  needs         text[] not null,                  -- trade ids from journey.json
  player        text,                             -- game player or bot id
  created_at    timestamptz not null default now()
);

create table if not exists valley_matches (
  id         bigint generated always as identity primary key,
  buyer_id   bigint not null references valley_buyers(id) on delete cascade,
  trade      text not null,
  vendor_id  text references valley_vendors(id), -- null = unmet demand
  stage      text not null,                       -- district id
  outcome    text not null default 'matched',     -- matched | unmet | declined
  created_at timestamptz not null default now()
);

create index if not exists valley_matches_unmet_idx on valley_matches (trade, outcome) where vendor_id is null;
create index if not exists valley_leases_active_idx on valley_leases (plot_id) where ends_at is null;
