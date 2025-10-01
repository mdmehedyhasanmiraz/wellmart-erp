// Environment check utility
export const checkEnvironment = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('Environment Check:');
  console.log('- Supabase URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.log('- Supabase Anon Key:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
  
  if (supabaseUrl) {
    console.log('- URL format:', supabaseUrl.startsWith('https://') ? '✅ Valid' : '❌ Invalid');
  }
  
  return {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    urlValid: supabaseUrl?.startsWith('https://') || false
  };
};
