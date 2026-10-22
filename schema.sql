-- À exécuter dans Supabase > SQL Editor
create table if not exists docs(
  coll text not null, id text not null, data jsonb not null default '{}',
  created_at timestamptz not null default now(), primary key(coll,id));
alter table docs replica identity full;
alter table docs enable row level security;
create policy "lecture"     on docs for select to authenticated using(true);
create policy "creation"    on docs for insert to authenticated with check(true);
create policy "modification" on docs for update to authenticated using(true);
create policy "suppression" on docs for delete to authenticated using(true);
create or replace function merge_doc(p_coll text,p_id text,p_data jsonb) returns void
language sql as $$ update docs set data = data || p_data where coll=p_coll and id=p_id $$;
alter publication supabase_realtime add table docs;
insert into storage.buckets(id,name,public) values('visuals','visuals',true) on conflict do nothing;
create policy "envoi visuels" on storage.objects for insert to authenticated with check(bucket_id='visuals');
