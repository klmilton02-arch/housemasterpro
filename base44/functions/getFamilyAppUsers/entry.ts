import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ users: [] });

    const body = await req.json().catch(() => ({}));

    // Use passed family_group_id if provided, otherwise resolve from token
    let familyGroupId = body.family_group_id || user.family_group_id || null;

    if (!familyGroupId) {
      const allGroups = await base44.asServiceRole.entities.FamilyGroup.list();
      const ownedGroup = allGroups.find(g => g.owner_email === user.email);
      if (ownedGroup) familyGroupId = ownedGroup.id;
    }

    if (!familyGroupId) return Response.json({ users: [user] });

    const allUsers = await base44.asServiceRole.entities.User.list('-created_date', 500);
    const familyUsers = allUsers.filter(u => u.family_group_id === familyGroupId);

    return Response.json({ users: familyUsers.length ? familyUsers : [user] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});