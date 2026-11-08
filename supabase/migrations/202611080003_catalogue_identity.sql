-- Sticker numbers restart for each club and series. Unnumbered Extras use names.
alter table public.stickers drop constraint stickers_collection_id_official_code_edition_variant_key;
create unique index stickers_numbered_identity on public.stickers
(collection_id,team_id,series_id,official_code,edition,variant) nulls not distinct where official_code <> 'S/N';
create unique index stickers_unnumbered_identity on public.stickers
(collection_id,team_id,series_id,name,edition,variant) nulls not distinct where official_code = 'S/N';
alter table public.stickers add column catalog_section text,
 add column catalog_order integer,
 add column catalog_review text,
 add column catalog_number_status text,
 add column catalog_notes jsonb,
 add column catalog_sources jsonb,
 add column verification_method text not null default 'editorial';

create or replace function public.import_catalog(p_collection uuid,p_rows jsonb) returns integer language plpgsql security definer set search_path = '' as $$
 declare row jsonb; team uuid; series uuid; sid uuid; old_row jsonb; n integer:=0;
 begin
 if not public.is_admin() then raise exception 'Administración requerida'; end if;
 if jsonb_typeof(p_rows)<>'array' or jsonb_array_length(p_rows) not between 1 and 2000 then raise exception 'Importa entre 1 y 2000 filas'; end if;
 for row in select * from jsonb_array_elements(p_rows) loop
 if coalesce(row->>'official_code','')='' or coalesce(row->>'name','')='' or coalesce(row->>'edition','')='' or coalesce(row->>'source_url','')!~'^https://' or coalesce(row->>'corroboration_url','')!~'^https://' or row->>'source_url'=row->>'corroboration_url' or row->>'verified_at' is null or (row->>'verified_at')::timestamptz>now() then raise exception 'Fila no verificada o fuentes insuficientes'; end if;
 team:=null; series:=null;
 if nullif(row->>'team','') is not null then insert into public.teams(name) values(row->>'team') on conflict(name) do update set name=excluded.name returning id into team; end if;
 if nullif(row->>'series','') is not null then insert into public.sticker_series(name) values(row->>'series') on conflict(name) do update set name=excluded.name returning id into series; end if;
 select id,to_jsonb(s) into sid,old_row from public.stickers s where collection_id=p_collection and official_code=row->>'official_code' and edition=row->>'edition' and variant=coalesce(row->>'variant','base') and team_id is not distinct from team and series_id is not distinct from series and (official_code<>'S/N' or name=row->>'name');
 if sid is null then
 insert into public.stickers(collection_id,official_code,name,team_id,series_id,edition,variant,sticker_type,album_position,source_url,corroboration_url,verified_at,verified_by) values(p_collection,row->>'official_code',row->>'name',team,series,row->>'edition',coalesce(row->>'variant','base'),coalesce(row->>'sticker_type','normal'),nullif(row->>'album_position',''),row->>'source_url',row->>'corroboration_url',(row->>'verified_at')::timestamptz,auth.uid()) returning id into sid;
 else
 update public.stickers set name=row->>'name',team_id=team,series_id=series,album_position=nullif(row->>'album_position',''),source_url=row->>'source_url',corroboration_url=row->>'corroboration_url',verified_at=(row->>'verified_at')::timestamptz,verified_by=auth.uid() where id=sid;
 end if;
 insert into public.sticker_catalog_revisions(sticker_id,actor_id,old_data,new_data) select sid,auth.uid(),old_row,to_jsonb(s) from public.stickers s where id=sid;
 n:=n+1;
 end loop;
 update public.collections set catalog_status='partial' where id=p_collection and catalog_status='pending';
 insert into public.audit_logs(actor_id,action,details) values(auth.uid(),'catalog_import',jsonb_build_object('rows',n,'collection_id',p_collection)); return n;
 end $$;
