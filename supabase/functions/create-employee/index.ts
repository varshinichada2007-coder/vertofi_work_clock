// Supabase Edge Function: create-employee
// Deno runtime environment for server-side employee creation with Admin authorization and rollback

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

interface CreateEmployeePayload {
  name: string;
  email: string;
  password?: string;
  employeeId?: string;
  department?: string;
  designation?: string;
  employeeType?: 'Employee' | 'Intern';
  joiningDate?: string;
  workLocation?: string;
  phone?: string;
  profileImage?: string;
  managerName?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(JSON.stringify({ error: 'Server configuration error: missing Supabase environment variables' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 1. Verify Caller JWT and confirm role is ADMIN
    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user: callerUser }, error: callerError } = await callerClient.auth.getUser();
    if (callerError || !callerUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid or expired session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Initialize Admin Service Client (Never exposed to client)
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Check caller's role in public.profiles
    const { data: callerProfile, error: profileCheckError } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', callerUser.id)
      .single();

    if (profileCheckError || !callerProfile || callerProfile.role !== 'ADMIN') {
      return new Response(JSON.stringify({ error: 'Forbidden: Only the System Administrator can create employees' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 2. Parse and validate input fields
    const body: CreateEmployeePayload = await req.json();
    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password || 'password123';
    const department = body.department?.trim() || 'Engineering';
    const designation = body.designation?.trim() || 'Software Engineer';
    const employeeType = body.employeeType === 'Intern' ? 'Intern' : 'Employee';
    const joiningDate = body.joiningDate || new Date().toISOString().split('T')[0];
    const workLocation = body.workLocation?.trim() || 'Work From Home';
    const phone = body.phone?.trim() || '+91 98765 43210';
    const profileImage = body.profileImage?.trim() || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'Employee')}&backgroundColor=0c8ee9,0270c7`;

    if (!name || name.length < 2) {
      return new Response(JSON.stringify({ error: 'Full name must be at least 2 characters long' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'A valid work email address is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (password.length < 6) {
      return new Response(JSON.stringify({ error: 'Password must be at least 6 characters long' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate or format Employee ID
    let employeeId = body.employeeId?.trim();
    if (!employeeId) {
      const { count } = await adminClient.from('profiles').select('*', { count: 'exact', head: true });
      const nextNum = (count || 0) + 1;
      employeeId = `EMP${String(nextNum).padStart(3, '0')}`;
    }

    // 3. Create Supabase Auth User
    const { data: createdAuthUser, error: authCreateError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        employee_id: employeeId,
        role: 'EMPLOYEE'
      }
    });

    if (authCreateError || !createdAuthUser.user) {
      return new Response(JSON.stringify({ error: authCreateError?.message || 'Failed to create user authentication account' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const newUserId = createdAuthUser.user.id;

    // 4. Insert into public.profiles
    const profileInsertData = {
      id: newUserId,
      name,
      email,
      employee_id: employeeId,
      department,
      designation,
      role: 'EMPLOYEE',
      employee_type: employeeType,
      joining_date: joiningDate,
      profile_image: profileImage,
      work_location: workLocation,
      phone,
      manager_name: body.managerName?.trim() || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: profileInsertError } = await adminClient
      .from('profiles')
      .insert([profileInsertData]);

    if (profileInsertError) {
      // 5. ROLLBACK: Delete newly created Auth user if profile insertion failed
      console.error('Profile insert failed, rolling back auth user:', profileInsertError);
      await adminClient.auth.admin.deleteUser(newUserId);

      return new Response(JSON.stringify({
        error: `Failed to create employee profile: ${profileInsertError.message}. Auth account creation was rolled back.`
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Also initialize default user settings for the new employee
    await adminClient.from('user_settings').insert([{
      user_id: newUserId,
      clock_in_reminder: true,
      clock_in_time: '09:00',
      clock_out_reminder: true,
      clock_out_time: '18:00',
      break_duration_warning: true,
      max_break_minutes: 60,
      activity_check_in: true,
      activity_interval_minutes: 120,
      use_24_hour_clock: false,
      timezone: 'Asia/Kolkata',
      email_notifications: true
    }]);

    // 6. Return sanitized response (NEVER return password)
    const sanitizedResponse = {
      id: newUserId,
      name,
      email,
      employeeId,
      department,
      designation,
      role: 'EMPLOYEE',
      employeeType,
      joiningDate,
      profileImage,
      workLocation,
      phone,
      createdAt: profileInsertData.created_at
    };

    return new Response(JSON.stringify({
      success: true,
      message: `Employee ${name} (${employeeId}) created successfully.`,
      user: sanitizedResponse
    }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    console.error('Unexpected error in create-employee function:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
