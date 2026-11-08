-- One atomic operation for the first duplicate (2 copies) or confirmed OCR quantities (1..9).
create or replace function public.change_quantity(p_sticker uuid,p_delta integer,p_operation uuid) returns integer language plpgsql security definer set search_path = '' as $$
 declare u uuid:=public.require_user(); q integer; r integer; old_op public.inventory_operations; c uuid;
 begin
 perform pg_advisory_xact_lock(hashtextextended(u::text,0));
 select * into old_op from public.inventory_operations where operation_id=p_operation;
 if found then if old_op.user_id<>u or old_op.sticker_id<>p_sticker or old_op.delta<>p_delta then raise exception 'Identificador de operación ya usado'; end if; return old_op.result_quantity; end if;
 perform public.throttle('quantity',120);
 if p_delta is null or (p_delta<>-1 and p_delta not between 1 and 9) then raise exception 'Incremento no válido'; end if;
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
