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

    console.log('[createPersonalTask] user:', user.email, 'task name:', name);

    // Create the Personal task using the user's auth context
    // created_by will be automatically set to user.email
    const task = await base44.entities.Task.create({
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
      family_group_id: user.family_group_id || undefined,
    });

    console.log('[createPersonalTask] created task:', task.id);
    return Response.json({ task });
  } catch (error) {
    console.error('[createPersonalTask] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});