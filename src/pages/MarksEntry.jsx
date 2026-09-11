import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { fetchAllFiltered } from '@/lib/fetchAll';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Save, GraduationCap, User, Calendar, BookOpen, Award, Users, Sparkles } from 'lucide-react';
import BulkMarksUpload from '@/components/exam/BulkMarksUpload';
import RemarksWriterPanel from '@/components/exam/RemarksWriterPanel';

// Co-Scholastic Areas Configuration matching the PDF
const CO_SCHOLASTIC_CONFIG = {
  academic_evaluation: {
    title: 'Academic Evaluation',
    items: [
      'Is self-motivated',
      'Complete task',
      'Has the initiative to work independently',
      'Participation in group activity',
      'Class work presentation'
    ]
  },
  self_awareness: {
    title: 'Self-Awareness',
    items: [
      'Recognizes and names own feelings',
      'Demonstrates growing confidence in sharing ideas',
      'Shows pride in accomplishments and efforts'
    ]
  },
  self_management: {
    title: 'Self-Management',
    items: [
      'Manages emotions appropriately in different situations',
      'Demonstrates perseverance in completing tasks',
      'Use strategies to stays calm and focused during challenges'
    ]
  },
  social_awareness: {
    title: 'Social Awareness',
    items: [
      'Shows respect and empathy towards peer',
      'Listens attentively to other\'s prospectives',
      'Demonstrates kindness and inclusivity in group settings'
    ]
  },
  relationship_skills: {
    title: 'Relationship Skills',
    items: [
      'Cooperates well with peers during group activities',
      'Resolves conflicts with minimal guidance',
      'Communicates ideas clearly and respectifully'
    ]
  },
  health_hygiene: {
    title: 'Health & Hygiene',
    items: [
      'Personal Cleanliness',
      'Healthy Habits',
      'Nutrition Awareness',
      'Physical Fitness',
      'Posture & Presentation',
      'Care of Surroundings'
    ]
  },
  other: {
    title: 'Other',
    items: ['Visual Arts', 'General Awareness']
  }
};

export default function MarksEntry() {
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [examGroups, setExamGroups] = useState([]);
  const [grades, setGrades] = useState([]);
  
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedExamGroup, setSelectedExamGroup] = useState('');
  const [maxMarksPerTest, setMaxMarksPerTest] = useState(20);
  const [maxMarksHalfYearly, setMaxMarksHalfYearly] = useState(80);
  
  const [students, setStudents] = useState([]);
  const [showRemarksWriter, setShowRemarksWriter] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  const [scholasticMarks, setScholasticMarks] = useState({});
  const [annualMarks, setAnnualMarks] = useState({});
  const [coScholasticGrades, setCoScholasticGrades] = useState({});
  const [annualCoScholasticGrades, setAnnualCoScholasticGrades] = useState({});
  const [attendanceData, setAttendanceData] = useState({ totalDays: '', daysPresent: '' });
  const [annualAttendanceData, setAnnualAttendanceData] = useState({ totalDays: '', daysPresent: '' });
  const [teacherRemarks, setTeacherRemarks] = useState('');
  const [annualTeacherRemarks, setAnnualTeacherRemarks] = useState('');
  
  const [currentSession, setCurrentSession] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Subject grouping configuration for class 6+
  const SUBJECT_GROUPS = {
    english: {
      subjects: ['English Literature', 'English Language'],
      averageLabel: 'English Average'
    },
    science: {
      subjects: ['Physics', 'Chemistry', 'Biology'],
      averageLabel: 'Science Average'
    },
    socialScience: {
      subjects: ['History & Civics', 'Geography'],
      averageLabel: 'Social Science Average'
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      loadSubjectsForClass();
    }
  }, [selectedClassId]);

  useEffect(() => {
    if (selectedClass && selectedSection) {
      loadStudents();
    }
  }, [selectedClass, selectedSection]);

  useEffect(() => {
    if (selectedStudent && selectedExamGroup) {
      loadExistingResult();
    }
  }, [selectedStudent, selectedExamGroup]);

  const loadInitialData = async () => {
    try {
      const [classData, sectionData, examGroupData, gradeData, sessionData] = await Promise.all([
        base44.entities.Class.list('numeric_value'),
        base44.entities.Section.list('name'),
        base44.entities.ExamGroup.list('name'),
        base44.entities.GradeConfiguration.list(),
        base44.entities.Session.list()
      ]);
      setClasses(classData);
      setSections(sectionData);
      setExamGroups(examGroupData);
      setGrades(gradeData);
      const current = sessionData.find(s => s.is_current) || sessionData[0];
      if (current) setCurrentSession(current.name);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const loadSubjectsForClass = async () => {
    try {
      const subjectGroups = await base44.entities.SubjectGroup.filter({ class_id: selectedClassId });
      if (subjectGroups.length > 0) {
        const subjectIds = subjectGroups[0].subject_ids || [];
        const allSubjects = await base44.entities.Subject.list();
        const classSubjects = allSubjects.filter(s => subjectIds.includes(s.id));
        setSubjects(classSubjects);
      } else {
        setSubjects([]);
      }
    } catch (error) {
      console.error('Error loading subjects:', error);
      setSubjects([]);
    }
  };

  const loadStudents = async () => {
    try {
      setIsLoading(true);
      const studentData = await fetchAllFiltered('Student', {
        class: selectedClass,
        section: selectedSection,
        status: 'active'
      });
      setStudents(studentData.sort((a, b) => (a.roll_number || '').localeCompare(b.roll_number || '')));
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadExistingResult = async () => {
    try {
      const existingResults = await base44.entities.StudentResult.filter({
        student_id: selectedStudent.id,
        exam_group_id: selectedExamGroup
      });

      if (existingResults.length > 0) {
        const result = existingResults[0];
        setScholasticMarks(result.scholastic_marks || {});
        setAnnualMarks(result.annual_marks || {});
        setCoScholasticGrades(result.co_scholastic || {});
        setAnnualCoScholasticGrades(result.annual_co_scholastic || {});
        setAttendanceData({ totalDays: result.total_days || '', daysPresent: result.days_present || '' });
        setAnnualAttendanceData({ totalDays: result.annual_total_days || '', daysPresent: result.annual_days_present || '' });
        setTeacherRemarks(result.teacher_remarks || '');
        setAnnualTeacherRemarks(result.annual_teacher_remarks || '');
        if (result.max_marks_per_test) setMaxMarksPerTest(result.max_marks_per_test);
        if (result.max_marks_half_yearly) setMaxMarksHalfYearly(result.max_marks_half_yearly);
      } else {
        const emptyMarks = {};
        subjects.forEach(s => {
          emptyMarks[s.id] = { perTest: '', halfYearly: '', total: 0, grade: '' };
        });
        setScholasticMarks(emptyMarks);
        setAnnualMarks({});
        setCoScholasticGrades({});
        setAnnualCoScholasticGrades({});
        setAttendanceData({ totalDays: '', daysPresent: '' });
        setAnnualAttendanceData({ totalDays: '', daysPresent: '' });
        setTeacherRemarks('');
        setAnnualTeacherRemarks('');
      }
    } catch (error) {
      console.error('Error loading existing result:', error);
    }
  };

  const handleClassChange = (className) => {
    const classObj = classes.find(c => c.name === className);
    setSelectedClass(className);
    setSelectedClassId(classObj?.id || '');
    setSelectedStudent(null);
    setScholasticMarks({});
    setCoScholasticGrades({});
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
  };

  const handleMarksChange = (subjectId, field, value, isAnnual = false) => {
    const setter = isAnnual ? setAnnualMarks : setScholasticMarks;
    const mainField = isAnnual ? 'annual' : 'halfYearly';
    setter(prev => {
      const updated = { ...prev };
      if (!updated[subjectId]) updated[subjectId] = { perTest: '', [mainField]: '', total: 0, grade: '' };
      updated[subjectId][field] = value;
      const perTest = parseFloat(updated[subjectId].perTest) || 0;
      const main = parseFloat(updated[subjectId][mainField]) || 0;
      const total = perTest + main;
      const maxTotal = maxMarksPerTest + maxMarksHalfYearly;
      updated[subjectId].total = total;
      updated[subjectId].grade = calculateGrade((total / maxTotal) * 100);
      return updated;
    });
  };

  const handleCoScholasticChange = (item, value, isAnnual = false) => {
    const setter = isAnnual ? setAnnualCoScholasticGrades : setCoScholasticGrades;
    setter(prev => ({ ...prev, [item]: value.toUpperCase() }));
  };

  const calculateGrade = (percentage) => {
    if (percentage >= 91) return 'A1';
    if (percentage >= 81) return 'A2';
    if (percentage >= 71) return 'B1';
    if (percentage >= 61) return 'B2';
    if (percentage >= 51) return 'C1';
    if (percentage >= 41) return 'C2';
    if (percentage >= 33) return 'D';
    return 'E';
  };

  const calculateAttendancePercentage = () => {
    const total = parseFloat(attendanceData.totalDays) || 0;
    const present = parseFloat(attendanceData.daysPresent) || 0;
    if (total === 0) return 0;
    return Math.round((present / total) * 100);
  };

  // Check if class is 6 or higher
  const isClass6OrAbove = () => {
    const classObj = classes.find(c => c.name === selectedClass);
    return classObj && classObj.numeric_value >= 6;
  };

  // Get subject by name
  const getSubjectByName = (name) => {
    return subjects.find(s => s.name.toLowerCase() === name.toLowerCase());
  };

  // Calculate average for a group of subjects
  const calculateGroupAverage = (subjectNames) => {
    let totalPerTest = 0, totalHalfYearly = 0, count = 0;
    
    subjectNames.forEach(name => {
      const subject = getSubjectByName(name);
      if (subject && scholasticMarks[subject.id]) {
        const marks = scholasticMarks[subject.id];
        const perTest = parseFloat(marks.perTest) || 0;
        const halfYearly = parseFloat(marks.halfYearly) || 0;
        if (perTest > 0 || halfYearly > 0) {
          totalPerTest += perTest;
          totalHalfYearly += halfYearly;
          count++;
        }
      }
    });

    if (count === 0) return { perTest: 0, halfYearly: 0, total: 0, grade: '' };

    const avgPerTest = totalPerTest / count;
    const avgHalfYearly = totalHalfYearly / count;
    const total = avgPerTest + avgHalfYearly;
    const maxTotal = maxMarksPerTest + maxMarksHalfYearly;
    const percentage = (total / maxTotal) * 100;

    return {
      perTest: avgPerTest,
      halfYearly: avgHalfYearly,
      total: total,
      grade: calculateGrade(percentage)
    };
  };

  // Calculate grand total
  const calculateGrandTotal = () => {
    const maxTotal = maxMarksPerTest + maxMarksHalfYearly;
    
    if (isClass6OrAbove()) {
      // For class 6+, use averages for grouped subjects
      let grandPerTest = 0, grandHalfYearly = 0, subjectCount = 0;
      const groupedSubjectNames = [];
      
      // Collect all grouped subject names
      Object.values(SUBJECT_GROUPS).forEach(group => {
        groupedSubjectNames.push(...group.subjects.map(s => s.toLowerCase()));
      });

      // Add averages for grouped subjects
      Object.values(SUBJECT_GROUPS).forEach(group => {
        const hasGroupSubjects = group.subjects.some(name => getSubjectByName(name));
        if (hasGroupSubjects) {
          const avg = calculateGroupAverage(group.subjects);
          if (avg.total > 0) {
            grandPerTest += avg.perTest;
            grandHalfYearly += avg.halfYearly;
            subjectCount++;
          }
        }
      });

      // Add other subjects not in groups
      subjects.forEach(subject => {
        if (!groupedSubjectNames.includes(subject.name.toLowerCase())) {
          const marks = scholasticMarks[subject.id];
          if (marks) {
            grandPerTest += parseFloat(marks.perTest) || 0;
            grandHalfYearly += parseFloat(marks.halfYearly) || 0;
            subjectCount++;
          }
        }
      });

      const grandTotal = grandPerTest + grandHalfYearly;
      const maxPossible = subjectCount * maxTotal;
      const percentage = maxPossible > 0 ? (grandTotal / maxPossible) * 100 : 0;

      return {
        perTest: grandPerTest,
        halfYearly: grandHalfYearly,
        total: grandTotal,
        grade: calculateGrade(percentage),
        maxPossible: maxPossible
      };
    } else {
      // For class 1-5, simple sum of all subjects
      let grandPerTest = 0, grandHalfYearly = 0;
      
      subjects.forEach(subject => {
        const marks = scholasticMarks[subject.id];
        if (marks) {
          grandPerTest += parseFloat(marks.perTest) || 0;
          grandHalfYearly += parseFloat(marks.halfYearly) || 0;
        }
      });

      const grandTotal = grandPerTest + grandHalfYearly;
      const maxPossible = subjects.length * maxTotal;
      const percentage = maxPossible > 0 ? (grandTotal / maxPossible) * 100 : 0;

      return {
        perTest: grandPerTest,
        halfYearly: grandHalfYearly,
        total: grandTotal,
        grade: calculateGrade(percentage),
        maxPossible: maxPossible
      };
    }
  };

  // Build organized subject list with averages for display
  const getOrganizedSubjects = () => {
    if (!isClass6OrAbove()) {
      // For class 1-5, return subjects as-is
      return subjects.map(s => ({ type: 'subject', subject: s }));
    }

    const result = [];
    const processedSubjects = new Set();
    const addedGroups = new Set();

    // First, organize subjects by groups in order
    subjects.forEach(subject => {
      if (processedSubjects.has(subject.id)) return;

      // Check if this subject belongs to a group
      let belongsToGroup = null;
      let groupKey = null;
      Object.entries(SUBJECT_GROUPS).forEach(([key, group]) => {
        if (group.subjects.some(name => name.toLowerCase() === subject.name.toLowerCase())) {
          belongsToGroup = group;
          groupKey = key;
        }
      });

      if (belongsToGroup && !addedGroups.has(groupKey)) {
        // Add all subjects in the group in defined order, then the average
        belongsToGroup.subjects.forEach(name => {
          const groupSubject = getSubjectByName(name);
          if (groupSubject) {
            result.push({ type: 'subject', subject: groupSubject });
            processedSubjects.add(groupSubject.id);
          }
        });
        // Add average row after the group
        result.push({ type: 'average', group: belongsToGroup });
        addedGroups.add(groupKey);
      } else if (!belongsToGroup) {
        // Regular subject not in any group
        result.push({ type: 'subject', subject });
        processedSubjects.add(subject.id);
      }
    });

    return result;
  };

  const handleSaveResult = async () => {
    if (!selectedStudent || !selectedExamGroup) {
      alert('Please select a student and exam');
      return;
    }

    try {
      setIsSaving(true);

      const existingResults = await base44.entities.StudentResult.filter({
        student_id: selectedStudent.id,
        exam_group_id: selectedExamGroup
      });

      const calcPct = (present, total) => total > 0 ? Math.round((present / total) * 100) : 0;
      const resultData = {
        student_id: selectedStudent.id,
        exam_group_id: selectedExamGroup,
        class: selectedClass,
        section: selectedSection,
        academic_session: currentSession,
        scholastic_marks: scholasticMarks,
        annual_marks: annualMarks,
        max_marks_per_test: maxMarksPerTest,
        max_marks_half_yearly: maxMarksHalfYearly,
        co_scholastic: coScholasticGrades,
        annual_co_scholastic: annualCoScholasticGrades,
        total_days: parseFloat(attendanceData.totalDays) || 0,
        days_present: parseFloat(attendanceData.daysPresent) || 0,
        attendance_percentage: calcPct(parseFloat(attendanceData.daysPresent), parseFloat(attendanceData.totalDays)),
        annual_total_days: parseFloat(annualAttendanceData.totalDays) || 0,
        annual_days_present: parseFloat(annualAttendanceData.daysPresent) || 0,
        annual_attendance_percentage: calcPct(parseFloat(annualAttendanceData.daysPresent), parseFloat(annualAttendanceData.totalDays)),
        teacher_remarks: teacherRemarks,
        annual_teacher_remarks: annualTeacherRemarks,
        status: 'saved'
      };

      if (existingResults.length > 0) {
        await base44.entities.StudentResult.update(existingResults[0].id, resultData);
      } else {
        await base44.entities.StudentResult.create(resultData);
      }

      alert('Result saved successfully!');
    } catch (error) {
      console.error('Error saving result:', error);
      alert('Error saving result. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Marks Entry
          </h1>
          <p className="text-gray-500">Enter scholastic and co-scholastic marks for students</p>
        </div>
        {selectedClass && selectedSection && selectedExamGroup && (
          <Button
            variant="outline"
            className="border-purple-300 text-purple-700 hover:bg-purple-50"
            onClick={() => setShowRemarksWriter((v) => !v)}
          >
            <Sparkles className="h-4 w-4" />
            {showRemarksWriter ? 'Hide AI Remarks' : 'AI Remarks Writer'}
          </Button>
        )}
      </div>

      {/* Selection Card */}
      <Card className="border-purple-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
          <CardTitle className="flex items-center gap-2 text-purple-800">
            <GraduationCap className="h-5 w-5" />
            Select Class, Section & Exam
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Class *</Label>
              <Select value={selectedClass} onValueChange={handleClassChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(c => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Section *</Label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map(s => (
                    <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Exam *</Label>
              <Select value={selectedExamGroup} onValueChange={setSelectedExamGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="Select exam" />
                </SelectTrigger>
                <SelectContent>
                  {examGroups.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Per. Test Max</Label>
              <Input
                type="number"
                value={maxMarksPerTest}
                onChange={(e) => setMaxMarksPerTest(parseInt(e.target.value) || 20)}
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label>Half Yearly Max</Label>
              <Input
                type="number"
                value={maxMarksHalfYearly}
                onChange={(e) => setMaxMarksHalfYearly(parseInt(e.target.value) || 80)}
                min="1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Remarks Writer */}
      {showRemarksWriter && selectedClass && selectedSection && selectedExamGroup && (
        <RemarksWriterPanel
          selectedClass={selectedClass}
          selectedSection={selectedSection}
          examGroup={examGroups.find((e) => e.id === selectedExamGroup)}
          subjects={subjects}
          onClose={() => setShowRemarksWriter(false)}
        />
      )}

      {/* Student List */}
      {selectedClass && selectedSection && selectedExamGroup && (
        <Card className="border-purple-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <Users className="h-5 w-5" />
              Select Student
              <Badge className="ml-2 bg-purple-600">{students.length} Students</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="text-center py-4">Loading students...</div>
            ) : students.length === 0 ? (
              <div className="text-center py-4 text-gray-500">No students found</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {students.map(student => (
                  <div
                    key={student.id}
                    onClick={() => handleStudentSelect(student)}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedStudent?.id === student.id
                        ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                        : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
                    }`}
                  >
                    <div className="font-medium">{student.first_name} {student.last_name}</div>
                    <div className="text-sm text-gray-500">Roll: {student.roll_number || '-'} | Adm: {student.admission_number}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bulk CSV Upload */}
      {selectedClass && selectedSection && selectedExamGroup && students.length > 0 && (
        <BulkMarksUpload
          students={students}
          subjects={subjects}
          examGroupId={selectedExamGroup}
          examGroup={examGroups.find(e => e.id === selectedExamGroup)}
          selectedClass={selectedClass}
          selectedSection={selectedSection}
          currentSession={currentSession}
          maxMarksPerTest={maxMarksPerTest}
          maxMarksHalfYearly={maxMarksHalfYearly}
        />
      )}

      {/* Student Details & Marks Entry */}
      {selectedStudent && selectedExamGroup && (
        <>
          {/* Student Info Card */}
          <Card className="border-blue-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <User className="h-5 w-5" />
                Student Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-gray-500 text-xs">Student Id</Label>
                  <p className="font-medium">{selectedStudent.admission_number}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">Roll No</Label>
                  <p className="font-medium">{selectedStudent.roll_number || '-'}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">Student's Name</Label>
                  <p className="font-medium">{selectedStudent.first_name} {selectedStudent.last_name}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">Father's/Guardian Name</Label>
                  <p className="font-medium">{selectedStudent.father_name || '-'}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">Mother's Name</Label>
                  <p className="font-medium">{selectedStudent.mother_name || '-'}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">Date of Birth</Label>
                  <p className="font-medium">{selectedStudent.date_of_birth || '-'}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">Class</Label>
                  <p className="font-medium">{selectedStudent.class}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">Section</Label>
                  <p className="font-medium">{selectedStudent.section}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scholastic Areas — HY + Annual */}
          <Card className="border-green-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="flex items-center gap-2 text-green-800">
                <BookOpen className="h-5 w-5" />
                Scholastic Areas — Half Yearly & Annual Examination
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {subjects.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No subjects found for this class. Please configure Subject Groups.</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-green-50">
                        <TableHead rowSpan={2} className="align-middle">Subject Name</TableHead>
                        <TableHead colSpan={4} className="text-center border-l bg-blue-50 text-blue-800">Half Yearly ({maxMarksPerTest + maxMarksHalfYearly})</TableHead>
                        <TableHead colSpan={4} className="text-center border-l bg-orange-50 text-orange-800">Annual ({maxMarksPerTest + maxMarksHalfYearly})</TableHead>
                      </TableRow>
                      <TableRow className="bg-green-50">
                        <TableHead className="text-center border-l text-xs">Per Test ({maxMarksPerTest})</TableHead>
                        <TableHead className="text-center text-xs">HY ({maxMarksHalfYearly})</TableHead>
                        <TableHead className="text-center text-xs">Total</TableHead>
                        <TableHead className="text-center text-xs">Grd</TableHead>
                        <TableHead className="text-center border-l text-xs">Per Test ({maxMarksPerTest})</TableHead>
                        <TableHead className="text-center text-xs">Ann ({maxMarksHalfYearly})</TableHead>
                        <TableHead className="text-center text-xs">Total</TableHead>
                        <TableHead className="text-center text-xs">Grd</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getOrganizedSubjects().map((item, index) => {
                        if (item.type === 'subject') {
                          const subject = item.subject;
                          const hy = scholasticMarks[subject.id] || { perTest: '', halfYearly: '', total: 0, grade: '' };
                          const ann = annualMarks[subject.id] || { perTest: '', annual: '', total: 0, grade: '' };
                          return (
                            <TableRow key={subject.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                              <TableCell className="font-medium">{subject.name}</TableCell>
                              <TableCell className="border-l p-1"><Input type="number" value={hy.perTest} onChange={e => handleMarksChange(subject.id, 'perTest', e.target.value, false)} min="0" max={maxMarksPerTest} className="w-16 text-center h-8" /></TableCell>
                              <TableCell className="p-1"><Input type="number" value={hy.halfYearly} onChange={e => handleMarksChange(subject.id, 'halfYearly', e.target.value, false)} min="0" max={maxMarksHalfYearly} className="w-16 text-center h-8" /></TableCell>
                              <TableCell className="text-center font-semibold text-sm">{(hy.total || 0).toFixed(0)}</TableCell>
                              <TableCell className="text-center text-sm font-bold">{hy.grade || '-'}</TableCell>
                              <TableCell className="border-l p-1"><Input type="number" value={ann.perTest} onChange={e => handleMarksChange(subject.id, 'perTest', e.target.value, true)} min="0" max={maxMarksPerTest} className="w-16 text-center h-8" /></TableCell>
                              <TableCell className="p-1"><Input type="number" value={ann.annual} onChange={e => handleMarksChange(subject.id, 'annual', e.target.value, true)} min="0" max={maxMarksHalfYearly} className="w-16 text-center h-8" /></TableCell>
                              <TableCell className="text-center font-semibold text-sm">{(ann.total || 0).toFixed(0)}</TableCell>
                              <TableCell className="text-center text-sm font-bold">{ann.grade || '-'}</TableCell>
                            </TableRow>
                          );
                        }
                        return null;
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attendance */}
          <Card className="border-orange-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <Calendar className="h-5 w-5" />
                Attendance
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="font-semibold text-blue-700 mb-2">Half Yearly</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1"><Label className="text-xs">Total Days</Label><Input type="number" value={attendanceData.totalDays} onChange={e => setAttendanceData(p => ({...p, totalDays: e.target.value}))} min="0" /></div>
                    <div className="space-y-1"><Label className="text-xs">Days Present</Label><Input type="number" value={attendanceData.daysPresent} onChange={e => setAttendanceData(p => ({...p, daysPresent: e.target.value}))} min="0" /></div>
                    <div className="space-y-1"><Label className="text-xs">Attendance %</Label><div className="h-10 px-3 py-2 bg-gray-100 rounded-md flex items-center font-semibold">{calculateAttendancePercentage()}%</div></div>
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-orange-700 mb-2">Annual</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1"><Label className="text-xs">Total Days</Label><Input type="number" value={annualAttendanceData.totalDays} onChange={e => setAnnualAttendanceData(p => ({...p, totalDays: e.target.value}))} min="0" /></div>
                    <div className="space-y-1"><Label className="text-xs">Days Present</Label><Input type="number" value={annualAttendanceData.daysPresent} onChange={e => setAnnualAttendanceData(p => ({...p, daysPresent: e.target.value}))} min="0" /></div>
                    <div className="space-y-1"><Label className="text-xs">Attendance %</Label><div className="h-10 px-3 py-2 bg-gray-100 rounded-md flex items-center font-semibold">{annualAttendanceData.totalDays > 0 ? Math.round((annualAttendanceData.daysPresent / annualAttendanceData.totalDays) * 100) : 0}%</div></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grade Scale */}
          <Card className="border-gray-200">
            <CardContent className="pt-4">
              <p className="text-sm">
                <strong>Grading scale for scholastic areas:</strong><br/>
                A1(91%-100%), A2(81%-90%), B1(71%-80%), B2(61%-70%), C1(51%-60%), C2(41%-50%), D(33%-40%), E(Below 33%)
              </p>
              <p className="text-sm mt-2 text-gray-600">
                <strong>Note:</strong> AB = Absent, ML = Medical Leave. For ML cases, grade is calculated based on the percentage of marks obtained in tests attended.
              </p>
            </CardContent>
          </Card>

          {/* Signature Section */}
          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 gap-8 text-center">
                <div className="border-t border-gray-400 pt-2 mt-8">
                  <p className="text-sm">Signature of Class Teacher</p>
                </div>
                <div className="border-t border-gray-400 pt-2 mt-8">
                  <p className="text-sm">Signature of Principal</p>
                </div>
                <div className="border-t border-gray-400 pt-2 mt-8">
                  <p className="text-sm">Signature of Parent/Guardian</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Co-Scholastic Areas */}
          <Card className="border-pink-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50">
              <CardTitle className="flex items-center gap-2 text-pink-800">
                <Award className="h-5 w-5" />
                Co-Scholastic Areas
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-6">
              {/* Co-Scholastic sections with HY + Annual columns */}
              {Object.entries(CO_SCHOLASTIC_CONFIG).map(([key, section]) => (
                <div key={key}>
                  <h4 className="font-semibold mb-2 text-gray-800">{section.title}</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Criteria</TableHead>
                        <TableHead className="w-24 text-center text-blue-700">HY</TableHead>
                        <TableHead className="w-24 text-center text-orange-700">Annual</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {section.items.map(item => (
                        <TableRow key={item}>
                          <TableCell className="text-sm">{item}</TableCell>
                          <TableCell className="text-center">
                            <Input value={coScholasticGrades[item] || ''} onChange={e => handleCoScholasticChange(item, e.target.value, false)} className="w-16 text-center uppercase mx-auto" maxLength={2} placeholder="A" />
                          </TableCell>
                          <TableCell className="text-center">
                            <Input value={annualCoScholasticGrades[item] || ''} onChange={e => handleCoScholasticChange(item, e.target.value, true)} className="w-16 text-center uppercase mx-auto" maxLength={2} placeholder="A" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}

              {/* Class Teacher's Remarks - HY & Annual */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold text-blue-700">HY Remarks:</Label>
                  <Textarea value={teacherRemarks} onChange={e => setTeacherRemarks(e.target.value)} placeholder="HY remarks..." className="mt-2" rows={2} />
                </div>
                <div>
                  <Label className="font-semibold text-orange-700">Annual Remarks:</Label>
                  <Textarea value={annualTeacherRemarks} onChange={e => setAnnualTeacherRemarks(e.target.value)} placeholder="Annual remarks..." className="mt-2" rows={2} />
                </div>
              </div>

              {/* Grading scale */}
              <div className="p-3 bg-gray-50 rounded text-sm">
                <strong>Grading scale for co-scholastic areas:</strong><br/>
                A+ (9-10) consistently demonstrates the skill, A (7-8) regularly demonstrates the skill, B (5-6) occasionally demonstrates the skill, C (3-4) infrequently demonstrates the skill, D (1-2) Needs Improvement
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSaveResult}
              disabled={isSaving}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8"
            >
              {isSaving ? 'Saving...' : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Result
                </>
              )}
            </Button>
          </div>
        </>
      )}

      {/* Instructions */}
      {(!selectedClass || !selectedSection || !selectedExamGroup) && (
        <Card className="border-dashed border-2 border-purple-200">
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <GraduationCap className="h-12 w-12 mx-auto mb-4 text-purple-300" />
              <p className="text-lg font-medium">Select class, section, and exam to begin marks entry</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}