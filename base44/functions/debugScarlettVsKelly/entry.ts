import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const familyGroupId = '6a022b2d26729cca52dd5fb0';
    
    // Get all tasks in the Milton family with family_group_id set
    const allTasks = await base44.asServiceRole.entities.Task.list('-created_date', 5000);
    const familyTasks = allTasks.filter(t => t.family_group_id === familyGroupId);
    
    // Filter for cleaning and maintenance
    const cleaningMaintenance = familyTasks.filter(t => 
      t.category === 'Cleaning' || t.category === 'Maintenance'
    );

    // Count by creator
    const byCreator = {};
    cleaningMaintenance.forEach(t => {
      if (!byCreator[t.created_by]) byCreator[t.created_by] = [];
      byCreator[t.created_by].push(t.name);
    });

    console.log(`[debugScarlettVsKelly] Total tasks in Milton family: ${familyTasks.length}`);
    console.log(`[debugScarlettVsKelly] Cleaning + Maintenance: ${cleaningMaintenance.length}`);
    console.log(`[debugScarlettVsKelly] By creator:`, Object.keys(byCreator));

    return Response.json({
      totalInFamily: familyTasks.length,
      cleaningMaintenance: cleaningMaintenance.length,
      byCreator: Object.entries(byCreator).map(([creator, names]) => ({
        creator,
        count: names.length,
        samples: names.slice(0, 3)
      }))
    });
  } catch (error) {
    console.error('[debugScarlettVsKelly] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});