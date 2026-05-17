import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Current user:', {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      family_group_id: user.family_group_id,
      role: user.role,
    });

    // List all users to check family_group_id assignment
    const allUsers = await base44.asServiceRole.entities.User.list('-created_date', 10);
    const scarlett = allUsers.find(u => u.email === 'kellymilton02@gmail.com');
    
    console.log('Scarlett found:', scarlett);
    console.log('All users:', allUsers.map(u => ({
      id: u.id,
      email: u.email,
      full_name: u.full_name,
      family_group_id: u.family_group_id,
    })));

    return Response.json({
      currentUser: user,
      scarlett: scarlett ? {
        id: scarlett.id,
        email: scarlett.email,
        full_name: scarlett.full_name,
        family_group_id: scarlett.family_group_id,
      } : null,
      allUsers: allUsers.map(u => ({
        id: u.id,
        email: u.email,
        full_name: u.full_name,
        family_group_id: u.family_group_id,
      })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});