import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function setAdminRole() {
  const userId = '33b59934-f052-46a6-a110-f18f58547a1c';
  
  console.log('Setting admin role for user:', userId);
  
  // First delete any existing role
  const { error: deleteError } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId);
  
  if (deleteError) {
    console.log('Delete error (may be ok):', deleteError.message);
  }
  
  // Then insert admin role
  const { error: insertError } = await supabase
    .from('user_roles')
    .insert({ user_id: userId, role: 'admin' });
  
  if (insertError) {
    console.log('Insert error:', insertError.message);
  } else {
    console.log('✓ Admin role assigned successfully!');
  }
  
  // Verify
  const { data } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', userId);
  
  console.log('Current role:', data);
}

setAdminRole();
