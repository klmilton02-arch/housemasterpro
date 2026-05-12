import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    // Scarlett's data
    const allUsers = await base44.asServiceRole.entities.User.list();
    const scarlett = allUsers.find(u => u.email === 'kellymilton02@gmail.com');
    
    if (!scarlett) {
      return Response.json({ error: 'Scarlett not found' });
    }

    const fgId = scarlett.family_group_id;
    const members = await base44.asServiceRole.entities.FamilyMember.list();
    const familyMembers = members.filter(m => m.family_group_id === fgId);
    
    const users = await base44.asServiceRole.entities.User.list();
    const familyUsers = users.filter(u => u.family_group_id === fgId);

    return Response.json({
      scarlett,
      familyGroupId: fgId,
      familyMembersCount: familyMembers.length,
      familyMembers: familyMembers.map(m => ({ id: m.id, name: m.name, linked_user_email: m.linked_user_email })),
      familyUsersCount: familyUsers.length,
      familyUsers: familyUsers.map(u => ({ id: u.id, email: u.email, full_name: u.full_name }))
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});