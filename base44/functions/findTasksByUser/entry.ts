import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get all tasks and group by creator
    const allTasks = await base44.asServiceRole.entities.Task.list('-created_date', 5000);

    const byEmail = {};
    allTasks.forEach(t => {
      const creator = t.created_by || 'unknown';
      if (!byEmail[creator]) {
        byEmail[creator] = { pending: 0, completed: 0, categories: {} };
      }
      if (t.status === 'Completed') {
        byEmail[creator].completed++;
      } else {
        byEmail[creator].pending++;
      }
      byEmail[creator].categories[t.category] = (byEmail[creator].categories[t.category] || 0) + 1;
    });

    const results = Object.entries(byEmail)
      .map(([email, stats]) => ({
        email,
        pending: stats.pending,
        completed: stats.completed,
        total: stats.pending + stats.completed,
        categories: stats.categories
      }))
      .sort((a, b) => b.pending - a.pending);

    return Response.json({ total: allTasks.length, byCreator: results });
  } catch (error) {
    console.error('[findTasksByUser] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});