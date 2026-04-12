import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    const tasks = await base44.entities.Task.list();
    const results = { created: 0, updated: 0, errors: [] };

    for (const task of tasks) {
      if (!task.next_due_date) continue;

      const startDate = task.next_due_date; // "YYYY-MM-DD"
      const endDate = startDate; // all-day event

      // Build RRULE from frequency_days
      const freqDays = task.frequency_days || 30;
      const rrule = `RRULE:FREQ=DAILY;INTERVAL=${freqDays}`;

      const description = [
        task.description || '',
        task.assigned_to_name ? `Assigned to: ${task.assigned_to_name}` : '',
        `Category: ${task.category || 'General'}`,
        `Frequency: every ${freqDays} days`,
      ].filter(Boolean).join('\n');

      const eventBody = {
        summary: task.name,
        description,
        start: { date: startDate },
        end: { date: endDate },
        recurrence: [rrule],
        extendedProperties: {
          private: { familysync_task_id: task.id },
        },
      };

      if (task.calendar_event_id) {
        // Update existing event
        const res = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events/${task.calendar_event_id}`,
          { method: 'PUT', headers, body: JSON.stringify(eventBody) }
        );
        if (res.ok) {
          results.updated++;
        } else {
          // Event may have been deleted — create new
          const createRes = await fetch(
            'https://www.googleapis.com/calendar/v3/calendars/primary/events',
            { method: 'POST', headers, body: JSON.stringify(eventBody) }
          );
          if (createRes.ok) {
            const created = await createRes.json();
            await base44.entities.Task.update(task.id, { calendar_event_id: created.id });
            results.created++;
          } else {
            results.errors.push(task.name);
          }
        }
      } else {
        // Create new event
        const res = await fetch(
          'https://www.googleapis.com/calendar/v3/calendars/primary/events',
          { method: 'POST', headers, body: JSON.stringify(eventBody) }
        );
        if (res.ok) {
          const created = await res.json();
          await base44.entities.Task.update(task.id, { calendar_event_id: created.id });
          results.created++;
        } else {
          const err = await res.json();
          results.errors.push(`${task.name}: ${err?.error?.message || 'unknown error'}`);
        }
      }
    }

    return Response.json({ success: true, ...results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});