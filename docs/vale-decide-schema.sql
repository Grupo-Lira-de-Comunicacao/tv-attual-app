-- TV Attual — Vale Decide 2026
-- Esquema inicial para Supabase/PostgreSQL

create extension if not exists pgcrypto;

create table if not exists public.election_cities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  state char(2) not null default 'SP',
  region text,
  priority integer not null default 100,
  created_at timestamptz not null default now(),
  unique (name, state)
);

create table if not exists public.election_candidates (
  id uuid primary key default gen_random_uuid(),
  tse_sequential text unique,
  ballot_name text not null,
  full_name text,
  office text not null,
  ballot_number text,
  party text not null,
  federation text,
  coalition text,
  base_city_id uuid references public.election_cities(id) on delete set null,
  base_type text not null default 'regional' check (base_type in ('local','regional','supported_local','impact_history')),
  registration_status text not null default 'em_analise',
  occupation text,
  biography text,
  photo_url text,
  instagram_url text,
  facebook_url text,
  website_url text,
  tse_url text,
  publish boolean not null default false,
  verification_status text not null default 'pending' check (verification_status in ('pending','verified','review_required')),
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.candidate_city_impact (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.election_candidates(id) on delete cascade,
  city_id uuid not null references public.election_cities(id) on delete cascade,
  year integer,
  category text,
  description text not null,
  announced_amount numeric(14,2),
  committed_amount numeric(14,2),
  paid_amount numeric(14,2),
  executed_amount numeric(14,2),
  status text not null default 'identified',
  source_url text,
  source_name text,
  source_date date,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.candidate_election_history (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.election_candidates(id) on delete cascade,
  election_year integer not null,
  office text not null,
  city text,
  party text,
  votes integer,
  result text,
  source_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.candidate_sources (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid references public.election_candidates(id) on delete cascade,
  source_type text not null,
  title text,
  url text not null,
  publisher text,
  published_at timestamptz,
  checked_at timestamptz not null default now(),
  notes text
);

create table if not exists public.editorial_tracking (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.election_candidates(id) on delete cascade,
  invitation_status text not null default 'not_contacted',
  contact_name text,
  contact_channel text,
  interview_at timestamptz,
  interview_status text not null default 'not_scheduled',
  published_url text,
  notes text,
  updated_at timestamptz not null default now(),
  unique(candidate_id)
);

create index if not exists idx_candidates_city on public.election_candidates(base_city_id);
create index if not exists idx_candidates_office on public.election_candidates(office);
create index if not exists idx_candidates_party on public.election_candidates(party);
create index if not exists idx_impact_candidate_city on public.candidate_city_impact(candidate_id, city_id);

alter table public.election_cities enable row level security;
alter table public.election_candidates enable row level security;
alter table public.candidate_city_impact enable row level security;
alter table public.candidate_election_history enable row level security;
alter table public.candidate_sources enable row level security;
alter table public.editorial_tracking enable row level security;

-- O conteúdo público só poderá ser lido quando marcado como publicado/verificado.
create policy "public read published candidates"
on public.election_candidates for select
to anon, authenticated
using (publish = true and verification_status = 'verified');

create policy "public read cities"
on public.election_cities for select
to anon, authenticated
using (true);

-- candidate_city_impact e histórico serão publicados por views/API após validação editorial.
-- Escritas administrativas devem ser feitas exclusivamente com service role/Edge Function segura.
