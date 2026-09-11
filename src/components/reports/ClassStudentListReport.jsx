import { useState, useEffect } from 'react';
import { Student } from '@/entities/Student';
import { Class } from '@/entities/Class';
import { Section } from '@/entities/Section';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, FileText, Loader2 } from 'lucide-react';
import { exportToCsv, exportToPdf } from '../utils/exportUtils';

export default function ClassStudentListReport() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

  useEffect(() => {
    (async () => {
      setClasses(await Class.list());
      setSections(await Section.list());
    })();
  }, []);

  const handleGenerateReport = async () => {
    if (!selectedClass || !selectedSection) {
      alert("Please select both a class and a section.");
      return;
    }
    setIsLoading(true);
    try {
      const data = await Student.filter({ class: selectedClass, section: selectedSection, status: 'active' });
      setStudents(data);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const headers = [
    { key: 'admission_number', label: 'Admission No.' },
    { key: 'name', label: 'Name' },
    { key: 'roll_number', label: 'Roll No.' },
    { key: 'father_name', label: 'Father Name' },
    { key: 'guardian_phone', label: 'Mobile' }
  ];
  
  const reportData = students.map(s => ({
      ...s,
      name: `${s.first_name} ${s.last_name}`
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Class-wise Student List</CardTitle>
        <CardDescription>Generate a list of students for a specific class and section.</CardDescription>
        <div className="flex flex-wrap items-end gap-4 pt-4">
          <div className="space-y-2">
            <Label>Class</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Select Class" /></SelectTrigger>
              <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Section</Label>
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Select Section" /></SelectTrigger>
              <SelectContent>{sections.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button onClick={handleGenerateReport} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Generate Report
          </Button>
          <Button variant="outline" onClick={() => exportToCsv(reportData, headers, `students_${selectedClass}_${selectedSection}.csv`)} disabled={students.length === 0}>
            <FileText className="mr-2 h-4 w-4" /> Excel
          </Button>
          <Button variant="outline" onClick={() => exportToPdf(reportData, headers, `Student List - ${selectedClass} ${selectedSection}`, `students_${selectedClass}_${selectedSection}.pdf`)} disabled={students.length === 0}>
            <Download className="mr-2 h-4 w-4" /> PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>{headers.map(h => <TableHead key={h.key}>{h.label}</TableHead>)}</TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={headers.length} className="text-center">Loading...</TableCell></TableRow>
              ) : students.length > 0 ? (
                reportData.map(item => (
                  <TableRow key={item.id}>
                    {headers.map(h => <TableCell key={h.key}>{item[h.key]}</TableCell>)}
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={headers.length} className="text-center">No data found for the selected criteria.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}