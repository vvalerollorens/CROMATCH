-- Owner-only diagnostics and conservative reconstruction from immutable movements.
create function public.album_save_status() returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=public.require_user(); result jsonb;
begin
 with expected as (select sticker_id,sum(delta)::integer quantity from public.inventory_transactions where user_id=u group by sticker_id)
 select jsonb_build_object(
  'saved_stickers',(select count(*) from public.user_inventory where user_id=u and quantity>0),
  'saved_copies',(select coalesce(sum(quantity),0) from public.user_inventory where user_id=u),
  'movements',(select count(*) from public.inventory_transactions where user_id=u),
  'last_saved',(select max(created_at) from public.inventory_transactions where user_id=u),
  'recoverable_stickers',(select count(*) from expected e join public.stickers s on s.id=e.sticker_id left join public.user_inventory i on i.sticker_id=e.sticker_id and i.user_id=u where s.published and e.quantity>coalesce(i.quantity,0) and e.quantity between 1 and 10000),
  'outside_catalogue',(select count(*) from public.user_inventory i join public.stickers s on s.id=i.sticker_id where i.user_id=u and i.quantity>0 and not s.published)
 ) into result;
 return result;
end $$;
create function public.recover_album_from_history() returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=public.require_user(); r record; changed integer:=0; copies integer:=0; before_count integer; reserved_count integer;
begin
 perform pg_advisory_xact_lock(hashtextextended(u::text,0));
 perform public.throttle('album_recovery',5);
 for r in select t.sticker_id,s.collection_id,sum(t.delta)::integer expected from public.inventory_transactions t join public.stickers s on s.id=t.sticker_id where t.user_id=u and s.published group by t.sticker_id,s.collection_id having sum(t.delta) between 1 and 10000 loop
  select quantity into before_count from public.user_inventory where user_id=u and sticker_id=r.sticker_id;
  before_count:=coalesce(before_count,0);
  if r.expected>before_count then
   select coalesce(sum(quantity),0) into reserved_count from public.trade_reservations where user_id=u and sticker_id=r.sticker_id;
   if reserved_count>greatest(r.expected-1,0) then raise exception 'El historial requiere revisar las reservas antes de recuperar'; end if;
   insert into public.user_collections values(u,r.collection_id,now()) on conflict do nothing;
   insert into public.user_inventory(user_id,sticker_id,quantity,reserved) values(u,r.sticker_id,r.expected,reserved_count) on conflict(user_id,sticker_id) do update set quantity=greatest(public.user_inventory.quantity,excluded.quantity),reserved=greatest(public.user_inventory.reserved,excluded.reserved),updated_at=now();
   -- The original movements already represent these copies: never count them twice.
   insert into public.audit_logs(actor_id,action,details) values(u,'inventory_recovered_from_history',jsonb_build_object('sticker_id',r.sticker_id,'before',before_count,'after',r.expected));
   changed:=changed+1; copies:=copies+r.expected-before_count;
  end if;
 end loop;
 return jsonb_build_object('recovered_stickers',changed,'recovered_copies',copies);
end $$;
revoke all on function public.album_save_status(),public.recover_album_from_history() from public,anon,authenticated;
grant execute on function public.album_save_status(),public.recover_album_from_history() to authenticated;
notify pgrst, 'reload schema';
