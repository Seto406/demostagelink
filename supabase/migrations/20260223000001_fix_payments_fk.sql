alter table public.payments drop constraint if exists payments_user_id_fkey;

-- referencing profiles(user_id) which is unique and same as auth.users.id
alter table public.payments
  add constraint payments_user_id_fkey
  foreign key (user_id)
  references public.profiles(user_id);
