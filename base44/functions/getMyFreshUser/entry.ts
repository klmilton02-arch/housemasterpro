import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch fresh user data from DB by email (not cached token)
    const freshUsers = await base44.asServiceRole.entities.User.filter({ email: user.email });
    const freshUser = freshUsers?.[0] || user;

    return Response.json({ user: freshUser });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});