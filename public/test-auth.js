// Simple test to verify authentication and database connection
import { supabase } from '@/lib/supabase';

window.testAuth = async function() {
  console.log('=== AUTHENTICATION TEST ===');
  
  // Test 1: Check getUser
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  console.log('getUser result:', user ? 'USER EXISTS' : 'NO USER');
  console.log('User ID:', user?.id);
  console.log('User email:', user?.email);
  console.log('User error:', userError);
  
  // Test 2: Check getSession
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  console.log('getSession result:', session ? 'SESSION EXISTS' : 'NO SESSION');
  console.log('Session user ID:', session?.user?.id);
  console.log('Session error:', sessionError);
  
  // Test 3: Try to query categories table
  if (user) {
    console.log('Testing categories table access...');
    const { data, error } = await supabase
      .from('categories')
      .select('id, name')
      .eq('user_id', user.id)
      .limit(5);
    
    console.log('Categories query result:', data);
    console.log('Categories query error:', error);
  }
  
  console.log('=== TEST COMPLETE ===');
};

console.log('Auth test function loaded. Run window.testAuth() in console to test.');

export {};
