import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ tasks: [] });

    const body = await req.json().catch(() => ({}));
    
    // Use passed family_group_id if provided, otherwise resolve from user
    let familyGroupId = body.family_group_id || user.family_group_id || null;

    // If still no family_group_id, try to resolve it
    if (!familyGroupId) {
      // Check if user owns a group
      const allGroups = await base44.asServiceRole.entities.FamilyGroup.list();
      const ownedGroup = allGroups.find(g => g.owner_email === user.email);
      if (ownedGroup) {
        familyGroupId = ownedGroup.id;
      } else {
        // Check if user is linked as a family member
        const allMembers = await base44.asServiceRole.entities.FamilyMember.list('-created_date', 500);
        const match = allMembers.find(m => m.linked_user_email?.toLowerCase() === user.email?.toLowerCase());
        if (match?.family_group_id) familyGroupId = match.family_group_id;
      }
    }

    let tasks;
    if (familyGroupId) {
      // Family user — fetch all tasks for the family group using service role
      tasks = await base44.asServiceRole.entities.Task.filter(
        { family_group_id: familyGroupId },
        '-created_date',
        5000
      );
    } else {
      // Solo user — return tasks created by them
      tasks = await base44.asServiceRole.entities.Task.filter(
        { created_by: user.email },
        '-created_date',
        5000
      );
    }

    return Response.json({ tasks: tasks || [] });
  } catch (error) {
    console.error('[getFamilyTasks] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});