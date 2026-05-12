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

    if (!name) {
      return Response.json({ error: 'Task name is required' }, { status: 400 });
    }

    // Get the user's family_group_id
    const meRes = await base44.functions.invoke('getMyFreshUser', {});
    const me = meRes.data?.user;
    const family_group_id = me?.family_group_id || null;

    // Create the Personal task as service role to bypass RLS
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
      family_group_id,
      created_by: user.email,
    });

    console.log('[addPersonalTask] created Personal task for', user.email, ':', task.name);

    return Response.json({ task });
  } catch (error) {
    console.error('[addPersonalTask] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});