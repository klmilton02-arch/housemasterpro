import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get ALL tasks regardless of filters
    const allTasks = await base44.asServiceRole.entities.Task.list(null, 1000);
    
    const byStatus = {};
    allTasks.forEach(t => {
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
    });

    return Response.json({ 
      total: allTasks.length,
      byStatus,
      userFamilyId: user.family_group_id,
      userEmail: user.email
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});