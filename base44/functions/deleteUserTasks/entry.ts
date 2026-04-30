import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { targetEmail } = await req.json();

    // Get all users and find the target
    const allUsers = await base44.asServiceRole.entities.User.list();
    const targetUser = allUsers.find(u => u.email === targetEmail);
    if (!targetUser) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const familyGroupId = targetUser.family_group_id;
    if (!familyGroupId) {
      return Response.json({ error: 'User has no family group' }, { status: 400 });
    }

    // Delete all tasks in the family
    const tasks = await base44.asServiceRole.entities.Task.filter({ family_group_id: familyGroupId });
    
    // Delete calendar events first
    for (const task of tasks) {
      if (task.calendar_event_id) {
        try {
          await base44.functions.invoke('deleteCalendarEvent', { taskId: task.id });
        } catch (e) {
          console.error(`Failed to delete calendar event for task ${task.id}:`, e);
        }
      }
    }

    // Delete all tasks in parallel
    await Promise.all(tasks.map(task => base44.asServiceRole.entities.Task.delete(task.id)));

    return Response.json({ 
      success: true, 
      message: `Deleted ${tasks.length} tasks for ${targetEmail}` 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});