// Shared AI helpers for the Examination module's AI features.
// Uses only the built-in Core.InvokeLLM integration (no external connectors).
import { InvokeLLM } from '@/api/integrations';

const MAX_TOTAL_DEFAULT = 100;

export function isAnnualExam(examGroupName) {
  return /annual/i.test(examGroupName || '');
}

function subjectName(subjects, id) {
  const s = (subjects || []).find((x) => x.id === id);
  return s ? s.name : id;
}

function pct(total, maxTotal) {
  if (total === null || total === undefined || total === '') return null;
  const m = maxTotal || MAX_TOTAL_DEFAULT;
  return Math.round((Number(total) / m) * 100);
}

function resolveMaxTotal(results) {
  for (const r of results) {
    const t = (r.max_marks_per_test || 0) + (r.max_marks_half_yearly || 0);
    if (t > 0) return t;
  }
  return MAX_TOTAL_DEFAULT;
}

// Generate a concise report-card remark for one student.
export async function generateStudentRemark({ student, result, subjects, isAnnual, maxTotal }) {
  const marksObj = isAnnual ? result.annual_marks || {} : result.scholastic_marks || {};
  const coObj = isAnnual ? result.annual_co_scholastic || {} : result.co_scholastic || {};
  const totalDays = isAnnual ? result.annual_total_days : result.total_days;
  const daysPresent = isAnnual ? result.annual_days_present : result.days_present;
  const attPct = isAnnual ? result.annual_attendance_percentage : result.attendance_percentage;

  const subjectLines = Object.entries(marksObj)
    .map(([sid, m]) => {
      const name = subjectName(subjects, sid);
      const p = pct(m.total, maxTotal);
      return `- ${name}: ${m.total ?? '-'}/${maxTotal} (${p != null ? p + '%' : 'n/a'}, grade ${m.grade || '-'})`;
    })
    .join('\n');

  const coLines = Object.entries(coObj)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join('\n') || 'None provided';

  const attendance =
    attPct != null ? attPct + '%'
    : totalDays > 0 ? Math.round((daysPresent / totalDays) * 100) + '%'
    : 'n/a';

  const prompt = `You are an experienced Indian school class teacher writing a report card remark for a student.
Write a concise, encouraging and specific remark of 1-2 sentences (max ~40 words) in English.
Reference the student's academic performance, attendance and co-scholastic grades where relevant.
Do NOT use quotes, headings, bullet points or JSON. Output ONLY the remark text.

Student: ${student.first_name} ${student.last_name || ''}
Class: ${result.class || ''} ${result.section || ''}
Term: ${isAnnual ? 'Annual' : 'Half-Yearly'}
Attendance: ${attendance} (present ${daysPresent ?? '-'}/${totalDays ?? '-'})
Subject marks:
${subjectLines || 'No marks entered'}
Co-scholastic grades:
${coLines}

Remark:`;

  const res = await InvokeLLM({ prompt });
  const text = typeof res === 'string' ? res : res?.text || res?.output || JSON.stringify(res);
  return text.trim().replace(/^["'\s]+|["'\s]+$/g, '');
}

// Aggregate a class's results into context for the insights LLM call.
export function aggregateClassData({ results, subjects, isAnnual, maxTotal }) {
  const subjectAgg = {}; // sid -> { name, pcts: [], grades: {} }
  const gradeCounts = {};
  const studentRows = [];

  results.forEach((r) => {
    const marksObj = isAnnual ? r.annual_marks || {} : r.scholastic_marks || {};
    const attPct = isAnnual ? r.annual_attendance_percentage : r.attendance_percentage;
    const rowPcts = [];
    const failed = [];
    Object.entries(marksObj).forEach(([sid, m]) => {
      if (!subjectAgg[sid]) subjectAgg[sid] = { name: subjectName(subjects, sid), pcts: [], grades: {} };
      const p = pct(m.total, maxTotal);
      if (p != null) {
        subjectAgg[sid].pcts.push(p);
        rowPcts.push(p);
      }
      if (m.grade) {
        subjectAgg[sid].grades[m.grade] = (subjectAgg[sid].grades[m.grade] || 0) + 1;
        gradeCounts[m.grade] = (gradeCounts[m.grade] || 0) + 1;
      }
      if (m.grade === 'E' || (p != null && p < 33)) failed.push(subjectName(subjects, sid));
    });
    const overall = rowPcts.length ? Math.round(rowPcts.reduce((a, b) => a + b, 0) / rowPcts.length) : null;
    studentRows.push({
      name: r._studentName || 'Unknown',
      overall,
      attendance: attPct,
      failed,
    });
  });

  const subjectAverages = Object.entries(subjectAgg).map(([sid, s]) => ({
    name: s.name,
    avg: s.pcts.length ? Math.round(s.pcts.reduce((a, b) => a + b, 0) / s.pcts.length) : null,
  })).filter((s) => s.avg != null).sort((a, b) => a.avg - b.avg);

  return { subjectAverages, gradeCounts, studentRows };
}

// Generate a structured one-page class performance summary.
export async function generateClassInsights({ examGroupName, className, section, results, subjects, isAnnual, maxTotal }) {
  const m = maxTotal || resolveMaxTotal(results);
  const { subjectAverages, gradeCounts, studentRows } = aggregateClassData({ results, subjects, isAnnual, maxTotal: m });

  const subjectAvgLines = subjectAverages
    .map((s) => `- ${s.name}: ${s.avg}%`)
    .join('\n') || 'No subject data';

  const gradeLines = Object.entries(gradeCounts)
    .map(([g, c]) => `${g}: ${c}`)
    .join(', ') || 'No grades recorded';

  const studentLines = studentRows
    .map((s) => `- ${s.name}: overall ${s.overall != null ? s.overall + '%' : 'n/a'}, attendance ${s.attendance != null ? s.attendance + '%' : 'n/a'}${s.failed.length ? ', weak in ' + s.failed.join(', ') : ''}`)
    .join('\n') || 'No students';

  const prompt = `You are a school principal reviewing the performance of a class for an exam.
Analyze the data below and produce a structured performance report.

Exam: ${examGroupName}
Class: ${className} ${section || ''}
Term: ${isAnnual ? 'Annual' : 'Half-Yearly'}
Number of students with results: ${studentRows.length}

Per-subject class average (%):
${subjectAvgLines}

Grade distribution (count of subject grades across students): ${gradeLines}

Per-student summary:
${studentLines}

Return JSON with:
- class_summary: a short paragraph (3-4 sentences) summarizing overall class performance.
- grade_distribution: array of {grade, count} from the distribution above.
- weakest_subjects: array of subject names (strings) with the lowest averages.
- strongest_subjects: array of subject names (strings) with the highest averages.
- intervention_students: array of {name, reason} for students scoring below 40% overall or failing any subject; reason is one short sentence.
- recommendations: 3-4 actionable recommendations (strings) for the class teacher.`;

  const res = await InvokeLLM({
    prompt,
    response_json_schema: {
      type: 'object',
      properties: {
        class_summary: { type: 'string' },
        grade_distribution: {
          type: 'array',
          items: {
            type: 'object',
            properties: { grade: { type: 'string' }, count: { type: 'number' } },
          },
        },
        weakest_subjects: { type: 'array', items: { type: 'string' } },
        strongest_subjects: { type: 'array', items: { type: 'string' } },
        intervention_students: {
          type: 'array',
          items: {
            type: 'object',
            properties: { name: { type: 'string' }, reason: { type: 'string' } },
          },
        },
        recommendations: { type: 'array', items: { type: 'string' } },
      },
    },
  });

  return res;
}

export { resolveMaxTotal };