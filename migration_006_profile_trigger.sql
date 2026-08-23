-- Automatically creates a profiles row the moment a new Supabase
-- Auth account is confirmed. Pulls contact_name and business_name
-- from signup metadata if the form supplied them, contact_email
-- always comes from the verified auth record itself, never the
-- client-supplied value.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, contact_email, contact_name, business_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'contact_name',
    new.raw_user_meta_data ->> 'business_name'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
