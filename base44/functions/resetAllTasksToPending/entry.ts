import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    let page = 0;
    let total = 0;
    while (true) {
      // Only fetch completed tasks to minimize updates needed
      const tasks = await base44.asServiceRole.entities.Task.filter({ status: 'Completed' }, '-created_date', 200);
      if (!tasks || tasks.length === 0) break;
      // Process in small batches with a pause to avoid rate limits
      const BATCH = 10;
      for (let i = 0; i < tasks.length; i += BATCH) {
        const slice = tasks.slice(i, i + BATCH);
        for (const t of slice) {
          await base44.asServiceRole.entities.Task.update(t.id, {
            status: 'Pending',
            last_completed_date: null,
            completed_by_name: null,
            completed_with_blast: false,
          });
        }
        if (i + BATCH < tasks.length) {
          await new Promise(r => setTimeout(r, 300));
        }
      }
      total += tasks.length;
      // After updating, if fewer than 200 returned we're done
      if (tasks.length < 200) break;
    }

    return Response.json({ success: true, tasks_reset: total });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});