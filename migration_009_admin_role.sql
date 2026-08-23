alter table profiles add column if not exists is_admin boolean not null default false;

update profiles set is_admin = true where contact_email = 'lavonne@norrilssignature.com';
