import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { file_url } = await req.json();

    if (!file_url) {
      return Response.json({ error: 'File URL required' }, { status: 400 });
    }

    // Extract appointment details from image using AI vision
    const extractionResult = await base44.integrations.Core.InvokeLLM({
      prompt: `Extract appointment information from this image. Return ONLY a JSON object with: date (YYYY-MM-DD format), time (HH:MM format or null if not specified), doctor_name, location, and any additional notes. If you cannot find certain fields, use null. Example: {"date": "2026-05-15", "time": "14:00", "doctor_name": "Dr. Smith", "location": "123 Medical Ave", "notes": "Annual checkup"}`,
      file_urls: [file_url],
      response_json_schema: {
        type: 'object',
        properties: {
          date: { type: 'string' },
          time: { type: 'string' },
          doctor_name: { type: 'string' },
          location: { type: 'string' },
          notes: { type: 'string' }
        }
      }
    });

    if (!extractionResult.date) {
      return Response.json({ error: 'Could not extract appointment date from image' }, { status: 400 });
    }

    // Create one-time task
    const taskName = extractionResult.doctor_name ? `Appointment with ${extractionResult.doctor_name}` : 'Doctor Appointment';
    
    const taskData = {
      name: taskName,
      category: 'Personal',
      room: 'Mixed Use Room',
      priority: 'Medium',
      difficulty: 'Easy',
      frequency_days: 1,
      next_due_date: extractionResult.date,
      start_date: extractionResult.date,
      status: 'Pending',
      description: extractionResult.notes || `Location: ${extractionResult.location || 'Not specified'}${extractionResult.time ? ` at ${extractionResult.time}` : ''}`,
      family_group_id: user.family_group_id || null
    };

    const task = await base44.entities.Task.create(taskData);

    // Sync to Google Calendar if available
    try {
      const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
      const eventTitle = taskName;
      const eventDescription = taskData.description;
      const eventDate = extractionResult.date;
      
      const calendarEvent = {
        summary: eventTitle,
        description: eventDescription,
        start: {
          date: eventDate
        },
        end: {
          date: eventDate
        }
      };

      const calendarResponse = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(calendarEvent)
      });

      if (calendarResponse.ok) {
        const calendarEvent = await calendarResponse.json();
        // Update task with calendar event ID
        await base44.entities.Task.update(task.id, {
          calendar_event_id: calendarEvent.id
        });
      }
    } catch (calError) {
      // Calendar sync is optional, don't fail the whole operation
      console.error('Calendar sync failed:', calError);
    }

    return Response.json({
      success: true,
      task,
      extracted: extractionResult
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});