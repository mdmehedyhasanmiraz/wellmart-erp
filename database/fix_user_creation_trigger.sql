-- Fix for user creation trigger to handle all user metadata fields
-- This should be run in Supabase SQL Editor

-- Drop and recreate the trigger function with improved error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_branch_id UUID;
    v_is_active BOOLEAN;
    v_phone TEXT;
BEGIN
    -- Extract values from metadata, handling NULL and empty strings
    v_branch_id := NULLIF(NEW.raw_user_meta_data->>'branch_id', '');
    v_is_active := COALESCE(
        (NEW.raw_user_meta_data->>'is_active')::BOOLEAN,
        true
    );
    v_phone := NULLIF(NEW.raw_user_meta_data->>'phone', '');
    
    -- Insert user with all metadata fields
    INSERT INTO public.users (
        id, 
        email, 
        name, 
        role, 
        branch_id,
        is_active,
        phone,
        created_at, 
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'employee'),
        v_branch_id,
        v_is_active,
        v_phone,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        branch_id = EXCLUDED.branch_id,
        is_active = EXCLUDED.is_active,
        phone = EXCLUDED.phone,
        updated_at = NOW();
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error (this will appear in Supabase logs)
        RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
        -- Re-raise the error so it can be caught by the API
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the trigger exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
    ) THEN
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    END IF;
END $$;
