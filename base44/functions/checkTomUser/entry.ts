import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const allUsers = await base44.asServiceRole.entities.User.list('-created_date', 500);
    
    return Response.json({ 
      total: allUsers.length,
      emails: allUsers.map(u => ({ email: u.email, id: u.id, family_group_id: u.family_group_id }))
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});