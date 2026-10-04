-- Run this in the Supabase SQL Editor to set up all required tables.

create table citizens (
  id uuid primary key,
  name text not null,
  dob date not null,
  root_id text unique not null,
  created_at timestamptz default now()
);

create table sub_ids (
  id uuid primary key,
  citizen_id uuid references citizens(id) on delete cascade,
  domain text not null,
  sub_id text unique not null,
  created_at timestamptz default now()
);

-- Seed institutions manually (or via a setup script) after generating
-- each one's ECDSA keypair with generate_institution_keypair() in
-- crypto_utils.py. private_key stays server-side only.
create table institutions (
  id uuid primary key,
  name text unique not null,
  domain text not null,       -- education | employment | finance | healthcare
  public_key text not null,
  private_key text not null,  -- demo simplicity only; see note below
  created_at timestamptz default now()
);

create table records (
  id uuid primary key,
  sub_id_id uuid references sub_ids(id) on delete cascade,
  institution_id uuid references institutions(id),
  title text not null,
  content text,
  signature text not null,
  created_at timestamptz default now()
);

create table consent_grants (
  id uuid primary key,
  record_id uuid references records(id) on delete cascade,
  share_code text unique not null,
  verifier_name text,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

-- Note on institution private keys: storing them in the same database
-- as everything else is fine for a hackathon demo, but call this out
-- explicitly as a "future work" item in your deck — a production system
-- would keep each institution's private key in their own infrastructure
-- or a secrets manager (e.g. AWS KMS), never centrally in your DB.
