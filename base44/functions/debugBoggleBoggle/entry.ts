import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    console.log('[debugBoggleBoggle] logged in user:', user?.email);

    // Get what the user sees
    const meRes = await base44.functions.invoke('getMyFreshUser', {});
    const me = meRes.data?.user;
    const fgId = me?.family_group_id;
    
    console.log('[debugBoggleBoggle] user from getMyFreshUser:', {
      email: me?.email,
      family_group_id: fgId
    });

    // Get tasks via getFamilyTasks
    const tasksRes = await base44.functions.invoke('getFamilyTasks', { family_group_id: fgId });
    const allUserTasks = tasksRes.data?.tasks || [];
    
    console.log('[debugBoggleBoggle] getFamilyTasks returned', allUserTasks.length, 'total tasks');

    const personalTasks = allUserTasks.filter(t => t.category === 'Personal');
    console.log('[debugBoggleBoggle] Personal tasks returned:', personalTasks.length);

    // Find Boggle task
    const boggleTask = allUserTasks.find(t => t.name && t.name.includes('Boggle'));
    console.log('[debugBoggleBoggle] Boggle task found?:', !!boggleTask);
    
    if (boggleTask) {
      console.log('[debugBoggleBoggle] Boggle task details:', {
        id: boggleTask.id,
        name: boggleTask.name,
        category: boggleTask.category,
        created_by: boggleTask.created_by,
        family_group_id: boggleTask.family_group_id,
        status: boggleTask.status,
        created_date: boggleTask.created_date
      });
    } else {
      console.log('[debugBoggleBoggle] Boggle task NOT found in getFamilyTasks results');
      // List all personal tasks to debug
      personalTasks.slice(0, 10).forEach(t => {
        console.log('[debugBoggleBoggle] Personal task example:', { name: t.name, created_by: t.created_by });
      });
    }

    return Response.json({
      userEmail: user?.email,
      familyGroupId: fgId,
      totalTasksReturned: allUserTasks.length,
      personalTasksCount: personalTasks.length,
      boggleTaskFound: !!boggleTask,
      boggleTaskDetails: boggleTask ? {
        id: boggleTask.id,
        name: boggleTask.name,
        category: boggleTask.category,
        created_by: boggleTask.created_by,
        family_group_id: boggleTask.family_group_id
      } : null
    });
  } catch (error) {
    console.error('[debugBoggleBoggle] error:', error);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});