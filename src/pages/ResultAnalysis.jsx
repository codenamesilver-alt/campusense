import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { fetchAllFiltered } from '@/lib/fetchAll';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BarChart3, Trophy, TrendingUp, Users, GraduationCap } from 'lucide-react';

const COLORS = ['#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#6366f1', '#14b8a6'];

export default function ResultAnalysis() {
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [examGroups, setExamGroups] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState([]);

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedExamGroup, setSelectedExamGroup] = useState('');

  const [subjectStats, setSubjectStats] = useState([]);
  const [gradeDistribution, setGradeDistribution] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [classStats, setClassStats] = useState({ avg: 0, highest: 0, lowest: 0, passRate: 0, totalStudents: 0 });
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadSubjectsForClass();
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedClass && selectedSection && selectedExamGroup) {
      loadResultsAndAnalyze();
    }
  }, [selectedClass, selectedSection, selectedExamGroup]);

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
    setSelectedStudent(null);
  };

  const loadResultsAndAnalyze = async () => {
    setIsLoading(true);
    
    const [studentData, resultData] = await Promise.all([
      fetchAllFiltered('Student', { class: selectedClass, section: selectedSection, status: 'active' }),
      fetchAllFiltered('StudentResult', { class: selectedClass, section: selectedSection, exam_group_id: selectedExamGroup })
    ]);
    
    setStudents(studentData);
    setResults(resultData);
    
    analyzeResults(studentData, resultData);
    setIsLoading(false);
  };

  const analyzeResults = (studentData, resultData) => {
    const markRows = resultData.filter(r => r.subject_id != null);
    if (markRows.length === 0) {
      setSubjectStats([]);
      setGradeDistribution([]);
      setTopPerformers([]);
      setClassStats({ avg: 0, highest: 0, lowest: 0, passRate: 0, totalStudents: 0 });
      return;
    }

    // Subject-wise analysis
    const subjectAnalysis = {};
    subjects.forEach(sub => {
      subjectAnalysis[sub.id] = { name: sub.name, marks: [], passed: 0, failed: 0 };
    });

    // Grade distribution
    const grades = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0, D: 0, E: 0 };

    // Student totals for top performers
    const studentTotals = [];
    const studentTotalsMap = {};

    markRows.forEach(row => {
      const total = Number(row.marks_obtained) || 0;
      const maxTotal = Number(row.max_marks) || 100;
      const percentage = maxTotal > 0 ? (total / maxTotal) * 100 : 0;

      const subjectKey = row.subject_id;
      if (!subjectAnalysis[subjectKey]) {
        subjectAnalysis[subjectKey] = { name: row.subject_name || 'Unknown', marks: [], passed: 0, failed: 0 };
      }
      subjectAnalysis[subjectKey].marks.push(total);
      if (percentage >= 33) {
        subjectAnalysis[subjectKey].passed++;
      } else {
        subjectAnalysis[subjectKey].failed++;
      }

      if (row.grade) {
        grades[row.grade] = (grades[row.grade] || 0) + 1;
      }

      if (!studentTotalsMap[row.student_id]) {
        studentTotalsMap[row.student_id] = { total: 0, max: 0, count: 0 };
      }
      const st = studentTotalsMap[row.student_id];
      st.total += total;
      st.max += maxTotal;
      st.count++;
    });

    Object.entries(studentTotalsMap).forEach(([studentId, st]) => {
      const student = studentData.find(s => s.id === studentId);
      if (student && st.count > 0) {
        const avgPercentage = st.max > 0 ? (st.total / st.max) * 100 : 0;
        studentTotals.push({
          name: `${student.first_name} ${student.last_name}`,
          rollNo: student.roll_number,
          total: st.total,
          percentage: avgPercentage,
          maxPossible: st.max
        });
      }
    });

    // Calculate subject stats
    const subjectStatsData = Object.entries(subjectAnalysis).map(([id, data]) => {
      const marks = data.marks;
      if (marks.length === 0) return null;
      
      const avg = marks.reduce((a, b) => a + b, 0) / marks.length;
      const highest = Math.max(...marks);
      const lowest = Math.min(...marks);
      const passRate = ((data.passed / marks.length) * 100).toFixed(1);
      
      return {
        name: data.name,
        average: parseFloat(avg.toFixed(2)),
        highest,
        lowest,
        passRate: parseFloat(passRate),
        totalStudents: marks.length
      };
    }).filter(Boolean);

    setSubjectStats(subjectStatsData);

    // Grade distribution for pie chart
    const gradeData = Object.entries(grades)
      .filter(([_, count]) => count > 0)
      .map(([grade, count]) => ({ name: grade, value: count }));
    setGradeDistribution(gradeData);

    // Top performers
    const sorted = studentTotals.sort((a, b) => b.percentage - a.percentage);
    setTopPerformers(sorted.slice(0, 10));

    // Class stats
    if (studentTotals.length > 0) {
      const percentages = studentTotals.map(s => s.percentage);
      const avgPercentage = percentages.reduce((a, b) => a + b, 0) / percentages.length;
      const passedCount = studentTotals.filter(s => s.percentage >= 33).length;
      
      setClassStats({
        avg: avgPercentage.toFixed(2),
        highest: Math.max(...percentages).toFixed(2),
        lowest: Math.min(...percentages).toFixed(2),
        passRate: ((passedCount / studentTotals.length) * 100).toFixed(1),
        totalStudents: studentTotals.length
      });
    }
  };

  const getGradeColor = (grade) => {
    if (grade === 'A1' || grade === 'A2') return 'bg-green-500';
    if (grade === 'B1' || grade === 'B2') return 'bg-blue-500';
    if (grade === 'C1' || grade === 'C2') return 'bg-yellow-500';
    if (grade === 'D') return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Result Analysis
        </h1>
        <p className="text-gray-500">Analyze student performance with charts and insights</p>
      </div>

      {/* Filters */}
      <Card className="border-purple-200">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
          <CardTitle className="flex items-center gap-2 text-purple-800">
            <BarChart3 className="h-5 w-5" />
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

      {isLoading && <Card><CardContent className="py-8 text-center">Loading analysis...</CardContent></Card>}

      {!isLoading && selectedClass && selectedSection && selectedExamGroup && results.some(r => r.subject_id != null) && (
        <>
          {/* Class Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="border-blue-200">
              <CardContent className="pt-4 text-center">
                <Users className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                <p className="text-2xl font-bold text-blue-600">{classStats.totalStudents}</p>
                <p className="text-sm text-gray-500">Total Students</p>
              </CardContent>
            </Card>
            <Card className="border-green-200">
              <CardContent className="pt-4 text-center">
                <TrendingUp className="h-8 w-8 mx-auto text-green-500 mb-2" />
                <p className="text-2xl font-bold text-green-600">{classStats.avg}%</p>
                <p className="text-sm text-gray-500">Class Average</p>
              </CardContent>
            </Card>
            <Card className="border-purple-200">
              <CardContent className="pt-4 text-center">
                <Trophy className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                <p className="text-2xl font-bold text-purple-600">{classStats.highest}%</p>
                <p className="text-sm text-gray-500">Highest Score</p>
              </CardContent>
            </Card>
            <Card className="border-orange-200">
              <CardContent className="pt-4 text-center">
                <BarChart3 className="h-8 w-8 mx-auto text-orange-500 mb-2" />
                <p className="text-2xl font-bold text-orange-600">{classStats.lowest}%</p>
                <p className="text-sm text-gray-500">Lowest Score</p>
              </CardContent>
            </Card>
            <Card className="border-emerald-200">
              <CardContent className="pt-4 text-center">
                <GraduationCap className="h-8 w-8 mx-auto text-emerald-500 mb-2" />
                <p className="text-2xl font-bold text-emerald-600">{classStats.passRate}%</p>
                <p className="text-sm text-gray-500">Pass Rate</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Subject Average Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Subject-wise Average Marks</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={subjectStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={10} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="average" fill="#8b5cf6" name="Average" />
                    <Bar dataKey="highest" fill="#10b981" name="Highest" />
                    <Bar dataKey="lowest" fill="#f59e0b" name="Lowest" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Grade Distribution Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Grade Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={gradeDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {gradeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Subject Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Subject Performance Report</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead className="text-center">Students</TableHead>
                    <TableHead className="text-center">Average</TableHead>
                    <TableHead className="text-center">Highest</TableHead>
                    <TableHead className="text-center">Lowest</TableHead>
                    <TableHead className="text-center">Pass Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjectStats.map((sub, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{sub.name}</TableCell>
                      <TableCell className="text-center">{sub.totalStudents}</TableCell>
                      <TableCell className="text-center font-semibold">{sub.average}</TableCell>
                      <TableCell className="text-center text-green-600">{sub.highest}</TableCell>
                      <TableCell className="text-center text-orange-600">{sub.lowest}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={sub.passRate >= 80 ? 'bg-green-500' : sub.passRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}>
                          {sub.passRate}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Top 10 Performers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Rank</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead className="text-center">Roll No</TableHead>
                    <TableHead className="text-center">Total Marks</TableHead>
                    <TableHead className="text-center">Percentage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topPerformers.map((student, idx) => (
                    <TableRow key={idx} className={idx < 3 ? 'bg-yellow-50' : ''}>
                      <TableCell>
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                      </TableCell>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell className="text-center">{student.rollNo || '-'}</TableCell>
                      <TableCell className="text-center">{student.total.toFixed(2)} / {student.maxPossible}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={student.percentage >= 80 ? 'bg-green-500' : student.percentage >= 60 ? 'bg-blue-500' : 'bg-yellow-500'}>
                          {student.percentage.toFixed(2)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {!isLoading && selectedClass && selectedSection && selectedExamGroup && !results.some(r => r.subject_id != null) && (
        <Card className="border-yellow-200">
          <CardContent className="py-8 text-center text-yellow-800">
            No results found for the selected class, section, and exam. Please enter marks first.
          </CardContent>
        </Card>
      )}

      {(!selectedClass || !selectedSection || !selectedExamGroup) && (
        <Card className="border-dashed border-2 border-purple-200">
          <CardContent className="py-12 text-center text-gray-500">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-purple-300" />
            <p className="text-lg font-medium">Select class, section, and exam to view analysis</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}