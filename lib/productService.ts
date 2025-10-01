import { supabase } from './supabase';
import { 
  Product, 
  ProductWithDetails, 
  CreateProductData, 
  UpdateProductData,
  Category,
  CreateCategoryData,
  UpdateCategoryData,
  Company,
  CreateCompanyData,
  UpdateCompanyData,
  ProductBatch,
  CreateProductBatchData,
  UpdateProductBatchData
} from '@/types/user';

export class ProductService {
  // Product operations
  static async getAllProducts(): Promise<ProductWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            id,
            name,
            slug,
            description
          ),
          companies (
            id,
            name,
            slug,
            logo_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
        return [];
      }

      return data.map(product => ({
        ...product,
        category: product.categories,
        company: product.companies
      }));
    } catch (error) {
      console.error('Error in getAllProducts:', error);
      return [];
    }
  }

  static async getProductById(id: string): Promise<ProductWithDetails | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            id,
            name,
            slug,
            description
          ),
          companies (
            id,
            name,
            slug,
            logo_url
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching product:', error);
        return null;
      }

      return {
        ...data,
        category: data.categories,
        company: data.companies
      };
    } catch (error) {
      console.error('Error in getProductById:', error);
      return null;
    }
  }

  static async getProductBySlug(slug: string): Promise<ProductWithDetails | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            id,
            name,
            slug,
            description
          ),
          companies (
            id,
            name,
            slug,
            logo_url
          )
        `)
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching product by slug:', error);
        return null;
      }

      return {
        ...data,
        category: data.categories,
        company: data.companies
      };
    } catch (error) {
      console.error('Error in getProductBySlug:', error);
      return null;
    }
  }

  static async getFeaturedProducts(): Promise<ProductWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            id,
            name,
            slug,
            description
          ),
          companies (
            id,
            name,
            slug,
            logo_url
          )
        `)
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching featured products:', error);
        return [];
      }

      return data.map(product => ({
        ...product,
        category: product.categories,
        company: product.companies
      }));
    } catch (error) {
      console.error('Error in getFeaturedProducts:', error);
      return [];
    }
  }

  static async getFlashSaleProducts(): Promise<ProductWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            id,
            name,
            slug,
            description
          ),
          companies (
            id,
            name,
            slug,
            logo_url
          )
        `)
        .eq('is_active', true)
        .eq('flash_sale', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching flash sale products:', error);
        return [];
      }

      return data.map(product => ({
        ...product,
        category: product.categories,
        company: product.companies
      }));
    } catch (error) {
      console.error('Error in getFlashSaleProducts:', error);
      return [];
    }
  }

  static async getProductsByCategory(categoryId: string): Promise<ProductWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            id,
            name,
            slug,
            description
          ),
          companies (
            id,
            name,
            slug,
            logo_url
          )
        `)
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products by category:', error);
        return [];
      }

      return data.map(product => ({
        ...product,
        category: product.categories,
        company: product.companies
      }));
    } catch (error) {
      console.error('Error in getProductsByCategory:', error);
      return [];
    }
  }

  static async searchProducts(query: string): Promise<ProductWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            id,
            name,
            slug,
            description
          ),
          companies (
            id,
            name,
            slug,
            logo_url
          )
        `)
        .eq('is_active', true)
        .or(`name.ilike.%${query}%, description.ilike.%${query}%, generic_name.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error searching products:', error);
        return [];
      }

      return data.map(product => ({
        ...product,
        category: product.categories,
        company: product.companies
      }));
    } catch (error) {
      console.error('Error in searchProducts:', error);
      return [];
    }
  }

  static async createProduct(productData: CreateProductData): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          ...productData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating product:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in createProduct:', error);
      return null;
    }
  }

  static async updateProduct(id: string, productData: UpdateProductData): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .update({
          ...productData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating product:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in updateProduct:', error);
      return null;
    }
  }

  static async deleteProduct(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('Error deleting product:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteProduct:', error);
      return false;
    }
  }

  // =========================
  // Product Batches
  // =========================

  static async getBatchesByProduct(productId: string): Promise<ProductBatch[]> {
    try {
      const { data, error } = await supabase
        .from('product_batches')
        .select('*')
        .eq('product_id', productId)
        .order('added_at', { ascending: false });

      if (error) {
        console.error('Error fetching product batches:', error);
        return [];
      }
      return data ?? [];
    } catch (error) {
      console.error('Error in getBatchesByProduct:', error);
      return [];
    }
  }

  static async upsertBatch(batch: CreateProductBatchData & { id?: string }): Promise<ProductBatch | null> {
    try {
      const { data, error } = await supabase
        .from('product_batches')
        .upsert(batch, { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        console.error('Error upserting product batch:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error in upsertBatch:', error);
      return null;
    }
  }

  static async updateBatch(id: string, updates: UpdateProductBatchData): Promise<ProductBatch | null> {
    try {
      const { data, error } = await supabase
        .from('product_batches')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating product batch:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error in updateBatch:', error);
      return null;
    }
  }

  static async deleteBatch(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('product_batches')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting product batch:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error in deleteBatch:', error);
      return false;
    }
  }

  // Category operations
  static async getAllCategories(): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching categories:', error);
        return [];
      }

      return data;
    } catch (error) {
      console.error('Error in getAllCategories:', error);
      return [];
    }
  }

  static async getCategoryById(id: string): Promise<Category | null> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching category:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getCategoryById:', error);
      return null;
    }
  }

  static async createCategory(categoryData: CreateCategoryData): Promise<Category | null> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          ...categoryData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating category:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in createCategory:', error);
      return null;
    }
  }

  static async updateCategory(id: string, categoryData: UpdateCategoryData): Promise<Category | null> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .update({
          ...categoryData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating category:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in updateCategory:', error);
      return null;
    }
  }

  // Company operations
  static async getAllCompanies(): Promise<Company[]> {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching companies:', error);
        return [];
      }

      return data;
    } catch (error) {
      console.error('Error in getAllCompanies:', error);
      return [];
    }
  }

  static async getCompanyById(id: string): Promise<Company | null> {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching company:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getCompanyById:', error);
      return null;
    }
  }

  static async createCompany(companyData: CreateCompanyData): Promise<Company | null> {
    try {
      const { data, error } = await supabase
        .from('companies')
        .insert({
          ...companyData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating company:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in createCompany:', error);
      return null;
    }
  }

  static async updateCompany(id: string, companyData: UpdateCompanyData): Promise<Company | null> {
    try {
      const { data, error } = await supabase
        .from('companies')
        .update({
          ...companyData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating company:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in updateCompany:', error);
      return null;
    }
  }

  // Utility functions
  static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  static calculateDiscountPercentage(regularPrice: number, offerPrice: number): number {
    if (regularPrice <= 0 || offerPrice >= regularPrice) return 0;
    return Math.round(((regularPrice - offerPrice) / regularPrice) * 100);
  }

  static formatPrice(price: number | null | undefined): string {
    // Handle null, undefined, or invalid price values
    if (price === null || price === undefined || isNaN(price)) {
      return '৳0.00';
    }
    
    return `৳${price.toLocaleString('en-BD', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }
}
