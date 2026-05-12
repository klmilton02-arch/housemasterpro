import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Find Scarlett member
    const allMembers = await base44.asServiceRole.entities.FamilyMember.list();
    const scarlettMember = allMembers.find(m => 
      m.name === 'Scarlett' || m.linked_user_email === 'kellymilton02@gmail.com'
    );
    
    if (!scarlettMember) {
      return Response.json({ error: 'Scarlett member not found' });
    }

    // Ensure profile exists
    const allProfiles = await base44.asServiceRole.entities.GamificationProfile.list();
    let scarlettProfile = allProfiles.find(p => p.family_member_id === scarlettMember.id);
    
    if (!scarlettProfile) {
      scarlettProfile = await base44.asServiceRole.entities.GamificationProfile.create({
        family_member_id: scarlettMember.id,
        family_member_name: scarlettMember.name,
        family_group_id: scarlettMember.family_group_id,
        total_xp: 0,
        level: 1,
      });
    } else if (!scarlettProfile.family_group_id) {
      // Fix missing family_group_id
      await base44.asServiceRole.entities.GamificationProfile.update(scarlettProfile.id, {
        family_group_id: scarlettMember.family_group_id,
      });
    }

    // Ensure cat shelter exists
    const allCats = await base44.asServiceRole.entities.CatShelter.list();
    const scarlettCat = allCats.find(c => c.family_member_id === scarlettMember.id);
    
    if (!scarlettCat) {
      await base44.asServiceRole.entities.CatShelter.create({
        family_member_id: scarlettMember.id,
        family_member_name: scarlettMember.name,
        family_group_id: scarlettMember.family_group_id,
        cat_name: `${scarlettMember.name}'s Cat`,
        cat_fur: 'pink',
        health: 100,
        is_home: true,
      });
    }

    return Response.json({
      success: true,
      message: 'Scarlett profile and cat ensured',
      member_id: scarlettMember.id,
      family_group_id: scarlettMember.family_group_id,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});