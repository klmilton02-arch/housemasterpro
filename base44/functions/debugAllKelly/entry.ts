import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Check all profiles
    const allProfiles = await base44.asServiceRole.entities.GamificationProfile.list('-total_xp', 1000);
    console.log('Total profiles:', allProfiles.length);
    
    // Check all members
    const allMembers = await base44.asServiceRole.entities.FamilyMember.list('-created_date', 500);
    console.log('Total members:', allMembers.length);
    const kellyMembers = allMembers.filter(m => m.name?.toLowerCase().includes('kelly'));
    console.log('Kelly members:', kellyMembers.length);
    
    // Check User entity for Kelly
    const allUsers = await base44.asServiceRole.entities.User.list();
    const kellyUsers = allUsers.filter(u => u.email?.toLowerCase().includes('kelly'));
    console.log('Kelly users:', kellyUsers.length, kellyUsers.map(u => ({ email: u.email, xp: u.total_xp })));
    
    // Return all Kelly-related data
    return Response.json({
      kelly_members: kellyMembers,
      kelly_users: kellyUsers,
      profiles_with_kelly: allProfiles.filter(p => p.family_member_name?.toLowerCase().includes('kelly'))
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});