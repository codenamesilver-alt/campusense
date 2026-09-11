import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { fetchAllFiltered } from '@/lib/fetchAll';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

// Co-scholastic items (must match MarksEntry config)
const CO_ITEMS = [
  'Is self-motivated', 'Complete task', 'Has the initiative to work independently',
  'Participation in group activity', 'Class work presentation',
  'Recognizes and names own feelings', 'Demonstrates growing confidence in sharing ideas',
  'Shows pride in accomplishments and efforts',
  'Manages emotions appropriately in different situations',
  'Demonstrates perseverance in completing tasks',
  'Use strategies to stays calm and focused during challenges',
  'Shows respect and empathy towards peer', "Listens attentively to other's prospectives",
  'Demonstrates kindness and inclusivity in group settings',
  'Cooperates well with peers during group activities',
  'Resolves conflicts with minimal guidance', 'Communicates ideas clearly and respectifully',
  'Personal Cleanliness', 'Healthy Habits', 'Nutrition Awareness',
  'Physical Fitness', 'Posture & Presentation', 'Care of Surroundings',
  'Visual Arts', 'General Awareness'
];

// Column field keys
const FIELD_PRE_TEST_1 = 'preTest_hy';   // scholastic_marks[subject].perTest
const FIELD_HALF_YEARLY = 'halfYearly';   // scholastic_marks[subject].halfYearly
const FIELD_PRE_TEST_2 = 'preTest_ann';   // annual_marks[subject].perTest
const FIELD_ANNUAL = 'annual';            // annual_marks[subject].annual

// Determine exam mode from exam_type string
const getExamMode = (examType) => {
  const t = (examType || '').toLowerCase();
  if (t.includes('annual')) return 'annual';
  if (t.includes('half') || t.includes('hy')) return 'halfYearly';
  // Pre Test 2 detection
  if (t.includes('pre test 2') || t.includes('pre-test 2') || t.includes('unit test 2') || t.includes('test 2')) return 'preTest2';
  return 'preTest1';
};

// Which fields a mode shows (in order)
const MODE_FIELDS = {
  preTest1: [FIELD_PRE_TEST_1],
  halfYearly: [FIELD_PRE_TEST_1, FIELD_HALF_YEARLY],
  preTest2: [FIELD_PRE_TEST_2],
  annual: [FIELD_PRE_TEST_2, FIELD_ANNUAL]
};

const FIELD_LABEL = {
  [FIELD_PRE_TEST_1]: (maxPerTest) => `Pre Test 1 (${maxPerTest})`,
  [FIELD_HALF_YEARLY]: (maxHY) => `Half Yearly (${maxHY})`,
  [FIELD_PRE_TEST_2]: (maxPerTest) => `Pre Test 2 (${maxPerTest})`,
  [FIELD_ANNUAL]: (maxHY) => `Annual (${maxHY})`
};

// Simple CSV escape
const csvCell = (val) => {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
};

const buildCsv = (rows) => rows.map(r => r.map(csvCell).join(',')).join('\n');

// Parse CSV text into array of rows (handles quoted fields)
const parseCsv = (text) => {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; }
        else { inQuotes = false; }
      } else { cell += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { row.push(cell); cell = ''; }
      else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
      else if (ch === '\r') { /* skip */ }
      else { cell += ch; }
    }
  }
  if (cell !== '' || row.length > 0) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.length > 0 && r.some(c => c.trim() !== ''));
};

const downloadFile = (content, filename) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const calculateGrade = (pct) => {
  if (pct >= 91) return 'A1';
  if (pct >= 81) return 'A2';
  if (pct >= 71) return 'B1';
  if (pct >= 61) return 'B2';
  if (pct >= 51) return 'C1';
  if (pct >= 41) return 'C2';
  if (pct >= 33) return 'D';
  return 'E';
};

// Match a header to a (subjectId, field) pair
const matchHeader = (header, subjects) => {
  const sub = subjects.find(s => header.startsWith(s.name + ' -'));
  if (!sub) return null;
  let field = null;
  if (header.includes('Pre Test 1')) field = FIELD_PRE_TEST_1;
  else if (header.includes('Half Yearly')) field = FIELD_HALF_YEARLY;
  else if (header.includes('Pre Test 2')) field = FIELD_PRE_TEST_2;
  else if (header.includes('Annual')) field = FIELD_ANNUAL;
  return field ? { subjectId: sub.id, field } : null;
};

// Match a co-scholastic header to (item, field)
const matchCoHeader = (header) => {
  let field = null;
  if (header.includes('Pre Test 1')) field = FIELD_PRE_TEST_1;
  else if (header.includes('Half Yearly')) field = FIELD_HALF_YEARLY;
  else if (header.includes('Pre Test 2')) field = FIELD_PRE_TEST_2;
  else if (header.includes('Annual')) field = FIELD_ANNUAL;
  if (!field) return null;
  const item = CO_ITEMS.find(it => header.startsWith(it + ' -'));
  return item ? { item, field } : null;
};

export default function BulkMarksUpload({ students, subjects, examGroupId, examGroup, selectedClass, selectedSection, currentSession, maxMarksPerTest, maxMarksHalfYearly }) {
  const [processing, setProcessing] = useState(null);
  const [result, setResult] = useState(null);
  const fileRefSch = useRef(null);
  const fileRefCo = useRef(null);

  const mode = getExamMode(examGroup?.exam_type || examGroup?.name || '');
  const fields = MODE_FIELDS[mode];
  const showAttendance = mode === 'halfYearly' || mode === 'annual';

  // ── Download Scholastic Template ──
  const downloadScholasticTemplate = () => {
    const headers = ['Admission Number', 'Student Name'];
    subjects.forEach(s => {
      fields.forEach(f => {
        const label = (f === FIELD_HALF_YEARLY || f === FIELD_ANNUAL)
          ? FIELD_LABEL[f](maxMarksHalfYearly)
          : FIELD_LABEL[f](maxMarksPerTest);
        headers.push(`${s.name} - ${label}`);
      });
    });
    if (showAttendance) {
      headers.push('Total Working Days', 'Total Attendance (Days Present)');
    }
    headers.push('Remarks');

    const rows = [headers];
    students.forEach(st => {
      const row = [st.admission_number || '', `${st.first_name} ${st.last_name || ''}`];
      subjects.forEach(() => fields.forEach(() => row.push('')));
      if (showAttendance) row.push('', '');
      row.push('');
      rows.push(row);
    });
    downloadFile(buildCsv(rows), `Scholastic_${examGroup?.name || selectedClass}_${selectedSection}.csv`);
  };

  // ── Download Co-Scholastic Template ──
  const downloadCoScholasticTemplate = () => {
    const headers = ['Admission Number', 'Student Name'];
    CO_ITEMS.forEach(item => {
      fields.forEach(f => {
        headers.push(`${item} - ${FIELD_LABEL[f](f === FIELD_HALF_YEARLY || f === FIELD_ANNUAL ? maxMarksHalfYearly : maxMarksPerTest)}`);
      });
    });
    headers.push('Remarks');

    const rows = [headers];
    students.forEach(st => {
      const row = [st.admission_number || '', `${st.first_name} ${st.last_name || ''}`];
      CO_ITEMS.forEach(() => fields.forEach(() => row.push('')));
      row.push('');
      rows.push(row);
    });
    downloadFile(buildCsv(rows), `CoScholastic_${examGroup?.name || selectedClass}_${selectedSection}.csv`);
  };

  // ── Apply a mark value into scholastic/annual objects ──
  const applyMark = (subjectId, field, raw, scholastic, annual, maxTotal) => {
    if (raw === '' || raw == null) return;
    const num = parseFloat(raw);
    if (isNaN(num)) return;

    if (field === FIELD_PRE_TEST_2 || field === FIELD_ANNUAL) {
      if (!annual[subjectId]) annual[subjectId] = { perTest: '', annual: '', total: 0, grade: '' };
      if (field === FIELD_PRE_TEST_2) annual[subjectId].perTest = num;
      else annual[subjectId].annual = num;
      const pt = parseFloat(annual[subjectId].perTest) || 0;
      const an = parseFloat(annual[subjectId].annual) || 0;
      annual[subjectId].total = pt + an;
      annual[subjectId].grade = calculateGrade((annual[subjectId].total / maxTotal) * 100);
    } else {
      if (!scholastic[subjectId]) scholastic[subjectId] = { perTest: '', halfYearly: '', total: 0, grade: '' };
      if (field === FIELD_PRE_TEST_1) scholastic[subjectId].perTest = num;
      else scholastic[subjectId].halfYearly = num;
      const pt = parseFloat(scholastic[subjectId].perTest) || 0;
      const hy = parseFloat(scholastic[subjectId].halfYearly) || 0;
      scholastic[subjectId].total = pt + hy;
      scholastic[subjectId].grade = calculateGrade((scholastic[subjectId].total / maxTotal) * 100);
    }
  };

  // ── Process Scholastic Upload ──
  const processScholastic = async (file) => {
    setProcessing('scholastic');
    setResult(null);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length < 2) { setResult({ success: 0, failed: 0, errors: ['File is empty or has no data rows'] }); setProcessing(null); return; }

      const headers = rows[0];
      const dataRows = rows.slice(1);
      const colMap = headers.map(h => matchHeader(h, subjects));
      const totalDaysIdx = headers.indexOf('Total Working Days');
      const presentIdx = headers.indexOf('Total Attendance (Days Present)');
      const remIdx = headers.indexOf('Remarks');

      const existingResults = await fetchAllFiltered('StudentResult', {
        exam_group_id: examGroupId, class: selectedClass, section: selectedSection
      });
      const resultMap = {};
      existingResults.forEach(r => { resultMap[r.student_id] = r; });

      let success = 0, failed = 0;
      const errors = [];
      const maxTotal = maxMarksPerTest + maxMarksHalfYearly;

      for (const row of dataRows) {
        const admNo = row[0]?.trim();
        const student = students.find(s => s.admission_number === admNo);
        if (!student) { failed++; errors.push(`Row ${row[0]}: Student not found`); continue; }

        const existing = resultMap[student.id];
        const scholastic = existing?.scholastic_marks || {};
        const annual = existing?.annual_marks || {};

        colMap.forEach((map, idx) => {
          if (!map) return;
          applyMark(map.subjectId, map.field, row[idx]?.trim(), scholastic, annual, maxTotal);
        });

        const totalDays = totalDaysIdx >= 0 ? (parseFloat(row[totalDaysIdx]) || 0) : 0;
        const daysPresent = presentIdx >= 0 ? (parseFloat(row[presentIdx]) || 0) : 0;
        const rem = remIdx >= 0 ? (row[remIdx] || '') : '';

        const resultData = {
          student_id: student.id,
          exam_group_id: examGroupId,
          class: selectedClass,
          section: selectedSection,
          academic_session: currentSession,
          scholastic_marks: scholastic,
          annual_marks: annual,
          max_marks_per_test: maxMarksPerTest,
          max_marks_half_yearly: maxMarksHalfYearly,
          co_scholastic: existing?.co_scholastic || {},
          annual_co_scholastic: existing?.annual_co_scholastic || {},
          total_days: mode === 'halfYearly' ? (totalDays || existing?.total_days || 0) : (existing?.total_days || 0),
          days_present: mode === 'halfYearly' ? (daysPresent || existing?.days_present || 0) : (existing?.days_present || 0),
          attendance_percentage: mode === 'halfYearly' && totalDays > 0 ? Math.round((daysPresent / totalDays) * 100) : (existing?.attendance_percentage || 0),
          annual_total_days: mode === 'annual' ? (totalDays || existing?.annual_total_days || 0) : (existing?.annual_total_days || 0),
          annual_days_present: mode === 'annual' ? (daysPresent || existing?.annual_days_present || 0) : (existing?.annual_days_present || 0),
          annual_attendance_percentage: mode === 'annual' && totalDays > 0 ? Math.round((daysPresent / totalDays) * 100) : (existing?.annual_attendance_percentage || 0),
          teacher_remarks: mode === 'halfYearly' ? (rem || existing?.teacher_remarks || '') : (existing?.teacher_remarks || ''),
          annual_teacher_remarks: mode === 'annual' ? (rem || existing?.annual_teacher_remarks || '') : (existing?.annual_teacher_remarks || ''),
          status: 'saved'
        };

        try {
          if (existing) await base44.entities.StudentResult.update(existing.id, resultData);
          else await base44.entities.StudentResult.create(resultData);
          success++;
        } catch (e) {
          failed++;
          errors.push(`${student.first_name}: ${e.message || 'Save failed'}`);
        }
      }

      setResult({ success, failed, errors });
    } catch (e) {
      setResult({ success: 0, failed: 0, errors: [e.message || 'Upload failed'] });
    } finally {
      setProcessing(null);
    }
  };

  // ── Process Co-Scholastic Upload ──
  const processCoScholastic = async (file) => {
    setProcessing('coscholastic');
    setResult(null);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length < 2) { setResult({ success: 0, failed: 0, errors: ['File is empty or has no data rows'] }); setProcessing(null); return; }

      const headers = rows[0];
      const dataRows = rows.slice(1);
      const colMap = headers.map(h => matchCoHeader(h));
      const remIdx = headers.indexOf('Remarks');

      const existingResults = await fetchAllFiltered('StudentResult', {
        exam_group_id: examGroupId, class: selectedClass, section: selectedSection
      });
      const resultMap = {};
      existingResults.forEach(r => { resultMap[r.student_id] = r; });

      let success = 0, failed = 0;
      const errors = [];

      for (const row of dataRows) {
        const admNo = row[0]?.trim();
        const student = students.find(s => s.admission_number === admNo);
        if (!student) { failed++; errors.push(`Row ${row[0]}: Student not found`); continue; }

        const existing = resultMap[student.id];
        const co = existing?.co_scholastic || {};
        const annCo = existing?.annual_co_scholastic || {};

        colMap.forEach((map, idx) => {
          if (!map) return;
          const val = row[idx]?.trim().toUpperCase();
          if (!val) return;
          if (map.field === FIELD_PRE_TEST_2 || map.field === FIELD_ANNUAL) {
            annCo[map.item] = val;
          } else {
            co[map.item] = val;
          }
        });

        const rem = remIdx >= 0 ? (row[remIdx] || '') : '';
        const resultData = {
          student_id: student.id,
          exam_group_id: examGroupId,
          class: selectedClass,
          section: selectedSection,
          academic_session: currentSession,
          scholastic_marks: existing?.scholastic_marks || {},
          annual_marks: existing?.annual_marks || {},
          max_marks_per_test: existing?.max_marks_per_test || maxMarksPerTest,
          max_marks_half_yearly: existing?.max_marks_half_yearly || maxMarksHalfYearly,
          co_scholastic: co,
          annual_co_scholastic: annCo,
          total_days: existing?.total_days || 0,
          days_present: existing?.days_present || 0,
          attendance_percentage: existing?.attendance_percentage || 0,
          annual_total_days: existing?.annual_total_days || 0,
          annual_days_present: existing?.annual_days_present || 0,
          annual_attendance_percentage: existing?.annual_attendance_percentage || 0,
          teacher_remarks: mode === 'halfYearly' ? (rem || existing?.teacher_remarks || '') : (existing?.teacher_remarks || ''),
          annual_teacher_remarks: mode === 'annual' ? (rem || existing?.annual_teacher_remarks || '') : (existing?.annual_teacher_remarks || ''),
          status: 'saved'
        };

        try {
          if (existing) await base44.entities.StudentResult.update(existing.id, resultData);
          else await base44.entities.StudentResult.create(resultData);
          success++;
        } catch (e) {
          failed++;
          errors.push(`${student.first_name}: ${e.message || 'Save failed'}`);
        }
      }

      setResult({ success, failed, errors });
    } catch (e) {
      setResult({ success: 0, failed: 0, errors: [e.message || 'Upload failed'] });
    } finally {
      setProcessing(null);
    }
  };

  const modeLabel = { preTest1: 'Pre Test 1', halfYearly: 'Half Yearly', preTest2: 'Pre Test 2', annual: 'Annual' }[mode];

  return (
    <Card className="border-cyan-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50">
        <CardTitle className="flex items-center gap-2 text-cyan-800">
          <FileSpreadsheet className="h-5 w-5" />
          Bulk Upload via CSV/Excel
          <span className="ml-2 text-xs font-normal px-2 py-1 rounded-full bg-cyan-100 text-cyan-700">Exam: {modeLabel}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <p className="text-sm text-gray-600">
          Download a template CSV tailored to <strong>{modeLabel}</strong> with all students and the relevant columns pre-filled. Enter marks in Excel, then upload to save all at once. Attendance columns are included for Half Yearly and Annual exams.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Scholastic */}
          <div className="border rounded-lg p-4 space-y-3 bg-white">
            <h4 className="font-semibold text-gray-800">Scholastic Marks</h4>
            <p className="text-xs text-gray-500">
              Columns: {fields.map(f => FIELD_LABEL[f](f === FIELD_HALF_YEARLY || f === FIELD_ANNUAL ? maxMarksHalfYearly : maxMarksPerTest)).join(', ')}
              {showAttendance ? ', Attendance' : ''}.
            </p>
            <Button onClick={downloadScholasticTemplate} variant="outline" className="w-full" disabled={!students.length || !subjects.length}>
              <Download className="mr-2 h-4 w-4" /> Download Template
            </Button>
            <div>
              <input ref={fileRefSch} type="file" accept=".csv" className="hidden"
                onChange={(e) => { const f = e.target.files[0]; if (f) processScholastic(f); e.target.value = ''; }} />
              <Button onClick={() => fileRefSch.current?.click()} disabled={!!processing || !students.length}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700">
                {processing === 'scholastic' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Upload Scholastic CSV
              </Button>
            </div>
          </div>

          {/* Co-Scholastic */}
          <div className="border rounded-lg p-4 space-y-3 bg-white">
            <h4 className="font-semibold text-gray-800">Co-Scholastic Grades</h4>
            <p className="text-xs text-gray-500">
              Columns: {fields.map(f => FIELD_LABEL[f](f === FIELD_HALF_YEARLY || f === FIELD_ANNUAL ? maxMarksHalfYearly : maxMarksPerTest)).join(', ')} grades per criterion.
            </p>
            <Button onClick={downloadCoScholasticTemplate} variant="outline" className="w-full" disabled={!students.length}>
              <Download className="mr-2 h-4 w-4" /> Download Template
            </Button>
            <div>
              <input ref={fileRefCo} type="file" accept=".csv" className="hidden"
                onChange={(e) => { const f = e.target.files[0]; if (f) processCoScholastic(f); e.target.value = ''; }} />
              <Button onClick={() => fileRefCo.current?.click()} disabled={!!processing || !students.length}
                className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700">
                {processing === 'coscholastic' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Upload Co-Scholastic CSV
              </Button>
            </div>
          </div>
        </div>

        {/* Result Summary */}
        {result && (
          <div className="mt-2 p-3 rounded-lg border bg-gray-50">
            {result.success > 0 && (
              <p className="text-sm text-green-700 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> {result.success} student(s) saved successfully.
              </p>
            )}
            {result.failed > 0 && (
              <p className="text-sm text-red-700 flex items-center gap-2 mt-1">
                <AlertCircle className="h-4 w-4" /> {result.failed} failed.
              </p>
            )}
            {result.errors.length > 0 && (
              <details className="mt-2 text-xs text-red-600">
                <summary className="cursor-pointer">View errors ({result.errors.length})</summary>
                <ul className="mt-1 list-disc list-inside max-h-32 overflow-y-auto">
                  {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </details>
            )}
          </div>
        )}

        {subjects.length === 0 && students.length > 0 && (
          <p className="text-xs text-amber-600">No subjects configured for this class. Configure Subject Groups first.</p>
        )}
      </CardContent>
    </Card>
  );
}