import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { format } from 'npm:date-fns@3.6.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { taskData } = body;

    if (!Array.isArray(taskData) || taskData.length === 0) {
      return Response.json({ error: 'No tasks to create' }, { status: 400 });
    }

    // Get fresh user data with family_group_id
    const meRes = await base44.functions.invoke('getMyFreshUser', {});
    const freshUser = meRes.data?.user;
    const family_group_id = freshUser?.family_group_id || null;

    // Add family_group_id to all tasks
    const tasksWithFamily = taskData.map(t => ({
      ...t,
      family_group_id,
    }));

    // Create in batches of 100 to avoid timeouts
    const batchSize = 100;
    const allCreated = [];
    for (let i = 0; i < tasksWithFamily.length; i += batchSize) {
      const batch = tasksWithFamily.slice(i, i + batchSize);
      const created = await base44.asServiceRole.entities.Task.bulkCreate(batch);
      allCreated.push(...created);
    }

    return Response.json({ created: allCreated.length });
  } catch (error) {
    console.error('[generateHomeSetupTasks] error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});