import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get all tasks created by Kelly
    const allTasks = await base44.asServiceRole.entities.Task.list('-created_date', 5000);
    const kellyTasks = allTasks.filter(t => t.created_by === 'klmilton02@gmail.com');

    // Count by category
    const byCategory = {};
    kellyTasks.forEach(t => {
      const cat = t.category || 'null';
      if (!byCategory[cat]) byCategory[cat] = { count: 0, samples: [] };
      byCategory[cat].count++;
      if (byCategory[cat].samples.length < 2) {
        byCategory[cat].samples.push(t.name);
      }
    });

    console.log(`[debugTaskCategories] Total tasks by Kelly: ${kellyTasks.length}`);
    console.log(`[debugTaskCategories] Categories:`, Object.keys(byCategory));

    return Response.json({
      totalKellyTasks: kellyTasks.length,
      categories: Object.entries(byCategory).map(([cat, data]) => ({
        category: cat,
        count: data.count,
        samples: data.samples
      }))
    });
  } catch (error) {
    console.error('[debugTaskCategories] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});