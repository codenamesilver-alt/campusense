import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { fetchAllFiltered } from '@/lib/fetchAll';
import { generateStudentRemark, isAnnualExam, resolveMaxTotal } from '@/lib/aiExamHelpers';
import { usePermissions } from '@/components/auth/PermissionProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, Save, X, AlertCircle, CheckCircle2, Wand2 } from 'lucide-react';

const ALLOWED_ROLES = ['admin', 'teacher', 'principal'];

// Props: selectedClass, selectedSection, examGroup (object), subjects (array), onClose
export default function RemarksWriterPanel({ selectedClass, selectedSection, examGroup, subjects, onClose }) {
  const { user, isAdmin } = usePermissions();
  const canUse = isAdmin || ALLOWED_ROLES.includes(user?.role);

  const [rows, setRows] = useState([]); // {student, result, remark, status}
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  if (!canUse) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6 text-center text-amber-700 text-sm">
          AI remarks generation is available to admins, teachers and principals only.
        </CardContent>
      </Card>
    );
  }

  const isAnnual = isAnnualExam(examGroup?.name);

  const handleGenerate = async () => {
    setError('');
    setDone(false);
    setRows([]);
    setIsGenerating(true);
    setProgress(0);
    try {
      const students = await fetchAllFiltered('Student', {
        class: selectedClass,
        section: selectedSection,
        status: 'active',
      });
      const allResults = await fetchAllFiltered('StudentResult', { exam_group_id: examGroup.id });
      const resultByStudent = {};
      allResults.forEach((r) => { resultByStudent[r.student_id] = r; });

      const maxTotal = resolveMaxTotal(allResults);
      const eligible = [];
      const skipped = [];
      students.forEach((s) => {
        const r = resultByStudent[s.id];
        const marksObj = isAnnual ? r?.annual_marks : r?.scholastic_marks;
        if (!r || !marksObj || Object.keys(marksObj).length === 0) {
          skipped.push({ student: s, reason: 'No marks entered' });
          return;
        }
        eligible.push({ student: s, result: r });
      });

      // initialise rows (skipped + pending)
      setRows([
        ...skipped.map((x) => ({ student: x.student, result: x.result, remark: '', status: 'skipped' })),
        ...eligible.map((x) => ({ student: x.student, result: x.result, remark: '', status: 'pending' })),
      ]);

      // generate sequentially with progress
      const generated = [...skipped.map((x) => ({ student: x.student, result: x.result, remark: '', status: 'skipped' }))];
      for (let i = 0; i < eligible.length; i++) {
        const { student, result } = eligible[i];
        try {
          const remark = await generateStudentRemark({ student, result, subjects, isAnnual, maxTotal });
          generated.push({ student, result, remark, status: 'generated' });
        } catch (e) {
          generated.push({ student, result, remark: '', status: 'error' });
        }
        setProgress(i + 1);
        setRows([...generated]);
      }
      setDone(true);
    } catch (e) {
      setError(e?.message || 'Failed to generate remarks. Please retry.');
    } finally {
      setIsGenerating(false);
    }
  };

  const updateRemark = (studentId, value) => {
    setRows((prev) => prev.map((r) => (r.student.id === studentId ? { ...r, remark: value } : r)));
  };

  const handleSave = async () => {
    setError('');
    setIsSaving(true);
    setSaveProgress(0);
    const toSave = rows.filter((r) => r.status === 'generated' || r.status === 'saved');
    try {
      let count = 0;
      for (const row of toSave) {
        const patch = isAnnual
          ? { annual_teacher_remarks: row.remark }
          : { teacher_remarks: row.remark };
        await base44.entities.StudentResult.update(row.result.id, patch);
        count += 1;
        setSaveProgress(count);
      }
      setRows((prev) => prev.map((r) => (r.status === 'generated' ? { ...r, status: 'saved' } : r)));
    } catch (e) {
      setError(e?.message || 'Failed to save some remarks. Please retry.');
    } finally {
      setIsSaving(false);
    }
  };

  const generatedCount = rows.filter((r) => r.status === 'generated' || r.status === 'saved').length;
  const savedCount = rows.filter((r) => r.status === 'saved').length;
  const pendingCount = rows.filter((r) => r.status === 'pending').length;

  return (
    <Card className="border-purple-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
        <CardTitle className="flex items-center justify-between text-purple-800">
          <span className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Remarks Writer — {selectedClass} {selectedSection} ({examGroup?.name})
          </span>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || isSaving}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            {isGenerating ? `Generating... ${progress}/${rows.filter(r => r.status !== 'skipped').length}` : done ? 'Regenerate' : 'Generate Remarks (AI)'}
          </Button>
          {done && pendingCount === 0 && generatedCount > 0 && (
            <Button onClick={handleSave} disabled={isSaving || savedCount === generatedCount} variant="default">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSaving ? `Saving... ${saveProgress}/${generatedCount}` : 'Save All'}
            </Button>
          )}
          {done && savedCount > 0 && <Badge className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />{savedCount} saved</Badge>}
          <p className="text-xs text-gray-500">
            Generates one remark per student from their marks, attendance & co-scholastic grades for the {isAnnual ? 'Annual' : 'Half-Yearly'} term.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        )}

        {rows.length === 0 && !isGenerating && (
          <p className="text-center text-gray-500 py-8 text-sm">
            Click <strong>Generate Remarks (AI)</strong> to draft remarks for every student in this class at once.
          </p>
        )}

        {rows.length > 0 && (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {rows.map((row) => (
              <div key={row.student.id} className="border rounded-lg p-3 bg-white">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-medium text-sm">
                    {row.student.first_name} {row.student.last_name}
                    <span className="text-gray-400 font-normal ml-2">Roll: {row.student.roll_number || '-'}</span>
                  </div>
                  {row.status === 'skipped' && <Badge variant="outline" className="text-gray-500">No marks</Badge>}
                  {row.status === 'pending' && <Badge variant="outline" className="text-amber-600">Pending</Badge>}
                  {row.status === 'generated' && <Badge className="bg-purple-600">Generated</Badge>}
                  {row.status === 'saved' && <Badge className="bg-green-600">Saved</Badge>}
                  {row.status === 'error' && <Badge variant="destructive">Error</Badge>}
                </div>
                {row.status !== 'skipped' && (
                  <Textarea
                    value={row.remark}
                    onChange={(e) => updateRemark(row.student.id, e.target.value)}
                    disabled={row.status === 'saved' || isSaving}
                    rows={2}
                    placeholder="Remark will appear here..."
                    className="text-sm"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}