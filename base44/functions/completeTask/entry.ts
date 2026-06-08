import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { task_id, updates } = body;

    if (!task_id || !updates) {
      return Response.json({ error: 'task_id and updates are required' }, { status: 400 });
    }

    // If this is a completion (status = Completed) and a new next_due_date is set,
    // immediately set status back to Pending so the task reappears in the pending list.
    // We keep last_completed_date, streak, completed_by_name etc. but reset status.
    let finalUpdates = { ...updates };
    if (updates.status === 'Completed' && updates.next_due_date) {
      finalUpdates.status = 'Pending';
    }

    const updated = await base44.asServiceRole.entities.Task.update(task_id, finalUpdates);

    return Response.json({ task: updated });
  } catch (error) {
    console.error('[completeTask] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});