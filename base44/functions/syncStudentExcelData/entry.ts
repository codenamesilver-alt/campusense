import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import * as XLSX from 'npm:xlsx@0.18.5';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const fileUrl = "https://media.base44.com/files/public/69d01c04452ce0c0137e7371/a7a8fa0b2_taha_report_sorted.xlsx";

    const normalize = (s) => (s || '').toString().toUpperCase().replace(/[.\s,]+/g, ' ').trim();

    // 1. Fetch and parse Excel
    const fileResponse = await fetch(fileUrl);
    const fileBuffer = await fileResponse.arrayBuffer();
    const workbook = XLSX.read(fileBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const excelStudents = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // 2. Get all students from DB
    const dbStudents = await base44.asServiceRole.entities.Student.list('-created_date', 1000);

    // 3. Match and prepare updates
    const updates = [];
    const unmatchedExcel = [];
    const matchedNames = [];

    for (const ex of excelStudents) {
      const exName = normalize(ex['Student Name']);
      const exFather = normalize(ex['Father Name']);
      if (!exName) continue;

      let found = false;
      for (const dbSt of dbStudents) {
        const dbName = normalize((dbSt.first_name || '') + ' ' + (dbSt.last_name || ''));
        const dbFather = normalize(dbSt.father_name);

        if (dbName === exName && dbFather === exFather) {
          const updateData = { id: dbSt.id };
          if (ex['Mother Name'] && ex['Mother Name'].toString().trim()) updateData.mother_name = ex['Mother Name'];
          if (ex['Current Address'] && ex['Current Address'].toString().trim()) updateData.address = ex['Current Address'];
          if (Object.keys(updateData).length > 1) {
            updates.push(updateData);
            matchedNames.push(ex['Student Name']);
          }
          found = true;
          break;
        }
      }
      if (!found) unmatchedExcel.push(ex['Student Name']);
    }

    // 4. Bulk update
    let updateResult = null;
    if (updates.length > 0) {
      updateResult = await base44.asServiceRole.entities.Student.bulkUpdate(updates);
    }

    return Response.json({
      total_excel: excelStudents.length,
      total_db: dbStudents.length,
      matched_and_updated: updates.length,
      matched_names: matchedNames,
      unmatched_excel_count: unmatchedExcel.length,
      unmatched_excel: unmatchedExcel,
      update_result: updateResult
    });
  } catch (error) {
    return Response.json({ error: "Failed to sync student data. Please try again or contact support." }, { status: 500 });
  }
});