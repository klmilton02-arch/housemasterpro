import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get all users
    const allUsers = await base44.asServiceRole.entities.User.list('-created_date', 200);
    
    // Get all family groups
    const familyGroups = await base44.asServiceRole.entities.FamilyGroup.list();
    
    const updates = [];

    // For each user that doesn't have a family_group_id, try to find one based on FamilyMember records
    for (const u of allUsers) {
      if (!u.family_group_id) {
        // Check if this user is linked to any FamilyMember
        const members = await base44.asServiceRole.entities.FamilyMember.filter({ linked_user_id: u.id });
        
        if (members.length > 0) {
          const familyGroupId = members[0].family_group_id;
          console.log(`Setting family_group_id for user ${u.email} to ${familyGroupId}`);
          
          await base44.asServiceRole.entities.User.update(u.id, {
            family_group_id: familyGroupId,
          });
          
          updates.push({
            email: u.email,
            family_group_id: familyGroupId,
            status: 'updated',
          });
        }
      } else {
        updates.push({
          email: u.email,
          family_group_id: u.family_group_id,
          status: 'already_set',
        });
      }
    }

    return Response.json({
      message: 'Family group IDs synced',
      updates,
      totalProcessed: allUsers.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});