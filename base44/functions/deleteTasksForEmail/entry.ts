import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    // Try to find user first
    const users = await base44.asServiceRole.entities.User.filter({ email });
    let tasksByEmail = [];
    let tasksByFamilyGroup = [];

    // If user exists, delete tasks from family group
    if (users.length > 0) {
      const user = users[0];
      if (user.family_group_id) {
        tasksByFamilyGroup = await base44.asServiceRole.entities.Task.filter({ family_group_id: user.family_group_id });
      }
    }

    // Also search for tasks created directly by this email
    tasksByEmail = await base44.asServiceRole.entities.Task.filter({ created_by: email });

    // Combine and deduplicate
    const allTasks = [...new Map([...tasksByEmail, ...tasksByFamilyGroup].map(t => [t.id, t])).values()];
    
    if (allTasks.length === 0) {
      return Response.json({ success: true, deleted: 0, message: `No tasks found for ${email}` });
    }

    // Delete all tasks
    await Promise.all(allTasks.map(task => base44.asServiceRole.entities.Task.delete(task.id)));

    return Response.json({ success: true, deleted: allTasks.length, message: `Deleted ${allTasks.length} tasks for ${email}` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});