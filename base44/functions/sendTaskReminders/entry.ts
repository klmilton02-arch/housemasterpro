import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // This function is called by a scheduler; use service role for all ops
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    // Find all tasks due tomorrow that are assigned to someone
    const tasks = await base44.asServiceRole.entities.Task.filter({
      next_due_date: tomorrowStr,
      status: "Pending",
    });

    const assignedTasks = tasks.filter(t => t.assigned_to && t.assigned_to_name);

    if (assignedTasks.length === 0) {
      return Response.json({ message: "No reminders to send.", sent: 0 });
    }

    // Get all app users to map family_member_id → email
    // FamilyMember.id is stored as assigned_to on Task
    // Users have email as their identifier; we match by looking up User records
    // where created_by or id matches – but the cleanest link is:
    // FamilyMember entity has a name; User entity has full_name.
    // We'll fetch all users and all family members and try to match by name.
    const [allUsers, allFamilyMembers] = await Promise.all([
      base44.asServiceRole.entities.User.list(),
      base44.asServiceRole.entities.FamilyMember.list(),
    ]);

    // Build a map: familyMemberId → email (match FamilyMember.name to User.full_name)
    const memberEmailMap = {};
    for (const member of allFamilyMembers) {
      const matchedUser = allUsers.find(
        u => u.full_name?.toLowerCase().trim() === member.name?.toLowerCase().trim()
      );
      if (matchedUser?.email) {
        memberEmailMap[member.id] = matchedUser.email;
      }
    }

    let sent = 0;
    const errors = [];

    for (const task of assignedTasks) {
      const email = memberEmailMap[task.assigned_to];
      if (!email) continue;

      const subject = `Reminder: "${task.name}" is due tomorrow`;
      const body = `
Hi ${task.assigned_to_name},

Just a friendly reminder that your household task is due tomorrow!

📋 Task: ${task.name}
📅 Due Date: ${task.next_due_date}
${task.category ? `🏷️ Category: ${task.category}` : ""}
${task.description ? `📝 Notes: ${task.description}` : ""}

Open HouseMasterPro to mark it complete and earn your XP!

— HouseMasterPro
      `.trim();

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: email,
        subject,
        body,
        from_name: "HouseMasterPro",
      });

      sent++;
    }

    return Response.json({ message: `Sent ${sent} reminder(s).`, sent, errors });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});