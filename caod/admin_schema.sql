-- Run after schema.sql. Adds institution status and verification audit logs.

alter table institutions
  add column if not exists status text not null default 'active';

create table if not exists verification_log (
  id uuid primary key,
  record_id uuid references records(id) on delete set null,
  share_code text,
  valid boolean not null,
  verifier_name text,
  created_at timestamptz default now()
);

alter table institutions
  add constraint institutions_status_check
  check (status in ('active', 'suspended'));
