import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const user = await base44.auth.me();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch all active students, attendance records, and existing insights
  const [students, allAttendance, existingInsights] = await Promise.all([
    base44.asServiceRole.entities.Student.filter({ status: 'active' }),
    base44.asServiceRole.entities.Attendance.list(),
    base44.asServiceRole.entities.StudentAttendanceInsight.list()
  ]);

  const today = new Date().toISOString().split('T')[0];
  const insightMap = {};
  for (const insight of existingInsights) {
    insightMap[insight.student_id] = insight;
  }

  let updated = 0;
  let created = 0;

  for (const student of students) {
    const studentAttendance = allAttendance.filter(a => a.student_id === student.id);
    const totalDays = studentAttendance.length;
    const presentDays = studentAttendance.filter(a =>
      a.status === 'present' || a.status === 'late' || a.status === 'half_day'
    ).length;

    if (totalDays === 0) continue;

    const percentage = parseFloat(((presentDays / totalDays) * 100).toFixed(2));
    const isAtRisk = percentage < 75;

    const insightData = {
      student_id: student.id,
      student_name: `${student.first_name} ${student.last_name}`,
      class: student.class,
      section: student.section,
      total_days_counted: totalDays,
      total_days_present: presentDays,
      attendance_percentage: percentage,
      is_at_risk: isAtRisk,
      academic_year: new Date().getFullYear().toString(),
      last_calculated: today
    };

    if (insightMap[student.id]) {
      await base44.asServiceRole.entities.StudentAttendanceInsight.update(insightMap[student.id].id, insightData);
      updated++;
    } else {
      await base44.asServiceRole.entities.StudentAttendanceInsight.create(insightData);
      created++;
    }
  }

  return Response.json({
    success: true,
    message: `Insights calculated. Created: ${created}, Updated: ${updated}`,
    total_students: students.length
  });
});