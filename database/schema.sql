-- Create users table that syncs with auth.users
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('admin', 'branch', 'mpo')),
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id),
    updated_by UUID REFERENCES public.users(id)
);

-- Create branches table for branch management
CREATE TABLE public.branches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    manager_id UUID REFERENCES public.users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_branch_id ON public.users(branch_id);
CREATE INDEX idx_users_is_active ON public.users(is_active);
CREATE INDEX idx_branches_code ON public.branches(code);
CREATE INDEX idx_branches_is_active ON public.branches(is_active);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Branch managers can view users in their branch" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users u1
            JOIN public.users u2 ON u1.branch_id = u2.branch_id
            WHERE u1.id = auth.uid() 
            AND u1.role = 'branch' 
            AND u2.id = users.id
        )
    );

CREATE POLICY "Admins can insert users" ON public.users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update users" ON public.users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create RLS policies for branches table
CREATE POLICY "Admins can manage branches" ON public.branches
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Branch managers can view their branch" ON public.branches
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'branch' 
            AND branch_id = branches.id
        )
    );

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, role, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'mpo'),
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile when auth user is created
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update user's last login
CREATE OR REPLACE FUNCTION public.update_last_login()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.users 
    SET last_login = NOW(), updated_at = NOW()
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user profile with role information
CREATE OR REPLACE FUNCTION public.get_user_profile(user_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    email TEXT,
    phone TEXT,
    role TEXT,
    branch_id UUID,
    branch_name TEXT,
    is_active BOOLEAN,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.role,
        u.branch_id,
        b.name as branch_name,
        u.is_active,
        u.last_login,
        u.created_at
    FROM public.users u
    LEFT JOIN public.branches b ON u.branch_id = b.id
    WHERE u.id = user_id AND u.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has specific role
CREATE OR REPLACE FUNCTION public.user_has_role(user_id UUID, required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = user_id 
        AND role = required_role 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert some sample data
INSERT INTO public.branches (name, code, address, phone, email) VALUES
('Main Branch', 'MAIN', '123 Main Street, City', '+1-555-0100', 'main@wellcare.com'),
('North Branch', 'NORTH', '456 North Avenue, City', '+1-555-0101', 'north@wellcare.com'),
('South Branch', 'SOUTH', '789 South Road, City', '+1-555-0102', 'south@wellcare.com');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON public.branches
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Employees table
CREATE TABLE public.employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    designation TEXT,
    employee_code TEXT UNIQUE NOT NULL,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    phone TEXT,
    email TEXT,
    joined_date DATE,
    resigned_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    created_by UUID REFERENCES public.users(id),
    updated_by UUID REFERENCES public.users(id)
);

-- Indexes for employees
CREATE INDEX idx_employees_branch_id ON public.employees(branch_id);
CREATE INDEX idx_employees_employee_code ON public.employees(employee_code);
CREATE INDEX idx_employees_is_active ON public.employees(is_active);
CREATE INDEX idx_employees_joined_date ON public.employees(joined_date);

-- RLS for employees
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Admins can manage employees
CREATE POLICY "Admins can manage employees" ON public.employees
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Branch managers can view employees in their branch
CREATE POLICY "Branch managers can view branch employees" ON public.employees
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role = 'branch'
            AND u.branch_id = employees.branch_id
        )
    );

-- updated_at trigger for employees
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create products table
CREATE TABLE public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    generic_name TEXT,
    dosage_form TEXT,
    pack_size TEXT,
    sku TEXT NOT NULL,
    price_regular NUMERIC(10, 2) NOT NULL,
    price_offer NUMERIC(10, 2),
    stock INTEGER NOT NULL DEFAULT 0,
    image_urls TEXT[],
    description TEXT NOT NULL,
    category_id UUID,
    company_id UUID,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    keywords TEXT[] DEFAULT '{}'::text[],
    price_purchase NUMERIC(10, 2),
    video TEXT,
    flash_sale BOOLEAN DEFAULT false,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    sub_products UUID[],
    variants JSONB,
    weight NUMERIC(10, 3),
    weight_unit TEXT
);

-- Create indexes for products table
CREATE INDEX idx_products_slug ON public.products(slug);
CREATE INDEX idx_products_sku ON public.products(sku);
CREATE INDEX idx_products_category_id ON public.products(category_id);
CREATE INDEX idx_products_company_id ON public.products(company_id);
CREATE INDEX idx_products_is_active ON public.products(is_active);
CREATE INDEX idx_products_is_featured ON public.products(is_featured);
CREATE INDEX idx_products_flash_sale ON public.products(flash_sale);
CREATE INDEX idx_products_price_regular ON public.products(price_regular);
CREATE INDEX idx_products_stock ON public.products(stock);
CREATE INDEX idx_products_created_at ON public.products(created_at);

-- Create categories table (referenced by products)
CREATE TABLE public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Create companies table (referenced by products)
CREATE TABLE public.companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    logo_url TEXT,
    website TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Add foreign key constraints for products
ALTER TABLE public.products 
ADD CONSTRAINT fk_products_category 
FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;

ALTER TABLE public.products 
ADD CONSTRAINT fk_products_company 
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;

-- Add foreign key constraint for sub_products (self-referencing)
ALTER TABLE public.products 
ADD CONSTRAINT fk_products_sub_products 
FOREIGN KEY (id) REFERENCES public.products(id) ON DELETE CASCADE;

-- Create indexes for categories and companies
CREATE INDEX idx_categories_slug ON public.categories(slug);
CREATE INDEX idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX idx_categories_is_active ON public.categories(is_active);
CREATE INDEX idx_categories_sort_order ON public.categories(sort_order);

CREATE INDEX idx_companies_slug ON public.companies(slug);
CREATE INDEX idx_companies_is_active ON public.companies(is_active);

-- Enable Row Level Security for new tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for products table
CREATE POLICY "Products are viewable by everyone" ON public.products
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage products" ON public.products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Branch managers can view products" ON public.products
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('admin', 'branch')
        )
    );

-- Create RLS policies for categories table
CREATE POLICY "Categories are viewable by everyone" ON public.categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage categories" ON public.categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create RLS policies for companies table
CREATE POLICY "Companies are viewable by everyone" ON public.companies
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage companies" ON public.companies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Add updated_at triggers for new tables
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample categories
INSERT INTO public.categories (name, slug, description, sort_order) VALUES
('Vitamins & Supplements', 'vitamins-supplements', 'Essential vitamins and dietary supplements', 1),
('Protein & Fitness', 'protein-fitness', 'Protein powders and fitness supplements', 2),
('Health & Wellness', 'health-wellness', 'General health and wellness products', 3),
('Beauty & Skincare', 'beauty-skincare', 'Beauty and skincare products', 4),
('Baby & Kids', 'baby-kids', 'Products for babies and children', 5);

-- Insert sample companies
INSERT INTO public.companies (name, slug, description, website) VALUES
('Wellcare Nutriscience', 'wellcare-nutriscience', 'Leading pharmaceutical and nutraceutical company', 'https://wellcare.com'),
('NutriLife', 'nutrilife', 'Premium nutrition and wellness products', 'https://nutrilife.com'),
('ProteinPlus', 'proteinplus', 'Specialized protein and fitness supplements', 'https://proteinplus.com'),
('HealthFirst', 'healthfirst', 'Quality health and wellness solutions', 'https://healthfirst.com');

-- Insert sample products
INSERT INTO public.products (
    name, slug, generic_name, dosage_form, pack_size, sku, 
    price_regular, price_offer, stock, description, 
    category_id, company_id, keywords, price_purchase, 
    is_featured, weight, weight_unit
) VALUES
(
    'Vitamin D3 1000IU', 'vitamin-d3-1000iu', 'Cholecalciferol', 
    'Softgel Capsules', '60 capsules', 'VIT-D3-1000-60', 
    1599.00, 1299.00, 1250, 'High-quality Vitamin D3 supplement for bone and immune health', 
    (SELECT id FROM public.categories WHERE slug = 'vitamins-supplements'),
    (SELECT id FROM public.companies WHERE slug = 'wellcare-nutriscience'),
    ARRAY['vitamin d3', 'bone health', 'immune support', 'cholecalciferol'],
    850.00, true, 0.1, 'kg'
),
(
    'Whey Protein 2kg', 'whey-protein-2kg', 'Whey Protein Isolate', 
    'Powder', '2kg tub', 'PRO-WHEY-2KG', 
    4599.00, 3999.00, 89, 'Premium whey protein isolate for muscle building and recovery', 
    (SELECT id FROM public.categories WHERE slug = 'protein-fitness'),
    (SELECT id FROM public.companies WHERE slug = 'proteinplus'),
    ARRAY['whey protein', 'muscle building', 'recovery', 'fitness'],
    2500.00, true, 2.0, 'kg'
),
(
    'Omega-3 Fish Oil', 'omega-3-fish-oil', 'Omega-3 Fatty Acids', 
    'Softgel Capsules', '120 capsules', 'OMG-3-120', 
    2499.00, 1999.00, 340, 'Pure fish oil supplement rich in Omega-3 fatty acids for heart and brain health', 
    (SELECT id FROM public.categories WHERE slug = 'vitamins-supplements'),
    (SELECT id FROM public.companies WHERE slug = 'wellcare-nutriscience'),
    ARRAY['omega 3', 'fish oil', 'heart health', 'brain health'],
    1250.00, false, 0.15, 'kg'
);

-- Inventory: per-branch stock table
CREATE TABLE IF NOT EXISTS public.product_branch_stocks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    stock INTEGER NOT NULL DEFAULT 0,
    min_level INTEGER DEFAULT 0,
    max_level INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(product_id, branch_id)
);

CREATE INDEX IF NOT EXISTS idx_pbs_product_id ON public.product_branch_stocks(product_id);
CREATE INDEX IF NOT EXISTS idx_pbs_branch_id ON public.product_branch_stocks(branch_id);
CREATE INDEX IF NOT EXISTS idx_pbs_stock ON public.product_branch_stocks(stock);

ALTER TABLE public.product_branch_stocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Admins manage product_branch_stocks" ON public.product_branch_stocks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY IF NOT EXISTS "Branch view own product_branch_stocks" ON public.product_branch_stocks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'branch' AND u.branch_id = product_branch_stocks.branch_id)
  );

CREATE TRIGGER update_product_branch_stocks_updated_at BEFORE UPDATE ON public.product_branch_stocks
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Inventory movements to record adjustments and transfers
CREATE TYPE IF NOT EXISTS movement_type AS ENUM ('adjustment', 'transfer', 'purchase', 'sale', 'return');

CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    from_branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    to_branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    type movement_type NOT NULL,
    note TEXT,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_im_product_id ON public.inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_im_from_branch ON public.inventory_movements(from_branch_id);
CREATE INDEX IF NOT EXISTS idx_im_to_branch ON public.inventory_movements(to_branch_id);
CREATE INDEX IF NOT EXISTS idx_im_created_at ON public.inventory_movements(created_at);

ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Admins manage inventory_movements" ON public.inventory_movements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY IF NOT EXISTS "Branch view related inventory_movements" ON public.inventory_movements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'branch' AND (u.branch_id = inventory_movements.from_branch_id OR u.branch_id = inventory_movements.to_branch_id)
    )
  );

-- Ensure at least one of branches present for non-adjustments
ALTER TABLE public.inventory_movements
  ADD CONSTRAINT IF NOT EXISTS chk_movement_branches
  CHECK (
    (type = 'adjustment' AND (from_branch_id IS NULL) AND (to_branch_id IS NOT NULL))
    OR (type <> 'adjustment' AND ((from_branch_id IS NOT NULL) OR (to_branch_id IS NOT NULL)))
  );

-- Helper function: ensure stock row exists
CREATE OR REPLACE FUNCTION public.ensure_stock_row(p_product_id UUID, p_branch_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.product_branch_stocks (product_id, branch_id, stock)
    VALUES (p_product_id, p_branch_id, 0)
    ON CONFLICT (product_id, branch_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Function to apply movement to stocks with non-negative enforcement
CREATE OR REPLACE FUNCTION public.apply_inventory_movement()
RETURNS TRIGGER AS $$
DECLARE
    current_stock INTEGER;
BEGIN
    IF NEW.from_branch_id IS NOT NULL THEN
        PERFORM public.ensure_stock_row(NEW.product_id, NEW.from_branch_id);
        SELECT stock INTO current_stock FROM public.product_branch_stocks WHERE product_id = NEW.product_id AND branch_id = NEW.from_branch_id FOR UPDATE;
        IF current_stock - NEW.quantity < 0 THEN
            RAISE EXCEPTION 'Insufficient stock for product % at branch %', NEW.product_id, NEW.from_branch_id;
        END IF;
        UPDATE public.product_branch_stocks
        SET stock = stock - NEW.quantity, updated_at = NOW()
        WHERE product_id = NEW.product_id AND branch_id = NEW.from_branch_id;
    END IF;

    IF NEW.to_branch_id IS NOT NULL THEN
        PERFORM public.ensure_stock_row(NEW.product_id, NEW.to_branch_id);
        UPDATE public.product_branch_stocks
        SET stock = stock + NEW.quantity, updated_at = NOW()
        WHERE product_id = NEW.product_id AND branch_id = NEW.to_branch_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER apply_inventory_movement_after_insert
AFTER INSERT ON public.inventory_movements
FOR EACH ROW EXECUTE FUNCTION public.apply_inventory_movement();

-- Transfer headers and items
CREATE TYPE IF NOT EXISTS transfer_status AS ENUM ('pending', 'approved', 'completed', 'cancelled');

CREATE TABLE IF NOT EXISTS public.branch_transfers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    from_branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    to_branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    status transfer_status NOT NULL DEFAULT 'pending',
    note TEXT,
    created_by UUID REFERENCES public.users(id),
    approved_by UUID REFERENCES public.users(id),
    completed_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.branch_transfer_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transfer_id UUID NOT NULL REFERENCES public.branch_transfers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0)
);

CREATE INDEX IF NOT EXISTS idx_bt_from_branch ON public.branch_transfers(from_branch_id);
CREATE INDEX IF NOT EXISTS idx_bt_to_branch ON public.branch_transfers(to_branch_id);
CREATE INDEX IF NOT EXISTS idx_bti_transfer_id ON public.branch_transfer_items(transfer_id);

ALTER TABLE public.branch_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branch_transfer_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Admins manage branch_transfers" ON public.branch_transfers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY IF NOT EXISTS "Admins manage branch_transfer_items" ON public.branch_transfer_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY IF NOT EXISTS "Branch view own transfers" ON public.branch_transfers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'branch' AND (u.branch_id = branch_transfers.from_branch_id OR u.branch_id = branch_transfers.to_branch_id)
    )
  );

CREATE TRIGGER update_branch_transfers_updated_at BEFORE UPDATE ON public.branch_transfers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to complete a transfer and create movements
CREATE OR REPLACE FUNCTION public.complete_branch_transfer(p_transfer_id UUID, p_actor UUID)
RETURNS VOID AS $$
DECLARE
    t record;
    item record;
BEGIN
    SELECT * INTO t FROM public.branch_transfers WHERE id = p_transfer_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Transfer % not found', p_transfer_id;
    END IF;
    IF t.status <> 'approved' THEN
        RAISE EXCEPTION 'Transfer % must be approved before completion', p_transfer_id;
    END IF;

    FOR item IN SELECT * FROM public.branch_transfer_items WHERE transfer_id = p_transfer_id LOOP
        INSERT INTO public.inventory_movements (product_id, from_branch_id, to_branch_id, quantity, type, note, created_by)
        VALUES (item.product_id, t.from_branch_id, t.to_branch_id, item.quantity, 'transfer', CONCAT('Transfer ', p_transfer_id), p_actor);
    END LOOP;

    UPDATE public.branch_transfers
    SET status = 'completed', completed_by = p_actor, updated_at = NOW()
    WHERE id = p_transfer_id;
END;
$$ LANGUAGE plpgsql;

-- =========================
-- Sales (Invoices)
-- =========================

CREATE TYPE IF NOT EXISTS sales_status AS ENUM ('draft', 'posted', 'cancelled', 'returned');

-- Parties (customers such as pharmacies)
CREATE TABLE IF NOT EXISTS public.parties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    party_code TEXT UNIQUE,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    shop_no TEXT,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT,
    latitude NUMERIC(10,6),
    longitude NUMERIC(10,6),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_parties_name ON public.parties(name);
CREATE INDEX IF NOT EXISTS idx_parties_is_active ON public.parties(is_active);

ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Admins manage parties" ON public.parties
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY IF NOT EXISTS "Branch view parties" ON public.parties
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','branch'))
  );

CREATE TRIGGER update_parties_updated_at BEFORE UPDATE ON public.parties
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.sales_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    party_id UUID REFERENCES public.parties(id) ON DELETE SET NULL,
    customer_name TEXT,
    customer_phone TEXT,
    status sales_status NOT NULL DEFAULT 'draft',
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
    discount_total NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax_total NUMERIC(12,2) NOT NULL DEFAULT 0,
    shipping_total NUMERIC(12,2) NOT NULL DEFAULT 0,
    grand_total NUMERIC(12,2) NOT NULL DEFAULT 0,
    paid_total NUMERIC(12,2) NOT NULL DEFAULT 0,
    due_total NUMERIC(12,2) NOT NULL DEFAULT 0,
    note TEXT,
    created_by UUID REFERENCES public.users(id),
    posted_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.sales_order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
    discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    discount_percent NUMERIC(6,3) NOT NULL DEFAULT 0 CHECK (discount_percent >= 0),
    total NUMERIC(12,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.sales_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    method TEXT NOT NULL DEFAULT 'cash',
    reference TEXT,
    paid_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    received_by UUID REFERENCES public.users(id)
);

CREATE INDEX IF NOT EXISTS idx_sales_orders_branch ON public.sales_orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_party ON public.sales_orders(party_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON public.sales_orders(status);
CREATE INDEX IF NOT EXISTS idx_sales_items_order ON public.sales_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_sales_payments_order ON public.sales_payments(order_id);

ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Admins manage sales" ON public.sales_orders
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY IF NOT EXISTS "Admins manage sales items" ON public.sales_order_items
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY IF NOT EXISTS "Admins manage sales payments" ON public.sales_payments
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY IF NOT EXISTS "Branch view own sales" ON public.sales_orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'branch' AND u.branch_id = sales_orders.branch_id)
  );
CREATE POLICY IF NOT EXISTS "Branch view own sales items" ON public.sales_order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sales_orders so JOIN public.users u ON u.id = auth.uid()
      WHERE so.id = sales_order_items.order_id AND u.role = 'branch' AND u.branch_id = so.branch_id
    )
  );
CREATE POLICY IF NOT EXISTS "Branch view own sales payments" ON public.sales_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sales_orders so JOIN public.users u ON u.id = auth.uid()
      WHERE so.id = sales_payments.order_id AND u.role = 'branch' AND u.branch_id = so.branch_id
    )
  );

CREATE TRIGGER update_sales_orders_updated_at BEFORE UPDATE ON public.sales_orders
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Recalculate sales order totals
CREATE OR REPLACE FUNCTION public.recalc_sales_totals(p_order_id UUID)
RETURNS VOID AS $$
DECLARE
    v_subtotal NUMERIC(12,2);
    v_paid NUMERIC(12,2);
    v_discount_total NUMERIC(12,2);
    v_tax_total NUMERIC(12,2);
    v_shipping_total NUMERIC(12,2);
BEGIN
    SELECT COALESCE(SUM((unit_price * quantity) - discount_amount - ((unit_price * quantity) * (discount_percent/100.0))), 0)
    INTO v_subtotal FROM public.sales_order_items WHERE order_id = p_order_id;

    SELECT discount_total, tax_total, shipping_total INTO v_discount_total, v_tax_total, v_shipping_total
    FROM public.sales_orders WHERE id = p_order_id FOR UPDATE;

    SELECT COALESCE(SUM(amount), 0) INTO v_paid FROM public.sales_payments WHERE order_id = p_order_id;

    UPDATE public.sales_orders
    SET subtotal = v_subtotal,
        grand_total = GREATEST(v_subtotal - v_discount_total + v_tax_total + v_shipping_total, 0),
        paid_total = v_paid,
        due_total = GREATEST((GREATEST(v_subtotal - v_discount_total + v_tax_total + v_shipping_total, 0) - v_paid), 0),
        updated_at = NOW()
    WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql;

-- Post sales order: check stock and create movements per item, set status
CREATE OR REPLACE FUNCTION public.post_sales_order(p_order_id UUID, p_actor UUID)
RETURNS VOID AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
    v_current_stock INTEGER;
BEGIN
    SELECT * INTO v_order FROM public.sales_orders WHERE id = p_order_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Order % not found', p_order_id; END IF;
    IF v_order.status <> 'draft' THEN RAISE EXCEPTION 'Only draft orders can be posted'; END IF;

    FOR v_item IN SELECT * FROM public.sales_order_items WHERE order_id = p_order_id LOOP
        PERFORM public.ensure_stock_row(v_item.product_id, v_order.branch_id);
        SELECT stock INTO v_current_stock FROM public.product_branch_stocks WHERE product_id = v_item.product_id AND branch_id = v_order.branch_id FOR UPDATE;
        IF v_current_stock - v_item.quantity < 0 THEN
            RAISE EXCEPTION 'Insufficient stock for product % at branch %', v_item.product_id, v_order.branch_id;
        END IF;
    END LOOP;

    FOR v_item IN SELECT * FROM public.sales_order_items WHERE order_id = p_order_id LOOP
        INSERT INTO public.inventory_movements(product_id, from_branch_id, to_branch_id, quantity, type, note, created_by)
        VALUES (v_item.product_id, v_order.branch_id, NULL, v_item.quantity, 'sale', CONCAT('Sale order ', p_order_id), p_actor);
    END LOOP;

    UPDATE public.sales_orders SET status = 'posted', posted_by = p_actor, updated_at = NOW() WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql;

-- =========================
-- Employee Allowances
-- =========================

CREATE TYPE IF NOT EXISTS allowance_item_type AS ENUM ('product', 'money', 'gift', 'other');

CREATE TABLE IF NOT EXISTS public.employee_allowances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    allowance_date DATE NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc')::date,
    total_value NUMERIC(12,2) NOT NULL DEFAULT 0,
    note TEXT,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.employee_allowance_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    allowance_id UUID NOT NULL REFERENCES public.employee_allowances(id) ON DELETE CASCADE,
    item_type allowance_item_type NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    description TEXT,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_value NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (unit_value >= 0),
    total_value NUMERIC(12,2) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_emp_allowances_employee ON public.employee_allowances(employee_id);
CREATE INDEX IF NOT EXISTS idx_emp_allowances_date ON public.employee_allowances(allowance_date);
CREATE INDEX IF NOT EXISTS idx_emp_allowance_items_allowance ON public.employee_allowance_items(allowance_id);

ALTER TABLE public.employee_allowances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_allowance_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Admins manage employee_allowances" ON public.employee_allowances
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY IF NOT EXISTS "Admins manage employee_allowance_items" ON public.employee_allowance_items
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY IF NOT EXISTS "Branch view own employee_allowances" ON public.employee_allowances
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.employees e JOIN public.users u ON u.id = auth.uid()
      WHERE e.id = employee_allowances.employee_id AND u.role = 'branch' AND u.branch_id = e.branch_id
    )
  );

CREATE TRIGGER update_employee_allowances_updated_at BEFORE UPDATE ON public.employee_allowances
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Recalculate allowance total
CREATE OR REPLACE FUNCTION public.recalc_allowance_total(p_allowance_id UUID)
RETURNS VOID AS $$
DECLARE v_total NUMERIC(12,2);
BEGIN
    SELECT COALESCE(SUM(total_value),0) INTO v_total FROM public.employee_allowance_items WHERE allowance_id = p_allowance_id;
    UPDATE public.employee_allowances SET total_value = v_total, updated_at = NOW() WHERE id = p_allowance_id;
END;$$ LANGUAGE plpgsql;

-- =========================
-- Reporting helpers
-- =========================

-- View: sales summary per branch and day
CREATE OR REPLACE VIEW public.v_sales_daily AS
SELECT 
  so.branch_id,
  (so.created_at AT TIME ZONE 'utc')::date AS sales_date,
  COUNT(so.id) AS orders_count,
  SUM(so.subtotal) AS subtotal_sum,
  SUM(so.discount_total) AS discount_sum,
  SUM(so.tax_total) AS tax_sum,
  SUM(so.shipping_total) AS shipping_sum,
  SUM(so.grand_total) AS grand_total_sum,
  SUM(so.paid_total) AS paid_total_sum,
  SUM(so.due_total) AS due_total_sum
FROM public.sales_orders so
WHERE so.status IN ('draft','posted')
GROUP BY so.branch_id, (so.created_at AT TIME ZONE 'utc')::date;

-- View: COGS approximation using products.price_purchase * qty from posted orders
CREATE OR REPLACE VIEW public.v_sales_cogs AS
SELECT 
  so.branch_id,
  (so.created_at AT TIME ZONE 'utc')::date AS sales_date,
  SUM( (COALESCE(p.price_purchase,0)) * soi.quantity ) AS cogs_sum
FROM public.sales_orders so
JOIN public.sales_order_items soi ON soi.order_id = so.id
JOIN public.products p ON p.id = soi.product_id
WHERE so.status = 'posted'
GROUP BY so.branch_id, (so.created_at AT TIME ZONE 'utc')::date;

-- View: profit per branch and day
CREATE OR REPLACE VIEW public.v_profit_daily AS
SELECT 
  s.branch_id,
  s.sales_date,
  s.grand_total_sum AS revenue,
  COALESCE(c.cogs_sum,0) AS cogs,
  (s.grand_total_sum - COALESCE(c.cogs_sum,0)) AS gross_profit
FROM public.v_sales_daily s
LEFT JOIN public.v_sales_cogs c ON c.branch_id = s.branch_id AND c.sales_date = s.sales_date;

-- Function: get sales summary for date range and branch (optional)
CREATE OR REPLACE FUNCTION public.get_sales_summary(p_from DATE, p_to DATE, p_branch UUID DEFAULT NULL)
RETURNS TABLE (
  branch_id UUID,
  sales_date DATE,
  orders_count BIGINT,
  subtotal_sum NUMERIC,
  discount_sum NUMERIC,
  tax_sum NUMERIC,
  shipping_sum NUMERIC,
  grand_total_sum NUMERIC,
  paid_total_sum NUMERIC,
  due_total_sum NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.v_sales_daily
  WHERE sales_date BETWEEN p_from AND p_to
    AND (p_branch IS NULL OR branch_id = p_branch);
END;$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: get profit summary for date range and branch (optional)
CREATE OR REPLACE FUNCTION public.get_profit_summary(p_from DATE, p_to DATE, p_branch UUID DEFAULT NULL)
RETURNS TABLE (
  branch_id UUID,
  sales_date DATE,
  revenue NUMERIC,
  cogs NUMERIC,
  gross_profit NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.v_profit_daily
  WHERE sales_date BETWEEN p_from AND p_to
    AND (p_branch IS NULL OR branch_id = p_branch);
END;$$ LANGUAGE plpgsql SECURITY DEFINER;

