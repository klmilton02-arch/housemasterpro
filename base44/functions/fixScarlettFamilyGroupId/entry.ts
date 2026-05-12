import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (user?.email !== 'kellymilton02@gmail.com') {
      return Response.json({ error: 'Only Scarlett can run this' }, { status: 403 });
    }

    // Find Scarlett's family member record
    const allMembers = await base44.asServiceRole.entities.FamilyMember.list();
    const scarlettMember = allMembers.find(
      m => m.linked_user_email?.toLowerCase() === 'kellymilton02@gmail.com'
    );

    if (!scarlettMember?.family_group_id) {
      return Response.json({ error: 'Scarlett member record not found or has no family_group_id' }, { status: 400 });
    }

    // Update Scarlett's user record with the family_group_id
    await base44.asServiceRole.entities.User.update(user.id, {
      family_group_id: scarlettMember.family_group_id,
      account_type: 'family',
    });

    return Response.json({ 
      message: 'Fixed Scarlett family_group_id',
      family_group_id: scarlettMember.family_group_id
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});