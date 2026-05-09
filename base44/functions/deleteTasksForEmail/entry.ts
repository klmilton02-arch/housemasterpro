import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    // Get user and their family group
    const users = await base44.asServiceRole.entities.User.filter({ email });
    if (users.length === 0) {
      return Response.json({ error: `User not found with email ${email}` }, { status: 404 });
    }

    const user = users[0];
    if (!user.family_group_id) {
      return Response.json({ success: true, deleted: 0, message: `User has no family group` });
    }

    // Get all tasks in the family group
    const tasks = await base44.asServiceRole.entities.Task.filter({ family_group_id: user.family_group_id });
    
    if (tasks.length === 0) {
      return Response.json({ success: true, deleted: 0, message: `No tasks found in family group` });
    }

    // Delete all tasks
    await Promise.all(tasks.map(task => base44.asServiceRole.entities.Task.delete(task.id)));

    return Response.json({ success: true, deleted: tasks.length, message: `Deleted ${tasks.length} tasks from family group` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});