import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { fetchAll, fetchAllFiltered } from '@/lib/fetchAll';
import { generateClassInsights, isAnnualExam } from '@/lib/aiExamHelpers';
import { usePermissions } from '@/components/auth/PermissionProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, Printer, RefreshCw, AlertCircle, BarChart3, TrendingDown, TrendingUp, Users, Lightbulb } from 'lucide-react';

const ALLOWED_ROLES = ['admin', 'teacher', 'principal'];

export default function ExamInsights() {
  const { user, isAdmin, hasPermission } = usePermissions();
  const canUse = isAdmin || ALLOWED_ROLES.includes(user?.role) || hasPermission('exam:results');

  const [sessions, setSessions] = useState([]);
  const [examGroups, setExamGroups] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [selectedSession, setSelectedSession] = useState('');
  const [selectedExamGroup, setSelectedExamGroup] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

  const [insights, setInsights] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [loadingInitial, setLoadingInitial] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [sessionData, classData, sectionData, subjectData] = await Promise.all([
          fetchAll('Session', 'name'),
          base44.entities.Class.list('numeric_value'),
          base44.entities.Section.list('name'),
          fetchAll('Subject', 'name'),
        ]);
        setSessions(sessionData);
        setClasses(classData);
        setSections(sectionData);
        setSubjects(subjectData);
        const current = sessionData.find((s) => s.is_current) || sessionData[0];
        if (current) setSelectedSession(current.name);
      } catch (e) {
        setError('Failed to load initial data.');
      } finally {
        setLoadingInitial(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedSession) return;
    (async () => {
      const allGroups = await fetchAll('ExamGroup', 'name');
      setExamGroups(allGroups.filter((g) => g.academic_session === selectedSession));
      setSelectedExamGroup('');
    })();
  }, [selectedSession]);

  const handleGenerate = async () => {
    setError('');
    setInsights(null);
    setIsGenerating(true);
    try {
      const examGroup = examGroups.find((g) => g.id === selectedExamGroup);
      const results = await fetchAllFiltered('StudentResult', {
        exam_group_id: selectedExamGroup,
        class: selectedClass,
        section: selectedSection,
      });
      const markRows = results.filter((r) => r.subject_id != null);
      if (markRows.length === 0) {
        setError('No results found for the selected class, section and exam. Enter marks first.');
        setIsGenerating(false);
        return;
      }
      const students = await fetchAllFiltered('Student', {
        class: selectedClass,
        section: selectedSection,
        status: 'active',
      });
      const nameById = {};
      students.forEach((s) => { nameById[s.id] = `${s.first_name} ${s.last_name || ''}`.trim(); });

      const parseMeta = (row) => {
        if (!row?.remarks) return null;
        try { return JSON.parse(row.remarks); } catch (e) { return null; }
      };

      const metaByStudent = {};
      results.forEach((r) => {
        if (r.subject_id == null) metaByStudent[r.student_id] = r;
      });

      const rowsByStudent = {};
      markRows.forEach((r) => {
        if (!rowsByStudent[r.student_id]) rowsByStudent[r.student_id] = [];
        rowsByStudent[r.student_id].push(r);
      });

      const maxTotal = Number(markRows[0].max_marks) || 100;

      const enriched = Object.entries(rowsByStudent).map(([studentId, rows]) => {
        const metaRow = metaByStudent[studentId];
        const meta = parseMeta(metaRow);
        const splits = meta?.splits && Object.keys(meta.splits).length > 0 ? meta.splits : {};
        const annualSplits = meta?.annualSplits && Object.keys(meta.annualSplits).length > 0 ? meta.annualSplits : {};
        const scholasticFromRows = {};
        rows.forEach((r) => {
          scholasticFromRows[String(r.subject_id)] = {
            total: Number(r.marks_obtained) || 0,
            grade: r.grade || '',
          };
        });
        const attendance = meta?.attendance || {};
        const annualAttendance = meta?.annualAttendance || {};
        const totalDays = Number(attendance.totalDays) || 0;
        const daysPresent = Number(attendance.daysPresent) || 0;
        const annualTotalDays = Number(annualAttendance.totalDays) || 0;
        const annualDaysPresent = Number(annualAttendance.daysPresent) || 0;

        return {
          ...rows[0],
          student_id: studentId,
          class: selectedClass,
          section: selectedSection,
          _studentName: nameById[studentId] || 'Unknown',
          scholastic_marks: Object.keys(splits).length > 0 ? splits : scholasticFromRows,
          annual_marks: Object.keys(annualSplits).length > 0 ? annualSplits : scholasticFromRows,
          co_scholastic: meta?.coScholastic || {},
          annual_co_scholastic: meta?.annualCoScholastic || {},
          total_days: totalDays,
          days_present: daysPresent,
          attendance_percentage: totalDays > 0 ? Math.round((daysPresent / totalDays) * 100) : 0,
          annual_total_days: annualTotalDays,
          annual_days_present: annualDaysPresent,
          annual_attendance_percentage: annualTotalDays > 0 ? Math.round((annualDaysPresent / annualTotalDays) * 100) : 0,
          teacher_remarks: meta?.teacherRemarks || '',
          annual_teacher_remarks: meta?.annualTeacherRemarks || '',
          max_marks_per_test: Number(meta?.maxMarksPerTest) || 20,
          max_marks_half_yearly: Number(meta?.maxMarksHalfYearly) || maxTotal - (Number(meta?.maxMarksPerTest) || 20),
        };
      });

      if (enriched.length === 0) {
        setError('No results found for the selected class, section and exam. Enter marks first.');
        setIsGenerating(false);
        return;
      }

      const data = await generateClassInsights({
        examGroupName: examGroup?.name,
        className: selectedClass,
        section: selectedSection,
        results: enriched,
        subjects,
        isAnnual: isAnnualExam(examGroup?.name),
        maxTotal,
      });
      setInsights(data);
    } catch (e) {
      setError(e?.message || 'Failed to generate insights. Please retry.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!canUse) {
    return (
      <div className="p-6">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6 text-center text-amber-700 text-sm">
            Exam Insights is available to admins, teachers and principals only.
          </CardContent>
        </Card>
      </div>
    );
  }

  const examGroup = examGroups.find((g) => g.id === selectedExamGroup);
  const ready = selectedSession && selectedExamGroup && selectedClass && selectedSection;

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Exam Insights
          </h1>
          <p className="text-gray-500">AI-generated class performance summary for principals & teachers</p>
        </div>
      </div>

      {/* Selection */}
      <Card className="border-purple-200 shadow-lg print:hidden">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
          <CardTitle className="flex items-center gap-2 text-purple-800">
            <BarChart3 className="h-5 w-5" /> Select Exam & Class
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Academic Session</Label>
              <Select value={selectedSession} onValueChange={setSelectedSession} disabled={loadingInitial}>
                <SelectTrigger><SelectValue placeholder="Select session" /></SelectTrigger>
                <SelectContent>
                  {sessions.map((s) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Exam</Label>
              <Select value={selectedExamGroup} onValueChange={setSelectedExamGroup}>
                <SelectTrigger><SelectValue placeholder="Select exam" /></SelectTrigger>
                <SelectContent>
                  {examGroups.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {classes.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Section</Label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
                <SelectContent>
                  {sections.map((s) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <Button
              onClick={handleGenerate}
              disabled={!ready || isGenerating}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isGenerating ? 'Generating...' : 'Generate Insights'}
            </Button>
            {insights && (
              <>
                <Button variant="outline" onClick={() => window.print()}>
                  <Printer className="h-4 w-4" /> Print / Save PDF
                </Button>
                <Button variant="outline" onClick={handleGenerate} disabled={isGenerating}>
                  <RefreshCw className="h-4 w-4" /> Regenerate
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3 print:hidden">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {isGenerating && !insights && (
        <Card className="border-purple-200">
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center gap-2 text-purple-700">
              <Loader2 className="h-5 w-5 animate-spin" /> Analyzing class performance...
            </div>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-4 bg-purple-100 rounded animate-pulse" style={{ width: `${90 - i * 15}%` }} />
            ))}
          </CardContent>
        </Card>
      )}

      {insights && (
        <Card className="border-purple-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle className="text-purple-800">
              Performance Report — {selectedClass} {selectedSection} · {examGroup?.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Summary */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Class Summary</h3>
              <p className="text-sm text-gray-700 leading-relaxed">{insights.class_summary}</p>
            </div>

            {/* Grade distribution */}
            {Array.isArray(insights.grade_distribution) && insights.grade_distribution.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Grade Distribution</h3>
                <div className="space-y-2">
                  {insights.grade_distribution.map((g, i) => {
                    const maxCount = Math.max(...insights.grade_distribution.map((x) => x.count || 0), 1);
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="w-8 text-sm font-medium text-purple-700">{g.grade}</span>
                        <div className="flex-1 bg-purple-50 rounded h-6 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                            style={{ width: `${((g.count || 0) / maxCount) * 100}%` }}
                          />
                        </div>
                        <span className="w-10 text-sm text-gray-600">{g.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Weakest / Strongest */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-red-200 rounded-lg p-4 bg-red-50/50">
                <h3 className="font-semibold text-red-700 mb-2 flex items-center gap-2"><TrendingDown className="h-4 w-4" /> Weakest Subjects</h3>
                {insights.weakest_subjects?.length ? (
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                    {insights.weakest_subjects.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                ) : <p className="text-sm text-gray-500">None identified.</p>}
              </div>
              <div className="border border-green-200 rounded-lg p-4 bg-green-50/50">
                <h3 className="font-semibold text-green-700 mb-2 flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Strongest Subjects</h3>
                {insights.strongest_subjects?.length ? (
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                    {insights.strongest_subjects.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                ) : <p className="text-sm text-gray-500">None identified.</p>}
              </div>
            </div>

            {/* Intervention students */}
            {insights.intervention_students?.length > 0 && (
              <div className="border border-amber-200 rounded-lg p-4 bg-amber-50/50">
                <h3 className="font-semibold text-amber-700 mb-2 flex items-center gap-2"><Users className="h-4 w-4" /> Students Needing Intervention</h3>
                <div className="space-y-2">
                  {insights.intervention_students.map((s, i) => (
                    <div key={i} className="text-sm">
                      <span className="font-medium text-gray-800">{s.name}</span>
                      <span className="text-gray-600"> — {s.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {insights.recommendations?.length > 0 && (
              <div className="border border-purple-200 rounded-lg p-4 bg-purple-50/50">
                <h3 className="font-semibold text-purple-700 mb-2 flex items-center gap-2"><Lightbulb className="h-4 w-4" /> Recommendations</h3>
                <ul className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                  {insights.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!insights && !isGenerating && !error && ready && (
        <Card className="border-dashed border-2 border-purple-200">
          <CardContent className="py-12 text-center text-gray-500">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-purple-300" />
            <p className="text-lg font-medium">Click <strong>Generate Insights</strong> to analyze this class's performance.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}