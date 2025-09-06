# Products System Documentation

## Overview

The Products System is a comprehensive solution for managing pharmaceutical and nutraceutical products in the Wellmart ERP system. It includes product management, categorization, company management, and inventory tracking.

## Database Schema

### Products Table

The `products` table contains all product information with the following structure:

```sql
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
```

### Categories Table

```sql
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
```

### Companies Table

```sql
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
```

## Key Features

### 1. Product Management
- **Complete Product Information**: Name, generic name, dosage form, pack size, SKU
- **Pricing**: Regular price, offer price, purchase price
- **Inventory**: Stock tracking with low stock alerts
- **Media**: Multiple image URLs, video support
- **Marketing**: Featured products, flash sales, keywords for SEO
- **Variants**: JSONB field for product variations (size, color, etc.)
- **Sub-products**: Support for product bundles and related items

### 2. Categorization System
- **Hierarchical Categories**: Parent-child relationships
- **Sort Order**: Custom ordering within categories
- **Active/Inactive**: Category status management
- **SEO Friendly**: Slug-based URLs

### 3. Company Management
- **Supplier Information**: Complete company details
- **Contact Information**: Email, phone, address
- **Branding**: Logo and website support
- **Status Management**: Active/inactive companies

### 4. Security & Access Control
- **Row Level Security (RLS)**: Enabled on all tables
- **Role-based Access**:
  - **Public**: Can view active products, categories, and companies
  - **Admin**: Full CRUD access to all entities
  - **Branch**: Can view products and manage branch-specific inventory

## API Services

### ProductService Class

Located in `lib/productService.ts`, provides comprehensive product management:

#### Product Operations
- `getAllProducts()`: Fetch all active products with category and company details
- `getProductById(id)`: Get specific product by ID
- `getProductBySlug(slug)`: Get product by URL slug
- `getFeaturedProducts()`: Get all featured products
- `getFlashSaleProducts()`: Get all flash sale products
- `getProductsByCategory(categoryId)`: Get products by category
- `searchProducts(query)`: Search products by name, description, or generic name
- `createProduct(productData)`: Create new product (Admin only)
- `updateProduct(id, productData)`: Update existing product (Admin only)
- `deleteProduct(id)`: Soft delete product (Admin only)

#### Category Operations
- `getAllCategories()`: Fetch all active categories
- `getCategoryById(id)`: Get specific category
- `createCategory(categoryData)`: Create new category (Admin only)
- `updateCategory(id, categoryData)`: Update existing category (Admin only)

#### Company Operations
- `getAllCompanies()`: Fetch all active companies
- `getCompanyById(id)`: Get specific company
- `createCompany(companyData)`: Create new company (Admin only)
- `updateCompany(id, companyData)`: Update existing company (Admin only)

#### Utility Functions
- `generateSlug(name)`: Generate URL-friendly slug from product name
- `calculateDiscountPercentage(regularPrice, offerPrice)`: Calculate discount percentage
- `formatPrice(price)`: Format price as currency

## User Interface

### Admin Product Management
- **Location**: `/admin/products`
- **Access**: Admin role only
- **Features**:
  - Complete product listing with search and filters
  - Create new products with full form
  - Edit existing products
  - Delete products (soft delete)
  - View product details with images
  - Stock level indicators
  - Price and discount display

### Inventory Management
- **Location**: `/inventory`
- **Access**: All authenticated users
- **Features**:
  - Real-time product listing from database
  - Stock level monitoring
  - Low stock alerts
  - Category and company information
  - Price display with offers
  - Product images and details

## Sample Data

The system includes sample data for testing:

### Categories
- Vitamins & Supplements
- Protein & Fitness
- Health & Wellness
- Beauty & Skincare
- Baby & Kids

### Companies
- Wellcare Nutriscience
- NutriLife
- ProteinPlus
- HealthFirst

### Sample Products
- Vitamin D3 1000IU (Featured)
- Whey Protein 2kg (Featured)
- Omega-3 Fish Oil

## Database Indexes

Optimized for performance with indexes on:
- Product slug, SKU, category, company
- Active status, featured status, flash sale
- Price and stock for filtering
- Created date for sorting

## Security Features

### Row Level Security Policies
1. **Public Access**: Can view active products, categories, and companies
2. **Admin Access**: Full CRUD operations on all entities
3. **Branch Access**: Can view products and manage inventory

### Data Validation
- Required fields validation
- Unique constraints on slugs and SKUs
- Foreign key relationships
- Data type validation

## Usage Examples

### Creating a New Product
```typescript
const newProduct = await ProductService.createProduct({
  name: 'Vitamin C 1000mg',
  slug: 'vitamin-c-1000mg',
  sku: 'VIT-C-1000',
  price_regular: 12.99,
  stock: 500,
  description: 'High-quality Vitamin C supplement',
  category_id: 'category-uuid',
  company_id: 'company-uuid',
  keywords: ['vitamin c', 'immune support', 'antioxidant']
});
```

### Fetching Featured Products
```typescript
const featuredProducts = await ProductService.getFeaturedProducts();
```

### Searching Products
```typescript
const searchResults = await ProductService.searchProducts('vitamin');
```

## Future Enhancements

1. **Bulk Operations**: Import/export products
2. **Advanced Filtering**: Price range, stock level, date filters
3. **Product Reviews**: Customer feedback system
4. **Inventory Alerts**: Automated low stock notifications
5. **Product Analytics**: Sales tracking and reporting
6. **Multi-language Support**: Internationalization
7. **Product Bundles**: Advanced bundle management
8. **Barcode Integration**: SKU scanning support

## Setup Instructions

1. **Database Setup**: Run the SQL schema in `database/schema.sql`
2. **Environment Variables**: Ensure Supabase credentials are configured
3. **Dependencies**: All required packages are included in `package.json`
4. **Access**: Use admin credentials to access product management features

## Troubleshooting

### Common Issues
1. **Permission Denied**: Ensure user has admin role for product management
2. **Missing Data**: Check if categories and companies exist before creating products
3. **Slug Conflicts**: Ensure unique slugs for products and categories
4. **Image Loading**: Verify image URLs are accessible and properly formatted

### Performance Optimization
1. **Database Indexes**: All necessary indexes are created
2. **Lazy Loading**: Images and large data are loaded on demand
3. **Caching**: Consider implementing Redis for frequently accessed data
4. **Pagination**: Implement for large product catalogs

This products system provides a solid foundation for managing pharmaceutical and nutraceutical products with room for future enhancements and scaling.
