import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Auth client for user verification
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(
        JSON.stringify({ error: 'No authorization provided' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    let userId: string | null = null;
    let userEmail: string | null = null;

    try {
      const { data: { user }, error: authError } = await authClient.auth.getUser(token);
      if (user) {
        userId = user.id;
        userEmail = user.email ?? null;
      } else if (authError) {
        console.warn('auth.getUser failed, falling back to JWT decode:', authError.message);
      }
    } catch (e) {
      console.warn('auth.getUser threw, falling back to JWT decode:', e);
    }

    if (!userId) {
      try {
        const base64 = token.split('.')[1];
        const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
        const payload = JSON.parse(json);
        userId = payload.sub || payload.user_id || null;
        userEmail = payload.email || null;
      } catch (e) {
        console.error('JWT decode failed:', e);
      }
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { messages } = await req.json();

    // Service role client for internal queries (bypasses RLS)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    // Get user role from user_roles table
    const { data: userRole, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (roleError || !userRole) {
      console.error('Role fetch error:', roleError);
      throw new Error('User role not found');
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('name')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError);
      throw new Error('Profile not found');
    }

    // Fetch role-specific context
    let contextData = '';
    
    if (userRole.role === 'TEACHER') {
      const { data: bookings } = await supabaseClient
        .from('bookings')
        .select('*, rooms(room_no, building)')
        .eq('teacher_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: attendance } = await supabaseClient
        .from('attendance')
        .select('*, rooms(room_no)')
        .eq('teacher_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: issues } = await supabaseClient
        .from('issue_reports')
        .select('*, rooms(room_no)')
        .eq('teacher_id', userId)
        .order('created_at', { ascending: false })
        .limit(3);

      contextData = `
USER CONTEXT:
- Role: Teacher
- Name: ${profile.name}

RECENT BOOKINGS (${bookings?.length || 0}):
${bookings?.map(b => `- ${b.rooms?.room_no} on ${b.date}, slot ${b.slot}, status: ${b.status}`).join('\n') || 'No recent bookings'}

RECENT ATTENDANCE (${attendance?.length || 0}):
${attendance?.map(a => `- ${a.rooms?.room_no} on ${a.date}, ${a.present}/${a.total} present`).join('\n') || 'No recent attendance'}

OPEN ISSUES (${issues?.filter(i => i.status !== 'CLOSED').length || 0}):
${issues?.filter(i => i.status !== 'CLOSED').map(i => `- ${i.rooms?.room_no}: ${i.message} (${i.status})`).join('\n') || 'No open issues'}
`;
    } else if (userRole.role === 'SPOC') {
      const { data: pendingBookings } = await supabaseClient
        .from('bookings')
        .select('*, rooms(room_no), profiles(name)')
        .eq('status', 'PENDING')
        .limit(5);

      const { data: openIssues } = await supabaseClient
        .from('issue_reports')
        .select('*, rooms(room_no), profiles(name)')
        .in('status', ['OPEN', 'IN_PROGRESS'])
        .limit(5);

      const { data: rooms } = await supabaseClient
        .from('rooms')
        .select('room_no, type, is_active')
        .eq('is_active', false);

      contextData = `
USER CONTEXT:
- Role: SPOC
- Name: ${profile.name}

PENDING BOOKINGS (${pendingBookings?.length || 0}):
${pendingBookings?.map(b => `- ${b.profiles?.name} requested ${b.rooms?.room_no} on ${b.date}, slot ${b.slot}`).join('\n') || 'No pending bookings'}

OPEN ISSUES (${openIssues?.length || 0}):
${openIssues?.map(i => `- ${i.profiles?.name} reported issue in ${i.rooms?.room_no}: ${i.message} (${i.status})`).join('\n') || 'No open issues'}

INACTIVE ROOMS (${rooms?.length || 0}):
${rooms?.map(r => `- ${r.room_no} (${r.type})`).join('\n') || 'All rooms active'}
`;
    } else if (userRole.role === 'ADMIN') {
      const { data: recentNotices } = await supabaseClient
        .from('notices')
        .select('title, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      const { data: pendingFeedback } = await supabaseClient
        .from('student_feedback')
        .select('category, status')
        .eq('status', 'pending')
        .limit(5);

      const { count: totalRooms } = await supabaseClient
        .from('rooms')
        .select('*', { count: 'exact', head: true });

      const { count: activeBookings } = await supabaseClient
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'APPROVED');

      contextData = `
USER CONTEXT:
- Role: Admin
- Name: ${profile.name}

SYSTEM STATS:
- Total Rooms: ${totalRooms || 0}
- Active Bookings: ${activeBookings || 0}
- Pending Feedback: ${pendingFeedback?.length || 0}

RECENT NOTICES (${recentNotices?.length || 0}):
${recentNotices?.map(n => `- ${n.title} (${new Date(n.created_at).toLocaleDateString()})`).join('\n') || 'No recent notices'}

PENDING FEEDBACK:
${pendingFeedback?.map(f => `- ${f.category} feedback`).join('\n') || 'No pending feedback'}
`;
    } else if (userRole.role === 'STUDENT') {
      const { data: feedback } = await supabaseClient
        .from('student_feedback')
        .select('category, status, created_at, response_message')
        .eq('student_id', userId)
        .order('created_at', { ascending: false })
        .limit(3);

      const { data: notices } = await supabaseClient
        .from('notices')
        .select('title, description, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      contextData = `
USER CONTEXT:
- Role: Student
- Name: ${profile.name}

YOUR FEEDBACK (${feedback?.length || 0}):
${feedback?.map(f => `- ${f.category}: ${f.status}${f.response_message ? ' (Responded)' : ''}`).join('\n') || 'No feedback submitted'}

RECENT NOTICES (${notices?.length || 0}):
${notices?.map(n => `- ${n.title}`).join('\n') || 'No recent notices'}
`;
    }

    const systemPrompt = `You are a helpful AI assistant for the SOET Smart Classroom Management System. 

${contextData}

Your role is to:
1. Answer questions about how to use the system
2. Provide guidance based on the user's role (${userRole.role})
3. Help with common tasks and workflows
4. Explain system features and policies
5. Provide insights based on their data shown above

Be concise, friendly, and helpful. Always consider their role when providing guidance.
If they ask about their data, reference the context provided above.
Keep responses clear and actionable.`;

    console.log('Calling Lovable AI...');

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI service requires additional credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
