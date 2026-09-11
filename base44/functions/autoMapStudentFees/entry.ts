import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const payload = await req.json();
    const { event, data } = payload;

    // Only process new student creations
    if (event?.type !== 'create') {
      return Response.json({ message: 'Not a create event, skipping.' });
    }

    const student = data;
    if (!student || !student.id || !student.class) {
      return Response.json({ message: 'No valid student data, skipping.' });
    }

    // Only process active students
    if (student.status && student.status !== 'active') {
      return Response.json({ message: 'Student is not active, skipping.' });
    }

    const studentId = student.id;
    const studentClass = student.class;
    const studentSection = student.section || '';
    const academicYear = student.academic_year || '';
    const isNewAdmission = student.is_new_admission === true;

    console.log(`Auto-mapping fees for student: ${student.first_name} ${student.last_name} | Class: ${studentClass} | Section: ${studentSection} | AY: ${academicYear}`);

    // Fetch required data in parallel
    const [classStructures, feeHeads, existingMappings, sessions] = await Promise.all([
      base44.asServiceRole.entities.ClassFeeStructure.list(),
      base44.asServiceRole.entities.FeeHead.list(),
      base44.asServiceRole.entities.StudentFeeMapping.filter({ student_id: studentId }),
      base44.asServiceRole.entities.Session.filter({ is_current: true })
    ]);

    // Resolve academic year
    const resolvedAcademicYear = academicYear || (sessions.length > 0 ? sessions[0].name : '2026-27');

    // Find applicable fee structures for this student's class/section
    const applicableStructures = classStructures.filter(s => {
      const classMatches = s.class === studentClass;
      const sectionMatches = !s.section || s.section === '' || s.section === studentSection;
      const isEnabled = s.enabled !== false;
      const yearMatches = !s.academic_year || s.academic_year === resolvedAcademicYear;
      const isActive = s.status === 'active';
      return classMatches && sectionMatches && isEnabled && yearMatches && isActive;
    });

    if (applicableStructures.length === 0) {
      console.log(`No fee structures found for class ${studentClass} / section ${studentSection}. Nothing to map.`);
      return Response.json({ message: 'No applicable fee structures found.', student_id: studentId });
    }

    console.log(`Found ${applicableStructures.length} applicable fee structures.`);

    const mappingsToCreate = [];
    const duesToCreate = [];
    const firstYear = resolvedAcademicYear ? parseInt(resolvedAcademicYear.split('-')[0]) : new Date().getFullYear();

    for (const structure of applicableStructures) {
      // Check if this is an admission fee and student is not a new admission
      const feeHead = feeHeads.find(h => h.id === structure.fee_head_id);
      const isAdmissionFee = feeHead?.fee_head_name?.toLowerCase().includes('admission');
      if (isAdmissionFee && !isNewAdmission) {
        console.log(`Skipping admission fee for existing student.`);
        continue;
      }

      // Skip if mapping already exists
      const alreadyMapped = existingMappings.some(m =>
        m.fee_head_id === structure.fee_head_id &&
        m.academic_year === resolvedAcademicYear
      );
      if (alreadyMapped) {
        console.log(`Mapping already exists for fee head: ${structure.fee_head_name}`);
        continue;
      }

      const frequency = feeHead?.frequency || 'one_time';
      const dayOfMonth = structure.due_date && /^\d{1,2}$/.test(structure.due_date)
        ? parseInt(structure.due_date)
        : 20;

      // Build due dates
      const dueDates = [];
      if (frequency === 'monthly') {
        // April of firstYear to March of firstYear+1 (12 months)
        for (let i = 0; i < 12; i++) {
          const monthIndex = (3 + i) % 12;
          const year = (3 + i) <= 11 ? firstYear : firstYear + 1;
          dueDates.push({ date: new Date(year, monthIndex, dayOfMonth), monthIndex, year });
        }
      } else if (structure.due_date && /^\d{4}-\d{2}-\d{2}$/.test(structure.due_date)) {
        const d = new Date(structure.due_date);
        dueDates.push({ date: d, monthIndex: d.getMonth(), year: d.getFullYear() });
      } else {
        const d = new Date(firstYear, 3, dayOfMonth); // April
        dueDates.push({ date: d, monthIndex: 3, year: firstYear });
      }

      const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

      for (const { date, monthIndex, year } of dueDates) {
        const dueDateStr = date.toISOString().split('T')[0];

        mappingsToCreate.push({
          student_id: studentId,
          fee_head_id: structure.fee_head_id,
          fee_head_name: structure.fee_head_name,
          amount: structure.amount,
          due_date: dueDateStr,
          frequency,
          academic_year: resolvedAcademicYear,
          status: 'active'
        });

        duesToCreate.push({
          student_id: studentId,
          fee_head_id: structure.fee_head_id,
          fee_head_name: structure.fee_head_name,
          due_amount: structure.amount,
          paid_amount: 0,
          balance_amount: structure.amount,
          due_date: dueDateStr,
          due_month: MONTH_NAMES[monthIndex],
          due_year: year.toString(),
          late_fine: 0,
          discount_applied: 0,
          academic_year: resolvedAcademicYear,
          status: 'pending'
        });
      }
    }

    if (mappingsToCreate.length === 0) {
      return Response.json({ message: 'All fees already mapped or no applicable structures.', student_id: studentId });
    }

    // Create mappings and dues
    await base44.asServiceRole.entities.StudentFeeMapping.bulkCreate(mappingsToCreate);
    await base44.asServiceRole.entities.FeeDue.bulkCreate(duesToCreate);

    console.log(`✅ Created ${mappingsToCreate.length} mappings and ${duesToCreate.length} dues for student ${studentId}`);

    return Response.json({
      success: true,
      student_id: studentId,
      mappings_created: mappingsToCreate.length,
      dues_created: duesToCreate.length
    });

  } catch (error) {
    console.error('Error in autoMapStudentFees:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});