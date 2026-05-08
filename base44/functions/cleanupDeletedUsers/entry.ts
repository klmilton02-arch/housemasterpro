import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get all users
    const allUsers = await base44.asServiceRole.entities.User.list();
    const userEmails = new Set(allUsers.map(u => u.email));

    // Get all family members and check if linked users still exist
    const familyMembers = await base44.asServiceRole.entities.FamilyMember.list();
    let cleaned = 0;

    for (const member of familyMembers) {
      if (member.linked_user_email && !userEmails.has(member.linked_user_email)) {
        // User was deleted - unlink the family member
        await base44.asServiceRole.entities.FamilyMember.update(member.id, {
          linked_user_id: null,
          linked_user_email: null,
        });
        cleaned++;
      }
    }

    return Response.json({ success: true, cleaned_members: cleaned });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});