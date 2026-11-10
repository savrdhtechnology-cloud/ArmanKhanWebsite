-- =====================================================================
-- Arman Hair Studio — Partner Network schema
-- Run once in Supabase → SQL Editor (project cehdkuowqafqyahafavi).
-- Creates tables, row-level security, booking RPCs and starter data
-- (services, products, 4 partner salons, 5 experts). No sample bookings.
-- =====================================================================

create extension if not exists btree_gist;

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------
create table if not exists public.services (
  id            text primary key,
  name          text not null,
  category      text not null,
  duration_min  int  not null check (duration_min between 5 and 600),
  price         int  not null check (price >= 0),
  needs_wash    boolean not null default false,
  skill         text not null,
  expert_payout int  not null default 0 check (expert_payout >= 0),
  description   text not null default '',
  active        boolean not null default true,
  sort          int  not null default 0
);

create table if not exists public.catalog_products (
  id   text primary key,
  name text not null,
  unit text not null
);

create table if not exists public.service_products (
  service_id text not null references public.services(id) on delete cascade,
  product_id text not null references public.catalog_products(id),
  qty        int  not null default 1 check (qty > 0),
  primary key (service_id, product_id)
);

create table if not exists public.salons (
  id         text primary key default replace(gen_random_uuid()::text, '-', ''),
  name       text not null,
  area       text not null,
  address    text not null default '',
  owner_name text not null default '',
  phone      text not null default '',
  status     text not null default 'pending' check (status in ('pending', 'approved', 'suspended')),
  open_min   int  not null default 600,
  close_min  int  not null default 1260,
  seat_fee   int  not null default 0 check (seat_fee >= 0),
  facilities text[] not null default '{}',
  created_at timestamptz not null default now(),
  check (open_min >= 0 and close_min <= 1440 and close_min > open_min)
);

create table if not exists public.chairs (
  salon_id text not null references public.salons(id) on delete cascade,
  id       text not null,
  name     text not null,
  has_wash boolean not null default false,
  active   boolean not null default true,
  primary key (salon_id, id)
);

create table if not exists public.salon_product_rates (
  salon_id   text not null references public.salons(id) on delete cascade,
  product_id text not null references public.catalog_products(id),
  rate       int  not null check (rate >= 0),
  primary key (salon_id, product_id)
);

create table if not exists public.experts (
  id        text primary key default replace(gen_random_uuid()::text, '-', ''),
  name      text not null,
  phone     text not null default '',
  skills    text[] not null default '{}',
  home_area text not null default '',
  start_min int  not null default 600,
  end_min   int  not null default 1260,
  status    text not null default 'active' check (status in ('active', 'leave')),
  rating    numeric(2,1) not null default 5.0,
  check (end_min > start_min)
);

create sequence if not exists public.booking_seq start 1040;

create table if not exists public.bookings (
  id            text primary key default 'AHS-' || nextval('public.booking_seq'),
  service_id    text not null references public.services(id),
  salon_id      text not null,
  chair_id      text not null,
  expert_id     text not null references public.experts(id),
  date          date not null,
  start_min     int  not null,
  end_min       int  not null,
  channel       text not null default 'online',
  status        text not null default 'confirmed'
                check (status in ('confirmed', 'checkedin', 'inservice', 'completed', 'cancelled', 'noshow')),
  payment       text not null default 'pending' check (payment in ('pending', 'paid', 'refunded')),
  products_used jsonb not null default '[]',
  price         int not null,
  salon_fee     int not null,
  products_amt  int not null,
  expert_pay    int not null,
  travel        int not null default 0,
  arman         int not null,
  created_at    timestamptz not null default now(),
  foreign key (salon_id, chair_id) references public.chairs(salon_id, id),
  check (end_min > start_min),
  -- last line of defence: one chair can never hold two live bookings (15 min cleanup included)
  constraint bookings_no_chair_overlap exclude using gist (
    salon_id with =, chair_id with =, date with =, int4range(start_min, end_min + 15) with &&
  ) where (status not in ('cancelled', 'noshow'))
);
create index if not exists bookings_date_idx on public.bookings (date);
create index if not exists bookings_expert_idx on public.bookings (expert_id, date);

-- customer contact is kept apart so partner salons never see it
create table if not exists public.booking_customers (
  booking_id text primary key references public.bookings(id) on delete cascade,
  name       text not null,
  phone      text not null
);
create index if not exists booking_customers_phone_idx on public.booking_customers (phone);

create table if not exists public.chair_blocks (
  id         uuid primary key default gen_random_uuid(),
  salon_id   text not null,
  chair_id   text not null,
  date       date not null,
  start_min  int  not null,
  end_min    int  not null,
  reason     text not null default '',
  created_at timestamptz not null default now(),
  foreign key (salon_id, chair_id) references public.chairs(salon_id, id) on delete cascade,
  check (end_min > start_min)
);

create table if not exists public.slot_holds (
  id         uuid primary key default gen_random_uuid(),
  service_id text not null,
  salon_id   text not null,
  chair_id   text not null,
  expert_id  text not null,
  date       date not null,
  start_min  int  not null,
  end_min    int  not null,
  travel     boolean not null default false,
  expires_at timestamptz not null
);

create table if not exists public.settlements (
  id          text primary key default 'ST-' || replace(gen_random_uuid()::text, '-', ''),
  kind        text not null check (kind in ('salon', 'expert')),
  party_id    text not null,
  amount      int  not null,
  booking_ids text[] not null,
  date        date not null default (now() at time zone 'Asia/Kolkata')::date,
  created_at  timestamptz not null default now()
);

-- who is who: admin (Arman team), partner (one salon), expert (one expert)
create table if not exists public.profiles (
  user_id   uuid primary key references auth.users(id) on delete cascade,
  role      text not null check (role in ('admin', 'partner', 'expert')),
  salon_id  text references public.salons(id),
  expert_id text references public.experts(id),
  full_name text not null default ''
);

-- ---------------------------------------------------------------------
-- Role helpers
-- ---------------------------------------------------------------------
create or replace function public.app_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where user_id = auth.uid()
$$;
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from public.profiles where user_id = auth.uid()), false)
$$;
create or replace function public.my_salon() returns text
language sql stable security definer set search_path = public as $$
  select salon_id from public.profiles where user_id = auth.uid() and role = 'partner'
$$;
create or replace function public.my_expert() returns text
language sql stable security definer set search_path = public as $$
  select expert_id from public.profiles where user_id = auth.uid() and role = 'expert'
$$;
create or replace function public.ist_today() returns date
language sql stable as $$ select (now() at time zone 'Asia/Kolkata')::date $$;
create or replace function public.ist_now_min() returns int
language sql stable as $$
  select (extract(hour from now() at time zone 'Asia/Kolkata') * 60 + extract(minute from now() at time zone 'Asia/Kolkata'))::int
$$;

-- ---------------------------------------------------------------------
-- Guards: partners can't change their own status / fee; experts can
-- only move their job forward and log products. Amounts recalculate.
-- ---------------------------------------------------------------------
create or replace function public.salons_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    new.status := old.status;
    new.seat_fee := old.seat_fee;
    new.name := old.name;
  end if;
  return new;
end $$;
drop trigger if exists salons_guard on public.salons;
create trigger salons_guard before update on public.salons for each row execute function public.salons_guard();

-- experts may only switch themselves between working and on leave
create or replace function public.experts_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    new.name := old.name; new.phone := old.phone; new.skills := old.skills; new.home_area := old.home_area;
    new.start_min := old.start_min; new.end_min := old.end_min; new.rating := old.rating;
  end if;
  return new;
end $$;
drop trigger if exists experts_guard on public.experts;
create trigger experts_guard before update on public.experts for each row execute function public.experts_guard();

create or replace function public.bookings_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() or current_setting('arman.trusted', true) = '1' then
    null;
  elsif old.expert_id = public.my_expert() then
    new.service_id := old.service_id; new.salon_id := old.salon_id; new.chair_id := old.chair_id;
    new.expert_id := old.expert_id; new.date := old.date; new.start_min := old.start_min; new.end_min := old.end_min;
    new.channel := old.channel; new.payment := old.payment; new.price := old.price; new.salon_fee := old.salon_fee;
    new.expert_pay := old.expert_pay; new.travel := old.travel;
    if new.status <> old.status and (old.status, new.status) not in
       (('confirmed', 'checkedin'), ('checkedin', 'inservice'), ('inservice', 'completed')) then
      raise exception 'Experts can only check in, start and complete their own jobs';
    end if;
  else
    raise exception 'Not allowed to change this booking';
  end if;

  new.products_amt := coalesce((
    select sum(r.rate * greatest((p->>'qty')::int, 0))
    from jsonb_array_elements(new.products_used) p
    join public.salon_product_rates r on r.salon_id = new.salon_id and r.product_id = p->>'id'
  ), 0);
  new.arman := new.price - new.salon_fee - new.products_amt - new.expert_pay - new.travel;
  if new.status = 'completed' and new.payment = 'pending' then new.payment := 'paid'; end if;
  if new.status = 'cancelled' and old.payment = 'paid' then new.payment := 'refunded'; end if;
  return new;
end $$;
drop trigger if exists bookings_guard on public.bookings;
create trigger bookings_guard before update on public.bookings for each row execute function public.bookings_guard();

-- ---------------------------------------------------------------------
-- Booking engine (same rules as the app):
-- chair free incl. 15 min cleanup, chair has wash station if needed,
-- salon open, expert skilled + working + 15 min gap at same salon or
-- 45 min when moving between salons (₹150 travel paid).
-- ---------------------------------------------------------------------
create or replace function public._slot_check(
  p_service text, p_salon text, p_chair text, p_expert text, p_date date, p_start int,
  p_ignore_hold uuid default null, p_ignore_booking text default null
) returns table (ok boolean, reason text, end_min int, travel boolean)
language plpgsql stable security definer set search_path = public as $$
declare
  s public.services; sl public.salons; ch public.chairs; x public.experts;
  e int; prev_salon text; found_prev boolean;
begin
  select * into s from public.services where id = p_service and active;
  if not found then return query select false, 'Service not found', 0, false; return; end if;
  e := p_start + s.duration_min;

  select * into sl from public.salons where id = p_salon;
  if not found or sl.status <> 'approved' then return query select false, 'This salon is not taking bookings', e, false; return; end if;
  if p_start < sl.open_min or e > sl.close_min then return query select false, 'Outside salon hours', e, false; return; end if;
  if p_date < public.ist_today() or (p_date = public.ist_today() and p_start < public.ist_now_min()) then
    return query select false, 'That time has already passed', e, false; return;
  end if;

  select * into ch from public.chairs c where c.salon_id = p_salon and c.id = p_chair;
  if not found or not ch.active then return query select false, 'This chair is not available', e, false; return; end if;
  if s.needs_wash and not ch.has_wash then return query select false, 'This service needs a chair with a wash station', e, false; return; end if;

  if exists (select 1 from public.bookings b where b.salon_id = p_salon and b.chair_id = p_chair and b.date = p_date
             and b.status not in ('cancelled', 'noshow') and b.id is distinct from p_ignore_booking
             and p_start < b.end_min + 15 and b.start_min < e + 15) then
    return query select false, 'This chair was just booked. Pick another time.', e, false; return;
  end if;
  if exists (select 1 from public.chair_blocks k where k.salon_id = p_salon and k.chair_id = p_chair and k.date = p_date
             and p_start < k.end_min and k.start_min < e + 15) then
    return query select false, 'This chair is blocked by the salon at that time.', e, false; return;
  end if;
  if exists (select 1 from public.slot_holds h where h.salon_id = p_salon and h.chair_id = p_chair and h.date = p_date
             and h.expires_at > now() and h.id is distinct from p_ignore_hold
             and p_start < h.end_min + 15 and h.start_min < e + 15) then
    return query select false, 'Someone is booking this chair right now. Pick another time.', e, false; return;
  end if;

  select * into x from public.experts where id = p_expert;
  if not found or x.status <> 'active' or not (s.skill = any (x.skills)) or p_start < x.start_min or e > x.end_min then
    return query select false, 'This expert is not available for this service.', e, false; return;
  end if;
  if exists (
    select 1 from (
      select b.salon_id, b.start_min, b.end_min from public.bookings b
       where b.expert_id = p_expert and b.date = p_date and b.status not in ('cancelled', 'noshow') and b.id is distinct from p_ignore_booking
      union all
      select h.salon_id, h.start_min, h.end_min from public.slot_holds h
       where h.expert_id = p_expert and h.date = p_date and h.expires_at > now() and h.id is distinct from p_ignore_hold
    ) j
    where p_start - (case when j.salon_id = p_salon then 15 else 45 end) < j.end_min
      and j.start_min < e + (case when j.salon_id = p_salon then 15 else 45 end)
  ) then
    return query select false, 'This expert is no longer free at that time.', e, false; return;
  end if;

  select j.salon_id, true into prev_salon, found_prev from (
    select b.salon_id, b.end_min from public.bookings b
     where b.expert_id = p_expert and b.date = p_date and b.status not in ('cancelled', 'noshow') and b.id is distinct from p_ignore_booking and b.end_min <= p_start
    union all
    select h.salon_id, h.end_min from public.slot_holds h
     where h.expert_id = p_expert and h.date = p_date and h.expires_at > now() and h.id is distinct from p_ignore_hold and h.end_min <= p_start
  ) j order by j.end_min desc limit 1;

  return query select true, null::text, e, case when found_prev then prev_salon <> p_salon else x.home_area <> sl.area end;
end $$;

create or replace function public._insert_booking(
  p_service text, p_salon text, p_chair text, p_expert text, p_date date, p_start int, p_end int, p_travel boolean,
  p_name text, p_phone text, p_channel text, p_payment text
) returns public.bookings
language plpgsql security definer set search_path = public as $$
declare s public.services; sl public.salons; prod int; b public.bookings; tr int := case when p_travel then 150 else 0 end;
begin
  select * into s from public.services where id = p_service;
  select * into sl from public.salons where id = p_salon;
  select coalesce(sum(r.rate * sp.qty), 0) into prod
    from public.service_products sp join public.salon_product_rates r on r.product_id = sp.product_id and r.salon_id = p_salon
   where sp.service_id = p_service;
  insert into public.bookings (service_id, salon_id, chair_id, expert_id, date, start_min, end_min, channel, payment,
                               products_used, price, salon_fee, products_amt, expert_pay, travel, arman)
  values (p_service, p_salon, p_chair, p_expert, p_date, p_start, p_end, p_channel, p_payment,
          coalesce((select jsonb_agg(jsonb_build_object('id', product_id, 'qty', qty)) from public.service_products where service_id = p_service), '[]'),
          s.price, sl.seat_fee, prod, s.expert_payout, tr, s.price - sl.seat_fee - prod - s.expert_payout - tr)
  returning * into b;
  insert into public.booking_customers (booking_id, name, phone) values (b.id, p_name, p_phone);
  return b;
end $$;

-- Busy chairs / experts for one day, without any customer details (used by the public booking page)
create or replace function public.availability(p_date date)
returns table (kind text, ref text, salon_id text, chair_id text, expert_id text, service_id text, start_min int, end_min int, status text, expires_at timestamptz)
language sql stable security definer set search_path = public as $$
  select 'booking', b.id, b.salon_id, b.chair_id, b.expert_id, b.service_id, b.start_min, b.end_min, b.status, null::timestamptz
    from public.bookings b where b.date = p_date and b.status not in ('cancelled', 'noshow')
  union all
  select 'block', k.id::text, k.salon_id, k.chair_id, null, null, k.start_min, k.end_min, k.reason, null
    from public.chair_blocks k where k.date = p_date
  union all
  select 'hold', h.id::text, h.salon_id, h.chair_id, h.expert_id, h.service_id, h.start_min, h.end_min, null, h.expires_at
    from public.slot_holds h where h.date = p_date and h.expires_at > now()
$$;

-- Step 1 of a customer booking: hold chair + expert for 5 minutes
create or replace function public.hold_slot(p_service text, p_salon text, p_chair text, p_expert text, p_date date, p_start int)
returns json language plpgsql security definer set search_path = public as $$
declare c record; h public.slot_holds;
begin
  perform pg_advisory_xact_lock(hashtext('arman-book:' || p_date));
  delete from public.slot_holds where expires_at < now() - interval '1 hour';
  select * into c from public._slot_check(p_service, p_salon, p_chair, p_expert, p_date, p_start);
  if not c.ok then raise exception '%', c.reason; end if;
  insert into public.slot_holds (service_id, salon_id, chair_id, expert_id, date, start_min, end_min, travel, expires_at)
  values (p_service, p_salon, p_chair, p_expert, p_date, p_start, c.end_min, c.travel, now() + interval '5 minutes')
  returning * into h;
  return json_build_object('id', h.id, 'expires', (extract(epoch from h.expires_at) * 1000)::bigint, 'travel', h.travel, 'end_min', h.end_min);
end $$;

create or replace function public.release_hold(p_hold uuid) returns void
language sql security definer set search_path = public as $$ delete from public.slot_holds where id = p_hold $$;

-- Customer switches expert while holding: re-check and swap
create or replace function public.change_hold_expert(p_hold uuid, p_expert text) returns json
language plpgsql security definer set search_path = public as $$
declare h public.slot_holds; c record;
begin
  select * into h from public.slot_holds where id = p_hold and expires_at > now();
  if not found then raise exception 'Your 5-minute hold ran out. Choose the time again.'; end if;
  perform pg_advisory_xact_lock(hashtext('arman-book:' || h.date));
  select * into c from public._slot_check(h.service_id, h.salon_id, h.chair_id, p_expert, h.date, h.start_min, p_hold);
  if not c.ok then raise exception '%', c.reason; end if;
  update public.slot_holds set expert_id = p_expert, travel = c.travel where id = p_hold;
  return json_build_object('travel', c.travel);
end $$;

-- Step 2: confirm the held slot. Re-checks everything under a per-day lock.
create or replace function public.confirm_booking(p_hold uuid, p_name text, p_phone text)
returns json language plpgsql security definer set search_path = public as $$
declare h public.slot_holds; c record; b public.bookings;
begin
  if length(trim(coalesce(p_name, ''))) < 2 then raise exception 'Enter your name'; end if;
  if coalesce(p_phone, '') !~ '^[0-9]{10}$' then raise exception 'Enter a 10-digit mobile number'; end if;
  select * into h from public.slot_holds where id = p_hold;
  if not found then raise exception 'Your 5-minute hold ran out. Choose the time again.'; end if;
  perform pg_advisory_xact_lock(hashtext('arman-book:' || h.date));
  if h.expires_at < now() then raise exception 'Your 5-minute hold ran out. Choose the time again.'; end if;
  select * into c from public._slot_check(h.service_id, h.salon_id, h.chair_id, h.expert_id, h.date, h.start_min, p_hold);
  if not c.ok then raise exception '%', c.reason; end if;
  b := public._insert_booking(h.service_id, h.salon_id, h.chair_id, h.expert_id, h.date, h.start_min, c.end_min, c.travel,
                              trim(p_name), p_phone, 'online', 'pending');
  delete from public.slot_holds where id = p_hold;
  return row_to_json(b);
end $$;

-- Admin walk-in / phone booking straight onto a chair
create or replace function public.admin_create_booking(
  p_service text, p_salon text, p_chair text, p_expert text, p_date date, p_start int,
  p_name text, p_phone text, p_payment text default 'pending'
) returns json language plpgsql security definer set search_path = public as $$
declare c record; b public.bookings;
begin
  if not public.is_admin() then raise exception 'Only Arman admins can create bookings here'; end if;
  if coalesce(p_phone, '') !~ '^[0-9]{10}$' then raise exception 'Enter a 10-digit mobile number'; end if;
  perform pg_advisory_xact_lock(hashtext('arman-book:' || p_date));
  select * into c from public._slot_check(p_service, p_salon, p_chair, p_expert, p_date, p_start);
  if not c.ok then raise exception '%', c.reason; end if;
  b := public._insert_booking(p_service, p_salon, p_chair, p_expert, p_date, p_start, c.end_min, c.travel, trim(p_name), p_phone, 'admin',
                              case when p_payment = 'paid' then 'paid' else 'pending' end);
  return row_to_json(b);
end $$;

create or replace function public.reassign_expert(p_booking text, p_expert text) returns void
language plpgsql security definer set search_path = public as $$
declare b public.bookings; c record;
begin
  if not public.is_admin() then raise exception 'Only Arman admins can reassign experts'; end if;
  select * into b from public.bookings where id = p_booking;
  perform pg_advisory_xact_lock(hashtext('arman-book:' || b.date));
  select * into c from public._slot_check(b.service_id, b.salon_id, b.chair_id, p_expert, b.date, b.start_min, null, p_booking);
  if not c.ok then raise exception '%', c.reason; end if;
  update public.bookings set expert_id = p_expert where id = p_booking;
end $$;

-- Customer self-service: look up / cancel with booking ID + mobile number
create or replace function public.find_booking(p_id text, p_phone text) returns json
language sql stable security definer set search_path = public as $$
  select row_to_json(t) from (
    select b.id, b.service_id, b.salon_id, b.chair_id, b.expert_id, b.date, b.start_min, b.end_min, b.status, b.payment, b.price, c.name
      from public.bookings b join public.booking_customers c on c.booking_id = b.id
     where b.id = upper(trim(p_id)) and c.phone = p_phone
  ) t
$$;

create or replace function public.cancel_my_booking(p_id text, p_phone text) returns void
language plpgsql security definer set search_path = public as $$
declare b public.bookings;
begin
  select bk.* into b from public.bookings bk join public.booking_customers c on c.booking_id = bk.id
   where bk.id = upper(trim(p_id)) and c.phone = p_phone;
  if not found then raise exception 'Booking not found'; end if;
  if b.status <> 'confirmed' then raise exception 'This booking can no longer be cancelled online'; end if;
  if (b.date + make_interval(mins => b.start_min)) - interval '2 hours' < (now() at time zone 'Asia/Kolkata') then
    raise exception 'Bookings can be cancelled online up to 2 hours before. Please call the studio.';
  end if;
  perform set_config('arman.trusted', '1', true);
  update public.bookings set status = 'cancelled' where id = b.id;
end $$;

-- Pay out everything completed and not yet settled for one salon or expert
create or replace function public.settle_party(p_kind text, p_party text) returns json
language plpgsql security definer set search_path = public as $$
declare ids text[]; amt int; st public.settlements;
begin
  if not public.is_admin() then raise exception 'Only Arman admins can record settlements'; end if;
  select array_agg(b.id), coalesce(sum(case when p_kind = 'salon' then b.salon_fee + b.products_amt else b.expert_pay + b.travel end), 0)
    into ids, amt
    from public.bookings b
   where b.status = 'completed'
     and (case when p_kind = 'salon' then b.salon_id else b.expert_id end) = p_party
     and not exists (select 1 from public.settlements s where s.kind = p_kind and s.party_id = p_party and b.id = any (s.booking_ids));
  if ids is null then raise exception 'Nothing to settle'; end if;
  insert into public.settlements (kind, party_id, amount, booking_ids) values (p_kind, p_party, amt, ids) returning * into st;
  return row_to_json(st);
end $$;

revoke execute on function public._slot_check(text, text, text, text, date, int, uuid, text) from public, anon, authenticated;
revoke execute on function public._insert_booking(text, text, text, text, date, int, int, boolean, text, text, text, text) from public, anon, authenticated;
grant execute on function public.availability(date), public.hold_slot(text, text, text, text, date, int), public.release_hold(uuid),
  public.change_hold_expert(uuid, text), public.confirm_booking(uuid, text, text), public.find_booking(text, text),
  public.cancel_my_booking(text, text) to anon, authenticated;
grant execute on function public.admin_create_booking(text, text, text, text, date, int, text, text, text),
  public.reassign_expert(text, text), public.settle_party(text, text) to authenticated;

-- ---------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------
alter table public.services            enable row level security;
alter table public.catalog_products    enable row level security;
alter table public.service_products    enable row level security;
alter table public.salons              enable row level security;
alter table public.chairs              enable row level security;
alter table public.salon_product_rates enable row level security;
alter table public.experts             enable row level security;
alter table public.bookings            enable row level security;
alter table public.booking_customers   enable row level security;
alter table public.chair_blocks        enable row level security;
alter table public.slot_holds          enable row level security;
alter table public.settlements         enable row level security;
alter table public.profiles            enable row level security;

-- catalogue: everyone reads, admins write
create policy services_read on public.services for select using (true);
create policy services_admin on public.services for all using (public.is_admin()) with check (public.is_admin());
create policy catalog_read on public.catalog_products for select using (true);
create policy catalog_admin on public.catalog_products for all using (public.is_admin()) with check (public.is_admin());
create policy sp_read on public.service_products for select using (true);
create policy sp_admin on public.service_products for all using (public.is_admin()) with check (public.is_admin());

-- salons: approved ones are public; partner sees and edits its own (guard trigger protects status/fee)
create policy salons_read on public.salons for select using (status = 'approved' or public.is_admin() or id = public.my_salon());
create policy salons_admin_insert on public.salons for insert with check (public.is_admin());
create policy salons_update on public.salons for update using (public.is_admin() or id = public.my_salon()) with check (public.is_admin() or id = public.my_salon());
create policy salons_admin_delete on public.salons for delete using (public.is_admin());

create policy chairs_read on public.chairs for select using (true);
create policy chairs_write on public.chairs for all using (public.is_admin() or salon_id = public.my_salon()) with check (public.is_admin() or salon_id = public.my_salon());
create policy rates_read on public.salon_product_rates for select using (true);
create policy rates_write on public.salon_product_rates for all using (public.is_admin() or salon_id = public.my_salon()) with check (public.is_admin() or salon_id = public.my_salon());

-- experts: public profile; expert edits nothing directly (admin manages skills/hours), status toggle via admin
create policy experts_read on public.experts for select using (true);
create policy experts_admin on public.experts for all using (public.is_admin()) with check (public.is_admin());
create policy experts_self_status on public.experts for update using (id = public.my_expert()) with check (id = public.my_expert());

-- bookings: admin all; partner own salon (read); expert own jobs (read + guarded update). Inserts only via RPC.
create policy bookings_read on public.bookings for select using (public.is_admin() or salon_id = public.my_salon() or expert_id = public.my_expert());
create policy bookings_update on public.bookings for update using (public.is_admin() or expert_id = public.my_expert());

create policy customers_read on public.booking_customers for select using (
  public.is_admin() or exists (select 1 from public.bookings b where b.id = booking_id and b.expert_id = public.my_expert())
);

create policy blocks_read on public.chair_blocks for select using (public.is_admin() or salon_id = public.my_salon());
create policy blocks_write on public.chair_blocks for all using (public.is_admin() or salon_id = public.my_salon()) with check (public.is_admin() or salon_id = public.my_salon());

create policy holds_admin_read on public.slot_holds for select using (public.is_admin());

create policy settlements_read on public.settlements for select using (
  public.is_admin() or (kind = 'salon' and party_id = public.my_salon()) or (kind = 'expert' and party_id = public.my_expert())
);

create policy profiles_read on public.profiles for select using (user_id = auth.uid() or public.is_admin());
create policy profiles_admin on public.profiles for all using (public.is_admin()) with check (public.is_admin());

-- the public booking page must not read owner / expert phone numbers
revoke select on public.salons from anon;
grant select (id, name, area, address, status, open_min, close_min, seat_fee, facilities) on public.salons to anon;
revoke select on public.experts from anon;
grant select (id, name, skills, home_area, start_min, end_min, status, rating) on public.experts to anon;
revoke insert, update, delete on all tables in schema public from anon;

-- ---------------------------------------------------------------------
-- Starter data (edit freely in the admin portal afterwards)
-- ---------------------------------------------------------------------
insert into public.catalog_products (id, name, unit) values
  ('loreal', 'L''Oréal colour tube', '100 ml'),
  ('keratin-kit', 'Keratin kit', 'per service'),
  ('spa-cream', 'Spa cream', '50 g'),
  ('rebond-kit', 'Rebonding kit', 'per service'),
  ('styling', 'Styling kit', 'per service'),
  ('olaplex', 'Olaplex No.1', '15 ml')
on conflict (id) do nothing;

insert into public.services (id, name, category, duration_min, price, needs_wash, skill, expert_payout, description, sort) values
  ('cut', 'Hair Cut & Style', 'Cut', 60, 700, true, 'cut', 300, 'Consultation, wash, cut and styling', 1),
  ('beard', 'Beard & Grooming', 'Cut', 30, 400, false, 'beard', 180, 'Beard shaping, trim and hot towel', 2),
  ('colour', 'Hair Colour', 'Colour', 120, 2800, true, 'colour', 800, 'Global or root touch-up colour', 3),
  ('keratin', 'Keratin Treatment', 'Treatment', 150, 4500, true, 'keratin', 1200, 'Frizz control and smooth finish', 4),
  ('spa', 'Hair Spa', 'Treatment', 60, 1200, true, 'spa', 400, 'Nourishment and scalp care', 5),
  ('rebond', 'Rebonding', 'Treatment', 180, 5500, true, 'rebond', 1500, 'Permanent straightening', 6),
  ('bridal', 'Bridal Styling', 'Styling', 120, 6000, false, 'bridal', 2000, 'Bridal or occasion hair styling', 7),
  ('olaplex', 'Olaplex Add-on', 'Treatment', 30, 900, true, 'colour', 250, 'Bond repair with any colour service', 8)
on conflict (id) do nothing;

insert into public.service_products (service_id, product_id, qty) values
  ('colour', 'loreal', 1), ('keratin', 'keratin-kit', 1), ('spa', 'spa-cream', 1),
  ('rebond', 'rebond-kit', 1), ('bridal', 'styling', 1), ('olaplex', 'olaplex', 1)
on conflict do nothing;

insert into public.salons (id, name, area, address, owner_name, phone, status, open_min, close_min, seat_fee, facilities) values
  ('mantra', 'Style Mantra', 'MP Nagar', 'Zone 2, MP Nagar, Bhopal', 'Sunil Mehta', '9893022001', 'approved', 600, 1260, 350, '{Wash station,Steamer,AC,Parking}'),
  ('glow', 'Glow Studio', 'Kolar Road', 'Near Sarvadharm, Kolar Road, Bhopal', 'Ritu Jain', '9893022002', 'approved', 600, 1230, 300, '{Wash station,Hood dryer,AC}'),
  ('shine', 'Shine On Salon', 'Arera Colony', 'E-4, Arera Colony, Bhopal', 'Faizal Qureshi', '9893022003', 'approved', 660, 1260, 400, '{Wash station,Bridal room,AC,Parking}'),
  ('urban', 'Urban Edge', 'New Market', 'TT Nagar, New Market, Bhopal', 'Karan Patel', '9893022004', 'pending', 600, 1260, 320, '{Wash station,AC}')
on conflict (id) do nothing;

insert into public.chairs (salon_id, id, name, has_wash, active) values
  ('mantra', 'c1', 'Chair 01', true, true), ('mantra', 'c2', 'Chair 02', true, true), ('mantra', 'c3', 'Chair 03', false, true), ('mantra', 'c4', 'Chair 04', false, false),
  ('glow', 'c1', 'Chair 01', true, true), ('glow', 'c2', 'Chair 02', false, true), ('glow', 'c3', 'Chair 03', true, true),
  ('shine', 'c1', 'Chair 01', true, true), ('shine', 'c2', 'Chair 02', true, true),
  ('urban', 'c1', 'Chair 01', true, true), ('urban', 'c2', 'Chair 02', false, true)
on conflict do nothing;

insert into public.salon_product_rates (salon_id, product_id, rate)
select s.id, p.id, r.rate from (values
  ('mantra', 550, 1200, 250, 1500, 300, 350), ('glow', 520, 1150, 230, 1450, 280, 340),
  ('shine', 580, 1250, 260, 1550, 320, 360), ('urban', 540, 1200, 240, 1500, 300, 340)
) v(salon, a, b, c, d, e, f)
join public.salons s on s.id = v.salon
cross join lateral (values ('loreal', v.a), ('keratin-kit', v.b), ('spa-cream', v.c), ('rebond-kit', v.d), ('styling', v.e), ('olaplex', v.f)) r(pid, rate)
join public.catalog_products p on p.id = r.pid
on conflict do nothing;

insert into public.experts (id, name, phone, skills, home_area, start_min, end_min, status, rating) values
  ('rohan', 'Rohan Verma', '9826011001', '{cut,beard,spa}', 'MP Nagar', 600, 1260, 'active', 4.8),
  ('asif', 'Asif Khan', '9826011002', '{colour,rebond,keratin,cut}', 'Kolar Road', 600, 1260, 'active', 4.9),
  ('neha', 'Neha Sharma', '9826011003', '{keratin,spa,bridal,colour}', 'Arera Colony', 660, 1260, 'active', 4.7),
  ('sameer', 'Sameer Ali', '9826011004', '{cut,beard,rebond}', 'New Market', 600, 1200, 'active', 4.6),
  ('pooja', 'Pooja Rathore', '9826011005', '{bridal,colour,spa,keratin}', 'MP Nagar', 660, 1260, 'leave', 4.8)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- After creating users in Authentication → Users, give them a role, e.g.:
--   insert into public.profiles (user_id, role, full_name)
--     select id, 'admin', 'Arman Khan' from auth.users where email = 'admin@example.com';
--   insert into public.profiles (user_id, role, salon_id)  select id, 'partner', 'mantra' from auth.users where email = 'mantra@example.com';
--   insert into public.profiles (user_id, role, expert_id) select id, 'expert',  'rohan'  from auth.users where email = 'rohan@example.com';
-- ---------------------------------------------------------------------
