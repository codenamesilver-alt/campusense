import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { fetchAllFiltered } from '@/lib/fetchAll';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Printer, GraduationCap, Users, CheckSquare, Square, Eye } from 'lucide-react';

export default function ReportCard() {
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [examGroups, setExamGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [reportSettings, setReportSettings] = useState(null);

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedExamGroup, setSelectedExamGroup] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [studentResultsMap, setStudentResultsMap] = useState({}); // { studentId: true/false }
  const [isLoadingResults, setIsLoadingResults] = useState(false);


  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    loadInitialData();
    loadReportSettings();
  }, []);

  useEffect(() => {
    if (selectedClass) loadSubjectsForClass();
  }, [selectedClass]);

  useEffect(() => {
    if (selectedClass && selectedSection) {
      loadStudents();
      setSelectedStudentIds([]);
      setStudentResultsMap({});
    }
  }, [selectedClass, selectedSection]);

  useEffect(() => {
    if (selectedExamGroup && students.length > 0) {
      loadResultsStatus();
    } else {
      setStudentResultsMap({});
    }
  }, [selectedExamGroup, students]);

  const loadReportSettings = async () => {
    const settings = await base44.entities.ReportCardSettings.list();
    if (settings.length > 0) setReportSettings(settings[0]);
  };

  const loadInitialData = async () => {
    const [classData, sectionData, examGroupData] = await Promise.all([
      base44.entities.Class.list('numeric_value'),
      base44.entities.Section.list('name'),
      base44.entities.ExamGroup.list('name')
    ]);
    setClasses(classData);
    setSections(sectionData);
    setExamGroups(examGroupData);
  };

  const loadSubjectsForClass = async () => {
    try {
      const subjectGroups = await base44.entities.SubjectGroup.filter({ class_name: selectedClass });
      if (subjectGroups.length > 0) {
        const subjectIds = (subjectGroups[0].subject_ids || []).map(id => String(id));
        const allSubjects = await base44.entities.Subject.list();
        setSubjects(allSubjects.filter(s => subjectIds.includes(String(s.id))));
      } else {
        setSubjects([]);
      }
    } catch (error) {
      console.error('Error loading subjects:', error);
      setSubjects([]);
    }
  };

  const handleClassChange = (className) => {
    setSelectedClass(className);
    setSelectedStudentIds([]);
  };

  const loadResultsStatus = async () => {
    setIsLoadingResults(true);
    const allResults = await fetchAllFiltered('StudentResult', { exam_group_id: selectedExamGroup });
    const map = {};
    students.forEach(s => {
      map[s.id] = allResults.some(r => r.student_id === s.id && r.subject_id != null);
    });
    setStudentResultsMap(map);
    setIsLoadingResults(false);
  };

  const loadStudents = async () => {
    const studentData = await fetchAllFiltered('Student', {
      class: selectedClass,
      section: selectedSection,
      status: 'active'
    });
    setStudents(studentData.sort((a, b) => (a.roll_number || '').localeCompare(b.roll_number || '', undefined, { numeric: true })));
  };

  const toggleStudent = (id) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedStudentIds.length === students.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(students.map(s => s.id));
    }
  };

  const getSubjectName = (subjectId) => subjects.find(s => s.id === subjectId)?.name || 'Unknown';

  // Detect if this is a Half Yearly only exam (no annual data)
  const isHalfYearlyOnly = (studentResult, examGroup) => {
    const name = (examGroup?.name || '').toLowerCase();
    const hasHYOnly = name.includes('half') || name.includes('hy') || name.includes('midterm') || name.includes('mid term');
    const hasAnnual = name.includes('annual') || name.includes('final') || name.includes('combined');
    const hasAnnualMarks = studentResult.annual_marks && Object.keys(studentResult.annual_marks).length > 0;
    if (hasAnnual) return false;
    if (hasHYOnly) return true;
    return !hasAnnualMarks;
  };

  const buildReportCardHtml = (studentInfo, studentResult, examGroup) => {
    const maxPerTest = studentResult.max_marks_per_test || 20;
    const maxMain = studentResult.max_marks_half_yearly || 80;
    const maxTotal = maxPerTest + maxMain;
    const hyMarks = studentResult.scholastic_marks || {};
    const annMarks = studentResult.annual_marks || {};
    const coHY = studentResult.co_scholastic || {};
    const coAnn = studentResult.annual_co_scholastic || {};
    const hyOnly = isHalfYearlyOnly(studentResult, examGroup);

    const schoolName = reportSettings?.school_name || 'TAHA SCHOOL';
    const schoolAddress = reportSettings?.school_address || 'Girdharilal Mathur Road, Musahibganj, Lucknow';
    const schoolPhone = reportSettings?.school_phone || '0522-252118, 6392442920';
    const schoolWebsite = reportSettings?.school_website || 'www.tahaschool.com';
    const academicSession = reportSettings?.academic_session || '2025-2026';
    const logoUrl = reportSettings?.school_logo_url || '';
    const headerImageUrl = reportSettings?.header_image_url || '';
    const teacherLabel = reportSettings?.teacher_signature_label || 'Class Teacher';
    const principalLabel = reportSettings?.principal_signature_label || 'Principal';
    const parentLabel = reportSettings?.parent_signature_label || 'Parent/Guardian';

    // Calculate HY total and percentage
    const subjectIds = [...new Set([...Object.keys(hyMarks), ...Object.keys(annMarks)])];
    let hyGrandTotal = 0, hyMaxPossible = 0;
    let annGrandTotal = 0, annMaxPossible = 0;
    subjectIds.forEach(sid => {
      if (hyMarks[sid]) { hyGrandTotal += hyMarks[sid].total || 0; hyMaxPossible += maxTotal; }
      if (annMarks[sid]) { annGrandTotal += annMarks[sid].total || 0; annMaxPossible += maxTotal; }
    });
    const hyPct = hyMaxPossible > 0 ? ((hyGrandTotal / hyMaxPossible) * 100).toFixed(2) : '0.00';
    const annPct = annMaxPossible > 0 ? ((annGrandTotal / annMaxPossible) * 100).toFixed(2) : '0.00';

    const calcGrade = (pct) => {
      if (pct >= 91) return 'A1'; if (pct >= 81) return 'A2'; if (pct >= 71) return 'B1';
      if (pct >= 61) return 'B2'; if (pct >= 51) return 'C1'; if (pct >= 41) return 'C2';
      if (pct >= 33) return 'D'; return 'E';
    };

    // Final % = avg of HY and Annual totals
    const finalPct = hyMaxPossible > 0 && annMaxPossible > 0
      ? (((hyGrandTotal + annGrandTotal) / (hyMaxPossible + annMaxPossible)) * 100).toFixed(2)
      : hyMaxPossible > 0 ? hyPct : annPct;

    const coSections = [
      { title: 'Academic Evaluation', items: ['Is self-motivated','Complete task','Has the initiative to work independently','Participation in group activity','Class work presentation'] },
      { title: 'Self-Awareness', items: ['Recognizes and names own feelings','Demonstrates growing confidence in sharing ideas','Shows pride in accomplishments and efforts'] },
      { title: 'Self-Management', items: ['Manages emotions appropriately in different situations','Demonstrates perseverance in completing tasks','Use strategies to stays calm and focused during challenges'] },
      { title: 'Social Awareness', items: ["Shows respect and empathy towards peer","Listens attentively to other's prospectives","Demonstrates kindness and inclusivity in group settings"] },
      { title: 'Relationship Skills', items: ['Cooperates well with peers during group activities','Resolves conflicts with minimal guidance','Communicates ideas clearly and respectifully'] },
      { title: 'Health & Hygiene', items: ['Personal Cleanliness','Healthy Habits','Nutrition Awareness','Physical Fitness','Posture & Presentation'] }
    ];

    const coSectionHtml = (sections) => sections.map(sec => `
      <div class="co-block">
        <div class="co-section-title">${sec.title}</div>
        <table class="co-table">
          <tr><th class="co-item">Criteria</th><th class="co-grade">HY</th><th class="co-grade">Annual</th></tr>
          ${sec.items.map(item => `<tr><td class="co-item">${item}</td><td class="co-grade">${coHY[item] || ''}</td><td class="co-grade">${coAnn[item] || ''}</td></tr>`).join('')}
        </table>
      </div>
    `).join('');

    const headerHtml = `<div style="text-align:center;margin-bottom:10px;"><img src="https://media.base44.com/images/public/69d01c04452ce0c0137e7371/9ddec3e9c_image.png" style="max-width:100%;height:auto;max-height:160px;" onerror="this.parentElement.style.display='none'" /></div>`;

    const titleHtml = ``;

    const studentInfoHtml = `
      <div class="student-info">
        <div><span class="label">Student Id:</span> ${studentInfo.admission_number || ''}</div>
        <div><span class="label">Roll No:</span> ${studentInfo.roll_number || ''}</div>
        <div><span class="label">Student's Name:</span> ${studentInfo.first_name} ${studentInfo.last_name || ''}</div>
        <div><span class="label">Father's Name:</span> ${studentInfo.father_name || ''}</div>
        <div><span class="label">Mother's Name:</span> ${studentInfo.mother_name || ''}</div>
        <div><span class="label">DOB:</span> ${studentInfo.date_of_birth || ''}</div>
        <div><span class="label">Class:</span> ${studentInfo.class}</div>
        <div><span class="label">Section:</span> ${studentInfo.section}</div>
      </div>`;

    if (hyOnly) {
      // ── HALF YEARLY ONLY FORMAT ──────────────────────────────────────────
      const coSingleHtml = (sections) => sections.map(sec => `
        <div class="co-block">
          <div class="co-section-title-hy">${sec.title}</div>
          <table class="co-table">
            <tr><th class="co-item">Criteria</th><th class="co-grade-single">Grade</th></tr>
            ${sec.items.map(item => `<tr><td class="co-item">${item}</td><td class="co-grade-single">${coHY[item] || ''}</td></tr>`).join('')}
          </table>
        </div>
      `).join('');

      return `
        <!-- PAGE 1 HY -->
        <div class="page">
          ${headerHtml}${titleHtml}${studentInfoHtml}

          <div style="font-weight:bold;font-size:11px;margin:10px 0 6px;padding:4px 0;">Scholastic Areas - Half Yearly Examination (${maxTotal} marks)</div>
          <table>
            <thead>
              <tr>
                <th class="subject-col">Subject Name</th>
                <th class="num-col-wide">Per. Test (${maxPerTest})</th>
                <th class="num-col-wide">Half Yearly (${maxMain})</th>
                <th class="num-col-wide">Total (${maxTotal})</th>
                <th class="num-col-wide">Grade</th>
              </tr>
            </thead>
            <tbody>
              ${subjectIds.map(sid => {
                const hy = hyMarks[sid] || {};
                return `<tr>
                  <td class="subject-col">${getSubjectName(sid)}</td>
                  <td class="num-col-wide">${hy.perTest !== undefined && hy.perTest !== '' ? parseFloat(hy.perTest).toFixed(2) : ''}</td>
                  <td class="num-col-wide">${hy.halfYearly !== undefined && hy.halfYearly !== '' ? parseFloat(hy.halfYearly).toFixed(2) : ''}</td>
                  <td class="num-col-wide">${hy.total ? parseFloat(hy.total).toFixed(2) : ''}</td>
                  <td class="num-col-wide grade-cell">${hy.grade || ''}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>

          <table class="summary-table" style="margin-top:0;">
            <tr>
              <td class="summary-cell">Total Working Days: ${studentResult.total_days || ''}</td>
              <td class="summary-cell">Total Attendance: ${studentResult.days_present || ''}</td>
              <td class="summary-cell">Attendance %: ${studentResult.attendance_percentage || 0}%</td>
            </tr>
          </table>

          <div class="grade-info" style="margin-top:8px;">
            <strong>Grading scale for scholastic areas:</strong><br/>
            A1(91%-100%), A2(81%-90%), B1(71%-80%), B2(61%-70%), C1(51%-60%), C2(41%-50%), D(33%-40%), E(Below 33%)<br/>
            <strong>Note:</strong> AB = Absent, ML = Medical Leave. For ML cases, grade is calculated based on the percentage of marks obtained in tests attended (e.g., 30/40 = 75% = B1). Total marks reflect only tests attended.
          </div>
        </div>

        <!-- PAGE 2 HY -->
        <div class="page page-break">
          <div class="co-section-heading">Academic Evaluation</div>
          <table class="co-table" style="margin-bottom:16px;">
            <tr><th class="co-item">Criteria</th><th class="co-grade-single">Grade</th></tr>
            ${coSections[0].items.map(item => `<tr><td class="co-item">${item}</td><td class="co-grade-single">${coHY[item] || ''}</td></tr>`).join('')}
          </table>

          <div class="co-two-col">
            ${coSingleHtml([coSections[1]])}
            ${coSingleHtml([coSections[2]])}
          </div>
          <div class="co-two-col">
            ${coSingleHtml([coSections[3]])}
            ${coSingleHtml([coSections[4]])}
          </div>

          <div class="co-section-heading" style="margin-top:12px;">Health &amp; Hygiene</div>
          <table class="co-table co-health-grid" style="margin-bottom:10px;">
            <tbody>
              <tr>
                <td class="co-item">Personal Cleanliness</td><td class="co-grade-single">${coHY['Personal Cleanliness'] || ''}</td>
                <td class="co-item">Healthy Habits</td><td class="co-grade-single">${coHY['Healthy Habits'] || ''}</td>
                <td class="co-item">Nutrition Awareness</td><td class="co-grade-single">${coHY['Nutrition Awareness'] || ''}</td>
              </tr>
              <tr>
                <td class="co-item">Physical Fitness</td><td class="co-grade-single">${coHY['Physical Fitness'] || ''}</td>
                <td class="co-item">Posture &amp; Presentation</td><td class="co-grade-single">${coHY['Posture & Presentation'] || ''}</td>
                <td class="co-item">Care of Surroundings</td><td class="co-grade-single">${coHY['Care of Surroundings'] || ''}</td>
              </tr>
            </tbody>
          </table>

          <table class="co-table" style="margin-bottom:12px;">
            <tr>
              <td style="width:50%;padding:5px 8px;"><strong>Visual Arts:</strong> ${coHY['Visual Arts'] || ''}</td>
              <td style="width:50%;padding:5px 8px;border-left:1px solid #555;"><strong>General Awareness:</strong> ${coHY['General Awareness'] || ''}</td>
            </tr>
          </table>

          ${studentResult.teacher_remarks ? `
          <div class="co-section-heading">Class Teacher's Remarks:</div>
          <div class="remarks-box">${studentResult.teacher_remarks}</div>` : ''}

          <div class="grade-info" style="margin-top:10px;">
            <strong>Grading scale for co-scholastic areas:</strong><br/>
            A+ (9-10) consistently demonstrates the skill, A (7-8) regularly demonstrates the skill, B (5-6) occasionally demonstrates the skill, C (3-4) infrequently demonstrates the skill, D (1-2) Needs Improvement
          </div>

          <div class="signatures" style="margin-top:30px;">
            <div><div class="sig-line"></div><div>Signature of ${teacherLabel}</div></div>
            <div><div class="sig-line"></div><div>Signature of ${principalLabel}</div></div>
            <div><div class="sig-line"></div><div>Signature of ${parentLabel}</div></div>
          </div>
        </div>
      `;
    }

    // ── COMBINED HY + ANNUAL FORMAT ──────────────────────────────────────────
    return `
      <!-- PAGE 1 COMBINED -->
      <div class="page">
        ${headerHtml}${titleHtml}${studentInfoHtml}

        <div style="font-weight:bold;font-size:11px;margin-bottom:4px;">Scholastic Areas — Half Yearly & Annual Examination</div>
        <table>
          <thead>
            <tr>
              <th class="subject-col" rowspan="2">Subject Name</th>
              <th colspan="4" class="exam-group-header hy-header">Half Yearly Examination (${maxTotal})</th>
              <th colspan="4" class="exam-group-header ann-header">Annual Examination (${maxTotal})</th>
              <th colspan="2" class="exam-group-header overall-header">Overall (${maxTotal})</th>
            </tr>
            <tr>
              <th class="num-col hy-col">Per Test (${maxPerTest})</th>
              <th class="num-col hy-col">HY (${maxMain})</th>
              <th class="num-col hy-col">Total</th>
              <th class="num-col hy-col">Grd</th>
              <th class="num-col ann-col">Per Test (${maxPerTest})</th>
              <th class="num-col ann-col">Ann (${maxMain})</th>
              <th class="num-col ann-col">Total</th>
              <th class="num-col ann-col">Grd</th>
              <th class="num-col overall-col">Grand Total (Avg)</th>
              <th class="num-col overall-col">Agg Grade</th>
            </tr>
          </thead>
          <tbody>
            ${subjectIds.map(sid => {
              const hy = hyMarks[sid] || {};
              const ann = annMarks[sid] || {};
              const hyTot = hy.total || 0;
              const annTot = ann.total || 0;
              const grandAvg = (hyTot + annTot) / 2;
              const grandPct = (grandAvg / maxTotal) * 100;
              return `<tr>
                <td class="subject-col">${getSubjectName(sid)}</td>
                <td class="num-col">${hy.perTest || ''}</td>
                <td class="num-col">${hy.halfYearly || ''}</td>
                <td class="num-col">${hyTot || ''}</td>
                <td class="num-col grade-cell">${hy.grade || ''}</td>
                <td class="num-col">${ann.perTest || ''}</td>
                <td class="num-col">${ann.annual || ''}</td>
                <td class="num-col">${annTot || ''}</td>
                <td class="num-col grade-cell">${ann.grade || ''}</td>
                <td class="num-col overall-col"><strong>${grandAvg.toFixed(2)}</strong></td>
                <td class="num-col overall-col grade-cell"><strong>${calcGrade(grandPct)}</strong></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>

        <table class="summary-table">
          <tr>
            <td class="summary-cell">HY: ${hyGrandTotal}/${hyMaxPossible} &nbsp;|&nbsp; ${hyPct}% &nbsp;|&nbsp; Grade: ${calcGrade(parseFloat(hyPct))}</td>
            <td class="summary-cell">Annual: ${annGrandTotal}/${annMaxPossible} &nbsp;|&nbsp; ${annPct}%</td>
            <td class="summary-cell final-cell"><strong>Final %: ${finalPct}% &nbsp;|&nbsp; Grade: ${calcGrade(parseFloat(finalPct))}</strong></td>
          </tr>
          <tr>
            <td class="summary-cell">HY Attendance: ${studentResult.days_present || ''}/${studentResult.total_days || ''}</td>
            <td class="summary-cell">Annual Attendance: ${studentResult.annual_days_present || ''}/${studentResult.annual_total_days || ''}</td>
            <td class="summary-cell">Annual Att%: ${studentResult.annual_attendance_percentage || 0}%</td>
          </tr>
        </table>

        <div class="grade-info">
          <strong>Grading:</strong> A1(91-100%), A2(81-90%), B1(71-80%), B2(61-70%), C1(51-60%), C2(41-50%), D(33-40%), E(&lt;33%) &nbsp;|&nbsp; AB=Absent, ML=Medical Leave &nbsp;|&nbsp; Overall = Avg of HY &amp; Annual
        </div>

        <div class="signatures">
          <div><div class="sig-line"></div><div>${teacherLabel}</div></div>
          <div><div class="sig-line"></div><div>${principalLabel}</div></div>
          <div><div class="sig-line"></div><div>${parentLabel}</div></div>
        </div>
      </div>

      <!-- PAGE 2 COMBINED -->
      <div class="page page-break">
        <div style="font-weight:bold;font-size:13px;margin-bottom:8px;">Co-Scholastic Areas</div>
        <div class="co-grid">
          ${coSectionHtml(coSections.slice(0,2))}
          ${coSectionHtml(coSections.slice(2,4))}
          ${coSectionHtml(coSections.slice(4,6))}
        </div>

        <div class="co-block" style="margin-top:10px;">
          <div class="co-section-title">Other</div>
          <table class="co-table">
            <tr><th class="co-item-wide">Item</th><th class="co-grade">HY</th><th class="co-grade">Annual</th></tr>
            <tr><td class="co-item-wide">Visual Arts</td><td class="co-grade">${coHY['Visual Arts'] || ''}</td><td class="co-grade">${coAnn['Visual Arts'] || ''}</td></tr>
            <tr><td class="co-item-wide">Care of Surroundings</td><td class="co-grade">${coHY['Care of Surroundings'] || ''}</td><td class="co-grade">${coAnn['Care of Surroundings'] || ''}</td></tr>
            <tr><td class="co-item-wide">General Awareness</td><td class="co-grade">${coHY['General Awareness'] || ''}</td><td class="co-grade">${coAnn['General Awareness'] || ''}</td></tr>
          </table>
        </div>

        ${(studentResult.teacher_remarks || studentResult.annual_teacher_remarks) ? `
        <div style="margin:10px 0;font-size:10px;">
          ${studentResult.teacher_remarks ? `<p><strong>HY Remarks:</strong> ${studentResult.teacher_remarks}</p>` : ''}
          ${studentResult.annual_teacher_remarks ? `<p><strong>Annual Remarks:</strong> ${studentResult.annual_teacher_remarks}</p>` : ''}
        </div>` : ''}

        <div class="grade-info" style="margin-top:8px;">
          <strong>Co-Scholastic Grading:</strong> A+(9-10) Consistently, A(7-8) Regularly, B(5-6) Occasionally, C(3-4) Infrequently, D(1-2) Needs Improvement
        </div>
      </div>
    `;
  };

  const buildLegacyResult = (rows) => {
    if (!rows || rows.length === 0) return null;
    const metaRow = rows.find(r => r.subject_id == null);
    const markRows = rows.filter(r => r.subject_id != null);
    let meta = null;
    if (metaRow?.remarks) {
      try { meta = JSON.parse(metaRow.remarks); } catch (e) { meta = null; }
    }

    const scholasticFromRows = {};
    markRows.forEach(r => {
      scholasticFromRows[String(r.subject_id)] = { total: Number(r.marks_obtained) || 0, grade: r.grade || '' };
    });
    const splits = meta?.splits && Object.keys(meta.splits).length > 0 ? meta.splits : scholasticFromRows;
    const annSplits = meta?.annualSplits && Object.keys(meta.annualSplits).length > 0 ? meta.annualSplits : {};
    const attendance = meta?.attendance || {};
    const annAttendance = meta?.annualAttendance || {};
    const totalDays = Number(attendance.totalDays) || 0;
    const daysPresent = Number(attendance.daysPresent) || 0;
    const annTotalDays = Number(annAttendance.totalDays) || 0;
    const annDaysPresent = Number(annAttendance.daysPresent) || 0;
    const maxPerTest = Number(meta?.maxMarksPerTest) || 20;
    const maxMain = Number(meta?.maxMarksHalfYearly) || 80;

    return {
      scholastic_marks: splits,
      annual_marks: annSplits,
      co_scholastic: meta?.coScholastic || {},
      annual_co_scholastic: meta?.annualCoScholastic || {},
      total_days: totalDays,
      days_present: daysPresent,
      attendance_percentage: totalDays > 0 ? Math.round((daysPresent / totalDays) * 100) : 0,
      annual_total_days: annTotalDays,
      annual_days_present: annDaysPresent,
      annual_attendance_percentage: annTotalDays > 0 ? Math.round((annDaysPresent / annTotalDays) * 100) : 0,
      teacher_remarks: meta?.teacherRemarks || '',
      annual_teacher_remarks: meta?.annualTeacherRemarks || '',
      max_marks_per_test: maxPerTest,
      max_marks_half_yearly: maxMain
    };
  };

  const printSelected = async (autoPrint = true) => {
    if (selectedStudentIds.length === 0 || !selectedExamGroup) return;
    setIsPrinting(true);

    const examGroup = examGroups.find(e => e.id === selectedExamGroup);
    const selectedStudents = students.filter(s => selectedStudentIds.includes(s.id));

    // Fetch all results in parallel
    const resultsData = await Promise.all(
      selectedStudents.map(s =>
        base44.entities.StudentResult.filter({ student_id: s.id, exam_group_id: selectedExamGroup })
      )
    );

    const pageStyle = `
      @media print {
        @page { margin: 0.8cm; size: A4; }
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: Arial, sans-serif; font-size: 10px; line-height: 1.4; color: #111; }
      .page { padding: 15px; max-width: 780px; margin: 0 auto; }
      .page-break { page-break-before: always; }
      /* Header */
      .header { display: flex; align-items: center; gap: 15px; margin-bottom: 6px; }
      .logo { width: 75px; height: 75px; object-fit: contain; }
      .school-info { flex: 1; text-align: center; }
      .school-name { font-size: 26px; font-weight: bold; color: #0891b2; }
      .school-sub { font-size: 10px; color: #444; }
      .report-title { text-align: center; color: #dc2626; font-size: 16px; font-weight: bold; margin: 6px 0 1px; letter-spacing: 1px; }
      .session { text-align: center; color: #0891b2; font-size: 11px; margin-bottom: 10px; }
      /* Student info */
      .student-info { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 3px 10px; margin-bottom: 10px; font-size: 10px; border-bottom: 1px solid #999; padding-bottom: 6px; }
      .student-info .label { font-weight: bold; }
      /* Main table */
      table { width: 100%; border-collapse: collapse; margin-bottom: 0; font-size: 9px; }
      th, td { border: 1px solid #555; padding: 4px 5px; vertical-align: middle; }
      th { background: #f0f0f0; font-weight: bold; text-align: center; }
      .subject-col { text-align: left; font-weight: 500; min-width: 90px; }
      .num-col { text-align: center; width: 48px; }
      .grade-cell { font-weight: bold; }
      .exam-group-header { font-size: 10px; }
      .hy-header { background: #e8f4fd; color: #1e40af; }
      .ann-header { background: #fff7ed; color: #92400e; }
      .overall-header { background: #f0fdf4; color: #166534; }
      .hy-col { background: #f8fbff; }
      .ann-col { background: #fffdf8; }
      .overall-col { background: #f6fff6; }
      /* Summary table */
      .summary-table { margin-top: 0; }
      .summary-cell { text-align: left; padding: 5px 7px; font-size: 9px; width: 33%; }
      .final-cell { background: #faf5ff; color: #6b21a8; }
      /* Grade info */
      .grade-info { border: 1px solid #aaa; padding: 5px 8px; margin: 8px 0; font-size: 9px; background: #fafafa; }
      /* Signatures */
      .signatures { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin: 20px 0 10px; text-align: center; font-size: 10px; }
      .sig-line { border-top: 1px solid #333; margin: 28px auto 4px; width: 80%; }
      /* Co-scholastic */
      .co-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      .co-block { margin-bottom: 8px; }
      .co-section-title { font-weight: bold; font-size: 10px; background: #f0f0f0; padding: 3px 5px; margin-bottom: 2px; }
      .co-table { width: 100%; border-collapse: collapse; font-size: 9px; }
      .co-table th, .co-table td { border: 1px solid #555; padding: 3px 5px; }
      .co-table th { background: #f0f0f0; font-weight: bold; }
      .co-item { text-align: left; }
      .co-item-wide { text-align: left; width: 70%; }
      .co-grade { text-align: center; width: 40px; font-weight: bold; }
      /* HY-only co-scholastic */
      .num-col-wide { text-align: center; width: 120px; }
      .co-section-heading { font-size: 14px; font-weight: bold; margin: 12px 0 6px; }
      .co-section-title-hy { font-size: 13px; font-weight: bold; margin: 0 0 4px; }
      .co-grade-single { text-align: center; width: 60px; font-weight: bold; }
      .co-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
      .co-health-grid td { width: 25%; }
      .remarks-box { border: 1px solid #aaa; padding: 10px; margin: 6px 0 10px; font-size: 10px; min-height: 40px; background: #fafafa; }
    `;

    const allPagesHtml = selectedStudents.map((student, idx) => {
      const rows = resultsData[idx];
      const result = buildLegacyResult(rows);
      if (!result) return `<p style="color:red;">No result for ${student.first_name} ${student.last_name}</p>`;
      const html = buildReportCardHtml(student, result, examGroup);
      // Add page-break-before on page 1 for students after the first
      if (idx === 0) return html;
      return html.replace('<div class="page">', '<div class="page page-break">');
    }).join('');

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Report Cards - Class ${selectedClass} ${selectedSection}</title>
          <style>${pageStyle}</style>
        </head>
        <body>
          ${allPagesHtml}
          <script>window.onload = function() { ${autoPrint ? 'window.print();' : ''} }<\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
    setIsPrinting(false);
  };

  const previewSelected = () => printSelected(false);

  const allSelected = students.length > 0 && selectedStudentIds.length === students.length;
  const someSelected = selectedStudentIds.length > 0 && !allSelected;
  const canPrint = selectedStudentIds.length > 0 && selectedExamGroup;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Report Card
          </h1>
          <p className="text-gray-500">Generate and print student report cards</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={previewSelected} disabled={!canPrint || isPrinting} variant="outline" className="border-purple-300 text-purple-700">
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button onClick={() => printSelected(true)} disabled={!canPrint || isPrinting} className="bg-green-600 hover:bg-green-700">
            <Printer className="mr-2 h-4 w-4" />
            {isPrinting ? 'Preparing...' : `Print${selectedStudentIds.length > 0 ? ` ${selectedStudentIds.length}` : ''} Report Card${selectedStudentIds.length > 1 ? 's' : ''}`}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-purple-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
          <CardTitle className="flex items-center gap-2 text-purple-800">
            <GraduationCap className="h-5 w-5" />
            Select Class & Exam
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Class *</Label>
              <Select value={selectedClass} onValueChange={handleClassChange}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {classes.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Section *</Label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
                <SelectContent>
                  {sections.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Exam *</Label>
              <Select value={selectedExamGroup} onValueChange={setSelectedExamGroup}>
                <SelectTrigger><SelectValue placeholder="Select exam" /></SelectTrigger>
                <SelectContent>
                  {examGroups.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student List */}
      {selectedClass && selectedSection && (
        <Card className="border-purple-200">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <Users className="h-5 w-5" />
              Students — Class {selectedClass} {selectedSection}
              {students.length > 0 && (
                <Badge className="ml-2 bg-purple-100 text-purple-800">{students.length} students</Badge>
              )}
            </CardTitle>
            {students.length > 0 && (
              <Button variant="outline" size="sm" onClick={toggleSelectAll} className="text-purple-700 border-purple-300">
                {allSelected ? <CheckSquare className="mr-1 h-4 w-4" /> : <Square className="mr-1 h-4 w-4" />}
                {allSelected ? 'Deselect All' : 'Select All'}
              </Button>
            )}
          </CardHeader>
          <CardContent className="pt-4">
            {students.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No active students found for this class and section.</p>
            ) : (
              <div className="space-y-1">
                {students.map((student) => {
                  const isSelected = selectedStudentIds.includes(student.id);
                  return (
                    <div
                      key={student.id}
                      onClick={() => toggleStudent(student.id)}
                      className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer border transition-colors ${
                        isSelected
                          ? 'bg-purple-50 border-purple-300'
                          : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200'
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleStudent(student.id)}
                        onClick={e => e.stopPropagation()}
                      />
                      <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-semibold text-sm flex-shrink-0">
                        {student.first_name?.[0]}{student.last_name?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">
                          {student.first_name} {student.last_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {student.admission_number}
                          {student.roll_number ? ` • Roll: ${student.roll_number}` : ''}
                        </p>
                      </div>
                      {selectedExamGroup && !isLoadingResults && (
                        studentResultsMap[student.id]
                          ? <Badge className="bg-green-100 text-green-800 text-xs whitespace-nowrap">Result Available</Badge>
                          : <Badge className="bg-red-100 text-red-700 text-xs whitespace-nowrap">Result Not Ready</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bottom action bar */}
      {selectedClass && selectedSection && students.length > 0 && (
        <div className="sticky bottom-4">
          <Card className="border-green-300 bg-green-50 shadow-lg">
            <CardContent className="py-3 flex items-center justify-between flex-wrap gap-3">
              <p className="text-green-800 font-medium">
                {selectedStudentIds.length} student{selectedStudentIds.length > 1 ? 's' : ''} selected
                {!selectedExamGroup && ' — select an exam to enable preview/print'}
                {selectedExamGroup && selectedStudentIds.length === 0 && ' — select students to enable preview/print'}
              </p>
              <div className="flex gap-2">
                <Button onClick={previewSelected} disabled={!canPrint || isPrinting} variant="outline" className="border-green-400 text-green-800">
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </Button>
                <Button onClick={() => printSelected(true)} disabled={!canPrint || isPrinting} className="bg-green-600 hover:bg-green-700">
                  <Printer className="mr-2 h-4 w-4" />
                  {isPrinting ? 'Preparing...' : `Print${selectedStudentIds.length > 0 ? ` ${selectedStudentIds.length}` : ''} Report Card${selectedStudentIds.length > 1 ? 's' : ''}`}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {(!selectedClass || !selectedSection) && (
        <Card className="border-dashed border-2 border-purple-200">
          <CardContent className="py-12 text-center text-gray-500">
            <GraduationCap className="h-12 w-12 mx-auto mb-4 text-purple-300" />
            <p className="text-lg font-medium">Select class, section, and exam to view students</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}