import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const validMemberIds = [
      '6a020910140348ba3c446f0e', // Kelly
      '69ff72f32a507e74cf24556e', // Tom
      '69ff72e44a5f554b3feae789', // Scarlett
    ];
    const validGroupId = '6a022b2d26729cca52dd5fb0';

    const cats = await base44.asServiceRole.entities.CatShelter.list('-created_date', 100);
    const toDelete = cats.filter(c =>
      !validMemberIds.includes(c.family_member_id) ||
      c.family_group_id !== validGroupId
    );

    const deleted = [];
    for (const cat of toDelete) {
      await base44.asServiceRole.entities.CatShelter.delete(cat.id);
      deleted.push({ id: cat.id, name: cat.family_member_name, member_id: cat.family_member_id });
    }

    return Response.json({ deleted_count: deleted.length, deleted });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});