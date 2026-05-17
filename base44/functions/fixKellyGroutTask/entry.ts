import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Find Kelly's user record
    const allUsers = await base44.asServiceRole.entities.User.list('-created_date', 100);
    const kelly = allUsers.find(u => u.email === 'klmilton02@gmail.com');
    
    if (!kelly) {
      return Response.json({ error: 'Kelly user not found' }, { status: 404 });
    }

    // Find the task "Inspect grout/caulking" assigned to Kelly
    const tasks = await base44.asServiceRole.entities.Task.filter(
      { assigned_to: kelly.id, name: 'Inspect grout/caulking' },
      '-created_date',
      10
    );

    if (!tasks || tasks.length === 0) {
      return Response.json({ error: 'Task not found for Kelly' }, { status: 404 });
    }

    const task = tasks[0];

    // Get Scarlett's info
    const scarlett = allUsers.find(u => u.email === 'kellymilton02@gmail.com');

    // Mark as completed (by Scarlett, for Kelly's task)
    await base44.asServiceRole.entities.Task.update(task.id, {
      status: 'Completed',
      last_completed_date: new Date().toISOString().split('T')[0],
      completed_by_name: scarlett ? scarlett.full_name : 'Scarlett',
    });

    return Response.json({
      success: true,
      message: `Task "${task.name}" marked as completed for Kelly`,
      task_id: task.id,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});