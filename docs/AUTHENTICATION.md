# Authentication Setup

This ERP system uses Supabase for authentication with email and password.

## Environment Variables

Make sure you have the following environment variables in your `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Authentication Flow

1. **Login Page**: Located at `/login` - allows users to sign in or sign up
2. **Protected Routes**: All main ERP pages are protected and require authentication
3. **Automatic Redirects**: Unauthenticated users are redirected to the login page
4. **Session Management**: User sessions are managed automatically by Supabase

## Features

- ✅ Email/Password Authentication
- ✅ User Registration
- ✅ Protected Routes
- ✅ Automatic Session Management
- ✅ Sign Out Functionality
- ✅ User Profile Display in Navigation

## Usage

1. Navigate to `/login` to access the authentication page
2. Sign up with a new account or sign in with existing credentials
3. Upon successful authentication, you'll be redirected to the dashboard
4. All ERP modules (Inventory, Sales, Purchases, etc.) are now accessible
5. Use the sign out button in the navigation to log out

## Supabase Setup

Make sure your Supabase project has:
- Authentication enabled
- Email confirmation settings configured (optional)
- Row Level Security (RLS) policies set up for your tables (if using database features)

## Security Notes

- All authentication is handled server-side by Supabase
- JWT tokens are managed automatically
- User sessions persist across browser refreshes
- Protected routes prevent unauthorized access
