import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get all tasks
    const allTasks = await base44.asServiceRole.entities.Task.list('-created_date', 5000);

    // Group by creator
    const byCreator = {};
    allTasks.forEach(t => {
      const creator = t.created_by || 'unknown';
      if (!byCreator[creator]) byCreator[creator] = { count: 0, samples: [] };
      byCreator[creator].count++;
      if (byCreator[creator].samples.length < 2) {
        byCreator[creator].samples.push({ name: t.name, category: t.category });
      }
    });

    console.log(`[debugTaskCreators] Total tasks: ${allTasks.length}`);
    console.log(`[debugTaskCreators] Creators:`, Object.keys(byCreator));

    return Response.json({
      total: allTasks.length,
      creators: Object.entries(byCreator).map(([creator, data]) => ({
        email: creator,
        count: data.count,
        samples: data.samples
      })).sort((a, b) => b.count - a.count)
    });
  } catch (error) {
    console.error('[debugTaskCreators] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});