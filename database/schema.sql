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
