-- CROMATCH: all writes to inventories and trades go through transactional RPCs.
create table public.profiles (
 id uuid primary key, username text not null unique check(username ~ '^[a-z0-9_]{3,24}$'),
 display_name text not null check(length(display_name) between 1 and 60), avatar_url text,
 is_admin boolean not null default false, deleted_at timestamptz, created_at timestamptz not null default now()
);
create table public.collections (id uuid primary key default gen_random_uuid(), slug text unique not null, name text not null, season text not null, catalog_status text not null default 'pending' check(catalog_status in ('pending','partial','verified')), album_positions integer check(album_positions > 0));
create table public.teams (id uuid primary key default gen_random_uuid(), name text unique not null);
create table public.sticker_series (id uuid primary key default gen_random_uuid(), name text unique not null);
create table public.stickers (
 id uuid primary key default gen_random_uuid(), collection_id uuid not null references public.collections,
 official_code text not null, name text not null, team_id uuid references public.teams, series_id uuid references public.sticker_series,
 edition text not null, variant text not null default 'base', sticker_type text not null default 'normal', album_position text,
 source_url text not null check(source_url ~ '^https://'), corroboration_url text not null check(corroboration_url ~ '^https://'),
 verified_at timestamptz not null, verified_by uuid not null references public.profiles,
 published boolean not null default true, image_url text, image_license text,
 check(image_url is null or image_license is not null),
 unique(collection_id, official_code, edition, variant)
);
create table public.sticker_catalog_revisions (id bigint generated always as identity primary key, sticker_id uuid references public.stickers, actor_id uuid references public.profiles, old_data jsonb, new_data jsonb not null, created_at timestamptz not null default now());
create table public.user_privacy_settings (user_id uuid primary key references public.profiles, visibility text not null default 'private' check(visibility in ('private','friends','registered')), match_notifications boolean not null default false);
create table public.user_collections (user_id uuid references public.profiles, collection_id uuid references public.collections, joined_at timestamptz not null default now(), primary key(user_id,collection_id));
create table public.user_inventory (
 user_id uuid references public.profiles, sticker_id uuid references public.stickers,
 quantity integer not null default 0 check(quantity between 0 and 10000), reserved integer not null default 0 check(reserved >= 0 and reserved <= greatest(quantity - 1,0)),
 updated_at timestamptz not null default now(), primary key(user_id,sticker_id)
);
create table public.friendships (id uuid primary key default gen_random_uuid(), requester_id uuid not null references public.profiles, recipient_id uuid not null references public.profiles, status text not null default 'pending' check(status in ('pending','accepted')), check(requester_id <> recipient_id), created_at timestamptz not null default now());
create unique index friendships_pair on public.friendships(least(requester_id,recipient_id),greatest(requester_id,recipient_id));
create table public.user_blocks (blocker_id uuid references public.profiles, blocked_id uuid references public.profiles, primary key(blocker_id,blocked_id), check(blocker_id <> blocked_id));
create table public.trade_proposals (id uuid primary key default gen_random_uuid(), collection_id uuid not null references public.collections, sender_id uuid not null references public.profiles, receiver_id uuid not null references public.profiles, status text not null default 'proposed' check(status in ('proposed','accepted','rejected','cancelled','completed')), created_at timestamptz not null default now(), completed_at timestamptz, check(sender_id <> receiver_id));
create table public.trade_participants (trade_id uuid references public.trade_proposals, user_id uuid references public.profiles, confirmed_at timestamptz, primary key(trade_id,user_id));
create table public.trade_items (trade_id uuid references public.trade_proposals, giver_id uuid references public.profiles, sticker_id uuid references public.stickers, quantity integer not null check(quantity between 1 and 100), primary key(trade_id,giver_id,sticker_id));
create table public.trade_reservations (trade_id uuid references public.trade_proposals, user_id uuid references public.profiles, sticker_id uuid references public.stickers, quantity integer not null check(quantity>0), created_at timestamptz not null default now(), primary key(trade_id,user_id,sticker_id));
create table public.inventory_transactions (id bigint generated always as identity primary key, user_id uuid references public.profiles, sticker_id uuid references public.stickers, delta integer not null, trade_id uuid references public.trade_proposals, operation_id uuid not null, created_at timestamptz not null default now(), unique(operation_id,user_id,sticker_id));
create table public.inventory_operations (operation_id uuid primary key, user_id uuid not null references public.profiles, sticker_id uuid not null references public.stickers, delta integer not null, result_quantity integer not null);
create table public.notifications (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles, message text not null, read_at timestamptz, created_at timestamptz not null default now());
create table public.shared_lists (id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles, collection_id uuid not null references public.collections, kind text not null check(kind in ('missing','duplicates')), revoked_at timestamptz, expires_at timestamptz not null default now()+interval '7 days');
create table public.audit_logs (id bigint generated always as identity primary key, actor_id uuid references public.profiles, action text not null, details jsonb not null default '{}', created_at timestamptz not null default now());
create table public.reports (id uuid primary key default gen_random_uuid(), reporter_id uuid not null references public.profiles, reported_id uuid not null references public.profiles, reason text not null check(length(reason) between 10 and 2000), created_at timestamptz not null default now());
create table public.rate_limits (user_id uuid references public.profiles, bucket text, window_start timestamptz not null, count integer not null, primary key(user_id,bucket));
create index profile_username_search on public.profiles(username text_pattern_ops);
create index stickers_collection on public.stickers(collection_id,official_code);
create index inventory_sticker on public.user_inventory(sticker_id,user_id);
create index friendships_recipient on public.friendships(recipient_id);
create index trades_receiver on public.trade_proposals(receiver_id,created_at desc);
create index trades_sender on public.trade_proposals(sender_id,created_at desc);
create index notification_user on public.notifications(user_id,created_at desc);
create index transactions_user on public.inventory_transactions(user_id,created_at);

create function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $$ select coalesce((select is_admin from public.profiles where id=auth.uid() and deleted_at is null),false) $$;
create function public.is_blocked(a uuid,b uuid) returns boolean language sql stable security definer set search_path = '' as $$ select exists(select 1 from public.user_blocks where (blocker_id=a and blocked_id=b) or (blocker_id=b and blocked_id=a)) $$;
create function public.are_friends(a uuid,b uuid) returns boolean language sql stable security definer set search_path = '' as $$ select exists(select 1 from public.friendships where status='accepted' and ((requester_id=a and recipient_id=b) or (requester_id=b and recipient_id=a))) and not public.is_blocked(a,b) $$;
create function public.can_view_inventory(owner_id uuid) returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.profiles where id=auth.uid() and deleted_at is null) and (owner_id=auth.uid() or (not public.is_blocked(owner_id,auth.uid()) and exists(select 1 from public.user_privacy_settings where user_id=owner_id and (visibility='registered' or (visibility='friends' and public.are_friends(owner_id,auth.uid()))))))
$$;
create function public.is_trade_member(t uuid) returns boolean language sql stable security definer set search_path = '' as $$ select exists(select 1 from public.trade_participants tp join public.profiles p on p.id=tp.user_id where tp.trade_id=t and tp.user_id=auth.uid() and p.deleted_at is null) $$;
create function public.require_user() returns uuid language plpgsql security definer set search_path = '' as $$ declare u uuid := auth.uid(); begin if u is null or not exists(select 1 from public.profiles where id=u and deleted_at is null) then raise exception 'Sesión no válida'; end if; return u; end $$;
create function public.throttle(b text, max_count integer) returns void language plpgsql security definer set search_path = '' as $$
 declare n integer; begin
 insert into public.rate_limits values(public.require_user(),b,date_trunc('minute',now()),1)
 on conflict(user_id,bucket) do update set count=case when rate_limits.window_start=date_trunc('minute',now()) then rate_limits.count+1 else 1 end, window_start=date_trunc('minute',now()) returning count into n;
 if n>max_count then raise exception 'Demasiadas peticiones. Espera un minuto.'; end if;
 end $$;
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
 begin
 insert into public.profiles(id,username,display_name) values(new.id,'u_'||replace(new.id::text,'-',''),coalesce(nullif(left(new.raw_user_meta_data->>'display_name',60),''),'Coleccionista'));
 insert into public.user_privacy_settings(user_id) values(new.id); return new;
 end $$;
-- Generated username is 34 chars: allow system-generated handles, then user can select 3–24 chars.
alter table public.profiles drop constraint profiles_username_check;
alter table public.profiles add check(username ~ '^[a-z0-9_]{3,34}$');
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Every table uses RLS; no browser has direct write access to sensitive tables.
do $$ declare t text; begin foreach t in array array['profiles','collections','teams','sticker_series','stickers','sticker_catalog_revisions','user_privacy_settings','user_collections','user_inventory','friendships','user_blocks','trade_proposals','trade_participants','trade_items','trade_reservations','inventory_transactions','inventory_operations','notifications','shared_lists','audit_logs','reports','rate_limits'] loop execute format('alter table public.%I enable row level security',t); end loop; end $$;
create policy profile_read on public.profiles for select to authenticated using(deleted_at is null and (id=auth.uid() or not public.is_blocked(id,auth.uid())));
create policy collections_read on public.collections for select to authenticated using(true);
create policy teams_read on public.teams for select to authenticated using(true);
create policy series_read on public.sticker_series for select to authenticated using(true);
create policy stickers_read on public.stickers for select to authenticated using(published or public.is_admin());
create policy revisions_read on public.sticker_catalog_revisions for select to authenticated using(public.is_admin());
create policy privacy_read on public.user_privacy_settings for select to authenticated using(user_id=auth.uid());
create policy user_collections_read on public.user_collections for select to authenticated using(public.can_view_inventory(user_id));
create policy inventory_read on public.user_inventory for select to authenticated using(public.can_view_inventory(user_id));
create policy friends_read on public.friendships for select to authenticated using(auth.uid() in (requester_id,recipient_id));
create policy blocks_read on public.user_blocks for select to authenticated using(blocker_id=auth.uid());
create policy trades_read on public.trade_proposals for select to authenticated using(public.is_trade_member(id));
create policy participants_read on public.trade_participants for select to authenticated using(public.is_trade_member(trade_id));
create policy items_read on public.trade_items for select to authenticated using(public.is_trade_member(trade_id));
create policy reservations_read on public.trade_reservations for select to authenticated using(user_id=auth.uid());
create policy transactions_read on public.inventory_transactions for select to authenticated using(user_id=auth.uid());
create policy operations_read on public.inventory_operations for select to authenticated using(user_id=auth.uid());
create policy notifications_read on public.notifications for select to authenticated using(user_id=auth.uid());
create policy shared_read on public.shared_lists for select to authenticated using(owner_id=auth.uid());
create policy audit_read on public.audit_logs for select to authenticated using(public.is_admin());
create policy reports_read on public.reports for select to authenticated using(reporter_id=auth.uid() or public.is_admin());

create function public.change_quantity(p_sticker uuid,p_delta integer,p_operation uuid) returns integer language plpgsql security definer set search_path = '' as $$
 declare u uuid:=public.require_user(); q integer; r integer; old_op public.inventory_operations; c uuid;
 begin
 perform pg_advisory_xact_lock(hashtextextended(u::text,0));
 select * into old_op from public.inventory_operations where operation_id=p_operation;
 if found then if old_op.user_id<>u or old_op.sticker_id<>p_sticker or old_op.delta<>p_delta then raise exception 'Identificador de operación ya usado'; end if; return old_op.result_quantity; end if;
 perform public.throttle('quantity',120);
 if p_delta not in (-1,1) then raise exception 'Incremento no válido'; end if;
 select collection_id into c from public.stickers where id=p_sticker and published;
 if c is null then raise exception 'Cromo no publicado'; end if;
 insert into public.user_collections values(u,c,now()) on conflict do nothing;
 insert into public.user_inventory(user_id,sticker_id) values(u,p_sticker) on conflict do nothing;
 select quantity,reserved into q,r from public.user_inventory where user_id=u and sticker_id=p_sticker for update;
 q:=q+p_delta;
 if q<0 or q>10000 or r>greatest(q-1,0) then raise exception 'Cantidad no válida o unidades reservadas'; end if;
 update public.user_inventory set quantity=q,updated_at=now() where user_id=u and sticker_id=p_sticker;
 insert into public.inventory_operations values(p_operation,u,p_sticker,p_delta,q);
 insert into public.inventory_transactions(user_id,sticker_id,delta,operation_id) values(u,p_sticker,p_delta,p_operation);
 return q;
 end $$;
create function public.update_profile(p_username text,p_display_name text,p_visibility text,p_matches boolean default false) returns void language plpgsql security definer set search_path = '' as $$
 declare u uuid:=public.require_user(); begin
 if p_username !~ '^[a-z0-9_]{3,24}$' or length(p_display_name) not between 1 and 60 or p_visibility not in ('private','friends','registered') then raise exception 'Perfil no válido'; end if;
 update public.profiles set username=p_username,display_name=p_display_name where id=u;
 update public.user_privacy_settings set visibility=p_visibility,match_notifications=p_matches where user_id=u;
 end $$;
create function public.friend_action(p_other uuid,p_action text) returns void language plpgsql security definer set search_path = '' as $$
 declare u uuid:=public.require_user(); begin
 perform public.throttle('friends',20);
 if p_other=u or not exists(select 1 from public.profiles where id=p_other and deleted_at is null) then raise exception 'Usuario no válido'; end if;
 if p_action='block' then
 insert into public.user_blocks values(u,p_other) on conflict do nothing;
 delete from public.friendships where (requester_id=u and recipient_id=p_other) or (recipient_id=u and requester_id=p_other);
 elsif p_action='unblock' then delete from public.user_blocks where blocker_id=u and blocked_id=p_other;
 elsif p_action='remove' then delete from public.friendships where (requester_id=u and recipient_id=p_other) or (recipient_id=u and requester_id=p_other);
 elsif public.is_blocked(u,p_other) then raise exception 'Operación no permitida';
 elsif p_action='request' then
 insert into public.friendships(requester_id,recipient_id) values(u,p_other);
 insert into public.notifications(user_id,message) values(p_other,'Has recibido una solicitud de amistad.');
 elsif p_action='accept' then
 update public.friendships set status='accepted' where requester_id=p_other and recipient_id=u and status='pending';
 if not found then raise exception 'Solicitud no encontrada'; end if;
 insert into public.notifications(user_id,message) values(p_other,'Tu solicitud de amistad ha sido aceptada.');
 else raise exception 'Acción no válida'; end if;
 end $$;
create function public.propose_trade(p_receiver uuid,p_collection uuid,p_items jsonb,p_id uuid) returns uuid language plpgsql security definer set search_path = '' as $$
 declare u uuid:=public.require_user(); item jsonb; giver uuid; s uuid; n integer;
 begin
 perform pg_advisory_xact_lock(hashtextextended(least(u,p_receiver)::text,0));
 perform pg_advisory_xact_lock(hashtextextended(greatest(u,p_receiver)::text,0));
 perform public.require_user();
 if exists(select 1 from public.trade_proposals where id=p_id and sender_id=u) then return p_id; end if;
 perform public.throttle('proposals',10);
 if not public.are_friends(u,p_receiver) or not public.can_view_inventory(p_receiver) then raise exception 'Necesitas amistad y permiso para consultar la colección'; end if;
 if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items) not between 2 and 100 then raise exception 'Propuesta no válida'; end if;
 insert into public.trade_proposals(id,collection_id,sender_id,receiver_id) values(p_id,p_collection,u,p_receiver);
 insert into public.trade_participants values(p_id,u,null),(p_id,p_receiver,null);
 for item in select * from jsonb_array_elements(p_items) loop
 giver:=(item->>'giver_id')::uuid; s:=(item->>'sticker_id')::uuid; n:=(item->>'quantity')::integer;
 if giver not in (u,p_receiver) or giver is null or n is null or n not between 1 and 100 or not exists(select 1 from public.stickers where id=s and collection_id=p_collection and published) then raise exception 'Cromo o participante no válido'; end if;
 if not exists(select 1 from public.user_inventory where user_id=giver and sticker_id=s and quantity-1-reserved>=n) then raise exception 'Unidades no disponibles'; end if;
 insert into public.trade_items values(p_id,giver,s,n);
 end loop;
 if (select count(distinct giver_id) from public.trade_items where trade_id=p_id)<>2 then raise exception 'Ambas partes deben ofrecer cromos'; end if;
 insert into public.notifications(user_id,message) values(p_receiver,'Tienes una nueva propuesta de intercambio.');
 return p_id;
 end $$;
create function public.trade_action(p_trade uuid,p_action text) returns text language plpgsql security definer set search_path = '' as $$
 declare u uuid:=public.require_user(); t public.trade_proposals; i record; receiver uuid; q integer;
 begin
 select * into t from public.trade_proposals where id=p_trade for update;
 if not found or u not in (t.sender_id,t.receiver_id) then raise exception 'Intercambio no autorizado'; end if;
 -- Lock users in deterministic order, shared by inventory and all exchange mutations.
 perform pg_advisory_xact_lock(hashtextextended(least(t.sender_id,t.receiver_id)::text,0));
 perform pg_advisory_xact_lock(hashtextextended(greatest(t.sender_id,t.receiver_id)::text,0));
 if t.status='completed' then if p_action='confirm' then return 'completed'; end if; raise exception 'Intercambio finalizado'; end if;
 if p_action='accept' then
 if u<>t.receiver_id or t.status<>'proposed' or public.is_blocked(t.sender_id,t.receiver_id) then raise exception 'No se puede aceptar'; end if;
 for i in select * from public.trade_items where trade_id=p_trade order by giver_id,sticker_id loop
 update public.user_inventory set reserved=reserved+i.quantity where user_id=i.giver_id and sticker_id=i.sticker_id and quantity-1-reserved>=i.quantity;
 if not found then raise exception 'Algún cromo ya no está disponible'; end if;
 insert into public.trade_reservations(trade_id,user_id,sticker_id,quantity) values(p_trade,i.giver_id,i.sticker_id,i.quantity);
 end loop;
 update public.trade_proposals set status='accepted' where id=p_trade;
 elsif p_action in ('reject','cancel') then
 if p_action='reject' and (u<>t.receiver_id or t.status<>'proposed') then raise exception 'No se puede rechazar'; end if;
 if t.status not in ('accepted','proposed') then return t.status; end if;
 for i in select * from public.trade_reservations where trade_id=p_trade loop
 update public.user_inventory set reserved=reserved-i.quantity where user_id=i.user_id and sticker_id=i.sticker_id;
 end loop;
 delete from public.trade_reservations where trade_id=p_trade;
 update public.trade_proposals set status=case when p_action='reject' then 'rejected' else 'cancelled' end where id=p_trade;
 elsif p_action='confirm' then
 if t.status<>'accepted' then raise exception 'Primero debe aceptarse'; end if;
 update public.trade_participants set confirmed_at=coalesce(confirmed_at,now()) where trade_id=p_trade and user_id=u;
 if not exists(select 1 from public.trade_participants where trade_id=p_trade and confirmed_at is null) then
 for i in select * from public.trade_reservations where trade_id=p_trade loop
 update public.user_inventory set reserved=reserved-i.quantity where user_id=i.user_id and sticker_id=i.sticker_id;
 end loop;
 delete from public.trade_reservations where trade_id=p_trade;
 for i in select * from public.trade_items where trade_id=p_trade order by giver_id,sticker_id loop
 receiver:=case when i.giver_id=t.sender_id then t.receiver_id else t.sender_id end;
 update public.user_inventory set quantity=quantity-i.quantity,updated_at=now() where user_id=i.giver_id and sticker_id=i.sticker_id and quantity>=i.quantity;
 if not found then raise exception 'Saldo insuficiente'; end if;
 insert into public.user_inventory(user_id,sticker_id,quantity) values(receiver,i.sticker_id,i.quantity) on conflict(user_id,sticker_id) do update set quantity=user_inventory.quantity+excluded.quantity,updated_at=now();
 insert into public.inventory_transactions(user_id,sticker_id,delta,trade_id,operation_id) values(i.giver_id,i.sticker_id,-i.quantity,p_trade,gen_random_uuid()),(receiver,i.sticker_id,i.quantity,p_trade,gen_random_uuid());
 end loop;
 update public.trade_proposals set status='completed',completed_at=now() where id=p_trade;
 insert into public.audit_logs(actor_id,action,details) values(u,'trade_completed',jsonb_build_object('trade_id',p_trade));
 end if;
 else raise exception 'Acción no válida'; end if;
 insert into public.notifications(user_id,message) values(case when u=t.sender_id then t.receiver_id else t.sender_id end,'Se ha actualizado un intercambio. Revisa su estado.');
 return (select status from public.trade_proposals where id=p_trade);
 end $$;
create function public.mark_notifications_read() returns void language sql security definer set search_path = '' as $$ update public.notifications set read_at=now() where user_id=auth.uid() and read_at is null $$;
create function public.report_user(p_other uuid,p_reason text) returns void language plpgsql security definer set search_path = '' as $$ begin perform public.throttle('reports',3); insert into public.reports(reporter_id,reported_id,reason) values(public.require_user(),p_other,p_reason); end $$;

-- Owner-managed, expiring links. Recipients must be signed in. A token only grants this list, never the complete inventory.
create function public.create_shared_list(p_collection uuid,p_kind text) returns uuid language plpgsql security definer set search_path = '' as $$ declare token uuid; begin perform public.throttle('share',10); insert into public.shared_lists(owner_id,collection_id,kind) values(public.require_user(),p_collection,p_kind) returning id into token; return token; end $$;
create function public.revoke_shared_list(p_id uuid) returns void language sql security definer set search_path = '' as $$ update public.shared_lists set revoked_at=now() where id=p_id and owner_id=auth.uid() $$;
create function public.read_shared_list(p_id uuid) returns table(official_code text,name text,quantity integer) language plpgsql security definer set search_path = '' as $$ declare l public.shared_lists; begin
 perform public.require_user(); select * into l from public.shared_lists where id=p_id and revoked_at is null and expires_at>now();
 if not found or public.is_blocked(l.owner_id,auth.uid()) then raise exception 'Enlace no disponible'; end if;
 return query select s.official_code,s.name,case when l.kind='missing' then 0 else greatest(coalesce(i.quantity,0)-1-coalesce(i.reserved,0),0) end from public.stickers s left join public.user_inventory i on i.sticker_id=s.id and i.user_id=l.owner_id where s.collection_id=l.collection_id and s.published and ((l.kind='missing' and coalesce(i.quantity,0)=0) or (l.kind='duplicates' and coalesce(i.quantity,0)-1-coalesce(i.reserved,0)>0));
 end $$;

create function public.import_catalog(p_collection uuid,p_rows jsonb) returns integer language plpgsql security definer set search_path = '' as $$
 declare row jsonb; team uuid; series uuid; sid uuid; old_row jsonb; n integer:=0;
 begin
 if not public.is_admin() then raise exception 'Administración requerida'; end if;
 if jsonb_typeof(p_rows)<>'array' or jsonb_array_length(p_rows) not between 1 and 2000 then raise exception 'Importa entre 1 y 2000 filas'; end if;
 for row in select * from jsonb_array_elements(p_rows) loop
 if coalesce(row->>'official_code','')='' or coalesce(row->>'name','')='' or coalesce(row->>'edition','')='' or coalesce(row->>'source_url','')!~'^https://' or coalesce(row->>'corroboration_url','')!~'^https://' or row->>'source_url'=row->>'corroboration_url' or row->>'verified_at' is null or (row->>'verified_at')::timestamptz>now() then raise exception 'Fila no verificada o fuentes insuficientes'; end if;
 team:=null; series:=null;
 if nullif(row->>'team','') is not null then insert into public.teams(name) values(row->>'team') on conflict(name) do update set name=excluded.name returning id into team; end if;
 if nullif(row->>'series','') is not null then insert into public.sticker_series(name) values(row->>'series') on conflict(name) do update set name=excluded.name returning id into series; end if;
 select id,to_jsonb(s) into sid,old_row from public.stickers s where collection_id=p_collection and official_code=row->>'official_code' and edition=row->>'edition' and variant=coalesce(row->>'variant','base');
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
create function public.add_collection(p_slug text,p_name text,p_season text) returns uuid language plpgsql security definer set search_path = '' as $$ declare c uuid; begin if not public.is_admin() then raise exception 'Administración requerida'; end if; insert into public.collections(slug,name,season) values(p_slug,p_name,p_season) returning id into c; insert into public.audit_logs(actor_id,action,details) values(auth.uid(),'collection_created',jsonb_build_object('collection_id',c)); return c; end $$;
create function public.delete_my_account() returns void language plpgsql security definer set search_path = '' as $$ declare u uuid:=public.require_user(); begin
 perform pg_advisory_xact_lock(hashtextextended(u::text,0));
 if exists(select 1 from public.trade_proposals where (sender_id=u or receiver_id=u) and status in ('proposed','accepted')) then raise exception 'Cancela o completa tus intercambios antes de eliminar la cuenta'; end if;
 update public.shared_lists set revoked_at=now() where owner_id=u;
 delete from public.user_inventory where user_id=u; delete from public.user_privacy_settings where user_id=u;
 delete from public.friendships where requester_id=u or recipient_id=u;
 delete from public.user_blocks where blocker_id=u or blocked_id=u;
 delete from public.notifications where user_id=u;
 update public.profiles set username='d_'||replace(u::text,'-',''),display_name='Cuenta eliminada',avatar_url=null,is_admin=false,deleted_at=now() where id=u;
 insert into public.audit_logs(actor_id,action) values(u,'account_deleted');
 delete from auth.users where id=u;
 end $$;

-- Defense in depth: helpers cannot be called directly; explicit RPC allowlist.
revoke all on all tables in schema public from anon,authenticated;
grant usage on schema public to authenticated;
grant select on all tables in schema public to authenticated;
revoke execute on all functions in schema public from public,anon,authenticated;
grant execute on function public.is_admin(),public.is_blocked(uuid,uuid),public.are_friends(uuid,uuid),public.can_view_inventory(uuid),public.is_trade_member(uuid),public.change_quantity(uuid,integer,uuid),public.update_profile(text,text,text,boolean),public.friend_action(uuid,text),public.propose_trade(uuid,uuid,jsonb,uuid),public.trade_action(uuid,text),public.mark_notifications_read(),public.report_user(uuid,text),public.create_shared_list(uuid,text),public.read_shared_list(uuid),public.revoke_shared_list(uuid),public.import_catalog(uuid,jsonb),public.add_collection(text,text,text),public.delete_my_account() to authenticated;
-- Only collection metadata, no unverified sticker data.
insert into public.collections(slug,name,season) values('laliga-este-2026-27','LaLiga ESTE 2026–27','2026-27');

-- Optional in embedded tests; standard Supabase has this publication.
do $$ begin if exists(select 1 from pg_publication where pubname='supabase_realtime') then alter publication supabase_realtime add table public.user_inventory, public.notifications; end if; end $$;

-- Rank reciprocal matches without downloading every friend's inventory.
create function public.find_matches(p_collection uuid) returns table(user_id uuid,username text,display_name text,offer_count bigint,receive_count bigint) language sql stable security definer set search_path = '' as $$
 select * from (select p.id as user_id,p.username,p.display_name,
 (select count(*) from public.user_inventory mine join public.stickers s on s.id=mine.sticker_id where mine.user_id=auth.uid() and s.collection_id=p_collection and s.published and mine.quantity-1-mine.reserved>0 and not exists(select 1 from public.user_inventory theirs where theirs.user_id=p.id and theirs.sticker_id=s.id and theirs.quantity>0)) as offer_count,
 (select count(*) from public.user_inventory theirs join public.stickers s on s.id=theirs.sticker_id where theirs.user_id=p.id and s.collection_id=p_collection and s.published and theirs.quantity-1-theirs.reserved>0 and not exists(select 1 from public.user_inventory mine where mine.user_id=auth.uid() and mine.sticker_id=s.id and mine.quantity>0)) as receive_count
 from public.profiles p where p.deleted_at is null and public.are_friends(auth.uid(),p.id) and public.can_view_inventory(p.id) and exists(select 1 from public.profiles me where me.id=auth.uid() and me.deleted_at is null)
 ) ranked order by least(offer_count,receive_count) desc,(offer_count+receive_count) desc,username limit 100
$$;
revoke all on function public.find_matches(uuid) from public,anon;
grant execute on function public.find_matches(uuid) to authenticated;
