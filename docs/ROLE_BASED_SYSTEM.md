# Role-Based Authentication System

This document describes the complete role-based authentication system implemented for Wellmart ERP.

## Database Schema

### Users Table
The `users` table syncs with Supabase `auth.users` and includes:

- `id` - UUID (references auth.users)
- `name` - User's full name
- `email` - User's email address
- `phone` - Contact phone number
- `role` - User role (admin, branch, mpo)
- `branch_id` - Reference to assigned branch
- `is_active` - Account status
- `last_login` - Last login timestamp
- `created_at` / `updated_at` - Audit timestamps

### Branches Table
- `id` - UUID primary key
- `name` - Branch name
- `code` - Unique branch code
- `address` - Branch address
- `phone` / `email` - Contact information
- `manager_id` - Reference to branch manager
- `is_active` - Branch status

## User Roles

### 1. Admin (👑)
**Access Level**: Full system access
**Dashboard**: `/admin/dashboard`
**Login Page**: `/admin/login`
**Permissions**:
- View all users
- Create/update/delete users
- Manage branches
- View all reports
- Manage inventory, sales, purchases
- Manage customers and suppliers
- System settings

### 2. Branch Manager (🏢)
**Access Level**: Branch-specific access
**Dashboard**: `/branch/dashboard`
**Login Page**: `/branch/login`
**Permissions**:
- View branch users
- View branch reports
- Manage branch inventory
- Manage branch sales
- View branch customers
- View branch suppliers

### 3. MPO - Medical Promotion Officer (👤)
**Access Level**: Field sales access
**Dashboard**: `/mpo/dashboard`
**Login Page**: `/mpo/login`
**Permissions**:
- View own profile
- View assigned customers
- Create sales orders
- View sales reports

## Authentication Flow

### 1. Login Process
1. User visits role-specific login page
2. Enters email and password (sign-up is disabled)
3. System authenticates with Supabase
4. User profile is fetched from database
5. Role-based redirection occurs

**Note**: User registration is disabled. Only admins and branch managers can create new users.

### 2. Role-Based Redirection
- **Admin**: `/admin/dashboard`
- **Branch**: `/branch/dashboard`
- **MPO**: `/mpo/dashboard`

### 3. Protected Routes
- All dashboards use `RoleProtectedRoute` component
- Unauthorized access redirects to appropriate dashboard
- Loading states handled gracefully

## File Structure

```
app/
├── (auth)/
│   ├── login/page.tsx              # General login
│   ├── admin/login/page.tsx        # Admin login
│   ├── branch/login/page.tsx       # Branch login
│   └── mpo/login/page.tsx          # MPO login
├── admin/
│   ├── dashboard/page.tsx          # Admin dashboard
│   └── users/page.tsx              # User management
├── branch/
│   └── dashboard/page.tsx          # Branch dashboard
├── mpo/
│   └── dashboard/page.tsx          # MPO dashboard
components/
├── ProtectedRoute.tsx              # Basic auth protection
└── RoleProtectedRoute.tsx          # Role-based protection
contexts/
└── AuthContext.tsx                 # Enhanced auth context
lib/
├── supabase.ts                     # Supabase client
└── userService.ts                  # User management service
types/
└── user.ts                         # TypeScript types
database/
└── schema.sql                      # Database schema
```

## Key Features

### 1. Automatic User Sync
- New auth users automatically create profile records
- Trigger-based synchronization
- Metadata handling for role assignment

### 2. Row Level Security (RLS)
- Database-level access control
- Role-based data filtering
- Secure multi-tenant architecture

### 3. Role-Based UI
- Different dashboards for each role
- Role-specific navigation
- Permission-based feature access

### 4. User Management
- **Admin only**: Create/manage users and passwords
- **Branch managers**: Can create MPO users for their branch
- Branch assignment
- Account activation/deactivation
- Audit trail
- **No public registration**: All user creation is admin-controlled

## Setup Instructions

### 1. Database Setup
Run the SQL schema in your Supabase project:
```sql
-- Execute database/schema.sql
```

### 2. Environment Variables
Ensure your `.env.local` has:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Supabase Configuration
- Enable Row Level Security
- Configure authentication settings
- Set up email templates (optional)

## Usage Examples

### Creating a New User (Admin)
```typescript
const newUser = await UserService.createUser({
  name: 'John Doe',
  email: 'john@wellcare.com',
  phone: '+1-555-0123',
  role: 'mpo',
  branch_id: 'branch-uuid'
});
```

### Checking User Permissions
```typescript
const hasPermission = userProfile?.permissions.includes('view_all_users');
```

### Role-Based Navigation
```typescript
const dashboardRoute = UserService.getDashboardRoute(userProfile.role);
```

## Security Considerations

1. **Database Security**
   - RLS policies prevent unauthorized data access
   - Service role key for admin operations only
   - Audit trails for all user actions

2. **Frontend Security**
   - Role-based route protection
   - Permission-based UI rendering
   - Secure token handling

3. **Authentication Security**
   - Supabase handles JWT tokens
   - Automatic session management
   - Secure password policies

## Future Enhancements

1. **Advanced Permissions**
   - Granular permission system
   - Custom role creation
   - Permission inheritance

2. **Audit Logging**
   - User action tracking
   - System event logging
   - Compliance reporting

3. **Multi-Factor Authentication**
   - SMS/Email verification
   - TOTP support
   - Hardware key support

4. **Branch Hierarchy**
   - Regional management
   - Territory assignments
   - Performance tracking
