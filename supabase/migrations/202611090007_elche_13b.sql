-- Elche 13B was excluded because the original corroboration missed the
-- John/Jon spelling variation. Three current lists identify the same card.
-- Preserve the reference UUID and leave all inventories untouched.
do $fix$
declare
 actor uuid := 'c657cfab-0e5d-5a10-8655-5ab264ca3f9f';
 sid uuid := 'e600bc74-6af8-5347-a43e-2816737a1090';
 c uuid; club uuid; previous jsonb;
 sources jsonb := '[{"name":"Cromolista","url":"https://cromolista.com/coleccion/liga-este-2026-27","number":"13B","nameInSource":"John Chetauya"},{"name":"Stickers.app","url":"https://stckrs.app/albums/2026/liga-este-2026-27/","number":"ELC 13B","nameInSource":"Jon Chetauya"},{"name":"De Cromos con JR","url":"https://www.decromosconjr.es/laliga-ea-sports-2026-27-listado-ediciones/","number":"13B","nameInSource":"Jon Chetauya"}]';
begin
 select id into strict c from public.collections where slug='laliga-este-2026-27';
 select id into strict club from public.teams where name='Elche CF';
 if exists(select 1 from public.stickers where collection_id=c and team_id=club and official_code='13B' and id<>sid)
 or exists(select 1 from public.stickers where id=sid and (collection_id<>c or team_id is distinct from club or official_code<>'13B')) then
   raise exception 'CATALOG_ID_CONFLICT';
 end if;
 select to_jsonb(s) into previous from public.stickers s where id=sid;
 insert into public.stickers(id,collection_id,official_code,name,team_id,edition,variant,sticker_type,source_url,corroboration_url,verified_at,verified_by,published,catalog_section,catalog_order,catalog_review,catalog_number_status,catalog_notes,catalog_sources,verification_method)
 values(sid,c,'13B','John Chetauya',club,'Edición por confirmar','B','normal',sources->0->>'url',sources->1->>'url','2026-11-09'::timestamptz,actor,true,'elche',188,'cross_checked','listed','["John/Jon Chetauya: número y equipo contrastados en tres listados; edición por confirmar."]',sources,'cross_checked_sources')
 on conflict(id) do update set published=true,catalog_review='cross_checked',catalog_sources=excluded.catalog_sources,catalog_notes=excluded.catalog_notes,source_url=excluded.source_url,corroboration_url=excluded.corroboration_url,verified_at=excluded.verified_at,verified_by=actor,verification_method='cross_checked_sources';
 insert into public.sticker_catalog_revisions(sticker_id,actor_id,old_data,new_data)
 select sid,actor,previous,to_jsonb(s) from public.stickers s where id=sid;
 insert into public.audit_logs(actor_id,action,details) values(actor,'catalogue_elche_13b_corroborated',jsonb_build_object('sticker_id',sid,'official_code','13B','team','Elche CF','sources',3,'officially_complete',false));
end $fix$;
