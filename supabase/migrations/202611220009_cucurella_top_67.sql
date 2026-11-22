-- Owner-confirmed catalogue correction: Cucurella, Top Fichajes #67.
-- Reuse the reference UUID and existing portrait; quantities stay untouched.
do $fix$
declare
 actor uuid := 'c657cfab-0e5d-5a10-8655-5ab264ca3f9f';
 sid uuid := 'd66911f6-46e3-5db3-9eec-eb89bbae427c';
 c uuid; series uuid; previous jsonb;
 sources jsonb := '[{"name": "Cromolista", "url": "https://cromolista.com/coleccion/liga-este-2026-27", "number": "67", "nameInSource": "Cucurella - Real Madrid"}, {"name": "Stickers.app", "url": "https://stckrs.app/albums/2026/liga-este-2026-27/", "number": "TF 2", "nameInSource": "Cucurella"}, {"name": "De Cromos con JR", "url": "https://www.decromosconjr.es/laliga-ea-sports-2026-27-listado-ediciones/", "number": "68", "nameInSource": "Cucurella"}]';
 notes jsonb := '["Número 67 confirmado expresamente por el usuario para Top Fichajes. Se conservan las discrepancias de las fuentes consultadas como historial; no se declara confirmación oficial de Panini."]';
begin
 select id into strict c from public.collections where slug='laliga-este-2026-27';
 select id into strict series from public.sticker_series where name='Top Fichajes';
 if exists(select 1 from public.stickers where collection_id=c and series_id=series and official_code='67' and id<>sid)
 or exists(select 1 from public.stickers where id=sid and (collection_id<>c or series_id is distinct from series or team_id is not null)) then
   raise exception 'CATALOG_ID_CONFLICT';
 end if;
 select to_jsonb(s) into previous from public.stickers s where id=sid;
 insert into public.stickers(id,collection_id,official_code,name,series_id,edition,variant,sticker_type,source_url,corroboration_url,verified_at,verified_by,published,catalog_section,catalog_order,catalog_review,catalog_number_status,catalog_notes,catalog_sources,verification_method)
 values(sid,c,'67','Cucurella',series,'4ª edición','base','special',sources->0->>'url',sources->1->>'url',now(),actor,true,'top-fichajes',658,'user_confirmed','user_confirmed',notes,sources,'user_confirmation')
 on conflict(id) do update set official_code='67',published=true,catalog_review='user_confirmed',catalog_number_status='user_confirmed',catalog_notes=excluded.catalog_notes,catalog_sources=excluded.catalog_sources,verification_method='user_confirmation',verified_at=excluded.verified_at,verified_by=actor;
 insert into public.sticker_catalog_revisions(sticker_id,actor_id,old_data,new_data)
 select sid,actor,previous,to_jsonb(s) from public.stickers s where id=sid;
 insert into public.audit_logs(actor_id,action,details) values(actor,'catalogue_cucurella_67_owner_confirmed',jsonb_build_object('sticker_id',sid,'official_code','67','series','Top Fichajes','basis','user_confirmation','officially_complete',false));
end $fix$;
