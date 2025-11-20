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

export type UserRole = 'admin' | 'branch' | 'employee';

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
  password?: string;
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
  employee: '/employee',
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
  pp: number; // Purchase Price
  tp: number; // Trade Price
  mrp: number; // Maximum Retail Price
  stock: number;
  image_urls?: string[];
  description: string;
  category_id?: string;
  company_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  keywords: string[];
  video?: string;
  flash_sale: boolean;
  is_featured: boolean;
  flat_rate: boolean;
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

// Product Batches
export interface ProductBatch {
  id: string;
  product_id: string;
  batch_no: string;
  quantity: number;
  added_at: string; // ISO date (date)
  mfg_date?: string; // ISO date (date)
  exp_date?: string; // ISO date (date)
  note?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProductBatchData {
  product_id: string;
  batch_no: string;
  quantity: number;
  added_at?: string; // ISO date
  mfg_date?: string; // ISO date
  exp_date?: string; // ISO date
  note?: string;
}

export interface UpdateProductBatchData {
  batch_no?: string;
  quantity?: number;
  added_at?: string; // ISO date
  mfg_date?: string; // ISO date
  exp_date?: string; // ISO date
  note?: string;
}

export interface CreateProductData {
  name: string;
  slug: string;
  generic_name?: string;
  dosage_form?: string;
  pack_size?: string;
  sku: string;
  pp: number; // Purchase Price
  tp: number; // Trade Price
  mrp: number; // Maximum Retail Price
  stock: number;
  image_urls?: string[];
  description: string;
  category_id?: string;
  company_id?: string;
  is_active?: boolean;
  keywords?: string[];
  video?: string;
  flash_sale?: boolean;
  is_featured?: boolean;
  flat_rate?: boolean;
  sub_products?: string[];
  variants?: Record<string, any>;
  weight?: number;
  weight_unit?: string;
}

export interface UpdateProductData {
  name?: string;
  slug?: string;
  generic_name?: string | null;
  dosage_form?: string | null;
  pack_size?: string | null;
  sku?: string;
  pp?: number; // Purchase Price
  tp?: number; // Trade Price
  mrp?: number; // Maximum Retail Price
  stock?: number;
  image_urls?: string[];
  description?: string;
  category_id?: string | null;
  company_id?: string | null;
  is_active?: boolean;
  keywords?: string[];
  video?: string | null;
  flash_sale?: boolean;
  is_featured?: boolean;
  flat_rate?: boolean;
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

// Designation types
export interface Designation {
  id: string;
  name: string;
  code: string;
  description?: string;
  parent_id?: string;
  level: number;
  sort_order: number;
  department?: string;
  reporting_to_id?: string;
  min_salary?: number;
  max_salary?: number;
  responsibilities?: string[];
  requirements?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface DesignationWithDetails extends Designation {
  parent?: Designation;
  reporting_to?: Designation;
  children?: Designation[];
}

export interface CreateDesignationData {
  name: string;
  code: string;
  description?: string;
  parent_id?: string;
  sort_order?: number;
  department?: string;
  reporting_to_id?: string;
  min_salary?: number;
  max_salary?: number;
  responsibilities?: string[];
  requirements?: string[];
}

export interface UpdateDesignationData {
  name?: string;
  code?: string;
  description?: string;
  parent_id?: string;
  sort_order?: number;
  department?: string;
  reporting_to_id?: string;
  min_salary?: number;
  max_salary?: number;
  responsibilities?: string[];
  requirements?: string[];
  is_active?: boolean;
}

// Employee types
export interface Employee {
  id: string;
  name: string;
  designation_id?: string;
  designation?: Designation;
  employee_code: string;
  branch_id?: string;
  reports_to_employee_id?: string;
  phone?: string;
  email?: string;
  present_address?: string;
  permanent_address?: string;
  blood_group?: string;
  date_of_birth?: string; // ISO date
  marriage_date?: string; // ISO date
  joined_date?: string; // ISO date
  resigned_date?: string; // ISO date
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateEmployeeData {
  name: string;
  designation_id?: string;
  employee_code: string;
  branch_id?: string;
  reports_to_employee_id?: string;
  phone?: string;
  email?: string;
  present_address?: string;
  permanent_address?: string;
  blood_group?: string;
  date_of_birth?: string; // ISO date
  marriage_date?: string; // ISO date
  joined_date?: string; // ISO date
  resigned_date?: string; // ISO date
  is_active?: boolean;
}

export interface UpdateEmployeeData {
  name?: string;
  designation_id?: string;
  employee_code?: string;
  branch_id?: string;
  reports_to_employee_id?: string;
  phone?: string;
  email?: string;
  present_address?: string;
  permanent_address?: string;
  blood_group?: string;
  date_of_birth?: string; // ISO date
  marriage_date?: string; // ISO date
  joined_date?: string; // ISO date
  resigned_date?: string; // ISO date
  is_active?: boolean;
}

// Inventory types
export interface ProductBranchStock {
  id: string;
  product_id: string;
  branch_id: string;
  stock: number;
  min_level?: number;
  max_level?: number;
  created_at: string;
  updated_at: string;
}

export interface InventoryMovement {
  id: string;
  product_id: string;
  from_branch_id?: string | null;
  to_branch_id?: string | null;
  quantity: number;
  note?: string;
  batch_id?: string;
  created_by?: string;
  created_at: string;
}

export type TransferStatus = 'pending' | 'approved' | 'completed' | 'cancelled';

export interface BranchTransfer {
  id: string;
  from_branch_id: string;
  to_branch_id: string;
  status: TransferStatus;
  note?: string;
  created_by?: string;
  approved_by?: string;
  completed_by?: string;
  created_at: string;
  updated_at: string;
}

export interface BranchTransferItem {
  id: string;
  transfer_id: string;
  product_id: string;
  quantity: number;
  batch_id?: string;
}

// Batch Management Types
export type BatchStatus = 'active' | 'expired' | 'recalled' | 'consumed';

export interface ProductBatch {
  id: string;
  product_id: string;
  batch_number: string;
  expiry_date?: string;
  manufacturing_date?: string;
  supplier_batch_number?: string;
  cost_price?: number;
  quantity_received: number;
  quantity_remaining: number;
  status: BatchStatus;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface ProductBranchBatchStock {
  id: string;
  product_id: string;
  branch_id: string;
  batch_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  product_batches?: {
    id: string;
    batch_number: string;
    expiry_date?: string;
    manufacturing_date?: string;
    status: BatchStatus;
  };
}

export interface CreateBatchData {
  product_id: string;
  batch_number: string;
  expiry_date?: string;
  manufacturing_date?: string;
  supplier_batch_number?: string;
  cost_price?: number;
  quantity_received: number;
}

export interface UpdateBatchData {
  batch_number?: string;
  expiry_date?: string;
  manufacturing_date?: string;
  supplier_batch_number?: string;
  cost_price?: number;
  quantity_received?: number;
  quantity_remaining?: number;
  status?: BatchStatus;
}

export interface BatchStockEntry {
  batch_id: string;
  quantity: number;
}

// Sales types
export type SalesStatus = 'draft' | 'posted' | 'cancelled' | 'returned';

export interface SalesOrder {
  id: string;
  branch_id: string;
  party_id?: string;
  employee_id?: string;
  customer_name?: string;
  customer_phone?: string;
  status: SalesStatus;
  subtotal: number;
  discount_total: number;
  tax_total: number;
  shipping_total: number;
  grand_total: number;
  paid_total: number;
  due_total: number;
  note?: string;
  created_by?: string;
  posted_by?: string;
  created_at: string;
  updated_at: string;
}

export interface SalesOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  discount_percent: number;
  total: number;
  batch_id?: string;
}

export interface SalesPayment {
  id: string;
  order_id: string;
  amount: number;
  method: string;
  reference?: string;
  paid_at: string;
  received_by?: string;
}

// Purchase types
export type PurchaseStatus = 'draft' | 'posted' | 'cancelled' | 'returned';

export interface PurchaseOrder {
  id: string;
  branch_id: string;
  supplier_id?: string;
  employee_id?: string;
  supplier_name?: string;
  supplier_phone?: string;
  status: PurchaseStatus;
  subtotal: number;
  discount_total: number;
  tax_total: number;
  shipping_total: number;
  grand_total: number;
  paid_total: number;
  due_total: number;
  note?: string;
  image_urls?: string[];
  created_by?: string;
  posted_by?: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  discount_percent: number;
  total: number;
  batch_number?: string;
}

export interface PurchasePayment {
  id: string;
  order_id: string;
  amount: number;
  method: string;
  reference?: string;
  paid_at: string;
  received_by?: string;
}

export interface CreatePurchaseOrderData {
  branch_id: string;
  supplier_id?: string;
  employee_id?: string;
  supplier_name?: string;
  supplier_phone?: string;
  status?: PurchaseStatus;
  subtotal?: number;
  discount_total?: number;
  tax_total?: number;
  shipping_total?: number;
  grand_total?: number;
  paid_total?: number;
  due_total?: number;
  note?: string;
  image_urls?: string[];
}

export interface UpdatePurchaseOrderData {
  supplier_id?: string;
  employee_id?: string;
  supplier_name?: string;
  supplier_phone?: string;
  status?: PurchaseStatus;
  subtotal?: number;
  discount_total?: number;
  tax_total?: number;
  shipping_total?: number;
  grand_total?: number;
  paid_total?: number;
  due_total?: number;
  note?: string;
  image_urls?: string[];
}

// Party (customer) types
export interface Party {
  id: string;
  name: string;
  party_code?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  shop_no?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  is_active: boolean;
  branch_id?: string;
  created_by?: string;
  employee_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePartyData {
  name: string;
  party_code?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  shop_no?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  branch_id?: string;
  employee_id?: string;
}

export interface UpdatePartyData {
  name?: string;
  party_code?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  shop_no?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  branch_id?: string;
  employee_id?: string;
  is_active?: boolean;
}

// Supplier types
export interface Supplier {
  id: string;
  name: string;
  supplier_code?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  shop_no?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  is_active: boolean;
  branch_id?: string;
  created_by?: string;
  employee_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSupplierData {
  name: string;
  supplier_code?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  shop_no?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  branch_id?: string;
  employee_id?: string;
}

export interface UpdateSupplierData {
  name?: string;
  supplier_code?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  shop_no?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  branch_id?: string;
  employee_id?: string;
  is_active?: boolean;
}

// Allowances
export type AllowanceItemType = 'product' | 'money' | 'gift' | 'other';

export interface EmployeeAllowance {
  id: string;
  employee_id: string;
  branch_id?: string;
  allowance_date: string; // ISO date
  total_value: number;
  note?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeAllowanceItem {
  id: string;
  allowance_id: string;
  item_type: AllowanceItemType;
  product_id?: string | null;
  description?: string;
  quantity: number;
  unit_value: number;
  total_value: number;
}