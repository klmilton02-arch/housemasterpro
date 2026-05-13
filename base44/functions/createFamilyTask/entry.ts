import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Resolve family_group_id server-side so stale frontend tokens don't break it
    let familyGroupId = user.family_group_id || null;
    if (!familyGroupId) {
      const allGroups = await base44.asServiceRole.entities.FamilyGroup.list();
      const ownedGroup = allGroups.find(g => g.owner_email === user.email);
      if (ownedGroup) {
        familyGroupId = ownedGroup.id;
      } else {
        const allMembers = await base44.asServiceRole.entities.FamilyMember.list('-created_date', 500);
        const match = allMembers.find(m => m.linked_user_email?.toLowerCase() === user.email?.toLowerCase());
        if (match?.family_group_id) familyGroupId = match.family_group_id;
      }
    }

    console.log('[createFamilyTask] user:', user.email, 'family_group_id:', familyGroupId, 'task:', body.name, 'category:', body.category);

    const task = await base44.asServiceRole.entities.Task.create({
      ...body,
      family_group_id: familyGroupId || undefined,
      created_by: user.email,
    });

    console.log('[createFamilyTask] created task:', task.id);
    return Response.json({ task });
  } catch (error) {
    console.error('[createFamilyTask] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});