import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ tasks: [] });
    }

    const body = await req.json().catch(() => ({}));
    
    let familyGroupId = body.family_group_id || user.family_group_id || null;

    // If still no family_group_id, resolve it server-side
    if (!familyGroupId) {
      const allGroups = await base44.asServiceRole.entities.FamilyGroup.list();
      const ownedGroup = allGroups.find(g => g.owner_email === user.email);
      if (ownedGroup) {
        familyGroupId = ownedGroup.id;
      } else {
        const allMembers = await base44.asServiceRole.entities.FamilyMember.list('-created_date', 500);
        const match = allMembers.find(m => m.linked_user_email?.toLowerCase() === user.email?.toLowerCase());
        if (match?.family_group_id) familyGroupId = match.family_group_id;
      }
    }

    let tasks = [];
    
    if (familyGroupId) {
      const allTasks = await base44.asServiceRole.entities.Task.list('-created_date', 5000);
      
      tasks = allTasks.filter(t => {
        // Personal tasks: only return to their owner
        // Owner = created_by matches (standard creation) OR personal_owner_email matches (service-role creation)
        if (t.category === 'Personal') {
          return t.created_by === user.email || t.personal_owner_email === user.email;
        }

        // Non-personal tasks: return if created by user OR belongs to their family group
        return t.created_by === user.email || t.family_group_id === familyGroupId;
      });

      console.log('[getFamilyTasks]', user.email, '- returning', tasks.length, 'tasks (personal filtered server-side)');
    } else {
      // Solo user: RLS handles it
      tasks = await base44.entities.Task.list('-created_date', 5000);
    }

    return Response.json({ tasks });
  } catch (error) {
    console.error('[getFamilyTasks] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});