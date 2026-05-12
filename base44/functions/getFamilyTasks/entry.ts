import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      console.log('[getFamilyTasks] no user');
      return Response.json({ tasks: [] });
    }

    const body = await req.json().catch(() => ({}));
    
    // Use passed family_group_id if provided, otherwise resolve from user
    let familyGroupId = body.family_group_id || user.family_group_id || null;
    console.log('[getFamilyTasks] user.email:', user.email, 'body.family_group_id:', body.family_group_id, 'user.family_group_id:', user.family_group_id);

    // If still no family_group_id, try to resolve it
    if (!familyGroupId) {
      // Check if user owns a group
      const allGroups = await base44.asServiceRole.entities.FamilyGroup.list();
      const ownedGroup = allGroups.find(g => g.owner_email === user.email);
      if (ownedGroup) {
        familyGroupId = ownedGroup.id;
        console.log('[getFamilyTasks] resolved via owned group:', familyGroupId);
      } else {
        // Check if user is linked as a family member
        const allMembers = await base44.asServiceRole.entities.FamilyMember.list('-created_date', 500);
        const match = allMembers.find(m => m.linked_user_email?.toLowerCase() === user.email?.toLowerCase());
        if (match?.family_group_id) {
          familyGroupId = match.family_group_id;
          console.log('[getFamilyTasks] resolved via member link:', familyGroupId);
        }
      }
    }

    console.log('[getFamilyTasks] final familyGroupId:', familyGroupId);

    let tasks = [];
    
    // Use user-scoped list() which applies RLS automatically
    // RLS allows family members to see each other's tasks (except Personal which are private)
    tasks = await base44.entities.Task.list('-created_date', 5000);
    console.log('[getFamilyTasks]', user.email, 'loaded', tasks.length, 'tasks via RLS');

    return Response.json({ tasks });
  } catch (error) {
    console.error('[getFamilyTasks] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});