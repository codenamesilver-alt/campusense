import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { fetchAllFiltered } from '@/lib/fetchAll';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { FileText } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8442ff'];

export default function MarksDivisionAnalysis() {
  const [examGroups, setExamGroups] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [availableSections, setAvailableSections] = useState([]);

  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

  const [analysisData, setAnalysisData] = useState([]);
  const [studentDetails, setStudentDetails] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const [groups, divs, classes] = await Promise.all([
        base44.entities.ExamGroup.list(),
        base44.entities.DivisionConfiguration.list(),
        base44.entities.Class.list()
      ]);
      setExamGroups(groups);
      setDivisions(divs);

      // Use actual Class entity records, sorted by numeric_value
      const sortedClasses = classes.sort((a, b) => (a.numeric_value ?? 0) - (b.numeric_value ?? 0)).map(c => c.name);
      setAvailableClasses(sortedClasses);
    })();
  }, []);

  // When class changes, load sections for that class
  useEffect(() => {
    if (!selectedClass) {
      setAvailableSections([]);
      setSelectedSection('');
      return;
    }
    (async () => {
      const students = await fetchAllFiltered('Student', { class: selectedClass, status: 'active' });
      const sections = [...new Set(students.map(s => s.section).filter(Boolean))].sort();
      setAvailableSections(sections);
      setSelectedSection('');
    })();
  }, [selectedClass]);

  useEffect(() => {
    if (selectedGroup && selectedClass) {
      runAnalysis();
    } else {
      setAnalysisData([]);
      setStudentDetails([]);
    }
  }, [selectedGroup, selectedClass, selectedSection, divisions]);

  const runAnalysis = async () => {
    setLoading(true);
    const filters = { class: selectedClass, status: 'active' };
    if (selectedSection) filters.section = selectedSection;

    const students = await fetchAllFiltered('Student', filters);

    const allResults = await fetchAllFiltered('StudentResult', { exam_group_id: selectedGroup });
    const markRows = allResults.filter(r => r.subject_id != null);
    if (students.length === 0 || markRows.length === 0) {
      setAnalysisData([]);
      setStudentDetails([]);
      setLoading(false);
      return;
    }

    const sortedDivisions = [...divisions]
      .filter(d => d.min_percentage != null)
      .sort((a, b) => b.min_percentage - a.min_percentage);

    const markRowsByStudent = {};
    markRows.forEach(r => {
      if (!markRowsByStudent[r.student_id]) markRowsByStudent[r.student_id] = [];
      markRowsByStudent[r.student_id].push(r);
    });

    const studentDivisionDetails = students.map(student => {
      const rows = markRowsByStudent[student.id] || [];
      let totalMarksObtained = 0;
      let totalMaxMarks = 0;

      rows.forEach(r => {
        totalMarksObtained += Number(r.marks_obtained) || 0;
        totalMaxMarks += Number(r.max_marks) || 100;
      });

      const percentage = totalMaxMarks > 0 ? (totalMarksObtained / totalMaxMarks) * 100 : 0;
      const division = sortedDivisions.find(d => percentage >= d.min_percentage)?.name || 'Fail';

      return { ...student, percentage, division };
    });

    setStudentDetails(studentDivisionDetails);

    // Aggregate for charts
    const divisionCounts = sortedDivisions.map(d => ({ name: d.name, value: 0 }));
    divisionCounts.push({ name: 'Fail', value: 0 });

    studentDivisionDetails.forEach(s => {
      const div = divisionCounts.find(d => d.name === s.division);
      if (div) div.value++;
    });

    setAnalysisData(divisionCounts.filter(d => d.value > 0));
    setLoading(false);
  };

  const handleExport = () => {
    const headers = ['AdmissionNo', 'Name', 'Class', 'Section', 'Percentage', 'Division'];
    const rows = studentDetails.map(s =>
      [s.admission_number, `${s.first_name} ${s.last_name}`, s.class, s.section, s.percentage.toFixed(2), s.division].join(',')
    );
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', 'division_analysis.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Marks Division Analysis</h1>

      <Card>
        <CardHeader><CardTitle>Select Filters</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select value={selectedGroup} onValueChange={setSelectedGroup}>
            <SelectTrigger><SelectValue placeholder="Select Exam Group" /></SelectTrigger>
            <SelectContent>
              {examGroups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
            <SelectContent>
              {availableClasses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={selectedSection} onValueChange={setSelectedSection}>
            <SelectTrigger><SelectValue placeholder="All Sections" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>All Sections</SelectItem>
              {availableSections.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {loading ? (
        <Card><CardContent className="p-6 text-center text-gray-500">Loading analysis...</CardContent></Card>
      ) : analysisData.length > 0 ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Division Distribution (Bar Chart)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analysisData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" name="No. of Students" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Division Distribution (Pie Chart)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analysisData}
                      cx="50%" cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      dataKey="value"
                    >
                      {analysisData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Detailed Student Report</CardTitle>
              <Button variant="outline" onClick={handleExport}><FileText className="mr-2 h-4 w-4" /> Export to CSV</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admission No.</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Division</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentDetails.map(s => (
                    <TableRow key={s.id}>
                      <TableCell>{s.admission_number}</TableCell>
                      <TableCell>{s.first_name} {s.last_name}</TableCell>
                      <TableCell>{s.class}</TableCell>
                      <TableCell>{s.section}</TableCell>
                      <TableCell>{s.percentage.toFixed(2)}%</TableCell>
                      <TableCell><Badge>{s.division}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card><CardContent className="p-6 text-center text-gray-500">
          {selectedGroup && selectedClass ? 'No data found for the selected filters.' : 'Please select an Exam Group and Class to generate the analysis.'}
        </CardContent></Card>
      )}
    </div>
  );
}