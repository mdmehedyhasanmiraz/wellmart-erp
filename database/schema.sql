-- Create users table that syncs with auth.users
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('admin', 'branch', 'employee')),
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
CREATE INDEX idx_users_id_active ON public.users(id, is_active); -- Composite index for user profile queries
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

-- Allow branch users to view all active branches for transfer purposes
CREATE POLICY "Branch users can view all active branches" ON public.branches
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'branch'
        )
        AND is_active = true
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
        COALESCE(NEW.raw_user_meta_data->>'role', 'employee'),
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
    designation_id UUID REFERENCES public.designations(id) ON DELETE SET NULL,
    employee_code TEXT UNIQUE NOT NULL,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    reports_to_employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    phone TEXT,
    email TEXT,
    present_address TEXT,
    permanent_address TEXT,
    blood_group TEXT,
    date_of_birth DATE,
    marriage_date DATE,
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
CREATE INDEX idx_employees_designation_id ON public.employees(designation_id);
CREATE INDEX idx_employees_employee_code ON public.employees(employee_code);
CREATE INDEX idx_employees_reports_to ON public.employees(reports_to_employee_id);
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
    pp NUMERIC(10, 2) NOT NULL, -- Purchase Price
    tp NUMERIC(10, 2) NOT NULL, -- Trade Price
    mrp NUMERIC(10, 2) NOT NULL, -- Maximum Retail Price
    stock INTEGER NOT NULL DEFAULT 0,
    image_urls TEXT[],
    description TEXT NOT NULL,
    category_id UUID,
    company_id UUID,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    keywords TEXT[] DEFAULT '{}'::text[],
    video TEXT,
    flash_sale BOOLEAN DEFAULT false,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    flat_rate BOOLEAN NOT NULL DEFAULT false,
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
CREATE INDEX idx_products_flat_rate ON public.products(flat_rate);
CREATE INDEX idx_products_pp ON public.products(pp);
CREATE INDEX idx_products_tp ON public.products(tp);
CREATE INDEX idx_products_mrp ON public.products(mrp);
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

-- =========================
-- Product Batches
-- =========================

CREATE TABLE IF NOT EXISTS public.product_batches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    batch_no TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    added_at DATE NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc')::date,
    mfg_date DATE,
    exp_date DATE,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(product_id, batch_no)
);

CREATE INDEX IF NOT EXISTS idx_product_batches_product ON public.product_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_product_batches_batch_no ON public.product_batches(batch_no);
CREATE INDEX IF NOT EXISTS idx_product_batches_added_at ON public.product_batches(added_at);

ALTER TABLE public.product_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Admins manage product_batches" ON public.product_batches
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE TRIGGER update_product_batches_updated_at BEFORE UPDATE ON public.product_batches
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Recalculate product stock from batches
CREATE OR REPLACE FUNCTION public.recalc_product_stock_from_batches(p_product_id UUID)
RETURNS VOID AS $$
DECLARE v_stock INTEGER;
BEGIN
  SELECT COALESCE(SUM(quantity),0) INTO v_stock FROM public.product_batches WHERE product_id = p_product_id;
  UPDATE public.products SET stock = v_stock, updated_at = NOW() WHERE id = p_product_id;
END;$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.after_product_batches_change()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.recalc_product_stock_from_batches(COALESCE(NEW.product_id, OLD.product_id));
  RETURN COALESCE(NEW, OLD);
END;$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_product_batches_after_insert
AFTER INSERT ON public.product_batches
FOR EACH ROW EXECUTE FUNCTION public.after_product_batches_change();

CREATE TRIGGER trg_product_batches_after_update
AFTER UPDATE ON public.product_batches
FOR EACH ROW EXECUTE FUNCTION public.after_product_batches_change();

CREATE TRIGGER trg_product_batches_after_delete
AFTER DELETE ON public.product_batches
FOR EACH ROW EXECUTE FUNCTION public.after_product_batches_change();

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
    pp, tp, mrp, stock, description, 
    category_id, company_id, keywords, 
    is_featured, flat_rate, weight, weight_unit
) VALUES
(
    'Vitamin D3 1000IU', 'vitamin-d3-1000iu', 'Cholecalciferol', 
    'Softgel Capsules', '60 capsules', 'VIT-D3-1000-60', 
    850.00, 1200.00, 1599.00, 1250, 'High-quality Vitamin D3 supplement for bone and immune health', 
    (SELECT id FROM public.categories WHERE slug = 'vitamins-supplements'),
    (SELECT id FROM public.companies WHERE slug = 'wellcare-nutriscience'),
    ARRAY['vitamin d3', 'bone health', 'immune support', 'cholecalciferol'],
    true, false, 0.1, 'kg'
),
(
    'Whey Protein 2kg', 'whey-protein-2kg', 'Whey Protein Isolate', 
    'Powder', '2kg tub', 'PRO-WHEY-2KG', 
    2500.00, 3500.00, 4599.00, 89, 'Premium whey protein isolate for muscle building and recovery', 
    (SELECT id FROM public.categories WHERE slug = 'protein-fitness'),
    (SELECT id FROM public.companies WHERE slug = 'proteinplus'),
    ARRAY['whey protein', 'muscle building', 'recovery', 'fitness'],
    true, true, 2.0, 'kg'
),
(
    'Omega-3 Fish Oil', 'omega-3-fish-oil', 'Omega-3 Fatty Acids', 
    'Softgel Capsules', '120 capsules', 'OMG-3-120', 
    1250.00, 1800.00, 2499.00, 340, 'Pure fish oil supplement rich in Omega-3 fatty acids for heart and brain health', 
    (SELECT id FROM public.categories WHERE slug = 'vitamins-supplements'),
    (SELECT id FROM public.companies WHERE slug = 'wellcare-nutriscience'),
    ARRAY['omega 3', 'fish oil', 'heart health', 'brain health'],
    false, false, 0.15, 'kg'
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

-- Insert sample stock data for each branch
INSERT INTO public.product_branch_stocks (product_id, branch_id, stock, min_level, max_level) VALUES
-- Main Branch stocks
((SELECT id FROM public.products WHERE sku = 'VIT-D3-1000-60'), (SELECT id FROM public.branches WHERE code = 'MAIN'), 500, 50, 1000),
((SELECT id FROM public.products WHERE sku = 'PRO-WHEY-2KG'), (SELECT id FROM public.branches WHERE code = 'MAIN'), 25, 5, 50),
((SELECT id FROM public.products WHERE sku = 'OMG-3-120'), (SELECT id FROM public.branches WHERE code = 'MAIN'), 150, 20, 300),

-- North Branch stocks
((SELECT id FROM public.products WHERE sku = 'VIT-D3-1000-60'), (SELECT id FROM public.branches WHERE code = 'NORTH'), 300, 30, 600),
((SELECT id FROM public.products WHERE sku = 'PRO-WHEY-2KG'), (SELECT id FROM public.branches WHERE code = 'NORTH'), 15, 3, 30),
((SELECT id FROM public.products WHERE sku = 'OMG-3-120'), (SELECT id FROM public.branches WHERE code = 'NORTH'), 100, 15, 200),

-- South Branch stocks
((SELECT id FROM public.products WHERE sku = 'VIT-D3-1000-60'), (SELECT id FROM public.branches WHERE code = 'SOUTH'), 200, 25, 400),
((SELECT id FROM public.products WHERE sku = 'PRO-WHEY-2KG'), (SELECT id FROM public.branches WHERE code = 'SOUTH'), 10, 2, 25),
((SELECT id FROM public.products WHERE sku = 'OMG-3-120'), (SELECT id FROM public.branches WHERE code = 'SOUTH'), 80, 10, 150);

-- Product Batches Table
CREATE TABLE IF NOT EXISTS public.product_batches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    batch_number TEXT NOT NULL,
    expiry_date DATE,
    manufacturing_date DATE,
    supplier_batch_number TEXT,
    cost_price NUMERIC(12,2),
    quantity_received INTEGER NOT NULL DEFAULT 0,
    quantity_remaining INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'recalled', 'consumed')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    created_by UUID REFERENCES public.users(id),
    UNIQUE(product_id, batch_number)
);

-- Indexes for product_batches
CREATE INDEX IF NOT EXISTS idx_pb_product_id ON public.product_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_pb_batch_number ON public.product_batches(batch_number);
CREATE INDEX IF NOT EXISTS idx_pb_expiry_date ON public.product_batches(expiry_date);
CREATE INDEX IF NOT EXISTS idx_pb_status ON public.product_batches(status);

-- Product Branch Batch Stocks Table (tracks batch-wise stock per branch)
CREATE TABLE IF NOT EXISTS public.product_branch_batch_stocks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES public.product_batches(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(product_id, branch_id, batch_id)
);

-- Indexes for product_branch_batch_stocks
CREATE INDEX IF NOT EXISTS idx_pbbs_product_id ON public.product_branch_batch_stocks(product_id);
CREATE INDEX IF NOT EXISTS idx_pbbs_branch_id ON public.product_branch_batch_stocks(branch_id);
CREATE INDEX IF NOT EXISTS idx_pbbs_batch_id ON public.product_branch_batch_stocks(batch_id);
CREATE INDEX IF NOT EXISTS idx_pbbs_product_branch ON public.product_branch_batch_stocks(product_id, branch_id);

-- Enable RLS for batch tables
ALTER TABLE public.product_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_branch_batch_stocks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_batches
CREATE POLICY IF NOT EXISTS "Admins manage product_batches" ON public.product_batches
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY IF NOT EXISTS "Branch view product_batches" ON public.product_batches
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'branch'))
  );

-- RLS Policies for product_branch_batch_stocks
CREATE POLICY IF NOT EXISTS "Admins manage product_branch_batch_stocks" ON public.product_branch_batch_stocks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY IF NOT EXISTS "Branch view own batch stocks" ON public.product_branch_batch_stocks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'branch' AND u.branch_id = product_branch_batch_stocks.branch_id)
  );

-- Triggers for updated_at
CREATE TRIGGER update_product_batches_updated_at BEFORE UPDATE ON public.product_batches
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_branch_batch_stocks_updated_at BEFORE UPDATE ON public.product_branch_batch_stocks
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically update batch remaining quantity when batch stock changes
CREATE OR REPLACE FUNCTION public.update_batch_remaining_quantity()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate total remaining quantity across all branches for this batch
    UPDATE public.product_batches 
    SET quantity_remaining = (
        SELECT COALESCE(SUM(quantity), 0)
        FROM public.product_branch_batch_stocks 
        WHERE batch_id = COALESCE(NEW.batch_id, OLD.batch_id)
    ),
    updated_at = NOW()
    WHERE id = COALESCE(NEW.batch_id, OLD.batch_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update batch remaining quantity when batch stock changes
CREATE TRIGGER update_batch_remaining_on_stock_change
    AFTER INSERT OR UPDATE OR DELETE ON public.product_branch_batch_stocks
    FOR EACH ROW EXECUTE FUNCTION public.update_batch_remaining_quantity();

-- Function to automatically update batch status based on remaining quantity
CREATE OR REPLACE FUNCTION public.update_batch_status()
RETURNS TRIGGER AS $$
BEGIN
    -- If remaining quantity is 0, mark as consumed
    IF NEW.quantity_remaining = 0 AND OLD.quantity_remaining > 0 THEN
        NEW.status = 'consumed';
    END IF;
    
    -- If remaining quantity > 0 and was consumed, mark as active
    IF NEW.quantity_remaining > 0 AND OLD.status = 'consumed' THEN
        NEW.status = 'active';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update batch status when remaining quantity changes
CREATE TRIGGER update_batch_status_on_quantity_change
    BEFORE UPDATE ON public.product_batches
    FOR EACH ROW EXECUTE FUNCTION public.update_batch_status();

-- Function to check for expired batches and update their status
CREATE OR REPLACE FUNCTION public.check_expired_batches()
RETURNS VOID AS $$
BEGIN
    UPDATE public.product_batches 
    SET status = 'expired', updated_at = NOW()
    WHERE expiry_date < CURRENT_DATE 
    AND status = 'active'
    AND quantity_remaining > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to ensure batch stock row exists when creating inventory movements
CREATE OR REPLACE FUNCTION public.ensure_batch_stock_row(p_product_id UUID, p_branch_id UUID, p_batch_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.product_branch_batch_stocks (product_id, branch_id, batch_id, quantity)
    VALUES (p_product_id, p_branch_id, p_batch_id, 0)
    ON CONFLICT (product_id, branch_id, batch_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Enhanced inventory movement trigger to handle batch movements
CREATE OR REPLACE FUNCTION public.apply_inventory_movement_with_batch()
RETURNS TRIGGER AS $$
DECLARE
    v_current_stock INTEGER;
BEGIN
    -- Handle outgoing stock (from_branch_id is not null)
    IF NEW.from_branch_id IS NOT NULL THEN
        -- If batch_id is provided, update batch stock
        IF NEW.batch_id IS NOT NULL THEN
            PERFORM public.ensure_batch_stock_row(NEW.product_id, NEW.from_branch_id, NEW.batch_id);
            
            SELECT quantity INTO v_current_stock 
            FROM public.product_branch_batch_stocks 
            WHERE product_id = NEW.product_id AND branch_id = NEW.from_branch_id AND batch_id = NEW.batch_id 
            FOR UPDATE;
            
            IF v_current_stock < NEW.quantity THEN
                RAISE EXCEPTION 'Insufficient batch stock. Available: %, Requested: %', v_current_stock, NEW.quantity;
            END IF;
            
            UPDATE public.product_branch_batch_stocks
            SET quantity = quantity - NEW.quantity, updated_at = NOW()
            WHERE product_id = NEW.product_id AND branch_id = NEW.from_branch_id AND batch_id = NEW.batch_id;
        ELSE
            -- Regular stock movement (no batch)
            PERFORM public.ensure_stock_row(NEW.product_id, NEW.from_branch_id);
            UPDATE public.product_branch_stocks
            SET stock = stock - NEW.quantity, updated_at = NOW()
            WHERE product_id = NEW.product_id AND branch_id = NEW.from_branch_id;
        END IF;
    END IF;

    -- Handle incoming stock (to_branch_id is not null)
    IF NEW.to_branch_id IS NOT NULL THEN
        -- If batch_id is provided, update batch stock
        IF NEW.batch_id IS NOT NULL THEN
            PERFORM public.ensure_batch_stock_row(NEW.product_id, NEW.to_branch_id, NEW.batch_id);
            
            UPDATE public.product_branch_batch_stocks
            SET quantity = quantity + NEW.quantity, updated_at = NOW()
            WHERE product_id = NEW.product_id AND branch_id = NEW.to_branch_id AND batch_id = NEW.batch_id;
        ELSE
            -- Regular stock movement (no batch)
            PERFORM public.ensure_stock_row(NEW.product_id, NEW.to_branch_id);
            UPDATE public.product_branch_stocks
            SET stock = stock + NEW.quantity, updated_at = NOW()
            WHERE product_id = NEW.product_id AND branch_id = NEW.to_branch_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Replace the existing trigger with the enhanced version
DROP TRIGGER IF EXISTS apply_inventory_movement_after_insert ON public.inventory_movements;
CREATE TRIGGER apply_inventory_movement_with_batch_after_insert
    AFTER INSERT ON public.inventory_movements
    FOR EACH ROW EXECUTE FUNCTION public.apply_inventory_movement_with_batch();

-- Insert sample batch data
INSERT INTO public.product_batches (product_id, batch_number, expiry_date, manufacturing_date, supplier_batch_number, cost_price, quantity_received, quantity_remaining, status) VALUES
-- Vitamin D3 batches
((SELECT id FROM public.products WHERE sku = 'VIT-D3-1000-60'), 'VIT2412001', '2025-12-31', '2024-01-15', 'SUP-VIT-001', 850.00, 500, 500, 'active'),
((SELECT id FROM public.products WHERE sku = 'VIT-D3-1000-60'), 'VIT2412002', '2025-11-30', '2024-02-10', 'SUP-VIT-002', 820.00, 300, 300, 'active'),
((SELECT id FROM public.products WHERE sku = 'VIT-D3-1000-60'), 'VIT2412003', '2025-10-15', '2024-03-05', 'SUP-VIT-003', 880.00, 200, 200, 'active'),

-- Whey Protein batches
((SELECT id FROM public.products WHERE sku = 'PRO-WHEY-2KG'), 'PRO2412001', '2025-08-20', '2024-01-20', 'SUP-PRO-001', 2500.00, 25, 25, 'active'),
((SELECT id FROM public.products WHERE sku = 'PRO-WHEY-2KG'), 'PRO2412002', '2025-09-15', '2024-02-15', 'SUP-PRO-002', 2450.00, 15, 15, 'active'),

-- Omega-3 batches
((SELECT id FROM public.products WHERE sku = 'OMG-3-120'), 'OMG2412001', '2025-07-30', '2024-01-25', 'SUP-OMG-001', 1250.00, 150, 150, 'active'),
((SELECT id FROM public.products WHERE sku = 'OMG-3-120'), 'OMG2412002', '2025-06-20', '2024-02-20', 'SUP-OMG-002', 1200.00, 100, 100, 'active');

-- Insert sample batch stock data
INSERT INTO public.product_branch_batch_stocks (product_id, branch_id, batch_id, quantity) VALUES
-- Main Branch batch stocks
((SELECT id FROM public.products WHERE sku = 'VIT-D3-1000-60'), (SELECT id FROM public.branches WHERE code = 'MAIN'), (SELECT id FROM public.product_batches WHERE batch_number = 'VIT2412001'), 200),
((SELECT id FROM public.products WHERE sku = 'VIT-D3-1000-60'), (SELECT id FROM public.branches WHERE code = 'MAIN'), (SELECT id FROM public.product_batches WHERE batch_number = 'VIT2412002'), 150),
((SELECT id FROM public.products WHERE sku = 'PRO-WHEY-2KG'), (SELECT id FROM public.branches WHERE code = 'MAIN'), (SELECT id FROM public.product_batches WHERE batch_number = 'PRO2412001'), 15),
((SELECT id FROM public.products WHERE sku = 'OMG-3-120'), (SELECT id FROM public.branches WHERE code = 'MAIN'), (SELECT id FROM public.product_batches WHERE batch_number = 'OMG2412001'), 80),

-- North Branch batch stocks
((SELECT id FROM public.products WHERE sku = 'VIT-D3-1000-60'), (SELECT id FROM public.branches WHERE code = 'NORTH'), (SELECT id FROM public.product_batches WHERE batch_number = 'VIT2412001'), 150),
((SELECT id FROM public.products WHERE sku = 'VIT-D3-1000-60'), (SELECT id FROM public.branches WHERE code = 'NORTH'), (SELECT id FROM public.product_batches WHERE batch_number = 'VIT2412003'), 100),
((SELECT id FROM public.products WHERE sku = 'PRO-WHEY-2KG'), (SELECT id FROM public.branches WHERE code = 'NORTH'), (SELECT id FROM public.product_batches WHERE batch_number = 'PRO2412002'), 10),
((SELECT id FROM public.products WHERE sku = 'OMG-3-120'), (SELECT id FROM public.branches WHERE code = 'NORTH'), (SELECT id FROM public.product_batches WHERE batch_number = 'OMG2412002'), 60),

-- South Branch batch stocks
((SELECT id FROM public.products WHERE sku = 'VIT-D3-1000-60'), (SELECT id FROM public.branches WHERE code = 'SOUTH'), (SELECT id FROM public.product_batches WHERE batch_number = 'VIT2412002'), 100),
((SELECT id FROM public.products WHERE sku = 'VIT-D3-1000-60'), (SELECT id FROM public.branches WHERE code = 'SOUTH'), (SELECT id FROM public.product_batches WHERE batch_number = 'VIT2412003'), 50),
((SELECT id FROM public.products WHERE sku = 'PRO-WHEY-2KG'), (SELECT id FROM public.branches WHERE code = 'SOUTH'), (SELECT id FROM public.product_batches WHERE batch_number = 'PRO2412001'), 5),
((SELECT id FROM public.products WHERE sku = 'OMG-3-120'), (SELECT id FROM public.branches WHERE code = 'SOUTH'), (SELECT id FROM public.product_batches WHERE batch_number = 'OMG2412001'), 40);

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
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    from_branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    to_branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    note TEXT,
    batch_id UUID REFERENCES public.product_batches(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_im_product_id ON public.inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_im_from_branch ON public.inventory_movements(from_branch_id);
CREATE INDEX IF NOT EXISTS idx_im_to_branch ON public.inventory_movements(to_branch_id);
CREATE INDEX IF NOT EXISTS idx_im_batch_id ON public.inventory_movements(batch_id);
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

-- Ensure at least one branch is present
ALTER TABLE public.inventory_movements
  ADD CONSTRAINT IF NOT EXISTS chk_movement_branches
  CHECK (
    (from_branch_id IS NOT NULL) OR (to_branch_id IS NOT NULL)
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
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    batch_id UUID REFERENCES public.product_batches(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_bt_from_branch ON public.branch_transfers(from_branch_id);
CREATE INDEX IF NOT EXISTS idx_bt_to_branch ON public.branch_transfers(to_branch_id);
CREATE INDEX IF NOT EXISTS idx_bti_transfer_id ON public.branch_transfer_items(transfer_id);
CREATE INDEX IF NOT EXISTS idx_bti_batch_id ON public.branch_transfer_items(batch_id);

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
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_parties_name ON public.parties(name);
CREATE INDEX IF NOT EXISTS idx_parties_is_active ON public.parties(is_active);
CREATE INDEX IF NOT EXISTS idx_parties_branch_id ON public.parties(branch_id);
CREATE INDEX IF NOT EXISTS idx_parties_created_by ON public.parties(created_by);
CREATE INDEX IF NOT EXISTS idx_parties_employee_id ON public.parties(employee_id);

ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Admins manage parties" ON public.parties
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY IF NOT EXISTS "Branch view parties" ON public.parties
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','branch'))
  );

CREATE POLICY IF NOT EXISTS "Employees insert parties" ON public.parties
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'employee')
  );

CREATE POLICY IF NOT EXISTS "Employees view own parties" ON public.parties
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'employee' AND created_by = auth.uid())
  );

CREATE TRIGGER update_parties_updated_at BEFORE UPDATE ON public.parties
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-fill branch/created_by on party insert
CREATE OR REPLACE FUNCTION public.before_insert_parties_defaults()
RETURNS TRIGGER AS $$
DECLARE v_branch UUID;
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  IF NEW.branch_id IS NULL THEN
    SELECT branch_id INTO v_branch FROM public.users WHERE id = NEW.created_by;
    NEW.branch_id := v_branch;
  END IF;
  RETURN NEW;
END;$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_parties_defaults ON public.parties;
CREATE TRIGGER trg_parties_defaults BEFORE INSERT ON public.parties
  FOR EACH ROW EXECUTE FUNCTION public.before_insert_parties_defaults();

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
-- Designations (Corporate Hierarchy)
-- =========================

CREATE TABLE IF NOT EXISTS public.designations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES public.designations(id) ON DELETE SET NULL,
    level INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    department TEXT,
    reporting_to_id UUID REFERENCES public.designations(id) ON DELETE SET NULL,
    min_salary NUMERIC(12,2),
    max_salary NUMERIC(12,2),
    responsibilities TEXT[],
    requirements TEXT[],
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    created_by UUID REFERENCES public.users(id),
    updated_by UUID REFERENCES public.users(id)
);

-- Indexes for designations
CREATE INDEX IF NOT EXISTS idx_designations_code ON public.designations(code);
CREATE INDEX IF NOT EXISTS idx_designations_parent_id ON public.designations(parent_id);
CREATE INDEX IF NOT EXISTS idx_designations_level ON public.designations(level);
CREATE INDEX IF NOT EXISTS idx_designations_sort_order ON public.designations(sort_order);
CREATE INDEX IF NOT EXISTS idx_designations_department ON public.designations(department);
CREATE INDEX IF NOT EXISTS idx_designations_reporting_to ON public.designations(reporting_to_id);
CREATE INDEX IF NOT EXISTS idx_designations_is_active ON public.designations(is_active);

-- RLS for designations
ALTER TABLE public.designations ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Admins manage designations" ON public.designations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY IF NOT EXISTS "Everyone can view active designations" ON public.designations
  FOR SELECT USING (is_active = true);

-- updated_at trigger for designations
CREATE TRIGGER update_designations_updated_at BEFORE UPDATE ON public.designations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update designation level based on parent hierarchy
CREATE OR REPLACE FUNCTION public.update_designation_level()
RETURNS TRIGGER AS $$
DECLARE
    parent_level INTEGER := 0;
BEGIN
    -- If there's a parent, get its level and add 1
    IF NEW.parent_id IS NOT NULL THEN
        -- Prevent self-reference
        IF NEW.parent_id = NEW.id THEN
            RAISE EXCEPTION 'Designation cannot be its own parent';
        END IF;
        
        -- Get parent level
        SELECT level INTO parent_level FROM public.designations WHERE id = NEW.parent_id;
        
        -- Check if parent exists
        IF parent_level IS NULL THEN
            RAISE EXCEPTION 'Parent designation not found';
        END IF;
        
        NEW.level := parent_level + 1;
        
        -- Prevent too deep hierarchy (max 10 levels)
        IF NEW.level > 10 THEN
            RAISE EXCEPTION 'Hierarchy too deep (max 10 levels)';
        END IF;
    ELSE
        NEW.level := 1;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update designation level
CREATE TRIGGER update_designation_level_trigger
    BEFORE INSERT OR UPDATE ON public.designations
    FOR EACH ROW EXECUTE FUNCTION public.update_designation_level();

-- Insert sample designations with hierarchy
INSERT INTO public.designations (name, code, description, department, sort_order, min_salary, max_salary, responsibilities, requirements) VALUES
-- Top Level
('Chief Executive Officer', 'CEO', 'Chief Executive Officer of the organization', 'Executive', 1, 150000.00, 300000.00, 
 ARRAY['Strategic planning', 'Overall company leadership', 'Board relations'], 
 ARRAY['MBA or equivalent', '15+ years experience', 'Leadership skills']),

-- Level 2 - Direct reports to CEO
('Chief Operating Officer', 'COO', 'Chief Operating Officer', 'Operations', 2, 120000.00, 200000.00,
 ARRAY['Operations management', 'Process improvement', 'Team leadership'],
 ARRAY['MBA preferred', '10+ years experience', 'Operations background']),

('Chief Financial Officer', 'CFO', 'Chief Financial Officer', 'Finance', 3, 100000.00, 180000.00,
 ARRAY['Financial planning', 'Budget management', 'Financial reporting'],
 ARRAY['CPA or CFA', '8+ years experience', 'Financial expertise']),

('Chief Technology Officer', 'CTO', 'Chief Technology Officer', 'Technology', 4, 110000.00, 190000.00,
 ARRAY['Technology strategy', 'IT infrastructure', 'Digital transformation'],
 ARRAY['Computer Science degree', '10+ years experience', 'Technical leadership']),

-- Level 3 - Department Heads
('Operations Manager', 'OPS_MGR', 'Operations Department Manager', 'Operations', 5, 80000.00, 120000.00,
 ARRAY['Department management', 'Process optimization', 'Team coordination'],
 ARRAY['Business degree', '5+ years experience', 'Management skills']),

('Finance Manager', 'FIN_MGR', 'Finance Department Manager', 'Finance', 6, 70000.00, 100000.00,
 ARRAY['Financial analysis', 'Budget preparation', 'Team management'],
 ARRAY['Accounting degree', '5+ years experience', 'Financial analysis']),

('IT Manager', 'IT_MGR', 'Information Technology Manager', 'Technology', 7, 75000.00, 110000.00,
 ARRAY['IT infrastructure', 'System administration', 'Team leadership'],
 ARRAY['IT degree', '5+ years experience', 'Technical skills']),

('Sales Manager', 'SALES_MGR', 'Sales Department Manager', 'Sales', 8, 60000.00, 90000.00,
 ARRAY['Sales strategy', 'Team management', 'Client relations'],
 ARRAY['Business degree', '5+ years experience', 'Sales experience']),

-- Level 4 - Senior Staff
('Senior Operations Analyst', 'SEN_OPS_ANALYST', 'Senior Operations Analyst', 'Operations', 9, 50000.00, 70000.00,
 ARRAY['Data analysis', 'Process improvement', 'Reporting'],
 ARRAY['Analytics degree', '3+ years experience', 'Analytical skills']),

('Senior Accountant', 'SEN_ACCOUNTANT', 'Senior Accountant', 'Finance', 10, 45000.00, 65000.00,
 ARRAY['Financial reporting', 'Audit support', 'Tax preparation'],
 ARRAY['Accounting degree', '3+ years experience', 'Accounting skills']),

('Senior Developer', 'SEN_DEV', 'Senior Software Developer', 'Technology', 11, 55000.00, 80000.00,
 ARRAY['Software development', 'Code review', 'Mentoring'],
 ARRAY['Computer Science degree', '3+ years experience', 'Programming skills']),

('Senior Sales Representative', 'SEN_SALES_REP', 'Senior Sales Representative', 'Sales', 12, 40000.00, 60000.00,
 ARRAY['Client acquisition', 'Sales targets', 'Customer service'],
 ARRAY['Business degree', '3+ years experience', 'Sales skills']),

-- Level 5 - Staff Level
('Operations Analyst', 'OPS_ANALYST', 'Operations Analyst', 'Operations', 13, 35000.00, 50000.00,
 ARRAY['Data collection', 'Process documentation', 'Support'],
 ARRAY['Business degree', '1+ years experience', 'Analytical thinking']),

('Accountant', 'ACCOUNTANT', 'Accountant', 'Finance', 14, 32000.00, 45000.00,
 ARRAY['Bookkeeping', 'Financial data entry', 'Reporting support'],
 ARRAY['Accounting degree', '1+ years experience', 'Attention to detail']),

('Software Developer', 'DEV', 'Software Developer', 'Technology', 15, 40000.00, 60000.00,
 ARRAY['Application development', 'Testing', 'Documentation'],
 ARRAY['Computer Science degree', '1+ years experience', 'Programming knowledge']),

('Sales Representative', 'SALES_REP', 'Sales Representative', 'Sales', 16, 30000.00, 45000.00,
 ARRAY['Customer outreach', 'Sales support', 'Lead generation'],
 ARRAY['High school diploma', '1+ years experience', 'Communication skills']),

-- Level 6 - Entry Level
('Operations Assistant', 'OPS_ASST', 'Operations Assistant', 'Operations', 17, 25000.00, 35000.00,
 ARRAY['Administrative support', 'Data entry', 'General assistance'],
 ARRAY['High school diploma', 'Entry level', 'Basic computer skills']),

('Accounting Assistant', 'ACCT_ASST', 'Accounting Assistant', 'Finance', 18, 24000.00, 34000.00,
 ARRAY['Data entry', 'Filing', 'Administrative support'],
 ARRAY['High school diploma', 'Entry level', 'Basic math skills']),

('IT Support Specialist', 'IT_SUPPORT', 'IT Support Specialist', 'Technology', 19, 28000.00, 40000.00,
 ARRAY['Technical support', 'Hardware maintenance', 'User assistance'],
 ARRAY['IT certification', 'Entry level', 'Problem-solving skills']),

('Sales Assistant', 'SALES_ASST', 'Sales Assistant', 'Sales', 20, 22000.00, 32000.00,
 ARRAY['Administrative support', 'Customer service', 'Data entry'],
 ARRAY['High school diploma', 'Entry level', 'Customer service skills']);

-- Update parent relationships after insertion
UPDATE public.designations SET parent_id = (SELECT id FROM public.designations WHERE code = 'CEO') WHERE code IN ('COO', 'CFO', 'CTO');
UPDATE public.designations SET parent_id = (SELECT id FROM public.designations WHERE code = 'COO') WHERE code IN ('OPS_MGR', 'SALES_MGR');
UPDATE public.designations SET parent_id = (SELECT id FROM public.designations WHERE code = 'CFO') WHERE code = 'FIN_MGR';
UPDATE public.designations SET parent_id = (SELECT id FROM public.designations WHERE code = 'CTO') WHERE code = 'IT_MGR';

UPDATE public.designations SET parent_id = (SELECT id FROM public.designations WHERE code = 'OPS_MGR') WHERE code IN ('SEN_OPS_ANALYST', 'OPS_ANALYST', 'OPS_ASST');
UPDATE public.designations SET parent_id = (SELECT id FROM public.designations WHERE code = 'FIN_MGR') WHERE code IN ('SEN_ACCOUNTANT', 'ACCOUNTANT', 'ACCT_ASST');
UPDATE public.designations SET parent_id = (SELECT id FROM public.designations WHERE code = 'IT_MGR') WHERE code IN ('SEN_DEV', 'DEV', 'IT_SUPPORT');
UPDATE public.designations SET parent_id = (SELECT id FROM public.designations WHERE code = 'SALES_MGR') WHERE code IN ('SEN_SALES_REP', 'SALES_REP', 'SALES_ASST');

-- Update reporting relationships
UPDATE public.designations SET reporting_to_id = parent_id WHERE parent_id IS NOT NULL;

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
-- Employee Salary & Payroll
-- =========================

-- Enums
CREATE TYPE IF NOT EXISTS salary_component_type AS ENUM ('basic', 'house_rent', 'medical', 'conveyance', 'bonus', 'commission', 'kpi', 'arrear', 'other_earning', 'pf_employee', 'pf_employer', 'tax', 'loan_repayment', 'advance_adjustment', 'other_deduction');
CREATE TYPE IF NOT EXISTS payroll_status AS ENUM ('draft', 'locked', 'approved', 'paid', 'cancelled');

-- Salary structure/profile per employee (CTC and defaults)
CREATE TABLE IF NOT EXISTS public.employee_salary_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    currency TEXT NOT NULL DEFAULT 'BDT',
    monthly_gross NUMERIC(12,2) NOT NULL DEFAULT 0,
    monthly_basic NUMERIC(12,2) NOT NULL DEFAULT 0,
    house_rent_percent NUMERIC(6,3) DEFAULT 0,
    medical_allowance NUMERIC(12,2) DEFAULT 0,
    conveyance_allowance NUMERIC(12,2) DEFAULT 0,
    pf_employee_percent NUMERIC(6,3) DEFAULT 0,
    pf_employer_percent NUMERIC(6,3) DEFAULT 0,
    tax_monthly NUMERIC(12,2) DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    note TEXT,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(employee_id, effective_from)
);

CREATE INDEX IF NOT EXISTS idx_esp_employee ON public.employee_salary_profiles(employee_id);
CREATE INDEX IF NOT EXISTS idx_esp_active ON public.employee_salary_profiles(is_active);

-- Detailed components for salary profile breakdown
CREATE TABLE IF NOT EXISTS public.employee_salary_components (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES public.employee_salary_profiles(id) ON DELETE CASCADE,
    component_type salary_component_type NOT NULL,
    name TEXT,
    is_earning BOOLEAN NOT NULL,
    is_percentage BOOLEAN NOT NULL DEFAULT false,
    percent_value NUMERIC(6,3) DEFAULT 0,
    amount_value NUMERIC(12,2) DEFAULT 0,
    taxable BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_esc_profile ON public.employee_salary_components(profile_id);
CREATE INDEX IF NOT EXISTS idx_esc_type ON public.employee_salary_components(component_type);

-- Employee advances/loans
CREATE TABLE IF NOT EXISTS public.employee_salary_advances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    approved_on DATE NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc')::date,
    principal NUMERIC(12,2) NOT NULL CHECK (principal > 0),
    balance NUMERIC(12,2) NOT NULL CHECK (balance >= 0),
    monthly_installment NUMERIC(12,2) NOT NULL DEFAULT 0,
    installments_remaining INTEGER,
    note TEXT,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_esa_employee ON public.employee_salary_advances(employee_id);
CREATE INDEX IF NOT EXISTS idx_esa_balance ON public.employee_salary_advances(balance);

-- Payroll run header
CREATE TABLE IF NOT EXISTS public.payroll_runs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    period_year INTEGER NOT NULL,
    period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    status payroll_status NOT NULL DEFAULT 'draft',
    total_gross NUMERIC(14,2) NOT NULL DEFAULT 0,
    total_net NUMERIC(14,2) NOT NULL DEFAULT 0,
    created_by UUID REFERENCES public.users(id),
    approved_by UUID REFERENCES public.users(id),
    paid_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (branch_id, period_year, period_month)
);

CREATE INDEX IF NOT EXISTS idx_payroll_runs_period ON public.payroll_runs(period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_status ON public.payroll_runs(status);

-- Payroll items per employee for a run
CREATE TABLE IF NOT EXISTS public.payroll_run_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    run_id UUID NOT NULL REFERENCES public.payroll_runs(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
    profile_id UUID REFERENCES public.employee_salary_profiles(id) ON DELETE SET NULL,
    working_days INTEGER DEFAULT 0,
    present_days INTEGER DEFAULT 0,
    absent_days INTEGER DEFAULT 0,
    leave_days INTEGER DEFAULT 0,
    gross_pay NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_earnings NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_deductions NUMERIC(12,2) NOT NULL DEFAULT 0,
    net_pay NUMERIC(12,2) NOT NULL DEFAULT 0,
    note TEXT
);

CREATE INDEX IF NOT EXISTS idx_pri_run ON public.payroll_run_items(run_id);
CREATE INDEX IF NOT EXISTS idx_pri_employee ON public.payroll_run_items(employee_id);

-- Payroll item components (flattened applied components)
CREATE TABLE IF NOT EXISTS public.payroll_run_item_components (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    run_item_id UUID NOT NULL REFERENCES public.payroll_run_items(id) ON DELETE CASCADE,
    component_type salary_component_type NOT NULL,
    name TEXT,
    is_earning BOOLEAN NOT NULL,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_pric_item ON public.payroll_run_item_components(run_item_id);

-- Adjustments for a run item (manual additions/deductions)
CREATE TABLE IF NOT EXISTS public.payroll_adjustments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    run_item_id UUID NOT NULL REFERENCES public.payroll_run_items(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    is_earning BOOLEAN NOT NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_payroll_adjust_item ON public.payroll_adjustments(run_item_id);

-- Payslip receipts
CREATE TABLE IF NOT EXISTS public.payroll_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    run_id UUID NOT NULL REFERENCES public.payroll_runs(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
    amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    method TEXT NOT NULL DEFAULT 'cash',
    reference TEXT,
    paid_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    paid_by UUID REFERENCES public.users(id)
);

CREATE INDEX IF NOT EXISTS idx_payroll_payments_run ON public.payroll_payments(run_id);
CREATE INDEX IF NOT EXISTS idx_payroll_payments_employee ON public.payroll_payments(employee_id);

-- RLS enable
ALTER TABLE public.employee_salary_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_salary_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_salary_advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_run_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_run_item_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_payments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY IF NOT EXISTS "Admins manage salary_profiles" ON public.employee_salary_profiles
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY IF NOT EXISTS "Branch view own salary_profiles" ON public.employee_salary_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.employees e JOIN public.users u ON u.id = auth.uid()
      WHERE e.id = employee_salary_profiles.employee_id AND u.role = 'branch' AND u.branch_id = e.branch_id
    )
  );

CREATE POLICY IF NOT EXISTS "Admins manage salary_components" ON public.employee_salary_components
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY IF NOT EXISTS "Admins manage salary_advances" ON public.employee_salary_advances
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY IF NOT EXISTS "Branch view own salary_advances" ON public.employee_salary_advances
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.employees e JOIN public.users u ON u.id = auth.uid()
      WHERE e.id = employee_salary_advances.employee_id AND u.role = 'branch' AND u.branch_id = e.branch_id
    )
  );

CREATE POLICY IF NOT EXISTS "Admins manage payroll_runs" ON public.payroll_runs
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY IF NOT EXISTS "Branch view own payroll_runs" ON public.payroll_runs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'branch' AND u.branch_id = payroll_runs.branch_id)
  );

CREATE POLICY IF NOT EXISTS "Admins manage payroll_items" ON public.payroll_run_items
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY IF NOT EXISTS "Branch view payroll_items" ON public.payroll_run_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.payroll_runs pr JOIN public.users u ON u.id = auth.uid()
      WHERE pr.id = payroll_run_items.run_id AND u.role = 'branch' AND u.branch_id = pr.branch_id
    )
  );

CREATE POLICY IF NOT EXISTS "Admins manage payroll_components" ON public.payroll_run_item_components
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY IF NOT EXISTS "Branch view payroll_components" ON public.payroll_run_item_components
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.payroll_runs pr JOIN public.payroll_run_items pri ON pri.run_id = pr.id JOIN public.users u ON u.id = auth.uid()
      WHERE payroll_run_item_components.run_item_id = pri.id AND u.role = 'branch' AND u.branch_id = pr.branch_id
    )
  );

CREATE POLICY IF NOT EXISTS "Admins manage payroll_adjustments" ON public.payroll_adjustments
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY IF NOT EXISTS "Admins manage payroll_payments" ON public.payroll_payments
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY IF NOT EXISTS "Branch view payroll_payments" ON public.payroll_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.payroll_runs pr JOIN public.users u ON u.id = auth.uid()
      WHERE pr.id = payroll_payments.run_id AND u.role = 'branch' AND u.branch_id = pr.branch_id
    )
  );

-- Triggers for updated_at
CREATE TRIGGER update_employee_salary_profiles_updated_at BEFORE UPDATE ON public.employee_salary_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employee_salary_advances_updated_at BEFORE UPDATE ON public.employee_salary_advances
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payroll_runs_updated_at BEFORE UPDATE ON public.payroll_runs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helper: recalc payroll run totals
CREATE OR REPLACE FUNCTION public.recalc_payroll_run_totals(p_run_id UUID)
RETURNS VOID AS $$
DECLARE v_gross NUMERIC(14,2); v_net NUMERIC(14,2);
BEGIN
  SELECT COALESCE(SUM(gross_pay),0), COALESCE(SUM(net_pay),0) INTO v_gross, v_net FROM public.payroll_run_items WHERE run_id = p_run_id;
  UPDATE public.payroll_runs SET total_gross = v_gross, total_net = v_net, updated_at = NOW() WHERE id = p_run_id;
END;$$ LANGUAGE plpgsql;

-- Helper: apply profile components to compute payroll item
CREATE OR REPLACE FUNCTION public.compute_payroll_item(p_run_id UUID, p_employee_id UUID)
RETURNS UUID AS $$
DECLARE
  v_profile RECORD;
  v_item_id UUID;
  v_gross NUMERIC(12,2) := 0;
  v_earn NUMERIC(12,2) := 0;
  v_ded NUMERIC(12,2) := 0;
  v_net NUMERIC(12,2) := 0;
  v_base NUMERIC(12,2) := 0;
  v_comp RECORD;
BEGIN
  SELECT esp.* INTO v_profile
  FROM public.employee_salary_profiles esp
  WHERE esp.employee_id = p_employee_id AND esp.is_active = true
    AND (esp.effective_to IS NULL OR esp.effective_to >= (NOW() AT TIME ZONE 'utc')::date)
  ORDER BY esp.effective_from DESC
  LIMIT 1;

  INSERT INTO public.payroll_run_items (run_id, employee_id, profile_id, gross_pay, total_earnings, total_deductions, net_pay)
  VALUES (p_run_id, p_employee_id, COALESCE(v_profile.id, NULL), 0, 0, 0, 0)
  RETURNING id INTO v_item_id;

  IF v_profile IS NULL THEN
    RETURN v_item_id;
  END IF;

  v_base := v_profile.monthly_basic;

  -- Load components and calculate
  FOR v_comp IN SELECT * FROM public.employee_salary_components WHERE profile_id = v_profile.id ORDER BY sort_order LOOP
    DECLARE v_amt NUMERIC(12,2);
    BEGIN
      IF v_comp.is_percentage THEN
        v_amt := ROUND((v_comp.percent_value/100.0) * CASE WHEN v_comp.component_type IN ('house_rent','medical','conveyance','bonus','commission','kpi','arrear','other_earning') THEN v_base ELSE v_profile.monthly_gross END, 2);
      ELSE
        v_amt := v_comp.amount_value;
      END IF;

      INSERT INTO public.payroll_run_item_components (run_item_id, component_type, name, is_earning, amount)
      VALUES (v_item_id, v_comp.component_type, COALESCE(v_comp.name, v_comp.component_type::text), v_comp.is_earning, v_amt);

      IF v_comp.is_earning THEN
        v_earn := v_earn + v_amt;
      ELSE
        v_ded := v_ded + v_amt;
      END IF;
    END;
  END LOOP;

  v_gross := GREATEST(v_profile.monthly_gross, v_earn);
  v_net := GREATEST(v_gross - v_ded, 0);

  UPDATE public.payroll_run_items
  SET gross_pay = v_gross, total_earnings = v_earn, total_deductions = v_ded, net_pay = v_net
  WHERE id = v_item_id;

  RETURN v_item_id;
END;$$ LANGUAGE plpgsql;

-- Generate payroll for a run (draft only)
CREATE OR REPLACE FUNCTION public.generate_payroll(p_run_id UUID)
RETURNS VOID AS $$
DECLARE v_run RECORD; v_emp RECORD; v_item UUID;
BEGIN
  SELECT * INTO v_run FROM public.payroll_runs WHERE id = p_run_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payroll run % not found', p_run_id; END IF;
  IF v_run.status <> 'draft' THEN RAISE EXCEPTION 'Only draft runs can be generated'; END IF;

  DELETE FROM public.payroll_run_items WHERE run_id = p_run_id;

  FOR v_emp IN SELECT id FROM public.employees WHERE is_active = true AND (v_run.branch_id IS NULL OR branch_id = v_run.branch_id) LOOP
    v_item := public.compute_payroll_item(p_run_id, v_emp.id);
  END LOOP;

  PERFORM public.recalc_payroll_run_totals(p_run_id);
END;$$ LANGUAGE plpgsql;

-- Approve payroll
CREATE OR REPLACE FUNCTION public.approve_payroll(p_run_id UUID, p_actor UUID)
RETURNS VOID AS $$
DECLARE v_run RECORD;
BEGIN
  SELECT * INTO v_run FROM public.payroll_runs WHERE id = p_run_id FOR UPDATE;
  IF v_run.status NOT IN ('draft','locked') THEN RAISE EXCEPTION 'Run must be draft/locked to approve'; END IF;
  UPDATE public.payroll_runs SET status = 'approved', approved_by = p_actor, updated_at = NOW() WHERE id = p_run_id;
END;$$ LANGUAGE plpgsql;

-- Mark payroll as paid and create payment rows per item (simple full payment)
CREATE OR REPLACE FUNCTION public.pay_payroll(p_run_id UUID, p_actor UUID, p_method TEXT DEFAULT 'cash')
RETURNS VOID AS $$
DECLARE v_run RECORD; v_item RECORD;
BEGIN
  SELECT * INTO v_run FROM public.payroll_runs WHERE id = p_run_id FOR UPDATE;
  IF v_run.status <> 'approved' THEN RAISE EXCEPTION 'Only approved runs can be paid'; END IF;

  FOR v_item IN SELECT * FROM public.payroll_run_items WHERE run_id = p_run_id LOOP
    INSERT INTO public.payroll_payments (run_id, employee_id, amount, method, paid_by)
    VALUES (p_run_id, v_item.employee_id, v_item.net_pay, p_method, p_actor);
  END LOOP;

  UPDATE public.payroll_runs SET status = 'paid', paid_by = p_actor, updated_at = NOW() WHERE id = p_run_id;
END;$$ LANGUAGE plpgsql;

-- Advance repayment application during payroll generation (optional simple rule)
CREATE OR REPLACE FUNCTION public.apply_advance_repayments(p_run_id UUID)
RETURNS VOID AS $$
DECLARE v_item RECORD; v_adv RECORD; v_pay NUMERIC(12,2);
BEGIN
  FOR v_item IN SELECT * FROM public.payroll_run_items WHERE run_id = p_run_id LOOP
    FOR v_adv IN SELECT * FROM public.employee_salary_advances WHERE employee_id = v_item.employee_id AND balance > 0 LOOP
      v_pay := LEAST(COALESCE(v_adv.monthly_installment,0), v_adv.balance);
      IF v_pay > 0 THEN
        INSERT INTO public.payroll_run_item_components (run_item_id, component_type, name, is_earning, amount)
        VALUES (v_item.id, 'loan_repayment', 'Advance Repayment', false, v_pay);
        UPDATE public.employee_salary_advances SET balance = balance - v_pay, updated_at = NOW() WHERE id = v_adv.id;
        UPDATE public.payroll_run_items SET total_deductions = total_deductions + v_pay, net_pay = GREATEST(net_pay - v_pay, 0) WHERE id = v_item.id;
      END IF;
    END LOOP;
  END LOOP;

  PERFORM public.recalc_payroll_run_totals(p_run_id);
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

