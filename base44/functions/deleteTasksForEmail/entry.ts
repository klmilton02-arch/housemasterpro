import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    // Get all tasks for this email (via created_by or as service role to get all)
    const tasks = await base44.asServiceRole.entities.Task.filter({ created_by: email });
    
    if (tasks.length === 0) {
      return Response.json({ success: true, deleted: 0, message: `No tasks found for ${email}` });
    }

    // Delete all tasks
    await Promise.all(tasks.map(task => base44.asServiceRole.entities.Task.delete(task.id)));

    return Response.json({ success: true, deleted: tasks.length, message: `Deleted ${tasks.length} tasks for ${email}` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});