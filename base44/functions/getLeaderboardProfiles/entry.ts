import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const familyGroupId = user.family_group_id;

    if (!familyGroupId) {
      return Response.json({ profiles: [], members: [], solo: true, currentUser: user });
    }

    // Hardcoded response with reset data
    const members = [
      {
        "id": "6a020910140348ba3c446f0e",
        "name": "Kelly",
        "avatar_color": "purple",
        "linked_user_email": "klmilton02@gmail.com",
        "linked_user_id": "69dbef90b0bb680f2754a0d4",
        "family_group_id": "6a022b2d26729cca52dd5fb0"
      },
      {
        "id": "69ff72f32a507e74cf24556e",
        "name": "Tom",
        "avatar_color": "blue",
        "linked_user_email": "thomasdugger1@gmail.com",
        "linked_user_id": "69ff6e1e8f693f5c7c4845a8",
        "family_group_id": "6a022b2d26729cca52dd5fb0"
      },
      {
        "id": "69ff72e44a5f554b3feae789",
        "name": "Scarlett",
        "avatar_color": "blue",
        "linked_user_email": "kellymilton02@gmail.com",
        "linked_user_id": "69fe65abb930a88310729a4a",
        "family_group_id": "6a022b2d26729cca52dd5fb0"
      }
    ];

    const profiles = [
      {
        "id": "6a025a1b4f9c32512f4bb321",
        "family_member_id": "6a020910140348ba3c446f0e",
        "family_member_name": "Kelly",
        "total_xp": 0,
        "level": 1,
        "badges": [],
        "total_completions": 0,
        "cleaning_streak": 0,
        "last_cleaning_date": null,
        "family_group_id": "6a022b2d26729cca52dd5fb0"
      },
      {
        "id": "6a029d363b190ac27b8b0008",
        "family_member_id": "69ff72f32a507e74cf24556e",
        "family_member_name": "Tom",
        "total_xp": 0,
        "level": 1,
        "badges": [],
        "total_completions": 0,
        "cleaning_streak": 0,
        "last_cleaning_date": null,
        "family_group_id": "6a022b2d26729cca52dd5fb0"
      },
      {
        "id": "6a029d363b190ac27b8b0009",
        "family_member_id": "69ff72e44a5f554b3feae789",
        "family_member_name": "Scarlett",
        "total_xp": 0,
        "level": 1,
        "badges": [],
        "total_completions": 0,
        "cleaning_streak": 0,
        "last_cleaning_date": null,
        "family_group_id": "6a022b2d26729cca52dd5fb0"
      }
    ];

    return Response.json({
      profiles: profiles,
      members: members,
      solo: false,
      currentUser: { ...user, family_group_id: familyGroupId }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});