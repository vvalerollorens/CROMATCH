-- Atomic repeated-copy entry; the album copy is determined from server stock.
alter table public.inventory_operations add column duplicate_extras integer check(duplicate_extras between 1 and 99);
create or replace function public.change_quantity(p_sticker uuid,p_delta integer,p_operation uuid) returns integer language plpgsql security definer set search_path = '' as $$
 declare u uuid:=public.require_user(); q integer; r integer; old_op public.inventory_operations; c uuid;
 begin
 perform pg_advisory_xact_lock(hashtextextended(u::text,0));
 select * into old_op from public.inventory_operations where operation_id=p_operation;
 if found then if old_op.user_id<>u or old_op.sticker_id<>p_sticker or old_op.delta<>p_delta or old_op.duplicate_extras is not null then raise exception 'Identificador de operación ya usado'; end if; return old_op.result_quantity; end if;
 perform public.throttle('quantity',120);
 if p_delta is null or (p_delta<>-1 and p_delta not between 1 and 100) then raise exception 'Incremento no válido'; end if;
 select collection_id into c from public.stickers where id=p_sticker and published;
 if c is null then raise exception 'Cromo no publicado'; end if;
 insert into public.user_collections values(u,c,now()) on conflict do nothing;
 insert into public.user_inventory(user_id,sticker_id) values(u,p_sticker) on conflict do nothing;
 select quantity,reserved into q,r from public.user_inventory where user_id=u and sticker_id=p_sticker for update;
 q:=q+p_delta;
 if q<0 or q>10000 or r>greatest(q-1,0) then raise exception 'Cantidad no válida o unidades reservadas'; end if;
 update public.user_inventory set quantity=q,updated_at=now() where user_id=u and sticker_id=p_sticker;
 insert into public.inventory_operations(operation_id,user_id,sticker_id,delta,result_quantity) values(p_operation,u,p_sticker,p_delta,q);
 insert into public.inventory_transactions(user_id,sticker_id,delta,operation_id) values(u,p_sticker,p_delta,p_operation);
 return q;
 end $$;

create function public.add_duplicates(p_sticker uuid,p_extras integer,p_operation uuid) returns integer language plpgsql security definer set search_path = '' as $$
declare u uuid:=public.require_user(); previous public.inventory_operations; q integer; delta integer;
begin
 perform pg_advisory_xact_lock(hashtextextended(u::text,0));
 if p_extras is null or p_extras not between 1 and 99 then raise exception 'Indica entre 1 y 99 repetidos'; end if;
 select * into previous from public.inventory_operations where operation_id=p_operation;
 if found then
   if previous.user_id<>u or previous.sticker_id<>p_sticker or previous.duplicate_extras is distinct from p_extras then raise exception 'Identificador de operación ya usado'; end if;
   return coalesce((select quantity from public.user_inventory where user_id=u and sticker_id=p_sticker),previous.result_quantity);
 end if;
 select coalesce((select quantity from public.user_inventory where user_id=u and sticker_id=p_sticker),0) into q;
 delta:=p_extras+case when q=0 then 1 else 0 end;
 if q+delta>999 then raise exception 'No puedes superar las 999 copias del cromo'; end if;
 q:=public.change_quantity(p_sticker,delta,p_operation);
 update public.inventory_operations set duplicate_extras=p_extras where operation_id=p_operation;
 return q;
end $$;
revoke all on function public.add_duplicates(uuid,integer,uuid) from public,anon;
grant execute on function public.add_duplicates(uuid,integer,uuid) to authenticated;
notify pgrst, 'reload schema';
