-- Create suppliers table with same structure as parties
create table public.suppliers (
  id uuid not null default gen_random_uuid (),
  name text not null,
  supplier_code text null,
  contact_person text null,
  phone text null,
  email text null,
  shop_no text null,
  address_line1 text null,
  address_line2 text null,
  city text null,
  state text null,
  postal_code text null,
  country text null,
  latitude numeric(10, 6) null,
  longitude numeric(10, 6) null,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  branch_id uuid null,
  created_by uuid null,
  employee_id uuid null,
  constraint suppliers_pkey primary key (id),
  constraint suppliers_supplier_code_key unique (supplier_code),
  constraint suppliers_branch_id_fkey foreign KEY (branch_id) references branches (id) on delete set null,
  constraint suppliers_created_by_fkey foreign KEY (created_by) references users (id) on delete set null,
  constraint suppliers_employee_id_fkey foreign KEY (employee_id) references employees (id) on delete set null
) TABLESPACE pg_default;

-- Create indexes
create index IF not exists idx_suppliers_name on public.suppliers using btree (name) TABLESPACE pg_default;
create index IF not exists idx_suppliers_is_active on public.suppliers using btree (is_active) TABLESPACE pg_default;
create index IF not exists idx_suppliers_branch_id on public.suppliers using btree (branch_id) TABLESPACE pg_default;
create index IF not exists idx_suppliers_created_by on public.suppliers using btree (created_by) TABLESPACE pg_default;
create index IF not exists idx_suppliers_employee_id on public.suppliers using btree (employee_id) TABLESPACE pg_default;

-- Create triggers
create trigger trg_suppliers_defaults BEFORE INSERT on suppliers for EACH row
execute FUNCTION before_insert_parties_defaults ();

create trigger update_suppliers_updated_at BEFORE
update on suppliers for EACH row
execute FUNCTION update_updated_at_column ();
