-- MODELO para novas instalações: substitua owner@example.invalid antes de executar.
-- O banco existente mantém suas políticas pessoais; não reaplique este modelo nele.
create table public.borali_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload)='object'),
 revision integer not null default 1,
 updated_at timestamptz not null default now()
);
create table public.borali_sessions (
 id text primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 payload jsonb not null check (jsonb_typeof(payload)='object' and payload->>'id'=id),
 revision integer not null default 1,
 updated_at timestamptz not null default now()
);
create index borali_sessions_owner on public.borali_sessions(user_id,updated_at);
alter table public.borali_profiles enable row level security;
alter table public.borali_sessions enable row level security;
create policy profiles_owner on public.borali_profiles for all to authenticated
 using ((select auth.uid())=user_id and (select auth.jwt()->>'email')='owner@example.invalid')
 with check ((select auth.uid())=user_id and (select auth.jwt()->>'email')='owner@example.invalid');
create policy sessions_owner on public.borali_sessions for all to authenticated
 using ((select auth.uid())=user_id and (select auth.jwt()->>'email')='owner@example.invalid')
 with check ((select auth.uid())=user_id and (select auth.jwt()->>'email')='owner@example.invalid');
revoke all on public.borali_profiles,public.borali_sessions from anon;
grant select,insert,update on public.borali_profiles,public.borali_sessions to authenticated;
create function public.borali_save_session(doc jsonb,expected_revision integer) returns public.borali_sessions
language plpgsql security invoker set search_path='' as $$
declare result public.borali_sessions;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if expected_revision=0 then
  insert into public.borali_sessions(id,user_id,payload) values(doc->>'id',auth.uid(),doc) returning * into result;
 else
  update public.borali_sessions set payload=doc,revision=revision+1,updated_at=now()
  where id=doc->>'id' and user_id=auth.uid() and revision=expected_revision returning * into result;
  if not found then raise exception 'Revision conflict' using errcode='40001'; end if;
 end if;
 return result;
end; $$;
revoke all on function public.borali_save_session(jsonb,integer) from public,anon;
grant execute on function public.borali_save_session(jsonb,integer) to authenticated;
create function public.borali_save_profile(doc jsonb,expected_revision integer) returns public.borali_profiles
language plpgsql security invoker set search_path='' as $$
declare result public.borali_profiles;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if expected_revision=0 then
  insert into public.borali_profiles(user_id,payload) values(auth.uid(),doc) returning * into result;
 else
  update public.borali_profiles set payload=doc,revision=revision+1,updated_at=now()
  where user_id=auth.uid() and revision=expected_revision returning * into result;
  if not found then raise exception 'Revision conflict' using errcode='40001'; end if;
 end if;
 return result;
end; $$;
revoke all on function public.borali_save_profile(jsonb,integer) from public,anon;
grant execute on function public.borali_save_profile(jsonb,integer) to authenticated;
