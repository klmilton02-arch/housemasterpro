import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get all users
    const allUsers = await base44.asServiceRole.entities.User.list('-created_date', 1000);

    let created = 0;
    let skipped = 0;

    // For each user, ensure they have a CatShelter
    for (const u of allUsers) {
      const existing = await base44.asServiceRole.entities.CatShelter.filter({ user_id: u.id });
      
      if (existing.length === 0) {
        // Create default cat for this user
        await base44.asServiceRole.entities.CatShelter.create({
          user_id: u.id,
          user_name: u.full_name || u.email,
          family_group_id: u.family_group_id || undefined,
          cat_name: `${u.full_name || 'User'}'s Cat`,
          cat_fur: 'orange',
          collar: 'none',
          toy: 'none',
          accessory: 'none',
          health: 100,
          is_home: true,
        });
        created++;
      } else {
        skipped++;
      }
    }

    return Response.json({
      message: 'CatShelter sync complete',
      created,
      skipped,
      total: allUsers.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});