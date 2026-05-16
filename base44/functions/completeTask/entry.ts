import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

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

    // Use service role to bypass RLS — task may have been created by service role
    const updated = await base44.asServiceRole.entities.Task.update(task_id, updates);

    return Response.json({ task: updated });
  } catch (error) {
    console.error('[completeTask] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});