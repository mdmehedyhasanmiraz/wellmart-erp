export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  branch_id?: string;
  branch_name?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export type UserRole = 'admin' | 'branch' | 'mpo';

export interface Branch {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  manager_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  branch_id?: string;
}

export interface UpdateUserData {
  name?: string;
  phone?: string;
  role?: UserRole;
  branch_id?: string;
  is_active?: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: {
    name?: string;
    role?: UserRole;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
  role?: UserRole;
}

export interface UserProfile extends User {
  permissions: string[];
  dashboard_route: string;
}

export type DashboardRoutes = {
  [key in UserRole]: string;
};

export const DASHBOARD_ROUTES: DashboardRoutes = {
  admin: '/admin',
  branch: '/branch',
  mpo: '/mpo',
};

// Product related types
export interface Product {
  id: string;
  name: string;
  slug: string;
  generic_name?: string;
  dosage_form?: string;
  pack_size?: string;
  sku: string;
  price_regular: number;
  price_offer?: number;
  stock: number;
  image_urls?: string[];
  description: string;
  category_id?: string;
  company_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  keywords: string[];
  price_purchase?: number;
  video?: string;
  flash_sale: boolean;
  is_featured: boolean;
  sub_products?: string[];
  variants?: Record<string, any>;
  weight?: number;
  weight_unit?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
  image_url?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  website?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductWithDetails extends Product {
  category?: Category;
  company?: Company;
}

export interface CreateProductData {
  name: string;
  slug: string;
  generic_name?: string;
  dosage_form?: string;
  pack_size?: string;
  sku: string;
  price_regular: number;
  price_offer?: number;
  stock: number;
  image_urls?: string[];
  description: string;
  category_id?: string;
  company_id?: string;
  is_active?: boolean;
  keywords?: string[];
  price_purchase?: number;
  video?: string;
  flash_sale?: boolean;
  is_featured?: boolean;
  sub_products?: string[];
  variants?: Record<string, any>;
  weight?: number;
  weight_unit?: string;
}

export interface UpdateProductData {
  name?: string;
  slug?: string;
  generic_name?: string;
  dosage_form?: string;
  pack_size?: string;
  sku?: string;
  price_regular?: number;
  price_offer?: number;
  stock?: number;
  image_urls?: string[];
  description?: string;
  category_id?: string;
  company_id?: string;
  is_active?: boolean;
  keywords?: string[];
  price_purchase?: number;
  video?: string;
  flash_sale?: boolean;
  is_featured?: boolean;
  sub_products?: string[];
  variants?: Record<string, any>;
  weight?: number;
  weight_unit?: string;
}

export interface CreateCategoryData {
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
  image_url?: string;
  sort_order?: number;
}

export interface UpdateCategoryData {
  name?: string;
  slug?: string;
  description?: string;
  parent_id?: string;
  image_url?: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface CreateCompanyData {
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  website?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
}

export interface UpdateCompanyData {
  name?: string;
  slug?: string;
  description?: string;
  logo_url?: string;
  website?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  is_active?: boolean;
}

// Employee types
export interface Employee {
  id: string;
  name: string;
  designation?: string;
  employee_code: string;
  branch_id?: string;
  phone?: string;
  email?: string;
  joined_date?: string; // ISO date
  resigned_date?: string; // ISO date
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateEmployeeData {
  name: string;
  designation?: string;
  employee_code: string;
  branch_id?: string;
  phone?: string;
  email?: string;
  joined_date?: string; // ISO date
  resigned_date?: string; // ISO date
  is_active?: boolean;
}

export interface UpdateEmployeeData {
  name?: string;
  designation?: string;
  employee_code?: string;
  branch_id?: string;
  phone?: string;
  email?: string;
  joined_date?: string; // ISO date
  resigned_date?: string; // ISO date
  is_active?: boolean;
}
