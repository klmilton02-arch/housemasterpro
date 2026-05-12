import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const allMembers = await base44.asServiceRole.entities.FamilyMember.list('-created_date', 500);
    
    return Response.json({
      total: allMembers.length,
      members: allMembers.map(m => ({
        id: m.id,
        family_group_id: m.family_group_id,
        name: m.name,
        linked_user_email: m.linked_user_email
      }))
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});