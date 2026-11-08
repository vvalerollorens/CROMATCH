-- Internal addresses are login identifiers, not email recipients.
-- Disable email confirmation in Supabase Auth for this username-only project.
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
declare handle text; address text := to_jsonb(new)->>'email';
begin
 if address like '%@accounts.nexo.invalid' then
   handle := split_part(address,'@',1);
   if handle !~ '^[a-z0-9_]{3,24}$' then raise exception 'Usuario no válido'; end if;
 else
   handle := 'u_'||replace(new.id::text,'-','');
 end if;
 insert into public.profiles(id,username,display_name)
 values(new.id,handle,coalesce(nullif(left(new.raw_user_meta_data->>'display_name',60),''),handle));
 insert into public.user_privacy_settings(user_id) values(new.id);
 return new;
end $$;

-- Login names remain stable. Display names can still be edited.
create function public.protect_login_username() returns trigger language plpgsql security definer set search_path = '' as $$
declare address text;
begin
 if new.username is distinct from old.username and new.deleted_at is null then
   select to_jsonb(u)->>'email' into address from auth.users u where u.id=old.id;
   if address like '%@accounts.nexo.invalid' then
     raise exception 'El usuario de acceso no se puede cambiar. Puedes editar tu nombre público.';
   end if;
 end if;
 return new;
end $$;
create trigger protect_login_username before update of username on public.profiles
for each row execute function public.protect_login_username();
revoke all on function public.protect_login_username() from public,anon,authenticated;
