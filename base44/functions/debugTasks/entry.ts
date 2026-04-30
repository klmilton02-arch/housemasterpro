import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { targetEmail } = await req.json();

    // Get the target user
    const allUsers = await base44.asServiceRole.entities.User.list();
    const targetUser = allUsers.find(u => u.email === targetEmail);
    if (!targetUser) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all tasks and show what's there
    const allTasks = await base44.asServiceRole.entities.Task.list();
    
    // Group by criteria
    const byFamily = allTasks.filter(t => t.family_group_id === targetUser.family_group_id);
    const byCreatedBy = allTasks.filter(t => t.created_by === targetEmail);
    const byPending = allTasks.filter(t => t.status === 'Pending');

    return Response.json({
      targetUserEmail: targetEmail,
      targetUserFamilyGroupId: targetUser.family_group_id,
      totalTasks: allTasks.length,
      byFamily: byFamily.length,
      byCreatedBy: byCreatedBy.length,
      byPending: byPending.length,
      sample: allTasks.slice(0, 3).map(t => ({
        id: t.id,
        name: t.name,
        family_group_id: t.family_group_id,
        created_by: t.created_by,
        status: t.status
      }))
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});