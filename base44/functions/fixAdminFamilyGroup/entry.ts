import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Use updateMe to set family_group_id on the current user's own record
    await base44.auth.updateMe({
      family_group_id: '69fe68f208158b6c527b6e16',
      account_type: 'family'
    });

    // Verify by fetching fresh
    const updated = await base44.auth.me();
    return Response.json({ success: true, user: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});