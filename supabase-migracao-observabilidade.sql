-- URA A&G — observabilidade, sessões, idempotência e timeout
-- BUILD: 20261027-2158 | Atualizado: 2026-10-27 21:58 -03
-- Execute uma única vez no Supabase > SQL Editor do projeto novo.

alter table public.ura_estado
  add column if not exists session_id text;

alter table public.ura_log
  add column if not exists session_id text,
  add column if not exists event_id text,
  add column if not exists ura_build text,
  add column if not exists evento text,
  add column if not exists acao text,
  add column if not exists arquivo text,
  add column if not exists tag text,
  add column if not exists move_etapa text,
  add column if not exists resposta_api jsonb,
  add column if not exists duracao_ms integer,
  add column if not exists origem text;

create index if not exists ura_log_session_id_idx
  on public.ura_log (session_id);

create index if not exists ura_log_evento_idx
  on public.ura_log (evento);

create index if not exists ura_log_criado_em_idx
  on public.ura_log (criado_em desc);

create unique index if not exists ura_log_event_id_uidx
  on public.ura_log (event_id)
  where event_id is not null;

create table if not exists public.ura_eventos (
  id bigint generated always as identity primary key,
  event_id text,
  telefone text not null,
  session_id text,
  fingerprint text not null,
  resposta_api jsonb not null,
  ura_build text,
  criado_em timestamptz not null default now()
);

create unique index if not exists ura_eventos_event_id_uidx
  on public.ura_eventos (event_id)
  where event_id is not null;

create index if not exists ura_eventos_telefone_criado_idx
  on public.ura_eventos (telefone, criado_em desc);

alter table public.ura_eventos enable row level security;

-- O backend usa exclusivamente a secret/service_role key. Nenhuma tabela
-- abaixo precisa ser exposta ao navegador ou à chave publishable.
grant usage on schema public to service_role;
grant select, insert, update, delete on table public.ura_estado to service_role;
grant select, insert, update, delete on table public.ura_log to service_role;
grant select, insert, update, delete on table public.ura_eventos to service_role;
grant usage, select on all sequences in schema public to service_role;

revoke all on table public.ura_eventos from anon, authenticated;

