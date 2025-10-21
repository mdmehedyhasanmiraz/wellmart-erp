-- Create purchases tables mirroring sales structure
-- Purchase Orders table
create table public.purchase_orders (
  id uuid not null default gen_random_uuid (),
  branch_id uuid not null,
  supplier_name text null,
  supplier_phone text null,
  status public.sales_status not null default 'posted'::sales_status,
  subtotal numeric(12, 2) not null default 0,
  discount_total numeric(12, 2) not null default 0,
  tax_total numeric(12, 2) not null default 0,
  shipping_total numeric(12, 2) not null default 0,
  grand_total numeric(12, 2) not null default 0,
  paid_total numeric(12, 2) not null default 0,
  due_total numeric(12, 2) not null default 0,
  note text null,
  image_urls text[] null,
  created_by uuid null,
  posted_by uuid null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  supplier_id uuid null,
  employee_id uuid null,
  constraint purchase_orders_pkey primary key (id),
  constraint purchase_orders_branch_id_fkey foreign KEY (branch_id) references branches (id) on delete RESTRICT,
  constraint purchase_orders_created_by_fkey foreign KEY (created_by) references users (id),
  constraint purchase_orders_employee_id_fkey foreign KEY (employee_id) references employees (id) on delete set null,
  constraint purchase_orders_supplier_id_fkey foreign KEY (supplier_id) references suppliers (id) on delete set null,
  constraint purchase_orders_posted_by_fkey foreign KEY (posted_by) references users (id)
) TABLESPACE pg_default;

-- Create indexes for purchase_orders
create index IF not exists idx_purchase_orders_supplier_id on public.purchase_orders using btree (supplier_id) TABLESPACE pg_default;
create index IF not exists idx_purchase_orders_employee_id on public.purchase_orders using btree (employee_id) TABLESPACE pg_default;
create index IF not exists idx_purchase_orders_branch on public.purchase_orders using btree (branch_id) TABLESPACE pg_default;
create index IF not exists idx_purchase_orders_status on public.purchase_orders using btree (status) TABLESPACE pg_default;

-- Create trigger for purchase_orders
create trigger update_purchase_orders_updated_at BEFORE
update on purchase_orders for EACH row
execute FUNCTION update_updated_at_column ();

-- Purchase Order Items table
create table public.purchase_order_items (
  id uuid not null default gen_random_uuid (),
  order_id uuid not null,
  product_id uuid not null,
  quantity integer not null,
  unit_price numeric(12, 2) not null,
  discount_amount numeric(12, 2) not null default 0,
  discount_percent numeric(6, 3) not null default 0,
  total numeric(12, 2) not null default 0,
  batch_number text null,
  constraint purchase_order_items_pkey primary key (id),
  constraint purchase_order_items_order_id_fkey foreign KEY (order_id) references purchase_orders (id) on delete CASCADE,
  constraint purchase_order_items_product_id_fkey foreign KEY (product_id) references products (id) on delete RESTRICT,
  constraint purchase_order_items_discount_percent_check check ((discount_percent >= (0)::numeric)),
  constraint purchase_order_items_discount_amount_check check ((discount_amount >= (0)::numeric)),
  constraint purchase_order_items_quantity_check check ((quantity > 0)),
  constraint purchase_order_items_unit_price_check check ((unit_price >= (0)::numeric))
) TABLESPACE pg_default;

-- Create index for purchase_order_items
create index IF not exists idx_purchase_items_order on public.purchase_order_items using btree (order_id) TABLESPACE pg_default;

-- Purchase Payments table
create table public.purchase_payments (
  id uuid not null default gen_random_uuid (),
  order_id uuid not null,
  amount numeric(12, 2) not null,
  method text not null default 'cash'::text,
  reference text null,
  paid_at timestamp with time zone not null default timezone ('utc'::text, now()),
  received_by uuid null,
  constraint purchase_payments_pkey primary key (id),
  constraint purchase_payments_order_id_fkey foreign KEY (order_id) references purchase_orders (id) on delete CASCADE,
  constraint purchase_payments_received_by_fkey foreign KEY (received_by) references users (id),
  constraint purchase_payments_amount_check check ((amount > (0)::numeric))
) TABLESPACE pg_default;

-- Create index for purchase_payments
create index IF not exists idx_purchase_payments_order on public.purchase_payments using btree (order_id) TABLESPACE pg_default;
