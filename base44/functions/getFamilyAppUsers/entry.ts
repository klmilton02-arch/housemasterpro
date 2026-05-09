import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || !user.family_group_id) {
      return Response.json({ users: [] });
    }

    // Get all users in the same family group
    const allUsers = await base44.asServiceRole.entities.User.filter({ 
      "data.family_group_id": user.family_group_id 
    });

    return Response.json({ users: allUsers });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});