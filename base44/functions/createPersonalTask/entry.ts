import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, priority, description, assigned_to, assigned_to_name, start_date, next_due_date } = body;

    console.log('[createPersonalTask] user:', user.email, 'family_group_id:', user.family_group_id, 'task name:', name);

    // Resolve family_group_id server-side (bypasses stale frontend token)
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
    console.log('[createPersonalTask] resolved familyGroupId:', familyGroupId);

    // Use asServiceRole so RLS create check doesn't block users with stale/missing family_group_id.
    // Store personal_owner_email so getFamilyTasks can correctly identify the owner.
    const task = await base44.asServiceRole.entities.Task.create({
      name,
      category: 'Personal',
      priority: priority || 'Medium',
      difficulty: 'Easy',
      frequency_days: 9999,
      description: description || undefined,
      assigned_to: assigned_to || undefined,
      assigned_to_name: assigned_to_name || undefined,
      start_date: start_date || new Date().toISOString().split('T')[0],
      next_due_date: next_due_date || new Date().toISOString().split('T')[0],
      status: 'Pending',
      overdue_grace_days: 999,
      family_group_id: familyGroupId || undefined,
      personal_owner_email: user.email,
    });

    console.log('[createPersonalTask] created task:', task.id, 'for', user.email, 'family_group_id:', familyGroupId);
    return Response.json({ task });
  } catch (error) {
    console.error('[createPersonalTask] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});